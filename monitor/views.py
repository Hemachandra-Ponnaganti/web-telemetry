import json
import math
import os
from concurrent.futures import ThreadPoolExecutor
from django.http import JsonResponse, HttpResponse, Http404
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.conf import settings
from django.db import connection

from .services.performance import check_status, analyze_seo, analyze_images
from .services.image_analyzer import analyze_uploaded_image, analyze_image_from_url
from .services.error_detector import detect_errors
from .services.advanced_performance import analyze_advanced_performance
from .services.advanced_seo import analyze_advanced_seo
from .services.security import analyze_security
from .services.ui_ux import analyze_ui_ux
from .services.wordpress import analyze_wordpress
from .services.structure import analyze_structure
from .services.remediation import generate_fix_suggestions

from .models import AnalysisReport, AlertHistory
from .notifications import send_alert_emails
from .thread_context import run_with_context, language_context



# ── Pages ─────────────────────────────────────────────────────────────────────

def home(request):
    """Serve React production frontend index.html if it exists, otherwise fall back to Django template."""
    react_index = os.path.join(settings.BASE_DIR, 'frontend', 'build', 'index.html')
    if os.path.exists(react_index):
        with open(react_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type="text/html")
    return render(request, "monitor/index.html")


def history_page(request):
    return render(request, "monitor/history.html")


def serve_react_root_files(request, filename):
    """Serve assets placed at the root of the React build directory (e.g. manifest.json, favicon.ico)."""
    filepath = os.path.join(settings.BASE_DIR, 'frontend', 'build', filename)
    if os.path.exists(filepath):
        if filename.endswith(".json"):
            ct = "application/json"
        elif filename.endswith(".ico"):
            ct = "image/x-icon"
        elif filename.endswith(".png"):
            ct = "image/png"
        elif filename.endswith(".txt"):
            ct = "text/plain"
        elif filename.endswith(".xml"):
            ct = "application/xml"
        else:
            ct = "application/octet-stream"
        with open(filepath, 'rb') as f:
            return HttpResponse(f.read(), content_type=ct)
    raise Http404("File not found")


# ── Helper: save report to DB ─────────────────────────────────────────────────


def _save_report(url, check_data, errors_data, seo_data, perf_data, sec_data, image_data=None, ui_ux_data=None, wordpress_data=None, structure_data=None):
    """Persist a full analysis run to the database."""
    try:
        perf_score = perf_data.get("performance_score") if perf_data else None
        seo_score = seo_data.get("seo_score") if seo_data else None
        sec_score = sec_data.get("security_score") if sec_data else None

        # Add custom metrics to save inside JSON fields
        if check_data and wordpress_data:
            check_data["wordpress"] = wordpress_data
        if perf_data:
            if ui_ux_data:
                perf_data["ui_ux"] = ui_ux_data
            if structure_data:
                perf_data["structure"] = structure_data

        overall = None
        scores = [s for s in [perf_score, seo_score, sec_score] if s is not None]
        if scores:
            overall = round(sum(scores) / len(scores))

        report = AnalysisReport.objects.create(
            url=url,
            status_code=check_data.get("status_code"),
            is_up=check_data.get("is_up", False),
            load_time=check_data.get("load_time"),
            ttfb=check_data.get("ttfb"),
            page_size_kb=check_data.get("page_size_kb"),
            perf_rating=check_data.get("perf_rating", ""),
            performance_score=perf_score,
            seo_score=seo_score,
            security_score=sec_score,
            overall_score=overall,
            page_title=seo_data.get("title", {}).get("text", "") if seo_data else "",
            meta_description=seo_data.get("meta_description", {}).get("text", "") if seo_data else "",
            is_https=check_data.get("url", "").startswith("https://"),
            has_ssl=sec_data.get("ssl", {}).get("valid", False) if sec_data else False,
            check_data=json.dumps(check_data),
            errors_data=json.dumps(errors_data),
            seo_data=json.dumps(seo_data),
            performance_data=json.dumps(perf_data),
            security_data=json.dumps(sec_data),
            image_data=json.dumps(image_data) if image_data else "",
        )

        # Save alerts with multiple severities
        all_alerts = []
        
        # Categorized lists of sources to scan alerts from
        alert_sources = [
            (check_data, "performance"),
            (perf_data, "performance"),
            (seo_data, "seo"),
            (sec_data, "security"),
            (errors_data, "error"),
            (image_data, "images"),
            (ui_ux_data, "ui_ux"),
            (wordpress_data, "wordpress"),
            (structure_data, "structure"),
        ]
        
        for src, cat in alert_sources:
            if not src:
                continue
            for a in src.get("alerts", []):
                all_alerts.append(AlertHistory(
                    report=report,
                    level=a.get("level", "info"),
                    message=a.get("message", ""),
                    category=cat
                ))
                
        AlertHistory.objects.bulk_create(all_alerts)

        # Send email notifications for alerts (Warning / Critical severity based)
        try:
            alerts_payload = [
                {"level": getattr(a, "level", "info"), "message": getattr(a, "message", ""), "category": getattr(a, "category", "")}
                for a in all_alerts
            ]
            import threading
            threading.Thread(target=send_alert_emails, args=(report, alerts_payload)).start()
        except Exception:
            pass

        return report.id
    except Exception:
        return None


# ── Core APIs (existing) ──────────────────────────────────────────────────────

@csrf_exempt
def api_check(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    res = check_status(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


@csrf_exempt
def api_errors(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    res = detect_errors(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


@csrf_exempt
def api_seo(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    res = analyze_seo(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


@csrf_exempt
def api_image(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    res = analyze_image_from_url(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


@csrf_exempt
def api_upload_image(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required."}, status=405)
    if "image" not in request.FILES:
        return JsonResponse({"error": "No image file provided."}, status=400)

    image_file = request.FILES["image"]
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"]
    content_type = image_file.content_type or ""
    if content_type not in allowed_types:
        name = image_file.name.lower()
        if not any(name.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"]):
            return JsonResponse({"error": "Unsupported file type."}, status=400)
    if image_file.size > 20 * 1024 * 1024:
        return JsonResponse({"error": f"File too large. Max 20 MB."}, status=400)
    return JsonResponse(analyze_uploaded_image(image_file))


# Keep alias
api_image_upload = api_upload_image


# ── Advanced APIs ─────────────────────────────────────────────────────────────

@csrf_exempt
def api_advanced_performance(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    res = analyze_advanced_performance(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


@csrf_exempt
def api_advanced_seo(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    res = analyze_advanced_seo(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


@csrf_exempt
def api_security(request):
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    res = analyze_security(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


# ── Granular Feature APIs (New) ────────────────────────────────────────────────

@csrf_exempt
def api_ui_ux(request):
    """GET /api/ui-ux/?url=..."""
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
        
    prev = AnalysisReport.objects.filter(url=url).first()
    res = analyze_ui_ux(url, previous_report=prev)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


@csrf_exempt
def api_wordpress(request):
    """GET /api/wordpress/?url=..."""
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
        
    res = analyze_wordpress(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


@csrf_exempt
def api_structure(request):
    """GET /api/structure/?url=..."""
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)
    
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
        
    res = analyze_structure(url)
    if "error" in res:
        return JsonResponse(res, status=400)
    return JsonResponse(res)


# ── Full Audit & Save Endpoint ─────────────────────────────────────────────────

@csrf_exempt
def api_full_analysis(request):
    """
    GET /api/analyze/?url=...
    Runs ALL modules in one call (concurrent threads) and saves results to DB.
    """
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)

    # Normalize
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    lang = request.GET.get("lang", "").strip()

    # Fetch previous report for regression checking
    previous_report = AnalysisReport.objects.filter(url=url).first()

    with ThreadPoolExecutor(max_workers=9) as executor:
        # Existing tasks
        future_check = executor.submit(run_with_context, lang, check_status, url)
        future_errors = executor.submit(run_with_context, lang, detect_errors, url)
        future_seo = executor.submit(run_with_context, lang, analyze_advanced_seo, url)
        future_perf = executor.submit(run_with_context, lang, analyze_advanced_performance, url)
        future_sec = executor.submit(run_with_context, lang, analyze_security, url)
        future_image = executor.submit(run_with_context, lang, analyze_images, url)
        
        # New monitoring tasks
        future_ui_ux = executor.submit(run_with_context, lang, analyze_ui_ux, url, previous_report=previous_report)
        future_wp = executor.submit(run_with_context, lang, analyze_wordpress, url)
        future_struct = executor.submit(run_with_context, lang, analyze_structure, url)


        # Retrieve results
        check_data = future_check.result()
        if check_data and "error" in check_data:
            return JsonResponse({"error": check_data["error"]}, status=400)

        errors_data = future_errors.result()
        seo_data = future_seo.result()
        perf_data = future_perf.result()
        sec_data = future_sec.result()
        image_data = future_image.result()
        
        # Retrieve new module data
        ui_ux_data = future_ui_ux.result()
        wp_data = future_wp.result()
        struct_data = future_struct.result()

    # Compute overall score including new audit systems
    scores = []
    if perf_data.get("performance_score") is not None:
        scores.append(perf_data["performance_score"])
    if seo_data.get("seo_score") is not None:
        scores.append(seo_data["seo_score"])
    if sec_data.get("security_score") is not None:
        scores.append(sec_data["security_score"])
        
    # Append UI & Structure values to overall rating if positive checks ran
    if ui_ux_data and "error" not in ui_ux_data:
        scores.append(ui_ux_data["ui_health_score"])
    if struct_data and "error" not in struct_data:
        scores.append(struct_data["structure_score"])
        
    overall_score = round(sum(scores) / len(scores)) if scores else None

    # Inject layout metrics into "performance" dictionary for direct frontend mapping
    if ui_ux_data and "error" not in ui_ux_data:
        perf_data["cls"] = ui_ux_data.get("layout_shift", {}).get("cls_hazard_index", 0.0)
        perf_data["responsive"] = ui_ux_data.get("responsiveness", {}).get("score", 100) >= 70
        perf_data["broken_ui_count"] = ui_ux_data.get("broken_elements", {}).get("broken_ui_count", 0)
        
        diff_pct = ui_ux_data.get("visual_regression", {}).get("diff_percentage", 0.0)
        if ui_ux_data.get("visual_regression", {}).get("visual_diff_detected"):
            perf_data["visual_changes"] = f"Yes ({diff_pct}%)"
        else:
            perf_data["visual_changes"] = "None"

    # Gather alerts from all modules
    all_alerts = []
    alert_sources = [
        (check_data, "performance"),
        (errors_data, "error"),
        (perf_data, "performance"),
        (seo_data, "seo"),
        (sec_data, "security"),
        (ui_ux_data, "ui_ux"),
        (wp_data, "wordpress"),
        (struct_data, "structure"),
    ]
    for src, cat in alert_sources:
        if not src:
            continue
        for a in src.get("alerts", []):
            a["category"] = cat
            all_alerts.append(a)
            
    if image_data:
        for a in image_data.get("alerts", []):
            a["category"] = "images"
            all_alerts.append(a)

    # Save to Database
    report_id = _save_report(
        url, check_data, errors_data, seo_data, perf_data, sec_data, image_data,
        ui_ux_data=ui_ux_data, wordpress_data=wp_data, structure_data=struct_data
    )

    full_payload = {
        "check": check_data,
        "seo": seo_data,
        "performance": perf_data,
        "security": sec_data,
        "ui_ux": ui_ux_data,
        "wordpress": wp_data,
        "structure": struct_data,
        "images": image_data
    }
    fix_suggestions = generate_fix_suggestions(full_payload)

    return JsonResponse({
        "url": url,
        "report_id": report_id,
        "overall_score": overall_score,
        "overall_label": _score_label(overall_score),
        "check": check_data,
        "errors": errors_data,
        "seo": seo_data,
        "performance": perf_data,
        "security": sec_data,
        "images": image_data,
        "ui_ux": ui_ux_data,
        "wordpress": wp_data,
        "structure": struct_data,
        "all_alerts": all_alerts,
        "fix_suggestions": fix_suggestions,
    })


# ── History APIs ──────────────────────────────────────────────────────────────

def api_history(request):
    url_filter = request.GET.get("url", "").strip()
    page = max(int(request.GET.get("page", 1)), 1)
    page_size = min(max(int(request.GET.get("page_size", 20)), 1), 100)

    qs = AnalysisReport.objects.all()
    if url_filter:
        qs = qs.filter(url__icontains=url_filter)

    total = qs.count()
    offset = (page - 1) * page_size
    reports_qs = qs[offset:offset + page_size]

    reports = []
    for r in reports_qs:
        reports.append({
            "id": r.id,
            "url": r.url,
            "analyzed_at": r.analyzed_at.strftime("%Y-%m-%d %H:%M:%S"),
            "is_up": r.is_up,
            "status_code": r.status_code,
            "load_time": r.load_time,
            "performance_score": r.performance_score,
            "seo_score": r.seo_score,
            "security_score": r.security_score,
            "overall_score": r.overall_score,
            "page_title": r.page_title[:60] if r.page_title else "",
            "is_https": r.is_https,
        })

    total_pages = math.ceil(total / page_size) if page_size else 1
    return JsonResponse({
        "reports": reports,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    })


@csrf_exempt
def api_quick_analysis(request):
    """GET /api/quick-analyze/?url=...  — lightweight scan for faster feedback."""
    url = request.GET.get("url", "").strip()
    if not url:
        return JsonResponse({"error": "URL parameter is required."}, status=400)

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    lang = request.GET.get("lang", "").strip()
    with language_context(lang):
        check_data = check_status(url)
        if "error" in check_data:
            return JsonResponse({"error": check_data["error"]}, status=400)

        seo_data = analyze_seo(url)
        errors_data = detect_errors(url)

    light_score = None
    if isinstance(check_data.get("load_time"), (int, float)):
        light_score = max(0, 100 - int(check_data.get("load_time", 0) * 15))

    return JsonResponse({
        "url": url,
        "quick_score": light_score,
        "check": check_data,
        "seo": seo_data,
        "errors": errors_data,
    })



def api_report_detail(request, report_id):
    """GET /api/history/<id>/  — full report detail"""
    try:
        r = AnalysisReport.objects.get(id=report_id)
    except AnalysisReport.DoesNotExist:
        return JsonResponse({"error": "Report not found."}, status=404)

    # Load nested dictionaries, checking for stored new metrics inside check/perf JSON columns
    check_raw = r.get_check_data()
    wordpress_data = check_raw.pop("wordpress", None)
    
    perf_raw = r.get_performance_data()
    ui_ux_data = perf_raw.pop("ui_ux", None)
    structure_data = perf_raw.pop("structure", None)

    # Re-inject layout variables into "performance" dictionary if not already merged
    if ui_ux_data:
        perf_raw["cls"] = ui_ux_data.get("layout_shift", {}).get("cls_hazard_index", 0.0)
        perf_raw["responsive"] = ui_ux_data.get("responsiveness", {}).get("score", 100) >= 70
        perf_raw["broken_ui_count"] = ui_ux_data.get("broken_elements", {}).get("broken_ui_count", 0)
        
        diff_pct = ui_ux_data.get("visual_regression", {}).get("diff_percentage", 0.0)
        if ui_ux_data.get("visual_regression", {}).get("visual_diff_detected"):
            perf_raw["visual_changes"] = f"Yes ({diff_pct}%)"
        else:
            perf_raw["visual_changes"] = "None"

    alerts = list(r.alert_records.values("level", "message", "category", "created_at"))
    for a in alerts:
        a["created_at"] = a["created_at"].strftime("%Y-%m-%d %H:%M:%S")

    full_payload = {
        "check": check_raw,
        "seo": r.get_seo_data(),
        "performance": perf_raw,
        "security": r.get_security_data(),
        "images": r.get_image_data(),
        "ui_ux": ui_ux_data,
        "wordpress": wordpress_data,
        "structure": structure_data,
        "errors": r.get_errors_data()
    }
    fix_suggestions = generate_fix_suggestions(full_payload)

    return JsonResponse({
        "id": r.id,
        "report_id": r.id,
        "url": r.url,
        "created_at": r.analyzed_at.strftime("%Y-%m-%d %H:%M:%S"),
        "analyzed_at": r.analyzed_at.strftime("%Y-%m-%d %H:%M:%S"),
        "is_up": r.is_up,
        "status_code": r.status_code,
        "load_time": r.load_time,
        "ttfb": r.ttfb,
        "page_size_kb": r.page_size_kb,
        "performance_score": r.performance_score,
        "seo_score": r.seo_score,
        "security_score": r.security_score,
        "overall_score": r.overall_score,
        "page_title": r.page_title,
        "is_https": r.is_https,
        "has_ssl": r.has_ssl,
        "check": check_raw,
        "seo": r.get_seo_data(),
        "performance": perf_raw,
        "security": r.get_security_data(),
        "images": r.get_image_data(),
        "ui_ux": ui_ux_data,
        "wordpress": wordpress_data,
        "structure": structure_data,
        "errors": r.get_errors_data(),
        "alerts": alerts,
        "all_alerts": alerts,
        "fix_suggestions": fix_suggestions,
    })


def api_history_stats(request):
    url_filter = request.GET.get("url", "").strip()
    limit = min(int(request.GET.get("limit", 10)), 50)

    qs = AnalysisReport.objects.all()
    if url_filter:
        qs = qs.filter(url__icontains=url_filter)

    recent = list(qs[:limit])
    recent.reverse()  # chronological order for charts

    return JsonResponse({
        "labels": [r.analyzed_at.strftime("%m/%d %H:%M") for r in recent],
        "load_times": [r.load_time for r in recent],
        "performance_scores": [r.performance_score for r in recent],
        "seo_scores": [r.seo_score for r in recent],
        "security_scores": [r.security_score for r in recent],
        "overall_scores": [r.overall_score for r in recent],
        "status_codes": [r.status_code for r in recent],
    })


@csrf_exempt
def api_db_diagnostics(request):
    """GET /api/db-diagnostics/ - Return active database metrics."""
    try:
        db_name = settings.DATABASES['default']['NAME']
        db_path = os.path.abspath(str(db_name)) if db_name else None
        
        size_bytes = 0
        if db_path and os.path.exists(db_path):
            size_bytes = os.path.getsize(db_path)
            
        reports_count = AnalysisReport.objects.count()
        alerts_count = AlertHistory.objects.count()
        
        integrity_ok = False
        try:
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA integrity_check;")
                row = cursor.fetchone()
                if row and row[0] == "ok":
                    integrity_ok = True
        except Exception:
            pass
            
        return JsonResponse({
            "success": True,
            "file_path": db_path,
            "size_bytes": size_bytes,
            "size_kb": round(size_bytes / 1024, 2),
            "size_mb": round(size_bytes / (1024 * 1024), 2),
            "reports_count": reports_count,
            "alerts_count": alerts_count,
            "integrity_ok": integrity_ok,
            "engine": "sqlite3",
            "last_checked": timezone.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@csrf_exempt
def api_db_vacuum(request):
    """POST/GET /api/db-vacuum/ - Run VACUUM command and return space details."""
    try:
        db_name = settings.DATABASES['default']['NAME']
        db_path = os.path.abspath(str(db_name)) if db_name else None
        
        size_before = 0
        if db_path and os.path.exists(db_path):
            size_before = os.path.getsize(db_path)
            
        with connection.cursor() as cursor:
            cursor.execute("VACUUM;")
            
        size_after = 0
        if db_path and os.path.exists(db_path):
            size_after = os.path.getsize(db_path)
            
        saved_bytes = max(0, size_before - size_after)
        reduction_pct = 0.0
        if size_before > 0:
            reduction_pct = round((saved_bytes / size_before) * 100, 2)
            
        return JsonResponse({
            "success": True,
            "size_before_bytes": size_before,
            "size_before_kb": round(size_before / 1024, 2),
            "size_after_bytes": size_after,
            "size_after_kb": round(size_after / 1024, 2),
            "saved_bytes": saved_bytes,
            "saved_kb": round(saved_bytes / 1024, 2),
            "reduction_percent": reduction_pct,
            "optimized_at": timezone.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


def _score_label(score):
    if score is None:
        return "N/A"
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 50:
        return "Needs Improvement"
    else:
        return "Poor"


@csrf_exempt
def api_settings(request):
    """GET/POST /api/settings/ - Manage SRE settings and Gmail configurations."""
    sre_settings_path = os.path.join(settings.BASE_DIR, 'sre_settings.json')
    
    if request.method == "GET":
        sre_config = {}
        if os.path.exists(sre_settings_path):
            try:
                with open(sre_settings_path, 'r', encoding='utf-8') as f:
                    sre_config = json.load(f)
            except Exception:
                pass
        
        # Pull defaults from active django settings if not in sre_settings.json
        slack_webhook = sre_config.get("slack_webhook", "https://hooks.slack.com/services/T00/B00/XRE2026")
        telegram_chat_id = sre_config.get("telegram_chat_id", "-10098471203")
        
        email_recipients = getattr(settings, "ALERT_EMAIL_RECIPIENTS", [])
        critical_email = sre_config.get("critical_email", email_recipients[0] if email_recipients else "alex.rivera@monitorpro.sre")
        
        email_host_user = sre_config.get("email_host_user", getattr(settings, "EMAIL_HOST_USER", ""))
        email_host_password = sre_config.get("email_host_password", getattr(settings, "EMAIL_HOST_PASSWORD", ""))
        
        # Mask password for security
        masked_password = ""
        if email_host_password:
            masked_password = "••••••••••••••••"
            
        return JsonResponse({
            "success": True,
            "slack_webhook": slack_webhook,
            "telegram_chat_id": telegram_chat_id,
            "critical_email": critical_email,
            "email_host_user": email_host_user,
            "email_host_password": masked_password,
        })
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            slack_webhook = data.get("slack_webhook", "").strip()
            telegram_chat_id = data.get("telegram_chat_id", "").strip()
            critical_email = data.get("critical_email", "").strip()
            email_host_user = data.get("email_host_user", "").strip()
            email_host_password = data.get("email_host_password", "").strip()
            
            # Load old settings first to handle masked password case
            old_config = {}
            if os.path.exists(sre_settings_path):
                try:
                    with open(sre_settings_path, 'r', encoding='utf-8') as f:
                        old_config = json.load(f)
                except Exception:
                    pass
            
            # If incoming password is empty or masked, preserve the existing one
            if not email_host_password or email_host_password == "••••••••••••••••" or "•••" in email_host_password:
                email_host_password = old_config.get("email_host_password") or getattr(settings, "EMAIL_HOST_PASSWORD", "")
                
            # Prepare new config dictionary
            new_config = {
                "slack_webhook": slack_webhook,
                "telegram_chat_id": telegram_chat_id,
                "critical_email": critical_email,
                "email_host_user": email_host_user,
                "email_host_password": email_host_password,
                "alert_email_recipients": critical_email,
            }
            
            # Save config dictionary to file
            with open(sre_settings_path, 'w', encoding='utf-8') as f:
                json.dump(new_config, f, indent=4)
                
            # Dynamically apply settings to current process
            settings.EMAIL_HOST_USER = email_host_user
            settings.EMAIL_HOST_PASSWORD = email_host_password
            settings.EMAIL_FROM = email_host_user if email_host_user else "monitor@example.com"
            settings.DEFAULT_FROM_EMAIL = settings.EMAIL_FROM
            
            if critical_email:
                settings.ALERT_EMAIL_RECIPIENTS = [r.strip() for r in critical_email.split(",") if r.strip()]
            else:
                settings.ALERT_EMAIL_RECIPIENTS = []
                
            is_gmail = "@gmail.com" in email_host_user.lower()
            if is_gmail:
                settings.EMAIL_HOST = "smtp.gmail.com"
                settings.EMAIL_PORT = 587
                settings.EMAIL_USE_TLS = True
                
            if email_host_user and email_host_password:
                settings.EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
            else:
                settings.EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend" if settings.DEBUG else "django.core.mail.backends.smtp.EmailBackend"
                
            return JsonResponse({
                "success": True, 
                "message": "Real-time SRE and SMTP credentials successfully synchronized and saved to sre_settings.json."
            })
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def api_send_test_email(request):
    """POST /api/send-test-email/ - Dispatches a real-time SMTP test alert email."""
    if request.method != "POST":
        return JsonResponse({"error": "POST method required."}, status=405)
    try:
        from django.core.mail import send_mail
        recipients = getattr(settings, "ALERT_EMAIL_RECIPIENTS", [])
        if not recipients:
            return JsonResponse({"success": False, "error": "No email recipient configured. Please save a critical email recipient first."}, status=400)
        
        subject = "TEST SRE ALERT: Gmail Connection Verified"
        body = (
            "Hello SRE Operator,\n\n"
            "This is a real-time test alert from your MonitorPro SRE Dashboard.\n"
            "Your Gmail SMTP configuration is working perfectly!\n\n"
            "Status: OPERATIONAL\n"
            "Timestamp: " + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + " UTC\n\n"
            "System: MonitorPro Enterprise SRE Console"
        )
        from_email = getattr(settings, "EMAIL_FROM", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None) or "monitor@example.com"
        
        # We run the email dispatch
        send_mail(subject, body, from_email, recipients, fail_silently=False)
        return JsonResponse({"success": True, "message": f"Test alert email successfully dispatched to {', '.join(recipients)} via SMTP."})
    except Exception as e:
        return JsonResponse({"success": False, "error": f"SMTP Connection Failed: {str(e)}"}, status=500)


@csrf_exempt
def api_benchmark(request):
    """
    GET /api/benchmark/?url1=...&url2=...
    Runs audits for both URLs concurrently using ThreadPoolExecutor and compares their scores.
    """
    url1 = request.GET.get("url1", "").strip()
    url2 = request.GET.get("url2", "").strip()
    if not url1 or not url2:
        return JsonResponse({"error": "Both url1 and url2 parameters are required."}, status=400)

    # Normalize URLs
    if not url1.startswith(("http://", "https://")):
        url1 = "https://" + url1
    if not url2.startswith(("http://", "https://")):
        url2 = "https://" + url2

    lang = request.GET.get("lang", "").strip()

    def run_single_url_audit(url):
        # We run a subset of essential SRE modules concurrently for quick feedback
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_check = executor.submit(run_with_context, lang, check_status, url)
            future_seo = executor.submit(run_with_context, lang, analyze_advanced_seo, url)
            future_perf = executor.submit(run_with_context, lang, analyze_advanced_performance, url)
            future_sec = executor.submit(run_with_context, lang, analyze_security, url)
            future_ui_ux = executor.submit(run_with_context, lang, analyze_ui_ux, url)
            
            check_data = future_check.result()
            if "error" in check_data:
                return {"error": check_data["error"]}
                
            seo_data = future_seo.result()
            perf_data = future_perf.result()
            sec_data = future_sec.result()
            ui_ux_data = future_ui_ux.result()
            
        scores = []
        if perf_data.get("performance_score") is not None:
            scores.append(perf_data["performance_score"])
        if seo_data.get("seo_score") is not None:
            scores.append(seo_data["seo_score"])
        if sec_data.get("security_score") is not None:
            scores.append(sec_data["security_score"])
        if ui_ux_data and "error" not in ui_ux_data:
            scores.append(ui_ux_data["ui_health_score"])
            
        overall_score = round(sum(scores) / len(scores)) if scores else None
        
        return {
            "url": url,
            "overall_score": overall_score,
            "overall_label": _score_label(overall_score),
            "check": check_data,
            "seo": seo_data,
            "performance": perf_data,
            "security": sec_data,
            "ui_ux": ui_ux_data,
        }

    with ThreadPoolExecutor(max_workers=2) as main_executor:
        future1 = main_executor.submit(run_single_url_audit, url1)
        future2 = main_executor.submit(run_single_url_audit, url2)
        
        res1 = future1.result()
        res2 = future2.result()

    if "error" in res1:
        return JsonResponse({"error": f"Failed to audit URL 1 ({url1}): {res1['error']}"}, status=400)
    if "error" in res2:
        return JsonResponse({"error": f"Failed to audit URL 2 ({url2}): {res2['error']}"}, status=400)

    # Compile the side-by-side comparison payload
    comparison = {
        "url1": res1,
        "url2": res2,
        "compared_at": timezone.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    return JsonResponse(comparison)

