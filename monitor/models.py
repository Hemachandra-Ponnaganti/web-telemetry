from django.db import models
import json


class AnalysisReport(models.Model):
    """Stores a full website analysis report."""

    STATUS_CHOICES = [
        ("up", "Up"),
        ("down", "Down"),
        ("error", "Error"),
    ]

    url = models.URLField(max_length=2048)
    analyzed_at = models.DateTimeField(auto_now_add=True)

    # Website monitoring
    status_code = models.IntegerField(null=True, blank=True)
    is_up = models.BooleanField(default=False)
    load_time = models.FloatField(null=True, blank=True)
    ttfb = models.FloatField(null=True, blank=True)
    page_size_kb = models.FloatField(null=True, blank=True)
    perf_rating = models.CharField(max_length=20, blank=True)

    # Scores (0-100)
    performance_score = models.IntegerField(null=True, blank=True)
    seo_score = models.IntegerField(null=True, blank=True)
    security_score = models.IntegerField(null=True, blank=True)
    overall_score = models.IntegerField(null=True, blank=True)

    # SEO
    page_title = models.TextField(blank=True)
    meta_description = models.TextField(blank=True)

    # Security
    is_https = models.BooleanField(default=False)
    has_ssl = models.BooleanField(default=False)

    # Full JSON snapshots
    check_data = models.TextField(blank=True)       # JSON
    errors_data = models.TextField(blank=True)      # JSON
    seo_data = models.TextField(blank=True)         # JSON
    performance_data = models.TextField(blank=True) # JSON
    security_data = models.TextField(blank=True)    # JSON
    image_data = models.TextField(blank=True)       # JSON

    class Meta:
        ordering = ["-analyzed_at"]
        indexes = [models.Index(fields=["url", "-analyzed_at"])]

    def __str__(self):
        return f"{self.url} @ {self.analyzed_at:%Y-%m-%d %H:%M}"

    def get_check_data(self):
        try:
            return json.loads(self.check_data) if self.check_data else {}
        except Exception:
            return {}

    def get_seo_data(self):
        try:
            return json.loads(self.seo_data) if self.seo_data else {}
        except Exception:
            return {}

    def get_performance_data(self):
        try:
            return json.loads(self.performance_data) if self.performance_data else {}
        except Exception:
            return {}

    def get_security_data(self):
        try:
            return json.loads(self.security_data) if self.security_data else {}
        except Exception:
            return {}

    def get_image_data(self):
        try:
            return json.loads(self.image_data) if self.image_data else {}
        except Exception:
            return {}

    def get_errors_data(self):
        try:
            return json.loads(self.errors_data) if self.errors_data else {}
        except Exception:
            return {}


class AlertHistory(models.Model):
    """Stores individual alerts generated during analysis."""

    LEVEL_CHOICES = [
        ("ok", "OK"),
        ("info", "Info"),
        ("warning", "Warning"),
        ("critical", "Critical"),
    ]

    report = models.ForeignKey(
        AnalysisReport, on_delete=models.CASCADE, related_name="alert_records"
    )
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    message = models.TextField()
    category = models.CharField(max_length=50, blank=True)  # performance/seo/security/error
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.level.upper()}] {self.message[:60]}"
