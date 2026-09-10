import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

logger = logging.getLogger(__name__)

def generate_html_email(report, critical_alerts, warning_alerts, info_alerts, is_down):
    """Compile a beautiful, responsive HTML template for SRE alerts."""
    status_bg = "#ea4335" if is_down or critical_alerts else "#fbbc04" if warning_alerts else "#1a73e8"
    status_text = "WEBSITE DOWN" if is_down else "CRITICAL ALERTS" if critical_alerts else "WARNING ALERTS" if warning_alerts else "HEALTH STATUS"
    
    analyzed_time = report.analyzed_at
    if hasattr(analyzed_time, "strftime"):
        time_str = analyzed_time.strftime("%Y-%m-%d %H:%M:%S")
    else:
        time_str = str(analyzed_time)

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f3f4; margin: 0; padding: 20px; color: #3c4043; }}
            .card {{ max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin: 0 auto; border: 1px solid #dadce0; }}
            .header {{ background-color: {status_bg}; padding: 24px; text-align: center; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }}
            .content {{ padding: 32px 24px; }}
            .meta-table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; }}
            .meta-table td {{ padding: 10px 12px; border-bottom: 1px solid #f1f3f4; font-size: 14px; }}
            .meta-table td.label {{ font-weight: 600; color: #5f6368; width: 35%; }}
            .meta-table td.value {{ color: #202124; }}
            .section-title {{ font-size: 15px; font-weight: 700; text-transform: uppercase; color: #5f6368; letter-spacing: 0.8px; margin: 24px 0 12px 0; border-bottom: 2px solid #f1f3f4; padding-bottom: 6px; }}
            .alert-item {{ padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; font-size: 14px; line-height: 1.4; display: flex; align-items: start; }}
            .alert-item.critical {{ background-color: #fce8e6; border-left: 4px solid #ea4335; color: #c5221f; }}
            .alert-item.warning {{ background-color: #fef7e0; border-left: 4px solid #fbbc04; color: #b06000; }}
            .alert-item.info {{ background-color: #e8f0fe; border-left: 4px solid #1a73e8; color: #174ea6; }}
            .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 11px; color: #70757a; border-top: 1px solid #e8eaed; }}
            .footer a {{ color: #1a73e8; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h1>{status_text}</h1>
            </div>
            <div class="content">
                <table class="meta-table">
                    <tr>
                        <td class="label">Target Website</td>
                        <td class="value"><a href="{report.url}" style="color: #1a73e8; text-decoration: none;">{report.url}</a></td>
                    </tr>
                    <tr>
                        <td class="label">Uptime Status</td>
                        <td class="value" style="font-weight: bold; color: {'#ea4335' if is_down else '#137333'}">
                            {'🚨 DOWN' if is_down else '✅ OPERATIONAL'}
                        </td>
                    </tr>
                    <tr>
                        <td class="label">HTTP Status Code</td>
                        <td class="value" style="font-family: monospace; font-weight: bold;">{getattr(report, 'status_code', None) or 'Unknown'}</td>
                    </tr>
                    <tr>
                        <td class="label">Load Time</td>
                        <td class="value">{getattr(report, 'load_time', None) or 'Unknown'}s</td>
                    </tr>
                    <tr>
                        <td class="label">Overall Score</td>
                        <td class="value" style="font-weight: bold;">{getattr(report, 'overall_score', None) or 'N/A'}/100</td>
                    </tr>
                    <tr>
                        <td class="label">Scan Time</td>
                        <td class="value">{time_str} UTC</td>
                    </tr>
                </table>
    """
    
    if is_down:
        html += """
        <div class="alert-item critical">
            <strong>CRITICAL OUTAGE:</strong> The website is currently unreachable or returning server-side errors! Action is required immediately.
        </div>
        """

    if critical_alerts:
        html += '<div class="section-title">🔥 Critical Alerts</div>'
        for a in critical_alerts:
            html += f"""
            <div class="alert-item critical">
                <strong>[{a.get('category','generic').upper()}]</strong> {a.get('message')}
            </div>
            """

    if warning_alerts:
        html += '<div class="section-title">⚠ Warning Alerts</div>'
        for a in warning_alerts:
            html += f"""
            <div class="alert-item warning">
                <strong>[{a.get('category','generic').upper()}]</strong> {a.get('message')}
            </div>
            """

    if info_alerts:
        html += '<div class="section-title">ℹ Info Notes</div>'
        for a in info_alerts:
            html += f"""
            <div class="alert-item info">
                <strong>[{a.get('category','generic').upper()}]</strong> {a.get('message')}
            </div>
            """

    html += """
            </div>
            <div class="footer">
                This is an automated alert from your <strong>MonitorPro SRE Platform</strong>.<br>
                To customize alert lists, sign in and update SRE settings in settings tab.
            </div>
        </div>
    </body>
    </html>
    """
    return html


def send_alert_emails(report, alerts):
    """
    Send HTML-formatted email notifications based on alert conditions and severity.
    """
    recipients = getattr(settings, "ALERT_EMAIL_RECIPIENTS", []) or []
    if not recipients:
        logger.debug("No ALERT_EMAIL_RECIPIENTS configured; skipping emails.")
        return False

    # Filter alerts by severity
    critical_alerts = []
    warning_alerts = []
    info_alerts = []

    for a in alerts:
        lvl = (a.get("level") or "").lower()
        cat = (a.get("category") or "").lower()
        msg = a.get("message") or ""

        # Flag server errors or database errors as critical automatically
        if "503" in msg or "504" in msg or "database" in msg.lower() or "db error" in msg.lower():
            a["level"] = "critical"
            lvl = "critical"

        if lvl == "critical":
            critical_alerts.append(a)
        elif lvl == "warning":
            warning_alerts.append(a)
        else:
            info_alerts.append(a)

    is_down = not getattr(report, "is_up", True)
    has_critical = len(critical_alerts) > 0
    has_warning = len(warning_alerts) > 0
    
    # Send email for any downtime, critical alert, or warning alert
    should_send = is_down or has_critical or has_warning

    if not should_send:
        return False

    # Subject line based on severity trigger
    if is_down:
        subject = f"🚨 [CRITICAL OUTAGE] Website DOWN: {report.url}"
    elif has_critical:
        subject = f"🔴 [CRITICAL ALERT] Issues detected on {report.url}"
    elif has_warning:
        subject = f"🟡 [WARNING ALERT] Performance/SEO alerts for {report.url}"
    else:
        subject = f"🔵 [INFO] Health scan report for {report.url}"

    # Build Plain Text Backup Body
    text_lines = [
        "========================================",
        "          WEBSITE MONITOR ALERT          ",
        "========================================",
        f"Target Website : {report.url}",
        f"HTTP Status    : {getattr(report, 'status_code', None) or 'UNKNOWN'}",
        f"Uptime Status  : {'DOWN' if is_down else 'UP'}",
        f"Overall Score  : {getattr(report, 'overall_score', None) or 'N/A'}/100",
        "========================================",
        ""
    ]
    for a in critical_alerts:
        text_lines.append(f"CRITICAL: [{a.get('category','generic').upper()}] {a.get('message')}")
    for a in warning_alerts:
        text_lines.append(f"WARNING: [{a.get('category','generic').upper()}] {a.get('message')}")
    for a in info_alerts:
        text_lines.append(f"INFO: [{a.get('category','generic').upper()}] {a.get('message')}")
        
    text_body = "\n".join(text_lines)

    # Build Gorgeous HTML Email Body
    html_body = generate_html_email(report, critical_alerts, warning_alerts, info_alerts, is_down)

    from_email = getattr(settings, "EMAIL_FROM", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None) or "monitor@example.com"
    try:
        msg = EmailMultiAlternatives(subject, text_body, from_email, recipients)
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        
        logger.info("Successfully dispatched rich HTML alert email to %s (Criticals: %d, Warnings: %d)", 
                    recipients, len(critical_alerts), len(warning_alerts))
        return True
    except Exception as e:
        logger.error("Failed to dispatch SRE SMTP email alert: %s", str(e))
        return False

