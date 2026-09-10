"""
Remediation Service.
Generates automated, actionable fix suggestions with SRE templates, code blocks,
impact metrics, and implementation difficulty estimates.
"""

def generate_fix_suggestions(report_data):
    """
    Analyzes full website audit report data and generates contextual suggestions.
    
    Args:
        report_data (dict): Standardized website monitoring report JSON.
        
    Returns:
        list: Actionable recommendation dictionaries.
    """
    suggestions = []
    
    if not report_data:
        return suggestions

    # Extract module sections
    check = report_data.get("check") or {}
    seo = report_data.get("seo") or {}
    perf = report_data.get("performance") or {}
    sec = report_data.get("security") or {}
    ui_ux = report_data.get("ui_ux") or {}
    wp = report_data.get("wordpress") or {}
    struct = report_data.get("structure") or {}
    images = report_data.get("images") or {}

    # ── 1. PERFORMANCE & PAYLOAD REMEDIATION ────────────────────────────────────
    load_time = check.get("load_time") or perf.get("load_time")
    if load_time and load_time > 2.5:
        suggestions.append({
            "id": "optimize_loading",
            "category": "performance",
            "title": "Defer Render-Blocking Resources",
            "description": "The initial page load took {:.2f}s. Render-blocking stylesheets and script files delay content paint. Use the 'async' or 'defer' tags for non-critical assets.".format(load_time),
            "impact": "High",
            "difficulty": "Easy",
            "code": "<!-- Example of non-blocking script deferral -->\n<script src=\"app.js\" defer></script>\n\n<!-- Non-blocking stylesheet loading -->\n<link rel=\"preload\" href=\"styles.css\" as=\"style\" onload=\"this.onload=null;this.rel='stylesheet'\">"
        })

    ttfb = check.get("ttfb") or perf.get("ttfb")
    if ttfb and ttfb > 0.2:
        suggestions.append({
            "id": "optimize_ttfb",
            "category": "performance",
            "title": "Enable Server Caching & Redis Cache layers",
            "description": "Time to First Byte (TTFB) is {:.3f}s (ideal: <0.2s). Enable fast-cgi micro-caching or Redis database objects memory stores to bypass backend compilation cycles.".format(ttfb),
            "impact": "High",
            "difficulty": "Moderate",
            "code": "# Nginx FastCGI Cache Configuration Example\nfastcgi_cache_path /var/nginx/cache levels=1:2 keys_zone=WORDPRESS:100m inactive=60m;\nfastcgi_cache_key \"$scheme$request_method$host$request_uri\";\n\nserver {\n    # Apply cache to php processing block\n    location ~ \\.php$ {\n        fastcgi_cache WORDPRESS;\n        fastcgi_cache_valid 200 301 302 1h;\n        fastcgi_cache_use_stale error timeout updating;\n    }\n}"
        })

    page_size = check.get("page_size_kb") or perf.get("page_size_kb")
    if page_size and page_size > 1500:
        suggestions.append({
            "id": "compress_payload",
            "category": "performance",
            "title": "Reduce Overall Asset Payload Budget",
            "description": "Total page transfer budget is {:.1f} KB (ideal: <1.5 MB). Compress heavy assets, utilize modern WebP/AVIF media types, and implement Gzip/Brotli compression.",
            "impact": "High",
            "difficulty": "Moderate",
            "code": "# Enable Brotli & Gzip compression in nginx.conf\ngzip on;\ngzip_types text/plain text/css application/json application/javascript text/xml;\ngzip_min_length 1000;\n\nbrotli on;\nbrotli_types text/plain text/css application/json application/javascript;"
        })

    # ── 2. IMAGE OPTIMIZATION SUGGESTIONS ────────────────────────────────────────
    img_summary = images.get("summary") or {}
    oversized_imgs = img_summary.get("oversized_count", 0)
    if oversized_imgs > 0:
        suggestions.append({
            "id": "compress_images",
            "category": "performance",
            "title": "Compress Oversized Page Images",
            "description": "Found {} oversized web images transferring more than 200 KB each. Compress images using lossy algorithms to ensure faster Core Web Vitals (LCP) performance.".format(oversized_imgs),
            "impact": "High",
            "difficulty": "Easy",
            "code": "# Python automation snippet to batch compress site directories using Pillow:\nfrom PIL import Image\nimport os\n\ndef compress_image(image_path, quality=80):\n    img = Image.open(image_path)\n    # Convert PNGs to WebP for standard web payload savings\n    target_path = os.path.splitext(image_path)[0] + \".webp\"\n    img.save(target_path, \"WEBP\", quality=quality)\n    print(f\"Optimized: {target_path}\")"
        })

    # ── 3. SEO STRUCTURE & METADATA REMEDIATION ─────────────────────────────────
    title_data = seo.get("title") or {}
    if title_data.get("status") in ["missing", "warning"]:
        suggestions.append({
            "id": "seo_title",
            "category": "seo",
            "title": "Optimize Document SEO Title Tag",
            "description": title_data.get("message") or "The document title is suboptimal or missing. Craft a highly contextual title containing primary keywords between 50 to 60 characters long.",
            "impact": "High",
            "difficulty": "Easy",
            "code": "<head>\n    <!-- Optimal primary SEO Title tag -->\n    <title>Primary Keyword | secondary branding tag (50-60 Characters)</title>\n</head>"
        })

    meta_data = seo.get("meta_description") or {}
    if meta_data.get("status") in ["missing", "warning"]:
        suggestions.append({
            "id": "seo_meta",
            "category": "seo",
            "title": "Craft Descriptive Meta Description",
            "description": meta_data.get("message") or "Meta description is missing or suboptimal. Add a compelling page summary between 150-160 characters to optimize snippet click-through rates.",
            "impact": "Medium",
            "difficulty": "Easy",
            "code": "<head>\n    <!-- COMPILING META DESCRIPTION -->\n    <meta name=\"description\" content=\"Compelling search snippet describing the primary services, keyword hooks, and call-to-action details (Target 150-160 characters).\">\n</head>"
        })

    h1_data = seo.get("h1") or {}
    if h1_data.get("status") in ["missing", "warning"]:
        suggestions.append({
            "id": "seo_h1",
            "category": "seo",
            "title": "Align H1 Heading Hierarchy",
            "description": h1_data.get("message") or "Ensure exactly one H1 tag per page to build a structured heading hierarchy (H1 -> H2 -> H3) for crawling engines.",
            "impact": "Medium",
            "difficulty": "Easy",
            "code": "<body>\n    <!-- Use exactly one primary H1 for topic classification -->\n    <h1>Primary Subject Header</h1>\n    \n    <!-- Nested sections follow under H2 elements -->\n    <h2>Secondary Section Theme</h2>\n</body>"
        })

    # ── 4. SRE PROTOCOL & ENCRYPTED SECURITY ────────────────────────────────────
    https_status = sec.get("https") or {}
    if not https_status.get("is_https"):
        suggestions.append({
            "id": "sec_https",
            "category": "security",
            "title": "Enforce HTTPS redirect policies",
            "description": "Website is transmitted over plain unencrypted HTTP. Enforce global SSL traffic redirection within Nginx or Apache server configurations.",
            "impact": "Critical",
            "difficulty": "Easy",
            "code": "# Nginx redirect from port 80 to secure port 443\nserver {\n    listen 80;\n    server_name example.com www.example.com;\n    return 301 https://$host$request_uri;\n}"
        })

    headers_data = sec.get("headers", {}).get("headers") or {}
    
    # HSTS Check
    hsts = headers_data.get("strict-transport-security") or {}
    if not hsts.get("present"):
        suggestions.append({
            "id": "sec_hsts",
            "category": "security",
            "title": "Enable Strict-Transport-Security (HSTS)",
            "description": "HSTS forces user browsers to only request site content over secure HTTPS tunnels, mitigating risk of downgrade decryption exploits.",
            "impact": "High",
            "difficulty": "Easy",
            "code": "# Add HSTS security header in Nginx server block\nadd_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;"
        })

    # CSP Check
    csp = headers_data.get("content-security-policy") or {}
    if not csp.get("present"):
        suggestions.append({
            "id": "sec_csp",
            "category": "security",
            "title": "Establish Content-Security-Policy (CSP)",
            "description": "Establish a strong Content Security Policy header to control resource request bindings and eliminate Cross-Site Scripting (XSS) exploit vectors.",
            "impact": "High",
            "difficulty": "Hard",
            "code": "# Standard tight CSP configuration template\nadd_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google-analytics.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;\" always;"
        })

    # X-Frame-Options Check
    xfo = headers_data.get("x-frame-options") or {}
    if not xfo.get("present"):
        suggestions.append({
            "id": "sec_xfo",
            "category": "security",
            "title": "Mitigate Clickjacking with X-Frame-Options",
            "description": "Instruct downstream browsers on whether the website is allowed to compile inside iframe nodes, preventing visual clickjacking alignments.",
            "impact": "Medium",
            "difficulty": "Easy",
            "code": "# Prevent frame embedding inside competitor domains\nadd_header X-Frame-Options \"SAMEORIGIN\" always;"
        })

    # X-Content-Type-Options Check
    xcto = headers_data.get("x-content-type-options") or {}
    if not xcto.get("present"):
        suggestions.append({
            "id": "sec_xcto",
            "category": "security",
            "title": "Prevent Sniffing with X-Content-Type-Options",
            "description": "Mitigate MIME-type sniffing vulnerabilities by forcing browsers to strictly follow content-type headers sent by the application host.",
            "impact": "Medium",
            "difficulty": "Easy",
            "code": "# Prevent MIME-sniffing exploits in Nginx\nadd_header X-Content-Type-Options \"nosniff\" always;"
        })

    # ── 5. UI/UX VISUAL REGRESSION & CLS SUGGESTIONS ─────────────────────────────
    layout_shift = ui_ux.get("layout_shift") or {}
    cls_hazard = layout_shift.get("cls_hazard_index") or perf.get("cls")
    if cls_hazard and cls_hazard > 0.15:
        suggestions.append({
            "id": "ui_ux_cls",
            "category": "ui_ux",
            "title": "Safeguard layout shifts (Cumulative Layout Shift)",
            "description": "Layout shift danger is {:.2f}. Specify width and height dimensional tags or equivalent CSS aspect-ratio variables on media assets to allocate design space ahead of loading.",
            "impact": "High",
            "difficulty": "Easy",
            "code": "<!-- Standard image tag width/height configuration -->\n<img src=\"banner.png\" width=\"800\" height=\"400\" alt=\"descriptive logo\" style=\"max-width: 100%; height: auto;\">\n\n<!-- Responsive CSS aspect ratio configuration -->\n.image-card {\n    width: 100%;\n    aspect-ratio: 16 / 9;\n    background-color: var(--card-bg-fallback);\n}"
        })

    responsiveness = ui_ux.get("responsiveness") or {}
    if responsiveness and not responsiveness.get("has_viewport"):
        suggestions.append({
            "id": "ui_ux_viewport",
            "category": "ui_ux",
            "title": "Add Responsive Mobile Viewport tag",
            "description": "Document is missing a mobile viewport scale meta header. This makes content rendering unreadable on high-resolution tablet and mobile viewport screens.",
            "impact": "Critical",
            "difficulty": "Easy",
            "code": "<head>\n    <!-- Standard device scalable viewport definition tag -->\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, shrink-to-fit=no\">\n</head>"
        })

    # ── 6. FRONTEND CODE STRUCTURE REMEDIATION ──────────────────────────────────
    optimization_struct = struct.get("optimization") or {}
    unminified_files = len(optimization_struct.get("unminified_resources") or [])
    if unminified_files > 0:
        suggestions.append({
            "id": "struct_minify",
            "category": "structure",
            "title": "Minify JavaScript & Stylesheet Assets",
            "description": "Found {} unminified resource scripts. Eliminate source comments, extra blank formatting indentation lines, and redundant scope variables to compress scripts.".format(unminified_files),
            "impact": "Medium",
            "difficulty": "Moderate",
            "code": "# Webpack compilation build config example (Terser Minifier plugin):\nconst TerserPlugin = require('terser-webpack-plugin');\n\nmodule.exports = {\n  optimization: {\n    minimize: true,\n    minimizer: [new TerserPlugin()],\n  },\n};"
        })

    # ── 7. CMS WORDPRESS SECURE CODE REMEDIATION ────────────────────────────────
    if wp.get("is_wordpress"):
        vulnerabilities = len(wp.get("vulnerabilities") or [])
        if vulnerabilities > 0:
            suggestions.append({
                "id": "wp_vuln",
                "category": "wordpress",
                "title": "Patch Core Wordpress & Plugin Vulnerabilities",
                "description": "Found {} potential plugin/theme vulnerability alerts. Update plugins directly from WP repository or deprecate older extensions.".format(vulnerabilities),
                "impact": "Critical",
                "difficulty": "Moderate",
                "code": "# WP-CLI command sequence to verify and auto-update active configurations:\nwp plugin list --update=available\nwp plugin update --all\nwp core update"
            })
            
        plugin_updates = len(wp.get("plugin_updates") or [])
        if plugin_updates > 0:
            suggestions.append({
                "id": "wp_plugin_updates",
                "category": "wordpress",
                "title": "Execute Pending WordPress Plugin Updates",
                "description": "Found {} plugins with pending updates. Keep modules updated to avoid backend logic exceptions and SQL injection vectors.".format(plugin_updates),
                "impact": "High",
                "difficulty": "Easy",
                "code": "# CLI sequence to target specific outdated plugin modules\nwp plugin list --status=outdated\nwp plugin update [plugin-slug]"
            })

    return suggestions
