from django.urls import path
from .views import (
    home,
    history_page,
    serve_react_root_files,
    api_check,
    api_errors,
    api_seo,
    api_image,
    api_upload_image,
    api_advanced_performance,
    api_advanced_seo,
    api_security,
    api_ui_ux,
    api_wordpress,
    api_structure,
    api_full_analysis,
    api_quick_analysis,
    api_history,
    api_report_detail,
    api_history_stats,
    api_db_diagnostics,
    api_db_vacuum,
    api_settings,
    api_send_test_email,
    api_benchmark,
)

urlpatterns = [
    # Pages
    path("", home, name="home"),
    path("history/", history_page, name="history_page"),
    
    # React build root files
    path("manifest.json", serve_react_root_files, {"filename": "manifest.json"}),
    path("favicon.ico", serve_react_root_files, {"filename": "favicon.ico"}),
    path("logo192.png", serve_react_root_files, {"filename": "logo192.png"}),
    path("robots.txt", serve_react_root_files, {"filename": "robots.txt"}),
    path("sitemap.txt", serve_react_root_files, {"filename": "sitemap.txt"}),
    path("sitemap.xml", serve_react_root_files, {"filename": "sitemap.xml"}),

    # Core APIs (existing)

    path("check/", api_check, name="api_check"),
    path("errors/", api_errors, name="api_errors"),
    path("seo/", api_seo, name="api_seo"),
    path("image/", api_image, name="api_image"),
    path("upload-image/", api_upload_image, name="api_upload_image"),

    # Advanced APIs
    path("advanced-performance/", api_advanced_performance, name="api_advanced_performance"),
    path("advanced-seo/", api_advanced_seo, name="api_advanced_seo"),
    path("security/", api_security, name="api_security"),
    path("ui-ux/", api_ui_ux, name="api_ui_ux"),
    path("wordpress/", api_wordpress, name="api_wordpress"),
    path("structure/", api_structure, name="api_structure"),
    path("analyze/", api_full_analysis, name="api_full_analysis"),
    path("quick-analyze/", api_quick_analysis, name="api_quick_analysis"),
    path("benchmark/", api_benchmark, name="api_benchmark"),

    # History / DB
    path("history-data/", api_history, name="api_history"),
    path("history-data/<int:report_id>/", api_report_detail, name="api_report_detail"),
    path("history-stats/", api_history_stats, name="api_history_stats"),
    path("db-diagnostics/", api_db_diagnostics, name="api_db_diagnostics"),
    path("db-vacuum/", api_db_vacuum, name="api_db_vacuum"),
    path("settings/", api_settings, name="api_settings"),
    path("send-test-email/", api_send_test_email, name="api_send_test_email"),
]
