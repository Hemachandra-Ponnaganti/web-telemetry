"""
Website Content & Structure Monitoring Service.
Covers: DOM tree complexity, DOM node counts, depth analysis, page weight budgets,
script & CSS minification, and server-side transfer compression checks.
"""
import re
import requests
import warnings
from bs4 import BeautifulSoup
from urllib.parse import urlparse

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

def analyze_structure(url, response=None, html_content=None):
    """
    Perform structural and asset weight audits on a webpage.
    """
    if not html_content and response:
        html_content = response.text
    elif not html_content:
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            resp = requests.get(url, timeout=10, headers=headers, verify=False)
            html_content = resp.text
            response = resp
        except Exception:
            return {"error": "Could not fetch webpage contents for structure analysis."}

    soup = BeautifulSoup(html_content, "html.parser")
    
    # 1. DOM Complexity Analysis
    dom_metrics = analyze_dom_complexity(soup)
    
    # 2. Script & CSS Minification Tracking
    optimization_metrics = check_js_css_optimization(soup)
    
    # 3. Compression check
    compression_metrics = check_compression(response, html_content)
    
    # Page weight budget (HTML + approximate sizes of referenced local style/script tags)
    html_size_kb = round(len(html_content) / 1024, 2)
    
    # Build health scores and alerts
    alerts = []
    score = 100
    
    if dom_metrics["total_nodes"] > 1500:
        score -= 20
        alerts.append({
            "level": "critical",
            "category": "structure",
            "message": f"Critical: DOM size is extremely high ({dom_metrics['total_nodes']} nodes). Exceeds target budget of 1500."
        })
    elif dom_metrics["total_nodes"] > 800:
        score -= 10
        alerts.append({
            "level": "warning",
            "category": "structure",
            "message": f"Warning: High DOM node count ({dom_metrics['total_nodes']} nodes). Aim for less than 800."
        })
        
    if dom_metrics["max_depth"] > 32:
        score -= 15
        alerts.append({
            "level": "warning",
            "category": "structure",
            "message": f"Warning: Excessive DOM tree depth ({dom_metrics['max_depth']} layers). Redundant HTML nesting slows down render."
        })
        
    unminified = len(optimization_metrics["unminified_resources"])
    if unminified > 4:
        score -= 15
        alerts.append({
            "level": "warning",
            "category": "structure",
            "message": f"Warning: Found {unminified} unminified external scripts or styles. Minify scripts to decrease transfer weight."
        })
        
    if not compression_metrics["is_compressed"]:
        score -= 15
        alerts.append({
            "level": "warning",
            "category": "structure",
            "message": "Warning: Gzip or Brotli compression is disabled or unconfigured on the web host."
        })
        
    score = max(0, score)
    
    # Status levels
    if score >= 90:
        status = "Excellent"
        color = "green"
    elif score >= 70:
        status = "Good"
        color = "green"
    elif score >= 50:
        status = "Needs Improvement"
        color = "orange"
    else:
        status = "Poor"
        color = "red"

    return {
        "structure_score": score,
        "structure_rating": status,
        "color": color,
        "html_size_kb": html_size_kb,
        "dom_complexity": dom_metrics,
        "optimization": optimization_metrics,
        "compression": compression_metrics,
        "alerts": alerts
    }

def analyze_dom_complexity(soup):
    """Calculate DOM node counts, depth, and max children metrics recursively."""
    all_elements = soup.find_all()
    total_nodes = len(all_elements) + 1  # elements + root document
    
    # Recursive function to extract deepest path
    def get_deepest_path(element):
        children = [c for c in element.children if c.name]
        
        # Build node selector string (e.g. div#id.class)
        classes = element.get("class", [])
        class_str = "." + ".".join(classes) if classes else ""
        id_str = f"#{element.get('id')}" if element.get('id') else ""
        node_desc = f"{element.name}{id_str}{class_str}"
        
        if not children:
            return [node_desc]
            
        deepest_child_path = []
        max_child_depth = -1
        
        for c in children:
            path = get_deepest_path(c)
            if len(path) > max_child_depth:
                max_child_depth = len(path)
                deepest_child_path = path
                
        return [node_desc] + deepest_child_path
        
    max_depth = 0
    deepest_path = []
    
    body = soup.find("body")
    if body:
        deepest_path = get_deepest_path(body)
        max_depth = len(deepest_path)
    else:
        html = soup.find("html")
        if html:
            deepest_path = get_deepest_path(html)
            max_depth = len(deepest_path)
            
    # Max children under a single element
    max_children = 0
    max_children_element = "None"
    
    for el in all_elements:
        children_count = sum(1 for c in el.children if c.name)
        if children_count > max_children:
            max_children = children_count
            max_children_element = el.name
            
    # Recommendations
    recs = []
    if total_nodes > 800:
        recs.append("Reduce total DOM elements count by lazy loading footer content or paginating lists.")
    if max_depth > 32:
        recs.append("Flatten the HTML hierarchy. Avoid deeply nested grid wrapper div containers.")
    if max_children > 60:
        recs.append(f"Node <{max_children_element}> has too many children ({max_children}). Split content into subgroups.")
        
    if not recs:
        recs.append("DOM structure is lean and perfectly optimized.")
        
    return {
        "total_nodes": total_nodes,
        "max_depth": max_depth,
        "max_children": max_children,
        "max_children_tag": max_children_element,
        "deepest_path": deepest_path,
        "recommendations": recs
    }

def check_js_css_optimization(soup):
    """Analyze all Javascript and Style scripts, counts, deferments, and minification levels."""
    scripts = soup.find_all("script")
    links = soup.find_all("link", rel="stylesheet")
    
    inline_scripts = 0
    external_scripts = 0
    deferred_scripts = 0
    minified_js = 0
    unminified_js = 0
    
    inline_styles = len(soup.find_all("style"))
    external_styles = len(links)
    minified_css = 0
    unminified_css = 0
    
    unminified_list = []
    
    for sc in scripts:
        src = sc.get("src", "").strip()
        if not src:
            inline_scripts += 1
            continue
            
        external_scripts += 1
        is_async = sc.get("async") is not None
        is_defer = sc.get("defer") is not None
        if is_async or is_defer:
            deferred_scripts += 1
            
        # Minification heuristic
        if ".min.js" in src or "-min.js" in src:
            minified_js += 1
        else:
            unminified_js += 1
            unminified_list.append({"type": "JavaScript", "url": src[:120]})
            
    for ln in links:
        href = ln.get("href", "").strip()
        if not href:
            continue
            
        if ".min.css" in href or "-min.css" in href:
            minified_css += 1
        else:
            unminified_css += 1
            unminified_list.append({"type": "CSS", "url": href[:120]})

    total_assets = external_scripts + external_styles
    optimized_assets = minified_js + minified_css
    
    minification_ratio = round(optimized_assets / total_assets, 2) if total_assets > 0 else 1.0
    
    return {
        "external_scripts_count": external_scripts,
        "inline_scripts_count": inline_scripts,
        "deferred_scripts_count": deferred_scripts,
        "unminified_scripts_count": unminified_js,
        "external_stylesheets_count": external_styles,
        "inline_stylesheets_count": inline_styles,
        "unminified_stylesheets_count": unminified_css,
        "minification_ratio": minification_ratio,
        "unminified_resources": unminified_list
    }

def check_compression(response, html):
    """Check transfer encoding headers to verify gzip/brotli compression is active."""
    is_compressed = False
    compression_type = "None"
    
    if response:
        headers_lower = {k.lower(): v.lower() for k, v in response.headers.items()}
        content_encoding = headers_lower.get("content-encoding", "")
        
        if "gzip" in content_encoding:
            is_compressed = True
            compression_type = "gzip"
        elif "br" in content_encoding:
            is_compressed = True
            compression_type = "brotli"
        elif "deflate" in content_encoding:
            is_compressed = True
            compression_type = "deflate"
            
        # Fallback: check if Transfer-Encoding is chunked
        transfer_encoding = headers_lower.get("transfer-encoding", "")
        server = headers_lower.get("server", "")
    
    return {
        "is_compressed": is_compressed,
        "compression_type": compression_type,
        "note": f"Compression: {compression_type.upper()} protocol is enabled." if is_compressed else "Compression is missing. Gzip or Brotli compresses page weights by up to 70%."
    }
