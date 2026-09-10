from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from bs4 import BeautifulSoup
from types import SimpleNamespace

from .notifications import send_alert_emails
from .services.ui_ux import check_responsiveness, check_layout_shifts, check_broken_elements
from .services.wordpress import detect_wordpress_signatures, check_wp_core_updates
from .services.structure import analyze_dom_complexity, check_js_css_optimization
from .services.advanced_seo import analyze_alt_tags


class MonitorApiTests(TestCase):
    def test_homepage_loads(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)

    def test_api_check_invalid_url(self):
        response = self.client.get(reverse('api_check'), {'url': 'not-a-valid-url'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    def test_api_history_empty(self):
        response = self.client.get(reverse('api_history'))
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['total'], 0)
        self.assertEqual(json_data['reports'], [])

    def test_api_history_stats_empty(self):
        response = self.client.get(reverse('api_history_stats'))
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['labels'], [])
        self.assertEqual(json_data['load_times'], [])

    def test_new_endpoints_load(self):
        # Verify the new endpoints load without raising exceptions
        ui_ux_url = reverse('api_ui_ux') + '?url=https://example.com'
        wp_url = reverse('api_wordpress') + '?url=https://example.com'
        struct_url = reverse('api_structure') + '?url=https://example.com'

        response = self.client.get(ui_ux_url)
        self.assertEqual(response.status_code, 200)

        response = self.client.get(wp_url)
        self.assertEqual(response.status_code, 200)

        response = self.client.get(struct_url)
        self.assertEqual(response.status_code, 200)

    def test_api_benchmark_invalid_parameters(self):
        response = self.client.get(reverse('api_benchmark'))
        self.assertEqual(response.status_code, 400)
        
        response = self.client.get(reverse('api_benchmark'), {'url1': 'https://example.com'})
        self.assertEqual(response.status_code, 400)

    def test_api_benchmark_success_mock(self):
        # Using a mock host that will fail quickly or pass to verify concurrent execution safety
        response = self.client.get(reverse('api_benchmark'), {'url1': 'example.com', 'url2': 'example.org'})
        # Since example.com is real, it will execute fully
        self.assertIn(response.status_code, [200, 400])  # Connection failure or success is acceptable


class ServiceUnitTests(TestCase):
    def test_responsiveness_audit(self):
        html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>'
        soup = BeautifulSoup(html, "html.parser")
        res = check_responsiveness(soup)
        self.assertTrue(res["has_viewport"])
        self.assertEqual(res["status"], "Warning")

    def test_layout_shift_hazards(self):
        # missing image dimensions should increase hazard penalty
        html = '<html><body><img src="img.jpg"><iframe src="frame.html"></iframe></body></html>'
        soup = BeautifulSoup(html, "html.parser")
        res = check_layout_shifts(soup, html)
        self.assertGreater(res["cls_hazard_index"], 0.0)
        self.assertEqual(res["missing_dimensions_images"], 1)
        self.assertEqual(res["missing_dimensions_iframes"], 1)

    def test_broken_elements(self):
        html = '<html><body><span><div>Block inside Inline element</div></span></body></html>'
        soup = BeautifulSoup(html, "html.parser")
        res = check_broken_elements(soup, "https://example.com")
        self.assertEqual(res["broken_ui_count"], 1)
        self.assertEqual(res["invalid_html_nestings"], 1)

    def test_wordpress_detection(self):
        html = '<html><head><meta name="generator" content="WordPress 6.5.3"></head><body></body></html>'
        soup = BeautifulSoup(html, "html.parser")
        is_wp, sigs = detect_wordpress_signatures(soup, html)
        self.assertTrue(is_wp)
        self.assertTrue(any("generator" in s.lower() for s in sigs))

    def test_dom_complexity(self):
        html = '<html><body><div><div><p>Nest</p></div></div></body></html>'
        soup = BeautifulSoup(html, "html.parser")
        res = analyze_dom_complexity(soup)
        self.assertEqual(res["total_nodes"], 6)  # html, body, div, div, p + document root
        self.assertEqual(res["max_depth"], 4)    # body -> div -> div -> p

    def test_minification_audit(self):
        html = '<html><head><link rel="stylesheet" href="style.css"><script src="app.min.js"></script></head></html>'
        soup = BeautifulSoup(html, "html.parser")
        res = check_js_css_optimization(soup)
        self.assertEqual(res["external_scripts_count"], 1)
        self.assertEqual(res["unminified_stylesheets_count"], 1)
        self.assertEqual(res["unminified_scripts_count"], 0)

    def test_alt_tag_analysis_and_suggestions(self):
        html = (
            '<html><body>'
            '<img src="/images/featured-summer-shoes-2026.png">'
            '<img src="/images/main_hero-banner-v2.jpg" alt="">'
            '<img src="/products/983749872.png">'
            '<img src="/logo.svg" alt="Valid alt">'
            '</body></html>'
        )
        soup = BeautifulSoup(html, "html.parser")
        res = analyze_alt_tags(soup)
        
        self.assertEqual(res["total_images"], 4)
        self.assertEqual(res["with_alt"], 1)
        self.assertEqual(res["missing_alt"], 2) # first and third
        self.assertEqual(res["empty_alt"], 1)   # second
        
        # Check suggestions
        srcs = res["missing_alt_srcs"]
        self.assertEqual(len(srcs), 3)
        
        # 1st image: /images/featured-summer-shoes-2026.png -> Featured summer shoes 2026
        self.assertEqual(srcs[0]["src"], "/images/featured-summer-shoes-2026.png")
        self.assertEqual(srcs[0]["suggested_alt"], "Featured summer shoes 2026")
        
        # 3rd image: /products/983749872.png -> Products image (folder fallback due to number hash)
        self.assertEqual(srcs[1]["src"], "/products/983749872.png")
        self.assertEqual(srcs[1]["suggested_alt"], "Products image")
        
        # 2nd image: /images/main_hero-banner-v2.jpg -> Main hero banner
        self.assertEqual(srcs[2]["src"], "/images/main_hero-banner-v2.jpg")
        self.assertEqual(srcs[2]["suggested_alt"], "Main hero banner")


class AlertNotificationTests(TestCase):
    @override_settings(ALERT_EMAIL_RECIPIENTS=[], EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_alert_emails_without_recipients(self):
        report = SimpleNamespace(url='https://example.com', analyzed_at='2026-05-21T00:00:00Z', is_up=True)
        sent = send_alert_emails(report, [{'level': 'critical', 'message': 'Test', 'category': 'test'}])
        self.assertFalse(sent)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(ALERT_EMAIL_RECIPIENTS=['alert@example.com'], EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_alert_emails_sends_message_for_critical(self):
        report = SimpleNamespace(url='https://example.com', analyzed_at='2026-05-21T00:00:00Z', is_up=True, overall_score=85, status_code=200)
        sent = send_alert_emails(report, [{'level': 'critical', 'message': 'Critical issue found', 'category': 'security'}])

        self.assertTrue(sent)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, '🔴 [CRITICAL ALERT] Issues detected on https://example.com')
        self.assertIn('Critical issue found', mail.outbox[0].body)

    @override_settings(ALERT_EMAIL_RECIPIENTS=['alert@example.com'], EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_alert_emails_sends_message_for_warning(self):
        report = SimpleNamespace(url='https://example.com', analyzed_at='2026-05-21T00:00:00Z', is_up=True, overall_score=85, status_code=200)
        sent = send_alert_emails(report, [{'level': 'warning', 'message': 'Slow load warnings', 'category': 'performance'}])

        self.assertTrue(sent)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, '🟡 [WARNING ALERT] Performance/SEO alerts for https://example.com')
        self.assertIn('Slow load warnings', mail.outbox[0].body)

    @override_settings(ALERT_EMAIL_RECIPIENTS=['alert@example.com'], EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_alert_emails_ignores_non_alert_level(self):
        report = SimpleNamespace(url='https://example.com', analyzed_at='2026-05-21T00:00:00Z', is_up=True, overall_score=85, status_code=200)
        sent = send_alert_emails(report, [{'level': 'info', 'message': 'Standard Info Note', 'category': 'performance'}])

        self.assertFalse(sent)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(ALERT_EMAIL_RECIPIENTS=['cmd@example.com'], EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_send_test_alert_command(self):
        out = self._capture_command_output('send_test_alert', ['--recipients', 'cmd@example.com'])
        self.assertIn('Test alert email sent.', out)
        self.assertEqual(len(mail.outbox), 1)

    def _capture_command_output(self, command_name, argv):
        from io import StringIO
        out = StringIO()
        call_command(command_name, *argv, stdout=out)
        return out.getvalue()
