from types import SimpleNamespace
from django.core.management.base import BaseCommand
from django.utils import timezone

from monitor.notifications import send_alert_emails


class Command(BaseCommand):
    help = "Send a test critical alert email to configured recipients or --recipients"

    def add_arguments(self, parser):
        parser.add_argument("--recipients", help="Comma-separated recipients (overrides env/settings)")
        parser.add_argument("--url", help="URL for the test report", default="https://example.com")

    def handle(self, *args, **options):
        recipients = options.get("recipients")
        if recipients:
            from django.conf import settings
            settings.ALERT_EMAIL_RECIPIENTS = [r.strip() for r in recipients.split(",") if r.strip()]

        report = SimpleNamespace(url=options.get("url"), analyzed_at=timezone.now())
        alerts = [{"level": "critical", "message": "Test critical alert from management command", "category": "test"}]

        sent = send_alert_emails(report, alerts)
        if sent:
            self.stdout.write(self.style.SUCCESS("Test alert email sent."))
        else:
            self.stdout.write(self.style.WARNING("No email sent — check ALERT_EMAIL_RECIPIENTS and email settings."))
