import socket
import re
import requests
import time
import warnings
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from .security import check_ssl_certificate

# Suppress SSL warnings for dev environment
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def _get(url, timeout=15, stream=False):
    """Make a GET request with SSL verification disabled for dev."""
    start = time.time()
    resp = requests.get(url, timeout=timeout, headers=_HEADERS,
                        verify=False, stream=stream)
    elapsed = round(time.time() - start, 3)
    return resp, elapsed


def normalize_url(url):
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def get_whois_expiry(domain):
    """Query WHOIS registry servers to extract domain expiration date."""
    try:
        ext = domain.split('.')[-1].lower()
        whois_server = f"whois.nic.{ext}"
        if ext in ['com', 'net']:
            whois_server = "whois.verisign-grs.com"
        elif ext == 'org':
            whois_server = "whois.pir.org"
        elif ext == 'edu':
            whois_server = "whois.educause.edu"
        elif ext == 'info':
            whois_server = "whois.afilias.net"
        else:
            whois_server = "whois.iana.org"

        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect((whois_server, 43))
        s.send((domain + "\r\n").encode("utf-8"))
        response = b""
        while True:
            data = s.recv(4096)
            if not data:
                break
            response += data
        s.close()
        text = response.decode("utf-8", errors="ignore")
        
        # Regex search for common expiration patterns
        patterns = [
            r"Registry Expiry Date:\s*([^\r\n]+)",
            r"Registrar Registration Expiration Date:\s*([^\r\n]+)",
            r"Expiration Date:\s*([^\r\n]+)",
            r"expires:\s*([^\r\n]+)",
            r"Expiry Date:\s*([^\r\n]+)",
        ]
        for p in patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                date_str = m.group(1).strip()
                # Parse standard date formats
                for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d-%b-%Y", "%Y/%m/%d"):
                    try:
                        dt = datetime.strptime(date_str[:19], fmt)
                        return dt
                    except ValueError:
                        continue
        return None
    except Exception:
        return None


# ── /api/check/ ───────────────────────────────────────────────────────────────

def check_status(url):
    """Check website availability, load time, and HTTP status."""
    url = normalize_url(url)
    try:
        parsed = urlparse(url)
        hostname = parsed.netloc.split(":")[0] if parsed.netloc else ""
        if not hostname:
            return {"error": "Invalid URL — no domain found."}

        # 1. Real-time DNS Resolution Lookup
        start_dns = time.time()
        try:
            resolved_ip = socket.gethostbyname(hostname)
            dns_time_ms = round((time.time() - start_dns) * 1000, 2)
        except Exception:
            resolved_ip = "Unknown"
            dns_time_ms = None

        # 2. SSL check (via our shared module)
        ssl_valid = False
        ssl_days_remaining = None
        ssl_issuer = "Unknown"
        if url.startswith("https://"):
            ssl_info = check_ssl_certificate(hostname)
            ssl_valid = ssl_info.get("valid", False)
            ssl_days_remaining = ssl_info.get("days_remaining")
            ssl_issuer = ssl_info.get("issued_by", "Unknown")

        # 3. Domain Expiry WHOIS with SSL Fallback
        domain_expiry_days = None
        expiry_source = "failed"
        domain_expiry_date = "Unknown"
        
        # Check WHOIS
        expiry_dt = get_whois_expiry(hostname)
        if expiry_dt:
            now = datetime.now()
            domain_expiry_days = (expiry_dt - now).days
            domain_expiry_date = expiry_dt.strftime("%Y-%m-%d")
            expiry_source = "whois"
        elif ssl_days_remaining is not None:
            # Fall back to SSL cert remaining days
            domain_expiry_days = ssl_days_remaining
            domain_expiry_date = (datetime.now() + timedelta(days=ssl_days_remaining)).strftime("%Y-%m-%d")
            expiry_source = "ssl_fallback"

        # 4. HTTP Fetch Uptime & Load Time Check
        response, load_time = _get(url)
        status_code = response.status_code
        is_up = (status_code == 200)
        ttfb = round(response.elapsed.total_seconds(), 3)
        page_size_kb = round(len(response.content) / 1024, 2)

        # 5. API Health Verification
        content_type = response.headers.get("Content-Type", "").lower()
        is_api = "application/json" in content_type or "application/xml" in content_type
        api_health = {
            "is_api": is_api,
            "content_type": content_type,
            "latency_s": load_time,
            "status": "good" if (load_time < 1.0 and is_api) else "warning" if is_api else "n/a",
            "message": f"API Endpoint operational ({content_type}) in {load_time}s." if is_api else "Standard webpage detected."
        }

        if load_time < 1:
            perf_rating = "excellent"
        elif load_time < 2.5:
            perf_rating = "good"
        elif load_time < 4:
            perf_rating = "warning"
        else:
            perf_rating = "poor"

        alerts = []
        if not is_up:
            alerts.append({
                "level": "critical",
                "message": f"Website returned HTTP {status_code} — site may be down.",
            })
        if load_time > 5:
            alerts.append({
                "level": "critical",
                "message": f"Website is very slow — load time {load_time}s (critical, >5s).",
            })
        elif load_time > 2.5:
            alerts.append({
                "level": "warning",
                "message": f"Website is slow — load time {load_time}s (recommended <2.5s).",
            })

        if ttfb > 1:
            alerts.append({
                "level": "critical",
                "message": f"Very high TTFB: {ttfb}s (target <0.2s).",
            })
        elif ttfb > 0.5:
            alerts.append({
                "level": "warning",
                "message": f"High TTFB: {ttfb}s (recommended <0.2s).",
            })

        if dns_time_ms and dns_time_ms > 300:
            alerts.append({
                "level": "warning",
                "message": f"Slow DNS Resolution: {dns_time_ms}ms (recommended <150ms).",
            })

        if domain_expiry_days is not None and domain_expiry_days < 30:
            alerts.append({
                "level": "critical",
                "message": f"Domain registration EXPIRES in {domain_expiry_days} days! Renew immediately.",
            })

        if page_size_kb > 2048:
            alerts.append({
                "level": "critical",
                "message": f"Page size is very large: {page_size_kb} KB (over 2 MB).",
            })
        elif page_size_kb > 1500:
            alerts.append({
                "level": "warning",
                "message": f"Page size is large: {page_size_kb} KB (ideal 1–1.5 MB, max 2 MB).",
            })

        return {
            "url": url,
            "status_code": status_code,
            "is_up": is_up,
            "load_time": load_time,
            "ttfb": ttfb,
            "page_size_kb": page_size_kb,
            "perf_rating": perf_rating,
            "resolved_ip": resolved_ip,
            "dns_time_ms": dns_time_ms,
            "domain_expiry_days": domain_expiry_days,
            "domain_expiry_date": domain_expiry_date,
            "domain_expiry_source": expiry_source,
            "api_health": api_health,
            "ssl_valid": ssl_valid,
            "ssl_days_remaining": ssl_days_remaining,
            "ssl_issuer": ssl_issuer,
            "alerts": alerts,
        }

    except requests.exceptions.SSLError:
        return {"error": "SSL certificate error — invalid or expired certificate.", "url": url}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection failed — site may be down or URL is unreachable.", "url": url}
    except requests.exceptions.Timeout:
        return {"error": "Request timed out — site took too long to respond (>15s).", "url": url}
    except requests.exceptions.MissingSchema:
        return {"error": "Invalid URL format — please include http:// or https://"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}



# ── /api/seo/ ─────────────────────────────────────────────────────────────────

def analyze_seo(url):
    """Extract and evaluate SEO signals from a page."""
    url = normalize_url(url)
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return {"error": "Invalid URL — no domain found."}

        response, _ = _get(url)
        soup = BeautifulSoup(response.text, "html.parser")

        # Title
        title_tag = soup.find("title")
        title_text = title_tag.get_text(strip=True) if title_tag else ""
        title_len = len(title_text)
        if not title_text:
            title_status, title_msg = "missing", "No title tag found — critical SEO issue."
        elif title_len < 30:
            title_status = "warning"
            title_msg = f"Title too short ({title_len} chars). Aim for 50–60 characters."
        elif title_len > 60:
            title_status = "warning"
            title_msg = f"Title too long ({title_len} chars). Keep under 60 characters."
        else:
            title_status = "good"
            title_msg = f"Title length is optimal ({title_len} chars)."

        # Meta description
        meta_tag = soup.find("meta", attrs={"name": "description"})
        meta_text = meta_tag.get("content", "").strip() if meta_tag else ""
        meta_len = len(meta_text)
        if not meta_text:
            meta_status, meta_msg = "missing", "No meta description — important for search snippets."
        elif meta_len < 70:
            meta_status = "warning"
            meta_msg = f"Meta description too short ({meta_len} chars). Aim for 150–160 characters."
        elif meta_len > 160:
            meta_status = "warning"
            meta_msg = f"Meta description too long ({meta_len} chars). Keep under 160 characters."
        else:
            meta_status = "good"
            meta_msg = f"Meta description length is optimal ({meta_len} chars)."

        # H1
        h1_tags = soup.find_all("h1")
        h2_tags = soup.find_all("h2")
        if not h1_tags:
            h1_status, h1_msg = "missing", "No H1 tag found — important for page structure."
        elif len(h1_tags) > 1:
            h1_status = "warning"
            h1_msg = f"Multiple H1 tags ({len(h1_tags)}). Use only one H1 per page."
        else:
            h1_status, h1_msg = "good", "One H1 tag found — good structure."

        # Other signals
        canonical_tag = soup.find("link", rel="canonical")
        canonical = canonical_tag.get("href", "") if canonical_tag else ""
        robots_tag = soup.find("meta", attrs={"name": "robots"})
        robots = robots_tag.get("content", "") if robots_tag else "not set"
        viewport_tag = soup.find("meta", attrs={"name": "viewport"})
        has_viewport = viewport_tag is not None

        og_title = soup.find("meta", property="og:title")
        og_desc = soup.find("meta", property="og:description")
        og_image = soup.find("meta", property="og:image")

        return {
            "url": url,
            "title": {"text": title_text, "length": title_len,
                      "status": title_status, "message": title_msg},
            "meta_description": {"text": meta_text, "length": meta_len,
                                 "status": meta_status, "message": meta_msg},
            "h1": {"count": len(h1_tags),
                   "texts": [h.get_text(strip=True)[:80] for h in h1_tags[:3]],
                   "status": h1_status, "message": h1_msg},
            "h2_count": len(h2_tags),
            "canonical": canonical or "not set",
            "robots": robots,
            "has_viewport": has_viewport,
            "open_graph": {
                "title": og_title.get("content", "") if og_title else "",
                "description": og_desc.get("content", "") if og_desc else "",
                "image": og_image.get("content", "") if og_image else "",
            },
        }

    except requests.exceptions.SSLError:
        return {"error": "SSL certificate error."}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection failed — site may be down."}
    except requests.exceptions.Timeout:
        return {"error": "Request timed out."}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


# ── /api/image/ (page scan) ───────────────────────────────────────────────────

def analyze_images(url):
    """Scan a web page and analyze all img tags found."""
    url = normalize_url(url)
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return {"error": "Invalid URL — no domain found."}

        response, _ = _get(url)
        soup = BeautifulSoup(response.text, "html.parser")
        img_tags = soup.find_all("img")
        total_images = len(img_tags)

        if total_images == 0:
            return {
                "url": url, "total_images": 0, "analyzed": 0, "images": [],
                "summary": {"missing_alt": 0, "missing_lazy": 0,
                            "missing_dimensions": 0, "oversized_count": 0,
                            "total_size_kb": 0},
                "overall_status": "good",
                "message": "No images found on this page.",
            }

        base_url = f"{parsed.scheme}://{parsed.netloc}"
        images_data = []
        total_size_kb = 0
        missing_alt = decorative_alt = non_descriptive_alt = valid_alt = 0
        missing_lazy = missing_dimensions = oversized_count = 0
        generic_alt_words = {"image", "img", "photo", "picture", "logo", "icon", "banner"}

        for img in img_tags[:20]:
            src = img.get("src", "")
            raw_alt = img.get("alt")
            loading = img.get("loading", "")
            width = img.get("width", "")
            height = img.get("height", "")

            # Alt attribute classification
            alt_status = "valid"
            if raw_alt is None:
                missing_alt += 1
                alt_status = "missing"
            elif raw_alt == "":
                decorative_alt += 1
                alt_status = "decorative"
            else:
                clean_alt = raw_alt.strip().lower()
                if clean_alt in generic_alt_words or re.match(r"^image\d+$|^pic\d+$|\.(png|jpg|jpeg|gif|webp)$", clean_alt):
                    non_descriptive_alt += 1
                    alt_status = "non_descriptive"
                else:
                    valid_alt += 1

            if loading != "lazy":
                missing_lazy += 1
            if not width or not height:
                missing_dimensions += 1

            if src and not src.startswith(("http://", "https://", "data:")):
                if src.startswith("//"):
                    src = "https:" + src
                elif src.startswith("/"):
                    src = base_url + src
                else:
                    src = base_url + "/" + src

            size_kb = None
            size_status = "unknown"
            suggestion = ""

            if src and src.startswith(("http://", "https://")):
                try:
                    ir, _ = _get(src, timeout=8, stream=True)
                    size_kb = round(len(ir.content) / 1024, 2)
                    total_size_kb += size_kb
                    if size_kb > 500:
                        size_status = "poor"
                        suggestion = f"Very large ({size_kb} KB). Compress to under 200 KB and keep total image budget under 2 MB."
                        oversized_count += 1
                    elif size_kb > 200:
                        size_status = "warning"
                        suggestion = f"Moderately large ({size_kb} KB). Target 100–200 KB for better page budgets."
                        oversized_count += 1
                    elif size_kb > 100:
                        size_status = "good"
                        suggestion = f"Image size ({size_kb} KB) is acceptable, but 100 KB or less is ideal."
                    else:
                        size_status = "excellent"
                        suggestion = "Image is well optimized for web use."
                except Exception:
                    size_status = "unknown"
                    suggestion = "Could not fetch image to measure size."

            issues = []
            if alt_status == "missing":
                issues.append("Missing alt attribute completely")
            elif alt_status == "non_descriptive":
                issues.append(f"Non-descriptive alt text ('{raw_alt}')")
            elif alt_status == "decorative":
                issues.append("Decorative image (empty alt=\"\")")

            if loading != "lazy":
                issues.append("Missing lazy loading")
            if not width or not height:
                issues.append("Missing width/height dimensions")

            images_data.append({
                "src": src[:120] if src else "no src",
                "alt": raw_alt if raw_alt is not None else "(none)",
                "alt_status": alt_status,
                "loading": loading or "not set",
                "width": width or "not set",
                "height": height or "not set",
                "size_kb": size_kb,
                "size_status": size_status,
                "suggestion": suggestion,
                "issues": issues,
            })

        total_size_kb = round(total_size_kb, 2)
        if total_size_kb > 2048 or oversized_count > 0 or missing_lazy > total_images * 0.5 or missing_alt > 0:
            overall_status = "poor"
        elif total_size_kb > 1024 or missing_dimensions > 0 or non_descriptive_alt > 0:
            overall_status = "warning"
        else:
            overall_status = "excellent"

        return {
            "url": url,
            "total_images": total_images,
            "analyzed": len(images_data),
            "images": images_data,
            "summary": {
                "missing_alt": missing_alt,
                "decorative_alt": decorative_alt,
                "non_descriptive_alt": non_descriptive_alt,
                "valid_alt": valid_alt,
                "missing_lazy": missing_lazy,
                "missing_dimensions": missing_dimensions,
                "oversized_count": oversized_count,
                "total_size_kb": total_size_kb,
            },
            "overall_status": overall_status,
        }

    except requests.exceptions.SSLError:
        return {"error": "SSL certificate error."}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection failed — site may be down."}
    except requests.exceptions.Timeout:
        return {"error": "Request timed out."}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}
