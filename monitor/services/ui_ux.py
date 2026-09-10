import re
import time
import requests
import warnings
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from django.utils import timezone
from PIL import Image
import io
import base64

try:
    import numpy as np
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    np = None
    cv2 = None


warnings.filterwarnings("ignore", message="Unverified HTTPS request")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

def _get(url, timeout=10):
    try:
        resp = requests.get(url, timeout=timeout, headers=_HEADERS, verify=False)
        return resp
    except Exception:
        return None


def _parse_color(c_str):
    """Parse color string (hex, rgb, rgba, keyword) into (r, g, b) tuple in 0..255 range."""
    if not c_str:
        return None
    c_str = c_str.strip().lower()
    if c_str.startswith("#"):
        hex_val = c_str.lstrip("#")
        if len(hex_val) == 3:
            return tuple(int(c * 2, 16) for c in hex_val)
        elif len(hex_val) >= 6:
            return (int(hex_val[0:2], 16), int(hex_val[2:4], 16), int(hex_val[4:6], 16))
    elif c_str.startswith("rgb"):
        m = re.search(r"rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", c_str)
        if m:
            return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    named_colors = {
        "black": (0, 0, 0), "white": (255, 255, 255), "red": (255, 0, 0),
        "green": (0, 128, 0), "blue": (0, 0, 255), "yellow": (255, 255, 0),
        "gray": (128, 128, 128), "grey": (128, 128, 128), "lightgray": (211, 211, 211),
        "darkgray": (169, 169, 169)
    }
    return named_colors.get(c_str)


def _relative_luminance(rgb):
    """Calculate WCAG 2.1 relative luminance for (r, g, b) in 0..255."""
    r, g, b = [x / 255.0 for x in rgb]
    r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
    g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
    b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _contrast_ratio(rgb1, rgb2):
    """Calculate WCAG 2.1 contrast ratio between two colors."""
    l1 = _relative_luminance(rgb1)
    l2 = _relative_luminance(rgb2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def check_accessibility(soup):
    """
    Comprehensive WCAG 2.1 AA Accessibility Audit:
    - Document Language (WCAG 3.1.1)
    - Heading Structure & Skip Hierarchy (WCAG 1.3.1)
    - Form Controls Labeling (WCAG 1.3.1, 3.3.2)
    - Buttons & Interactive Elements (WCAG 4.1.2)
    - Images Alt Text Quality (WCAG 1.1.1)
    - Link Purpose & Generic Text (WCAG 2.4.4)
    - ARIA Landmarks & Regions (WCAG 1.3.6)
    - WCAG Relative Luminance Color Contrast (WCAG 1.4.3)
    """
    issues = []
    
    # 1. Document Language (WCAG 3.1.1)
    has_lang = False
    html_tag = soup.find("html")
    if html_tag and html_tag.get("lang"):
        has_lang = True
    else:
        issues.append({
            "type": "Missing Document Language",
            "message": "The <html> element lacks a valid 'lang' attribute (WCAG 3.1.1).",
            "severity": "high"
        })

    # 2. Heading Hierarchy & Structure (WCAG 1.3.1)
    headings = soup.find_all(re.compile(r"^h[1-6]$", re.I))
    h1_count = len(soup.find_all("h1"))
    skipped_headings_count = 0

    if h1_count == 0:
        issues.append({
            "type": "Missing H1 Heading",
            "message": "Page contains no <h1> primary heading element (WCAG 1.3.1).",
            "severity": "high"
        })
    elif h1_count > 1:
        issues.append({
            "type": "Multiple H1 Headings",
            "message": f"Page contains {h1_count} <h1> headings. Best practice is exactly one <h1> for page context.",
            "severity": "low"
        })

    prev_level = 0
    for h in headings:
        level = int(h.name[1])
        if prev_level > 0 and level > prev_level + 1:
            skipped_headings_count += 1
            issues.append({
                "type": "Skipped Heading Level",
                "message": f"Heading hierarchy skips from <h{prev_level}> directly to <h{level}> (WCAG 1.3.1).",
                "severity": "medium"
            })
        prev_level = level

    # 3. Form Controls Labeling (Inputs, Selects, Textareas)
    missing_label_count = 0
    form_controls = soup.find_all(["input", "select", "textarea"])
    labels = soup.find_all("label")
    label_ids = {l.get("for") for l in labels if l.get("for")}
    
    for ctrl in form_controls:
        tag = ctrl.name
        ctrl_type = ctrl.get("type", "").lower()
        if tag == "input" and ctrl_type in ("hidden", "submit", "button", "image"):
            continue
            
        ctrl_id = ctrl.get("id")
        has_label_bind = ctrl_id in label_ids if ctrl_id else False
        
        parent = ctrl.parent
        has_parent_label = False
        while parent:
            if parent.name == "label":
                has_parent_label = True
                break
            parent = parent.parent
            
        aria_label = ctrl.get("aria-label")
        aria_labelledby = ctrl.get("aria-labelledby")
        title = ctrl.get("title")
        
        if not (has_label_bind or has_parent_label or aria_label or aria_labelledby or title):
            missing_label_count += 1
            ctrl_identifier = ctrl.get("name") or ctrl.get("id") or f"unnamed <{tag}>"
            issues.append({
                "type": "Missing Form Control Label",
                "message": f"Form control '{ctrl_identifier}' lacks an explicit <label>, 'aria-label', or 'title' (WCAG 3.3.2).",
                "severity": "high"
            })

    # 4. Buttons missing accessible names
    empty_button_count = 0
    for btn in soup.find_all(["button", "a"]):
        is_button_role = btn.name == "button" or btn.get("role") == "button"
        if not is_button_role:
            continue
        text = btn.get_text(strip=True)
        aria_label = btn.get("aria-label")
        aria_labelledby = btn.get("aria-labelledby")
        
        has_alt_img = any(img.get("alt") for img in btn.find_all("img"))
                
        if not (text or aria_label or aria_labelledby or has_alt_img):
            empty_button_count += 1
            issues.append({
                "type": "Empty Interactive Target",
                "message": "Interactive button element contains no visible text, image alt, or ARIA description (WCAG 4.1.2).",
                "severity": "high"
            })

    # 5. Image Alt Text Audit (WCAG 1.1.1)
    missing_alt_count = 0
    non_descriptive_alt_count = 0
    generic_alt_words = {"image", "img", "photo", "picture", "logo", "icon", "banner"}

    for img in soup.find_all("img"):
        alt = img.get("alt")
        if alt is None:
            # Attribute missing entirely
            missing_alt_count += 1
            src_name = img.get("src", "").split("/")[-1][:30] or "unnamed"
            issues.append({
                "type": "Missing Alt Attribute",
                "message": f"Image '{src_name}' lacks an 'alt' attribute completely (WCAG 1.1.1).",
                "severity": "high"
            })
        else:
            alt_clean = alt.strip().lower()
            if alt_clean and (alt_clean in generic_alt_words or re.match(r"^image\d+$|^pic\d+$|\.(png|jpg|jpeg|gif|webp)$", alt_clean)):
                non_descriptive_alt_count += 1
                issues.append({
                    "type": "Non-Descriptive Alt Text",
                    "message": f"Image alt text '{alt}' is vague/non-descriptive for screen readers (WCAG 1.1.1).",
                    "severity": "medium"
                })

    # 6. Link Purpose & Generic Text (WCAG 2.4.4)
    bad_links_count = 0
    generic_link_phrases = {"click here", "read more", "more", "link", "here", "learn more"}
    for a in soup.find_all("a"):
        href = a.get("href")
        text = a.get_text(strip=True).lower()
        aria_label = a.get("aria-label")
        
        if text in generic_link_phrases and not aria_label:
            bad_links_count += 1
            issues.append({
                "type": "Ambiguous Link Text",
                "message": f"Link uses generic phrase '{a.get_text(strip=True)}' without descriptive ARIA context (WCAG 2.4.4).",
                "severity": "medium"
            })

    # 7. ARIA Landmarks (WCAG 1.3.6)
    has_landmark = bool(soup.find(["main", "nav", "header", "footer", "aside"]) or soup.find(role=["main", "navigation", "banner", "contentinfo"]))
    if not has_landmark:
        issues.append({
            "type": "Missing ARIA Landmarks",
            "message": "Page contains no semantic ARIA landmark regions (<main>, <nav>, <header>, etc.) (WCAG 1.3.6).",
            "severity": "medium"
        })

    # 8. WCAG Relative Luminance Color Contrast Calculation (WCAG 1.4.3)
    contrast_hazards_count = 0
    for el in soup.find_all(style=True):
        style = el.get("style", "").lower()
        if "color" in style and ("background" in style or "bg" in style):
            c_match = re.search(r"(?:^|;\s*)color:\s*(#[a-f0-9]{3,6}|rgb[a]?\([^)]+\)|[a-z]+)", style)
            bg_match = re.search(r"background(?:-color)?:\s*(#[a-f0-9]{3,6}|rgb[a]?\([^)]+\)|[a-z]+)", style)
            if c_match and bg_match:
                rgb1 = _parse_color(c_match.group(1))
                rgb2 = _parse_color(bg_match.group(1))
                if rgb1 and rgb2:
                    ratio = round(_contrast_ratio(rgb1, rgb2), 2)
                    if ratio < 4.5:
                        contrast_hazards_count += 1
                        issues.append({
                            "type": "Low WCAG Color Contrast",
                            "message": f"Contrast ratio {ratio}:1 fails WCAG 2.1 AA minimum 4.5:1 requirement ({c_match.group(1)} vs {bg_match.group(1)}).",
                            "severity": "high" if ratio < 3.0 else "medium"
                        })
                        
    # Compute Weighted WCAG Accessibility Score (0-100)
    score = 100
    score -= (0 if has_lang else 10)
    score -= (15 if h1_count == 0 else 0)
    score -= (skipped_headings_count * 5)
    score -= (missing_label_count * 10)
    score -= (empty_button_count * 10)
    score -= (missing_alt_count * 10)
    score -= (non_descriptive_alt_count * 5)
    score -= (bad_links_count * 5)
    score -= (0 if has_landmark else 5)
    score -= (contrast_hazards_count * 8)
    
    score = max(10, min(100, score))
    
    if score >= 90:
        rating = "Excellent"
        color = "green"
    elif score >= 75:
        rating = "Good"
        color = "green"
    elif score >= 50:
        rating = "Needs Improvement"
        color = "orange"
    else:
        rating = "Poor"
        color = "red"
        
    return {
        "score": score,
        "rating": rating,
        "color": color,
        "has_lang_attribute": has_lang,
        "h1_count": h1_count,
        "missing_labels_count": missing_label_count,
        "empty_buttons_count": empty_button_count,
        "missing_alt_count": missing_alt_count,
        "non_descriptive_alt_count": non_descriptive_alt_count,
        "contrast_hazards_count": contrast_hazards_count,
        "issues": issues[:15]
    }


def analyze_ui_ux(url, html_content=None, previous_report=None, current_screenshot=None, previous_screenshot=None):
    """
    Perform a complete UI/UX, visual, and accessibility audit.
    """
    if not html_content:
        resp = _get(url)
        if resp:
            html_content = resp.text
        else:
            return {"error": "Could not fetch website contents for UI/UX analysis."}

    soup = BeautifulSoup(html_content, "html.parser")
    
    # 1. Responsive Design Check
    responsive_data = check_responsiveness(soup)
    
    # 2. Layout Shift Hazards
    layout_shift_data = check_layout_shifts(soup, html_content)
    
    # 3. Broken and Misaligned Design Elements
    broken_elements_data = check_broken_elements(soup, url)
    
    # 4. Visual Regression Detection
    visual_regression_data = check_visual_regression(
        soup, 
        previous_report, 
        current_screenshot, 
        previous_screenshot
    )
    
    # 5. Accessibility Auditing
    accessibility_data = check_accessibility(soup)
    
    # Compute UI Health Score (0-100)
    score = 100
    alerts = []
    
    # Responsiveness penalties
    if not responsive_data["has_viewport"]:
        score -= 30
        alerts.append({
            "level": "critical",
            "message": "Critical: Missing mobile viewport meta tag. Site will not display correctly on mobile devices."
        })
    elif responsive_data["score"] < 80:
        score -= 15
        alerts.append({
            "level": "warning",
            "message": "Warning: Limited responsive design traits detected (few relative units or media queries)."
        })
        
    # Layout shift penalties
    cls_hazard = layout_shift_data["cls_hazard_index"]
    if cls_hazard > 0.4:
        score -= 25
        alerts.append({
            "level": "critical",
            "message": f"Critical layout shift hazards detected! (Score {cls_hazard:.2f}). Several images/iframes lack dimensions."
        })
    elif cls_hazard > 0.15:
        score -= 10
        alerts.append({
            "level": "warning",
            "message": f"Warning: Moderate layout shift hazards detected ({cls_hazard:.2f}). Specify dimensions on images."
        })
        
    # Broken elements penalties
    broken_count = broken_elements_data["broken_ui_count"]
    if broken_count > 5:
        score -= 20
        alerts.append({
            "level": "critical",
            "message": f"Critical: Found {broken_count} broken or misaligned layout elements on the page."
        })
    elif broken_count > 0:
        score -= 10
        alerts.append({
            "level": "warning",
            "message": f"Warning: Found {broken_count} potential design alignment or broken asset issues."
        })
        
    # Accessibility alerts
    for a_issue in accessibility_data["issues"]:
        alerts.append({
            "level": a_issue["severity"],
            "message": f"Accessibility: [{a_issue['type']}] {a_issue['message']}"
        })
        
    # Visual regression alerts
    if visual_regression_data.get("visual_diff_detected"):
        alerts.append({
            "level": "info",
            "message": f"Visual regression: {visual_regression_data.get('diff_percentage')}% layout pixel changes detected compared to previous version."
        })
    elif visual_regression_data.get("dom_changes_detected"):
        alerts.append({
            "level": "info",
            "message": "DOM structure change: Website files or layout structure updated compared to last scan."
        })
        
    score = max(0, score)
    
    return {
        "ui_health_score": score,
        "responsiveness": responsive_data,
        "layout_shift": layout_shift_data,
        "broken_elements": broken_elements_data,
        "visual_regression": visual_regression_data,
        "accessibility": accessibility_data,
        "alerts": alerts
    }

def check_responsiveness(soup):
    """Check responsive viewport settings, CSS properties, and structure."""
    viewport = soup.find("meta", attrs={"name": "viewport"})
    has_viewport = viewport is not None
    viewport_content = viewport.get("content", "") if viewport else ""
    
    # Responsiveness scores based on markers
    score = 0
    markers = []
    
    if has_viewport:
        score += 40
        markers.append("Has viewport meta tag")
        if "width=device-width" in viewport_content:
            score += 10
            markers.append("Viewport width set to device-width")
        if "initial-scale" in viewport_content:
            score += 10
            markers.append("Viewport scales correctly on load")
            
    # Check for relative units / layout types in inline style attributes
    inline_styles = [el.get("style", "").lower() for el in soup.find_all(style=True)]
    flex_grid_count = sum(1 for s in inline_styles if "display: flex" in s or "display: grid" in s or "display:-webkit-box" in s)
    pct_unit_count = sum(1 for s in inline_styles if "%" in s or "vw" in s or "vh" in s or "rem" in s or "em" in s)
    absolute_px_widths = sum(1 for s in inline_styles if "width:" in s and "px" in s)
    
    # Search CSS stylesheets (if inline <style> exists)
    style_tags = [st.get_text().lower() for st in soup.find_all("style")]
    has_media_queries = any("@media" in style for style in style_tags)
    
    if flex_grid_count > 0:
        score += 10
        markers.append("Uses flexbox or CSS grid inline layout structures")
    if pct_unit_count > 0:
        score += 15
        markers.append("Uses fluid units (%, rem, em, vw, vh) in style layout declarations")
    if has_media_queries:
        score += 15
        markers.append("Embedded media queries found in document stylesheet")
        
    if absolute_px_widths > 5:
        score = max(20, score - 15)  # Penalty for absolute width constraints
        markers.append("Penalty: Overuse of hardcoded absolute widths (px) in inline elements")
        
    score = min(100, score)
    
    # Assess responsive capability status
    if score >= 90:
        status = "Excellent"
        color = "green"
    elif score >= 70:
        status = "Good"
        color = "green"
    elif score >= 40:
        status = "Warning"
        color = "orange"
    else:
        status = "Poor"
        color = "red"
        
    return {
        "has_viewport": has_viewport,
        "viewport_content": viewport_content,
        "has_media_queries": has_media_queries,
        "inline_responsive_styles": flex_grid_count + pct_unit_count,
        "absolute_width_elements": absolute_px_widths,
        "markers": markers,
        "score": score,
        "status": status,
        "color": color
    }

def check_layout_shifts(soup, html_content):
    """
    Search for layout-shifting hazards (missing img width/height, body scripts, etc.)
    and compute a hazard index (0.0 = none, 1.0 = high).
    """
    hazards = []
    penalty_sum = 0.0
    
    # 1. Images without width/height attributes
    total_imgs = 0
    missing_dim_imgs = 0
    for img in soup.find_all("img"):
        total_imgs += 1
        width = img.get("width")
        height = img.get("height")
        style = img.get("style", "").lower()
        has_css_dim = "width" in style and "height" in style
        
        if not (width and height) and not has_css_dim:
            missing_dim_imgs += 1
            src = img.get("src", "")[:50]
            hazards.append({
                "type": "Image Shift Hazard",
                "message": f"Image '{src}' has no width/height or equivalent CSS styling.",
                "severity": "medium"
            })
            penalty_sum += 0.05
            
    # 2. Iframes without width/height attributes
    total_iframes = 0
    missing_dim_iframes = 0
    for iframe in soup.find_all("iframe"):
        total_iframes += 1
        width = iframe.get("width")
        height = iframe.get("height")
        style = iframe.get("style", "").lower()
        has_css_dim = "width" in style and "height" in style
        
        if not (width and height) and not has_css_dim:
            missing_dim_iframes += 1
            src = iframe.get("src", "")[:50]
            hazards.append({
                "type": "Iframe Shift Hazard",
                "message": f"Iframe '{src}' is missing dimensions. This will shift standard content flow.",
                "severity": "high"
            })
            penalty_sum += 0.08

    # 3. Blocking JavaScript in body (not inside head)
    body = soup.find("body")
    body_blocking_scripts = 0
    if body:
        for script in body.find_all("script"):
            src = script.get("src")
            is_async = script.get("async") is not None
            is_defer = script.get("defer") is not None
            if src and not (is_async or is_defer):
                body_blocking_scripts += 1
                hazards.append({
                    "type": "Late Script Injection Hazard",
                    "message": f"Synchronous body script '{src[:50]}' forces sudden content shifts on execution.",
                    "severity": "medium"
                })
                penalty_sum += 0.04

    # 4. Font loaders without swap option
    style_tags = soup.find_all("style")
    font_swap_missing = 0
    for style in style_tags:
        style_text = style.get_text().lower()
        if "@font-face" in style_text and "font-display" not in style_text:
            font_swap_missing += 1
            hazards.append({
                "type": "Font Flash Hazard",
                "message": "A @font-face rule does not declare 'font-display: swap'. May cause FOIT/FOUT shift.",
                "severity": "low"
            })
            penalty_sum += 0.02
            
    # Normalize Cumulative Layout Shift Hazard Index (CLS Score placeholder metric)
    cls_hazard = round(min(1.0, penalty_sum), 2)
    
    return {
        "cls_hazard_index": cls_hazard,
        "total_images": total_imgs,
        "missing_dimensions_images": missing_dim_imgs,
        "total_iframes": total_iframes,
        "missing_dimensions_iframes": missing_dim_iframes,
        "body_blocking_scripts": body_blocking_scripts,
        "font_display_swap_missing": font_swap_missing,
        "hazards": hazards[:15]  # Limit returns
    }

def check_broken_elements(soup, url):
    """Identify elements that are likely broken or layout misalignments."""
    broken_elements = []
    
    # 1. Broken images (missing src or data:URI)
    broken_img_count = 0
    for img in soup.find_all("img"):
        src = img.get("src", "").strip()
        if not src:
            broken_img_count += 1
            broken_elements.append({
                "type": "Empty Image Source",
                "message": "Image element tag has an empty or missing 'src' attribute.",
                "element": str(img)[:80]
            })
            
    # 2. Unclosed structural elements or invalid tag nests
    # BeautifulSoup corrects malformed HTML; we can compare raw tags count with corrected tree
    # But a simple structural indicator is if we find invalid inline elements wrapping block tags
    invalid_nests = 0
    for span in soup.find_all(["span", "a"]):
        # Inline element wrapping block element
        has_block = span.find(["div", "p", "section", "h1", "h2", "h3", "h4", "table"])
        if has_block:
            invalid_nests += 1
            broken_elements.append({
                "type": "Block inside Inline element",
                "message": f"Block element '{has_block.name}' nested inside inline element '{span.name}'. Breaks layout rules.",
                "element": str(span)[:80]
            })
            
    # 3. Absolute positioned alignments (checking for overlapping coordinates overlay elements)
    inline_styles = soup.find_all(style=True)
    absolute_positions = []
    for el in inline_styles:
        style = el.get("style", "").lower()
        if "position: absolute" in style or "position: absolute" in style:
            # Try to grab left/right values
            absolute_positions.append(str(el)[:80])
            
    overlapping_count = 0
    # Overlapping style warnings
    if len(absolute_positions) > 8:
        overlapping_count += 1
        broken_elements.append({
            "type": "Overlapping Elements Hazard",
            "message": "Numerous position:absolute declarations found. High risk of design overlap on small screen sizes.",
            "element": f"{len(absolute_positions)} absolute elements detected."
        })
        
    return {
        "broken_ui_count": len(broken_elements),
        "broken_images": broken_img_count,
        "invalid_html_nestings": invalid_nests,
        "overlapping_layout_count": overlapping_count,
        "broken_elements_list": broken_elements
    }

def check_visual_regression(soup, previous_report=None, current_screenshot=None, previous_screenshot=None):
    """
    Compare current scan layout/assets with previous scans.
    Uses OpenCV/Pillow to perform pixel comparisons if images are available.
    """
    # Fallback/default structure comparison
    current_dom_signature = {
        "tag_count": len(soup.find_all()),
        "div_count": len(soup.find_all("div")),
        "script_count": len(soup.find_all("script")),
        "stylesheet_count": len(soup.find_all("link", rel="stylesheet")),
        "image_count": len(soup.find_all("img")),
        "fonts_count": len(soup.find_all("link", rel="stylesheet", href=lambda x: x and "fonts" in x))
    }
    
    regression_data = {
        "dom_changes_detected": False,
        "visual_diff_detected": False,
        "diff_percentage": 0.0,
        "changes": []
    }
    
    if previous_report:
        # Pull past check signature from JSON fields
        prev_check = {}
        try:
            # Try checking the 'check_data' of the previous report
            if isinstance(previous_report, dict):
                prev_check = previous_report.get("ui_ux", {}).get("visual_regression", {}).get("current_dom", {})
            elif hasattr(previous_report, "get_check_data"):
                # Django object fallback
                prev_check = previous_report.get_check_data().get("ui_ux", {}).get("visual_regression", {}).get("current_dom", {})
        except Exception:
            pass
            
        if prev_check:
            diffs = []
            for key, val in current_dom_signature.items():
                prev_val = prev_check.get(key, val)
                if val != prev_val:
                    diffs.append(f"{key.replace('_',' ')} changed from {prev_val} to {val}")
            
            if diffs:
                regression_data["dom_changes_detected"] = True
                regression_data["changes"] = diffs

    regression_data["current_dom"] = current_dom_signature
    
    # Perform OpenCV/PIL visual regression if screenshots are supplied
    if current_screenshot and previous_screenshot:
        if not OPENCV_AVAILABLE:
            regression_data["visual_error"] = "Visual regression image comparison libraries (numpy/opencv) are unavailable."
            return regression_data
        try:
            curr_img = _load_image(current_screenshot)
            prev_img = _load_image(previous_screenshot)
            
            if curr_img is not None and prev_img is not None:
                # Resize to matching dimensions for comparison
                h1, w1 = curr_img.shape[:2]
                h2, w2 = prev_img.shape[:2]
                target_w, target_h = min(w1, w2), min(h1, h2)
                
                curr_resized = cv2.resize(curr_img, (target_w, target_h))
                prev_resized = cv2.resize(prev_img, (target_w, target_h))
                
                # Convert to grayscale
                curr_gray = cv2.cvtColor(curr_resized, cv2.COLOR_BGR2GRAY)
                prev_gray = cv2.cvtColor(prev_resized, cv2.COLOR_BGR2GRAY)
                
                # Compute absolute difference
                diff = cv2.absdiff(curr_gray, prev_gray)
                _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
                
                # Calculate pixel difference percentage
                non_zero_count = np.count_nonzero(thresh)
                total_pixels = thresh.size
                diff_pct = round((non_zero_count / total_pixels) * 100, 2)
                
                regression_data["diff_percentage"] = diff_pct
                if diff_pct > 1.0: # threshold for layout shift detection
                    regression_data["visual_diff_detected"] = True
                    # Create visual bounding box regions of change
                    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    bounding_boxes = []
                    for c in contours[:10]: # Cap visual indicators
                        x, y, w, h = cv2.boundingRect(c)
                        if w > 10 and h > 10: # filter noise
                            bounding_boxes.append({"x": x, "y": y, "width": w, "height": h})
                    regression_data["visual_change_regions"] = bounding_boxes
                    
        except Exception as e:
            regression_data["visual_error"] = f"Visual alignment comparison error: {str(e)}"
            
    return regression_data

def _load_image(source):
    """Load image from base64 string, bytes, or file path into OpenCV format."""
    if not OPENCV_AVAILABLE:
        return None
    try:
        if isinstance(source, str):
            # Check if base64
            if "," in source:
                source = source.split(",")[1]
            image_data = base64.b64decode(source)
            pil_img = Image.open(io.BytesIO(image_data))
        elif isinstance(source, bytes):
            pil_img = Image.open(io.BytesIO(source))
        else:
            return None
            
        # Convert RGB to BGR for OpenCV
        open_cv_image = np.array(pil_img)
        if len(open_cv_image.shape) == 3:
            if open_cv_image.shape[2] == 4:
                open_cv_image = cv2.cvtColor(open_cv_image, cv2.COLOR_RGBA2BGR)
            else:
                open_cv_image = cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2BGR)
        return open_cv_image
    except Exception:
        return None
