"""
Error detection service.
Classifies HTTP status codes and generates structured error reports with severity.
"""
import requests
import time
from urllib.parse import urlparse


def _make_request(url):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    start = time.time()
    response = requests.get(url, timeout=15, headers=headers, allow_redirects=True)
    load_time = round(time.time() - start, 3)
    return response, load_time


def normalize_url(url):
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def classify_status(code):
    """Return severity, category label, and alert message for an HTTP status code."""
    if code == 200:
        return {
            "severity": "ok",
            "color": "green",
            "category": "OK",
            "label": "200 OK",
            "message": "Website is reachable and responding normally.",
            "alert": None,
        }
    elif code == 301 or code == 302:
        return {
            "severity": "info",
            "color": "blue",
            "category": "Redirect",
            "label": f"{code} Redirect",
            "message": f"Page redirects to another URL (HTTP {code}).",
            "alert": "Page is redirecting — check if the destination is correct.",
        }
    elif code == 400:
        return {
            "severity": "warning",
            "color": "orange",
            "category": "Client Error",
            "label": "400 Bad Request",
            "message": "The server could not understand the request.",
            "alert": "Bad request sent to server.",
        }
    elif code == 401:
        return {
            "severity": "warning",
            "color": "orange",
            "category": "Client Error",
            "label": "401 Unauthorized",
            "message": "Authentication is required to access this resource.",
            "alert": "Page requires authentication.",
        }
    elif code == 403:
        return {
            "severity": "warning",
            "color": "orange",
            "category": "Client Error",
            "label": "403 Forbidden",
            "message": "Access to this resource is forbidden.",
            "alert": "Access denied — page is forbidden.",
        }
    elif code == 404:
        return {
            "severity": "warning",
            "color": "orange",
            "category": "Not Found",
            "label": "404 Not Found",
            "message": "The requested page does not exist on this server.",
            "alert": "Page not found — the URL may be incorrect or the page was removed.",
        }
    elif code == 408:
        return {
            "severity": "warning",
            "color": "orange",
            "category": "Client Error",
            "label": "408 Request Timeout",
            "message": "The server timed out waiting for the request.",
            "alert": "Request timeout — server took too long to respond.",
        }
    elif code == 429:
        return {
            "severity": "warning",
            "color": "orange",
            "category": "Client Error",
            "label": "429 Too Many Requests",
            "message": "Rate limit exceeded — too many requests sent.",
            "alert": "Rate limited — too many requests to this server.",
        }
    elif 400 <= code < 500:
        return {
            "severity": "warning",
            "color": "orange",
            "category": "Client Error",
            "label": f"{code} Client Error",
            "message": f"Client-side error occurred (HTTP {code}).",
            "alert": f"Client error detected (HTTP {code}).",
        }
    elif code == 500:
        return {
            "severity": "critical",
            "color": "red",
            "category": "Server Error",
            "label": "500 Internal Server Error",
            "message": "The server encountered an unexpected condition.",
            "alert": "Server error detected — internal server error (500).",
        }
    elif code == 502:
        return {
            "severity": "critical",
            "color": "red",
            "category": "Server Error",
            "label": "502 Bad Gateway",
            "message": "The server received an invalid response from an upstream server.",
            "alert": "Bad gateway — upstream server issue detected.",
        }
    elif code == 503:
        return {
            "severity": "critical",
            "color": "red",
            "category": "Server Error",
            "label": "503 Service Unavailable",
            "message": "The server is temporarily unavailable or overloaded.",
            "alert": "Service unavailable — website may be down for maintenance.",
        }
    elif code == 504:
        return {
            "severity": "critical",
            "color": "red",
            "category": "Server Error",
            "label": "504 Gateway Timeout",
            "message": "The upstream server did not respond in time.",
            "alert": "Gateway timeout — server is not responding.",
        }
    elif 500 <= code < 600:
        return {
            "severity": "critical",
            "color": "red",
            "category": "Server Error",
            "label": f"{code} Server Error",
            "message": f"Server-side error occurred (HTTP {code}).",
            "alert": f"Critical server error detected (HTTP {code}).",
        }
    else:
        return {
            "severity": "info",
            "color": "blue",
            "category": "Unknown",
            "label": f"{code} Unknown",
            "message": f"Received HTTP status code {code}.",
            "alert": None,
        }


def detect_errors(url):
    """
    Fetch a URL and return a full error/status report.
    """
    url = normalize_url(url)

    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return {"error": "Invalid URL — no domain found."}

        response, load_time = _make_request(url)
        status_code = response.status_code
        classification = classify_status(status_code)

        # Build alerts list
        alerts = []

        # Check for Database Connection Errors inside the HTML response text
        content_lower = response.text.lower()
        db_error_indicators = [
            "error establishing a database connection",
            "database connection error",
            "could not connect to the database",
            "mysqli_connect",
            "connection refused",
            "connection to database failed"
        ]
        is_db_error = False
        for indicator in db_error_indicators:
            if indicator in content_lower:
                is_db_error = True
                break

        if is_db_error:
            # Override classification severity to mark it as critical
            classification["severity"] = "critical"
            classification["color"] = "red"
            alerts.append({
                "level": "critical",
                "color": "red",
                "message": "Database connection error detected on page (e.g., 'Error establishing a database connection').",
            })

        # Status-based alert
        if classification["alert"] and not is_db_error:
            alerts.append({
                "level": classification["severity"],
                "color": classification["color"],
                "message": classification["alert"],
            })

        # Load time alert
        if load_time > 5:
            alerts.append({
                "level": "critical",
                "color": "red",
                "message": f"Website is very slow — load time is {load_time}s (critical, > 5s).",
            })
        elif load_time > 2:
            alerts.append({
                "level": "warning",
                "color": "orange",
                "message": f"Website is slow — load time is {load_time}s (recommended < 2s).",
            })

        # Redirect chain check
        redirect_chain = []
        if response.history:
            for r in response.history:
                redirect_chain.append({
                    "url": r.url,
                    "status_code": r.status_code,
                })
            alerts.append({
                "level": "info",
                "color": "blue",
                "message": f"Page went through {len(response.history)} redirect(s) before reaching final URL.",
            })

        # HTTPS check
        if url.startswith("http://"):
            alerts.append({
                "level": "warning",
                "color": "orange",
                "message": "Page is served over HTTP (not HTTPS) — security risk.",
            })

        if not alerts:
            alerts.append({
                "level": "ok",
                "color": "green",
                "message": "No errors detected — website is healthy.",
            })

        return {
            "url": url,
            "final_url": response.url,
            "status_code": status_code,
            "load_time": load_time,
            "severity": classification["severity"],
            "color": classification["color"],
            "category": classification["category"],
            "label": classification["label"],
            "message": classification["message"],
            "alerts": alerts,
            "redirect_chain": redirect_chain,
            "redirected": len(response.history) > 0,
            "is_https": response.url.startswith("https://"),
        }

    except requests.exceptions.SSLError:
        return {
            "url": url,
            "error": "SSL certificate error — the site has an invalid or expired SSL certificate.",
            "severity": "critical",
            "color": "red",
            "alerts": [{
                "level": "critical",
                "color": "red",
                "message": "SSL certificate error — invalid or expired certificate.",
            }],
        }
    except requests.exceptions.ConnectionError:
        return {
            "url": url,
            "error": "Connection failed — the site may be down or the URL is unreachable.",
            "severity": "critical",
            "color": "red",
            "alerts": [{
                "level": "critical",
                "color": "red",
                "message": "Connection failed — website is down or unreachable.",
            }],
        }
    except requests.exceptions.Timeout:
        return {
            "url": url,
            "error": "Request timed out — the site took too long to respond.",
            "severity": "critical",
            "color": "red",
            "alerts": [{
                "level": "critical",
                "color": "red",
                "message": "Request timed out — website is not responding.",
            }],
        }
    except Exception as e:
        return {
            "url": url,
            "error": f"Unexpected error: {str(e)}",
            "severity": "critical",
            "color": "red",
            "alerts": [{
                "level": "critical",
                "color": "red",
                "message": f"Unexpected error: {str(e)}",
            }],
        }
