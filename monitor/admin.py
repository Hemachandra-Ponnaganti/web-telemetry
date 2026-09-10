from django.contrib import admin
from .models import AnalysisReport, AlertHistory


class AlertHistoryInline(admin.TabularInline):
    model = AlertHistory
    extra = 0
    readonly_fields = ("level", "message", "category", "created_at")
    can_delete = False


@admin.register(AnalysisReport)
class AnalysisReportAdmin(admin.ModelAdmin):
    list_display = (
        "url", "analyzed_at", "is_up", "status_code",
        "load_time", "performance_score", "seo_score",
        "security_score", "overall_score",
    )
    list_filter = ("is_up", "is_https", "perf_rating")
    search_fields = ("url", "page_title")
    readonly_fields = ("analyzed_at",)
    inlines = [AlertHistoryInline]
    ordering = ("-analyzed_at",)


@admin.register(AlertHistory)
class AlertHistoryAdmin(admin.ModelAdmin):
    list_display = ("level", "category", "message", "created_at", "report")
    list_filter = ("level", "category")
    search_fields = ("message",)
    ordering = ("-created_at",)
