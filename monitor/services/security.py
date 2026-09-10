"""
Security Monitoring Service.
Covers: HTTPS enforcement, SSL certificate validation,
security headers analysis, and security scoring.
"""
import requests
import ssl
import socket
import warnings
from datetime import datetime, timezone
from urllib.parse import urlparse

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# Security headers to check and their importance
_SECURITY_HEADERS = {
    "strict-transport-security": {
        "name": "Strict-Transport-Security (HSTS)",
        "importance": "critical",
        "description": "Forces browsers to use HTTPS for future requests.",
    },
    "content-security-policy": {
        "name": "Content-Security-Policy (CSP)",
        "importance": "high",
        "description": "Prevents XSS and data injection attacks.",
    },
    "x-content-type-options": {
        "name": "X-Content-Type-Options",
        "importance": "medium",
        "description": "Prevents MIME-type sniffing attacks.",
    },
    "x-frame-options": {
        "name": "X-Frame-Options",
        "importance": "medium",
        "description": "Prevents clickjacking attacks.",
    },
    "x-xss-protection": {
        "name": "X-XSS-Protection",
        "importance": "low",
        "description": "Enables browser XSS filtering (legacy).",
    },
    "referrer-policy": {
        "name": "Referrer-Policy",
        "importance": "medium",
        "description": "Controls referrer information sent with requests.",
    },
    "permissions-policy": {
        "name": "Permissions-Policy",
        "importance": "medium",
        "description": "Controls browser feature permissions.",
    },
}


def check_ssl_certificate(hostname, port=443):
    """Check SSL certificate validity and expiry."""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()

        # Parse expiry
        not_after_str = cert.get("notAfter", "")
        not_before_str = cert.get("notBefore", "")

        try:
            not_after = datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z")
            not_after = not_after.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            days_remaining = (not_after - now).days
        except Exception:
            days_remaining = None
            not_after = None

        # Subject / issuer
        subject = dict(x[0] for x in cert.get("subject", []))
        issuer = dict(x[0] for x in cert.get("issuer", []))

        if days_remaining is None:
            cert_status = "unknown"
            cert_msg = "Could not determine certificate expiry."
        elif days_remaining < 0:
            cert_status = "critical"
            cert_msg = f"SSL certificate has EXPIRED ({abs(days_remaining)} days ago)."
        elif days_remaining < 14:
            cert_status = "critical"
            cert_msg = f"SSL certificate expires in {days_remaining} days — renew immediately."
        elif days_remaining < 30:
            cert_status = "warning"
            cert_msg = f"SSL certificate expires in {days_remaining} days — renew soon."
        else:
            cert_status = "good"
            cert_msg = f"SSL certificate valid for {days_remaining} more days."

        return {
            "valid": True,
            "status": cert_status,
            "message": cert_msg,
            "days_remaining": days_remaining,
            "expires": not_after.strftime("%Y-%m-%d") if not_after else "unknown",
            "issued_to": subject.get("commonName", "unknown"),
            "issued_by": issuer.get("organizationName", issuer.get("commonName", "unknown")),
            "protocol": ssock.version() if hasattr(ssock, "version") else "TLS",
        }

    except ssl.SSLCertVerificationError as e:
        return {
            "valid": False,
            "status": "critical",
            "message": f"SSL certificate verification failed: {str(e)[:80]}",
        }
    except ssl.SSLError as e:
        return {
            "valid": False,
            "status": "critical",
            "message": f"SSL error: {str(e)[:80]}",
        }
    except socket.timeout:
        return {
            "valid": False,
            "status": "warning",
            "message": "SSL check timed out.",
        }
    except ConnectionRefusedError:
        return {
            "valid": False,
            "status": "warning",
            "message": "Could not connect to port 443 for SSL check.",
        }
    except Exception as e:
        return {
            "valid": False,
            "status": "warning",
            "message": f"SSL check error: {str(e)[:80]}",
        }


def analyze_security_headers(response_headers):
    """Analyze HTTP security headers."""
    headers_lower = {k.lower(): v for k, v in response_headers.items()}
    results = {}
    missing_critical = []
    missing_high = []
    present_count = 0

    for header_key, meta in _SECURITY_HEADERS.items():
        value = headers_lower.get(header_key)
        present = value is not None
        if present:
            present_count += 1

        entry = {
            "name": meta["name"],
            "present": present,
            "value": value[:120] if value else None,
            "importance": meta["importance"],
            "description": meta["description"],
            "status": "good" if present else ("critical" if meta["importance"] == "critical" else "warning"),
        }
        results[header_key] = entry

        if not present:
            if meta["importance"] == "critical":
                missing_critical.append(meta["name"])
            elif meta["importance"] == "high":
                missing_high.append(meta["name"])

    total = len(_SECURITY_HEADERS)
    coverage_pct = round((present_count / total) * 100)

    return {
        "headers": results,
        "present_count": present_count,
        "total_checked": total,
        "coverage_percent": coverage_pct,
        "missing_critical": missing_critical,
        "missing_high": missing_high,
        "status": "good" if coverage_pct >= 70 else "warning" if coverage_pct >= 40 else "poor",
    }


def check_https_enforcement(url, response):
    """Check HTTPS enforcement and mixed content."""
    parsed = urlparse(url)
    is_https = parsed.scheme == "https"
    final_https = response.url.startswith("https://")

    # Check if HTTP redirects to HTTPS
    redirected_to_https = False
    if not is_https:
        for r in response.history:
            if r.url.startswith("https://"):
                redirected_to_https = True
                break

    issues = []
    if not is_https and not redirected_to_https:
        issues.append("Site does not use HTTPS — all data is transmitted in plain text.")
    if not is_https and redirected_to_https:
        issues.append("HTTP redirects to HTTPS — but direct HTTPS should be enforced.")

    hsts = response.headers.get("Strict-Transport-Security", "")
    if is_https and not hsts:
        issues.append("HSTS header missing — browsers may not enforce HTTPS on future visits.")

    return {
        "is_https": is_https,
        "final_https": final_https,
        "redirected_to_https": redirected_to_https,
        "hsts_present": bool(hsts),
        "hsts_value": hsts[:100] if hsts else None,
        "issues": issues,
        "status": "good" if is_https and not issues else "warning" if redirected_to_https else "critical",
    }


def calculate_security_score(https_status, ssl_status, header_coverage, missing_critical_count):
    """Calculate a 0-100 security score."""
    score = 100

    # HTTPS (30 pts)
    if https_status == "critical":
        score -= 30
    elif https_status == "warning":
        score -= 15

    # SSL (30 pts)
    if ssl_status == "critical":
        score -= 30
    elif ssl_status == "warning":
        score -= 15

    # Security headers (40 pts)
    header_score = (header_coverage / 100) * 40
    score -= (40 - header_score)

    # Extra penalty for missing critical headers
    score -= missing_critical_count * 5

    return max(0, min(100, round(score)))


def analyze_security(url):
    """Full security analysis."""
    url_norm = url.strip()
    if not url_norm.startswith(("http://", "https://")):
        url_norm = "https://" + url_norm

    try:
        parsed = urlparse(url_norm)
        if not parsed.netloc:
            return {"error": "Invalid URL — no domain found."}

        # Fetch page
        response = requests.get(
            url_norm, timeout=15, headers=_HEADERS,
            verify=False, allow_redirects=True
        )

        # SSL check (only for HTTPS)
        hostname = parsed.netloc.split(":")[0]
        if url_norm.startswith("https://") or response.url.startswith("https://"):
            ssl_data = check_ssl_certificate(hostname)
        else:
            ssl_data = {
                "valid": False,
                "status": "critical",
                "message": "Site does not use HTTPS — no SSL certificate to check.",
            }

        # HTTPS enforcement
        https_data = check_https_enforcement(url_norm, response)

        # Security headers
        headers_data = analyze_security_headers(response.headers)

        # Score
        sec_score = calculate_security_score(
            https_data["status"],
            ssl_data["status"],
            headers_data["coverage_percent"],
            len(headers_data["missing_critical"]),
        )

        # Alerts
        alerts = []
        if not https_data["is_https"]:
            alerts.append({"level": "critical", "category": "security",
                           "message": "Site is not using HTTPS — data is transmitted insecurely."})

        if ssl_data["status"] == "critical":
            alerts.append({"level": "critical", "category": "security",
                           "message": ssl_data["message"]})
        elif ssl_data["status"] == "warning":
            alerts.append({"level": "warning", "category": "security",
                           "message": ssl_data["message"]})

        for h in headers_data["missing_critical"]:
            alerts.append({"level": "critical", "category": "security",
                           "message": f"Missing critical security header: {h}"})

        for h in headers_data["missing_high"]:
            alerts.append({"level": "warning", "category": "security",
                           "message": f"Missing important security header: {h}"})

        return {
            "url": url_norm,
            "security_score": sec_score,
            "score_label": _score_label(sec_score),
            "https": https_data,
            "ssl": ssl_data,
            "headers": headers_data,
            "alerts": alerts,
        }

    except requests.exceptions.SSLError:
        return {
            "url": url_norm,
            "error": "SSL certificate error.",
            "security_score": 0,
            "alerts": [{"level": "critical", "category": "security",
                        "message": "SSL certificate error — invalid or expired certificate."}],
        }
    except requests.exceptions.ConnectionError:
        return {"error": "Connection failed.", "url": url_norm}
    except requests.exceptions.Timeout:
        return {"error": "Request timed out.", "url": url_norm}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}", "url": url_norm}


def _score_label(score):
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 50:
        return "Needs Improvement"
    else:
        return "Poor"
