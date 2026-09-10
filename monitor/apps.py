from django.apps import AppConfig


class MonitorConfig(AppConfig):
    name = 'monitor'

    def ready(self):
        import monitor.thread_context
        
        # Start proactive background SRE monitoring thread
        import threading
        import time
        import sys
        import os

        def run_background_scheduler():
            # Wait for webserver to bind and database state to stabilize
            time.sleep(8)
            print("⏱️ SRE Background Scheduler: Initialized [Cycle: 60s]")
            
            # Prevent circular imports
            from monitor.models import AnalysisReport
            from monitor.views import _save_report
            from monitor.services.performance import check_status, analyze_images
            from monitor.services.error_detector import detect_errors
            from monitor.services.advanced_performance import analyze_advanced_performance
            from monitor.services.advanced_seo import analyze_advanced_seo
            from monitor.services.security import analyze_security
            from monitor.services.ui_ux import analyze_ui_ux
            from monitor.services.wordpress import analyze_wordpress
            from monitor.services.structure import analyze_structure
            from concurrent.futures import ThreadPoolExecutor

            while True:
                try:
                    # Get unique target URLs audited in history to dynamically monitor them
                    urls = list(AnalysisReport.objects.values_list('url', flat=True).distinct()[:5])
                    if not urls:
                        urls = ["https://wordpress.org"]
                        
                    for url in urls:
                        print(f"🔄 SRE Background Scheduler: Auditing URL state: {url}...")
                        previous_report = AnalysisReport.objects.filter(url=url).first()
                        
                        with ThreadPoolExecutor(max_workers=9) as executor:
                            future_check = executor.submit(check_status, url)
                            future_errors = executor.submit(detect_errors, url)
                            future_seo = executor.submit(analyze_advanced_seo, url)
                            future_perf = executor.submit(analyze_advanced_performance, url)
                            future_sec = executor.submit(analyze_security, url)
                            future_image = executor.submit(analyze_images, url)
                            future_ui_ux = executor.submit(analyze_ui_ux, url, previous_report=previous_report)
                            future_wp = executor.submit(analyze_wordpress, url)
                            future_struct = executor.submit(analyze_structure, url)

                            check_data = future_check.result()
                            if "error" in check_data:
                                continue

                            errors_data = future_errors.result()
                            seo_data = future_seo.result()
                            perf_data = future_perf.result()
                            sec_data = future_sec.result()
                            image_data = future_image.result()
                            ui_ux_data = future_ui_ux.result()
                            wp_data = future_wp.result()
                            struct_data = future_struct.result()
                            
                        # Save report & automatically fire email dispatch inside _save_report
                        _save_report(
                            url, check_data, errors_data, seo_data, perf_data, sec_data, image_data,
                            ui_ux_data=ui_ux_data, wordpress_data=wp_data, structure_data=struct_data
                        )
                        print(f"✅ SRE Background Scheduler: Audited and saved report for {url}")
                except Exception as e:
                    print(f"⚠️ SRE Background Scheduler error: {str(e)}")
                
                time.sleep(60)

        # Trigger scheduler thread only in main webserver process, avoiding duplicates
        if 'runserver' in sys.argv:
            if os.environ.get('RUN_MAIN') == 'true':
                t = threading.Thread(target=run_background_scheduler, daemon=True)
                t.start()

