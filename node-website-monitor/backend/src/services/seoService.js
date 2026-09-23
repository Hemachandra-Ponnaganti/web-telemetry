const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Generates an intelligent, context-aware alt text suggestion from the image source URL.
 * 
 * @param {string} src - The image src attribute value.
 * @returns {string} Suggested descriptive ALT tag.
 */
const generateSuggestedAlt = (src) => {
  if (!src) return "";
  
  let decodedSrc = src;
  try {
    decodedSrc = decodeURIComponent(src);
  } catch (e) {}

  const parts = decodedSrc.split('?')[0].split('/');
  let filename = parts.pop() || "";
  let folder = parts.length > 0 ? parts[parts.length - 1] : "";
  let subfolder = parts.length > 1 ? parts[parts.length - 2] : "";

  let baseName = filename.replace(/\.[a-zA-Z0-9]+$/, '');

  const isHashOrNum = /^[0-9a-fA-F-_]+$/.test(baseName) && (
    /^\d+$/.test(baseName.replace(/[-_]/g, '')) || 
    baseName.replace(/[-_]/g, '').length >= 8
  );

  let cleanName = baseName;
  if (isHashOrNum && folder && !/^(uploads|images|assets|wp-content|media|static|img)$/i.test(folder)) {
    cleanName = `${folder} image`;
  } else if (isHashOrNum && subfolder && !/^(uploads|images|assets|wp-content|media|static|img)$/i.test(subfolder)) {
    cleanName = `${subfolder} image`;
  } else if (isHashOrNum) {
    cleanName = "Content illustration";
  }

  if (!cleanName) {
    return "Website image";
  }

  cleanName = cleanName.replace(/[-_]\d+x\d+/g, '');
  cleanName = cleanName.replace(/[-_](scaled|thumb|thumbnail|medium|large|v\d+(\.\d+)*)/gi, '');
  cleanName = cleanName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  cleanName = cleanName.replace(/[-_+]/g, ' ');
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  const lower = cleanName.toLowerCase();
  if (lower === 'logo') {
    cleanName = "Brand logo";
  } else if (lower === 'avatar') {
    cleanName = "User avatar";
  } else if (lower === 'banner') {
    cleanName = "Hero banner";
  } else if (lower === 'icon') {
    cleanName = "Navigation icon";
  }

  if (cleanName.length > 0) {
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }

  return cleanName;
};

/**
 * Evaluates the Technical SEO Quality and Architecture of a given URL.
 * Analyzes protocol security, character length, directory nesting depth,
 * word separators, casing, query parameter bloat, safe encoding, and semantic readability.
 * 
 * @param {string} urlStr - Target URL string.
 * @returns {object} Comprehensive URL Quality scorecard and metrics.
 */
const evaluateUrlQuality = (urlStr) => {
  if (!urlStr) {
    return {
      score: 50,
      grade: 'C',
      rating: 'Fair',
      url: '',
      metrics: {},
      recommendations: ['Provide a valid URL to analyze.']
    };
  }

  let parsed;
  try {
    let toParse = urlStr.trim();
    if (!/^https?:\/\//i.test(toParse)) {
      toParse = `https://${toParse}`;
    }
    parsed = new URL(toParse);
  } catch (e) {
    return {
      score: 30,
      grade: 'F',
      rating: 'Invalid',
      url: urlStr,
      metrics: {},
      recommendations: ['Invalid URL format. Ensure valid domain and syntax.']
    };
  }

  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname || '/';
  const search = parsed.search || '';
  const fullUrl = urlStr.trim();

  let totalScore = 0;
  const recommendations = [];
  const metrics = {};

  // 1. Protocol Security (Weight: 20 pts)
  const isHttps = protocol === 'https:';
  if (isHttps) {
    totalScore += 20;
    metrics.protocol = {
      name: 'Protocol Security',
      score: 20,
      maxScore: 20,
      status: 'ok',
      value: 'HTTPS (Encrypted)',
      message: 'Secured with HTTPS. Meets search engine ranking security standards.'
    };
  } else {
    metrics.protocol = {
      name: 'Protocol Security',
      score: 0,
      maxScore: 20,
      status: 'critical',
      value: 'HTTP (Insecure)',
      message: 'Insecure HTTP protocol. Google flags and down-ranks non-HTTPS URLs.'
    };
    recommendations.push('Migrate URL to HTTPS and configure permanent 301 redirects from HTTP.');
  }

  // 2. URL Length (Weight: 15 pts)
  // Ideal: <= 60 chars. Good: 61-80 chars. Long: 81-100 chars. Suboptimal: > 100 chars.
  const urlLength = fullUrl.length;
  if (urlLength <= 60) {
    totalScore += 15;
    metrics.length = {
      name: 'URL Length',
      score: 15,
      maxScore: 15,
      status: 'ok',
      value: `${urlLength} chars (Optimal)`,
      message: `Short and concise (${urlLength} chars). Easy for search engines to index and humans to share.`
    };
  } else if (urlLength <= 80) {
    totalScore += 12;
    metrics.length = {
      name: 'URL Length',
      score: 12,
      maxScore: 15,
      status: 'ok',
      value: `${urlLength} chars (Good)`,
      message: `Acceptable length (${urlLength} chars). Well within SERP display limits.`
    };
  } else if (urlLength <= 100) {
    totalScore += 7;
    metrics.length = {
      name: 'URL Length',
      score: 7,
      maxScore: 15,
      status: 'warning',
      value: `${urlLength} chars (Moderate)`,
      message: `URL is somewhat long (${urlLength} chars). Consider shortening for better user experience.`
    };
    recommendations.push('Shorten the URL slug to under 75 characters for cleaner search snippet display.');
  } else {
    totalScore += 2;
    metrics.length = {
      name: 'URL Length',
      score: 2,
      maxScore: 15,
      status: 'critical',
      value: `${urlLength} chars (Too Long)`,
      message: `Excessive URL length (${urlLength} chars). Long URLs risk truncation in SERPs and lower CTR.`
    };
    recommendations.push('Excessive length detected. Trim unnecessary path segments or tracking parameters.');
  }

  // 3. Path Crawl Depth / Directory Hierarchy (Weight: 15 pts)
  const segments = pathname.split('/').filter(Boolean);
  const depth = segments.length;
  if (depth <= 2) {
    totalScore += 15;
    metrics.depth = {
      name: 'Directory Depth',
      score: 15,
      maxScore: 15,
      status: 'ok',
      value: `${depth} level${depth === 1 ? '' : 's'} (Shallow)`,
      message: `Optimal crawl depth (${depth} directory levels). Shallow hierarchy maximizes link equity.`
    };
  } else if (depth === 3) {
    totalScore += 10;
    metrics.depth = {
      name: 'Directory Depth',
      score: 10,
      maxScore: 15,
      status: 'ok',
      value: '3 levels (Moderate)',
      message: 'Standard directory depth (3 levels). Acceptable for deep e-commerce or blogs.'
    };
  } else {
    totalScore += 4;
    metrics.depth = {
      name: 'Directory Depth',
      score: 4,
      maxScore: 15,
      status: 'warning',
      value: `${depth} levels (Deep)`,
      message: `Deeply nested path structure (${depth} levels). Flatter URL architectures perform better.`
    };
    recommendations.push(`Reduce directory nesting depth (currently ${depth} levels). Aim for a maximum of 2 to 3 path segments.`);
  }

  // 4. Character Casing & Word Separators (Weight: 15 pts)
  const hasUppercase = pathname !== pathname.toLowerCase();
  const hasUnderscores = pathname.includes('_');
  const hasSpacesOrEncoded = /%20|\s/.test(pathname);

  let casingScore = 15;
  const casingIssues = [];
  if (hasUppercase) {
    casingScore -= 6;
    casingIssues.push('Uppercase characters');
    recommendations.push('Convert uppercase URL characters to lowercase to prevent duplicate content indexing.');
  }
  if (hasUnderscores) {
    casingScore -= 5;
    casingIssues.push('Underscores (_) used');
    recommendations.push('Use hyphens (-) instead of underscores (_) as word separators per Google SEO guidelines.');
  }
  if (hasSpacesOrEncoded) {
    casingScore -= 6;
    casingIssues.push('Spaces / %20 encoding');
    recommendations.push('Remove whitespace / %20 encodings from URLs and replace with hyphens (-).');
  }

  casingScore = Math.max(0, casingScore);
  totalScore += casingScore;
  metrics.casingSeparators = {
    name: 'Casing & Word Separators',
    score: casingScore,
    maxScore: 15,
    status: casingScore >= 12 ? 'ok' : casingScore >= 7 ? 'warning' : 'critical',
    value: casingIssues.length === 0 ? 'Lowercase & Hyphens' : casingIssues.join(', '),
    message: casingIssues.length === 0 
      ? 'Clean lowercase syntax with standard hyphen separators.'
      : `Suboptimal separators/casing: ${casingIssues.join(', ')}.`
  };

  // 5. Query Parameters & Dynamic Bloat (Weight: 15 pts)
  const searchParams = parsed.searchParams;
  const paramCount = Array.from(searchParams.keys()).length;
  const hasSessionId = /sessionid|phpsessid|jsessionid|sid|aspsessionid/i.test(search);
  const hasTracking = /utm_|fbclid|gclid|mc_cid|yclid/i.test(search);

  let paramScore = 15;
  if (paramCount === 0) {
    paramScore = 15;
    metrics.queryParams = {
      name: 'Query Parameter Bloat',
      score: 15,
      maxScore: 15,
      status: 'ok',
      value: '0 params (Clean/Static)',
      message: 'Clean static/RESTful URL with zero query parameter dilution.'
    };
  } else if (paramCount <= 2 && !hasSessionId) {
    paramScore = 10;
    metrics.queryParams = {
      name: 'Query Parameter Bloat',
      score: 10,
      maxScore: 15,
      status: 'ok',
      value: `${paramCount} parameter${paramCount === 1 ? '' : 's'}`,
      message: `Low parameter footprint (${paramCount} params). Ensure canonical tag points to primary URL.`
    };
  } else {
    paramScore = hasSessionId ? 0 : 4;
    metrics.queryParams = {
      name: 'Query Parameter Bloat',
      score: paramScore,
      maxScore: 15,
      status: 'warning',
      value: `${paramCount} parameter${paramCount === 1 ? '' : 's'}${hasSessionId ? ' (Session ID)' : ''}`,
      message: hasSessionId 
        ? 'Session IDs detected in URL. This can cause crawl loops and security leaks.'
        : `Heavy query parameter bloat (${paramCount} params). May cause duplicate content issues.`
    };
    if (hasSessionId) {
      recommendations.push('Remove session IDs from URLs; manage sessions via HTTP-only cookies.');
    } else {
      recommendations.push('Minimize query parameters on indexable URLs. Use clean RESTful slugs or canonical tags.');
    }
  }
  totalScore += paramScore;

  // 6. Special Characters & Encoding Safety (Weight: 10 pts)
  // Check for unsafe chars like @, $, !, *, +, ~, ;, commas, or non-ASCII
  const hasUnsafeChars = /[@$!*+~;,`^{}\[\]\\|<>]/i.test(pathname) || /[^\x00-\x7F]/.test(pathname);
  if (!hasUnsafeChars) {
    totalScore += 10;
    metrics.characterSafety = {
      name: 'Character Safety & Encoding',
      score: 10,
      maxScore: 10,
      status: 'ok',
      value: 'Clean ASCII',
      message: 'Safe ASCII characters without percent-encoding or illegal characters.'
    };
  } else {
    metrics.characterSafety = {
      name: 'Character Safety & Encoding',
      score: 2,
      maxScore: 10,
      status: 'critical',
      value: 'Unsafe / Non-ASCII Chars',
      message: 'Contains non-standard symbols or unsafe characters that can break search crawlers.'
    };
    recommendations.push('Remove special symbols (@, $, !, *, +, etc.) and ensure pure URL-safe ASCII slugs.');
  }

  // 7. Slug Architecture & Extension Cleanliness (Weight: 10 pts)
  const legacyExtMatch = pathname.match(/\.(php|asp|aspx|cgi|jsp|html|htm)$/i);
  const isNumericOnlySlug = segments.length > 0 && /^\d+$/.test(segments[segments.length - 1]);

  let slugScore = 10;
  const slugNotes = [];
  if (legacyExtMatch) {
    slugScore -= 4;
    slugNotes.push(`Extension ${legacyExtMatch[0]}`);
    recommendations.push(`Strip legacy file extension (${legacyExtMatch[0]}) in favor of clean RESTful slugs.`);
  }
  if (isNumericOnlySlug) {
    slugScore -= 3;
    slugNotes.push('Numeric ID slug');
    recommendations.push('Include descriptive keyword text in URL slug rather than numeric-only IDs.');
  }

  slugScore = Math.max(0, slugScore);
  totalScore += slugScore;
  metrics.readability = {
    name: 'Slug Architecture & Semantics',
    score: slugScore,
    maxScore: 10,
    status: slugScore >= 8 ? 'ok' : 'info',
    value: slugNotes.length === 0 ? 'Clean Semantic Slug' : slugNotes.join(', '),
    message: slugNotes.length === 0 
      ? 'Modern extension-free semantic keyword slug architecture.'
      : `Suboptimal slug structure: ${slugNotes.join(', ')}.`
  };

  // Clamp overall score
  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  // Calculate Grade
  let grade = 'F';
  let rating = 'Critical';
  if (finalScore >= 95) { grade = 'A+'; rating = 'Exceptional'; }
  else if (finalScore >= 85) { grade = 'A'; rating = 'Excellent'; }
  else if (finalScore >= 75) { grade = 'B'; rating = 'Good'; }
  else if (finalScore >= 60) { grade = 'C'; rating = 'Fair'; }
  else if (finalScore >= 45) { grade = 'D'; rating = 'Needs Improvement'; }

  if (recommendations.length === 0) {
    recommendations.push('URL is exceptionally structured and follows all modern Technical SEO best practices.');
  }

  // Breadcrumbs representation
  const breadcrumbSegments = [hostname, ...segments.map(s => s.replace(/[-_]/g, ' '))];

  return {
    score: finalScore,
    grade,
    rating,
    url: fullUrl,
    parsed: {
      protocol: parsed.protocol.replace(':', ''),
      hostname,
      pathname,
      paramCount,
      depth,
      length: urlLength
    },
    metrics,
    recommendations,
    breadcrumbSegments,
    serpPreview: {
      domain: hostname,
      breadcrumb: breadcrumbSegments.join(' › '),
      displayUrl: fullUrl
    }
  };
};

/**

 * Audit meta elements, headings, robots rules, canonical redirects, Open Graph tags, 
 * viewport configs, word occurrences, and broken link indexes.
 * 
 * @param {string} url - Target URL to analyze.
 * @param {string} htmlContent - Optional HTML content already loaded.
 * @returns {Promise<object>} Complete SEO audit payload.
 */
const analyzeSeo = async (url, htmlContent = '') => {
  let html = htmlContent;
  if (!html) {
    try {
      const resp = await axios.get(url, { 
        timeout: 6000, 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MonitorProSRE/1.0' }, 
        validateStatus: () => true,
        httpsAgent
      });
      html = typeof resp.data === 'string' ? resp.data : (typeof resp.data === 'object' ? JSON.stringify(resp.data) : String(resp.data || ''));
    } catch (e) {
      return { seoScore: 50, error: e.message, alerts: [{ level: 'critical', message: `Crawl Failed: ${e.message}` }] };
    }
  } else if (typeof html !== 'string') {
    html = typeof html === 'object' ? JSON.stringify(html) : String(html || '');
  }

  const urlQualityResult = evaluateUrlQuality(url);

  const reports = {
    title: { text: "", status: "warning", message: "No meta title tag detected." },
    metaDescription: { text: "", status: "warning", message: "No meta description tag detected." },
    keywordsMeta: { text: "", status: "warning", message: "No meta keywords tag detected." },
    headings: { h1: [], h2: [], h3: [], status: "ok", message: "Headings structure is valid." },
    canonical: { text: "", status: "ok", message: "Canonical tag verified." },
    robotsTxt: { exists: false, status: "warning", message: "Robots.txt check skipped." },
    sitemap: { exists: false, status: "warning", message: "Sitemap check skipped." },
    openGraph: { ogTitle: "", ogImage: "", status: "warning", message: "No Open Graph tags detected." },
    twitterCard: { twitterCard: "", status: "warning", message: "No Twitter card tags detected." },
    indexability: { isIndexable: true, status: "ok", message: "Site is indexable by search engines." },
    mobileFriendliness: { viewportConfigured: true, touchTargetIssues: 0, status: "ok", message: "Mobile touch layouts optimized." },
    keywordAnalysis: { topKeywords: [], status: "ok" },
    links: { internalCount: 0, externalCount: 0, brokenCount: 0, brokenLinks: [], status: "ok" },
    imageAnalysis: { totalImages: 0, withAlt: 0, missingAlt: 0, emptyAlt: 0, missingAltSrcs: [], status: "ok", message: "No images analyzed." },
    urlQuality: urlQualityResult,
    schemaMarkup: { present: false, valid: false, types: [], items: [], message: "No Schema markup detected." },
    seoScore: 100,
    alerts: []
  };

  // Check URL Quality impact on alerts
  if (urlQualityResult.score < 70) {
    reports.seoScore -= 5;
    reports.alerts.push({
      level: 'warning',
      message: `SEO Warning: Suboptimal URL Quality Score (${urlQualityResult.score}/100 - Grade ${urlQualityResult.grade}).`
    });
  }

  // 1. Meta Title Detection
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const titleText = titleMatch[1].trim();
    reports.title.text = titleText;
    if (titleText.length < 30 || titleText.length > 65) {
      reports.title.status = "warning";
      reports.title.message = `Title is ${titleText.length} chars. Ideal length is 30-65 chars.`;
      reports.alerts.push({ level: 'warning', message: `SEO Warning: Meta title length is suboptimal (${titleText.length} chars).` });
    } else {
      reports.title.status = "ok";
      reports.title.message = "Meta title length is excellent!";
    }
  } else {
    reports.seoScore -= 15;
    reports.alerts.push({ level: 'critical', message: 'SEO Critical: Missing HTML Meta Title tag.' });
  }

  // 2. Meta Description Detection
  const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  if (descMatch && descMatch[1]) {
    const descText = descMatch[1].trim();
    reports.metaDescription.text = descText;
    if (descText.length < 120 || descText.length > 160) {
      reports.metaDescription.status = "warning";
      reports.metaDescription.message = `Description is ${descText.length} chars. Ideal length is 120-160 chars.`;
      reports.alerts.push({ level: 'warning', message: `SEO Warning: Meta description length is suboptimal (${descText.length} chars).` });
    } else {
      reports.metaDescription.status = "ok";
      reports.metaDescription.message = "Meta description length is excellent!";
    }
  } else {
    reports.seoScore -= 15;
    reports.alerts.push({ level: 'critical', message: 'SEO Critical: Missing Meta Description tag.' });
  }

  // 2.5 Meta Keywords Detection
  const keywordMatch = html.match(/<meta\s+[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']keywords["']/i);
  if (keywordMatch && keywordMatch[1].trim()) {
    reports.keywordsMeta.text = keywordMatch[1].trim();
    reports.keywordsMeta.status = "ok";
    reports.keywordsMeta.message = "Meta keywords found.";
  } else {
    reports.keywordsMeta.text = "No keywords found";
    reports.keywordsMeta.status = "warning";
    reports.keywordsMeta.message = "No meta keywords tag detected.";
  }

  // 3. Canonical Check
  const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  if (canonicalMatch && canonicalMatch[1]) {
    reports.canonical.text = canonicalMatch[1];
    reports.canonical.status = "ok";
  } else {
    reports.seoScore -= 10;
    reports.canonical.status = "warning";
    reports.canonical.message = "Missing canonical link reference.";
    reports.alerts.push({ level: 'warning', message: 'SEO Warning: Missing canonical URL link.' });
  }

  // 4. Heading Structure H1/H2/H3
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const h3Matches = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];

  reports.headings.h1 = h1Matches.map(m => m[1].replace(/<[^>]*>/g, '').trim());
  reports.headings.h2 = h2Matches.map(m => m[1].replace(/<[^>]*>/g, '').trim());
  reports.headings.h3 = h3Matches.map(m => m[1].replace(/<[^>]*>/g, '').trim());

  if (reports.headings.h1.length === 0) {
    reports.seoScore -= 12;
    reports.headings.status = "warning";
    reports.headings.message = "Missing H1 page heading template.";
    reports.alerts.push({ level: 'critical', message: 'SEO Critical: Missing H1 page title heading.' });
  } else if (reports.headings.h1.length > 1) {
    reports.seoScore -= 6;
    reports.headings.status = "warning";
    reports.headings.message = "Multiple H1 tags detected. Keep a single unique H1 heading.";
    reports.alerts.push({ level: 'warning', message: 'SEO Warning: Multiple H1 tag declarations found.' });
  }

  // 5. Indexability & Robots
  const robotsMatch = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  if (robotsMatch && robotsMatch[1]) {
    const content = robotsMatch[1].toLowerCase();
    if (content.includes("noindex")) {
      reports.indexability.isIndexable = false;
      reports.indexability.status = "critical";
      reports.indexability.message = "Search engines blocked by meta robots noindex tag.";
      reports.seoScore -= 25;
      reports.alerts.push({ level: 'critical', message: 'SEO Critical: Page is de-indexed via Meta noindex.' });
    }
  }

  // 6. Robots.txt and Sitemap Detections
  try {
    const hostUrl = new URL(url);
    
    // Real robots.txt fetch in real-time
    const robotsUrl = `${hostUrl.origin}/robots.txt`;
    try {
      const robotsResp = await axios.get(robotsUrl, { 
        timeout: 3500, 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MonitorProSRE/1.0' }, 
        validateStatus: () => true,
        httpsAgent
      });
      if (robotsResp.status === 200 && robotsResp.data) {
        reports.robotsTxt.exists = true;
        reports.robotsTxt.status = "ok";
        reports.robotsTxt.message = `Robots.txt found at ${robotsUrl} (${robotsResp.data.length} bytes).`;
      } else {
        reports.robotsTxt.exists = false;
        reports.robotsTxt.status = "warning";
        reports.robotsTxt.message = `Robots.txt not found at ${robotsUrl} (HTTP ${robotsResp.status}).`;
        reports.alerts.push({ level: 'warning', message: `SEO Warning: Robots.txt was not found.` });
        reports.seoScore -= 5;
      }
    } catch (err) {
      reports.robotsTxt.exists = false;
      reports.robotsTxt.status = "warning";
      reports.robotsTxt.message = `Failed to fetch robots.txt: ${err.message}`;
      reports.alerts.push({ level: 'warning', message: `SEO Warning: Failed to fetch robots.txt.` });
      reports.seoScore -= 5;
    }

    // Real sitemap.xml fetch in real-time
    const sitemapUrl = `${hostUrl.origin}/sitemap.xml`;
    try {
      const sitemapResp = await axios.get(sitemapUrl, { 
        timeout: 3500, 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MonitorProSRE/1.0' }, 
        validateStatus: () => true,
        httpsAgent
      });
      if (sitemapResp.status === 200) {
        reports.sitemap.exists = true;
        reports.sitemap.status = "ok";
        const urlCount = (sitemapResp.data.match(/<url>/g) || []).length;
        reports.sitemap.message = `Sitemap found at ${sitemapUrl} with ${urlCount} URLs.`;
      } else {
        reports.sitemap.exists = false;
        reports.sitemap.status = "warning";
        reports.sitemap.message = `Sitemap.xml not found at ${sitemapUrl} (HTTP ${sitemapResp.status}).`;
        reports.alerts.push({ level: 'warning', message: `SEO Warning: Sitemap.xml was not found.` });
        reports.seoScore -= 5;
      }
    } catch (err) {
      reports.sitemap.exists = false;
      reports.sitemap.status = "warning";
      reports.sitemap.message = `Failed to fetch sitemap.xml: ${err.message}`;
      reports.alerts.push({ level: 'warning', message: `SEO Warning: Failed to fetch sitemap.xml.` });
      reports.seoScore -= 5;
    }
  } catch (e) {}

  // 7. Open Graph and Twitter Card tags
  const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const ogImageMatch = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  if (ogTitleMatch) {
    reports.openGraph.ogTitle = ogTitleMatch[1];
    reports.openGraph.status = "ok";
    reports.openGraph.message = "Open Graph protocol fully integrated.";
  } else {
    reports.alerts.push({ level: 'info', message: 'SEO Info: Missing Facebook Open Graph og:title metadata.' });
  }

  const twitterCardMatch = html.match(/<meta\s+[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i);
  if (twitterCardMatch) {
    reports.twitterCard.twitterCard = twitterCardMatch[1];
    reports.twitterCard.status = "ok";
    reports.openGraph.message = "Twitter rich cards protocol integrated.";
  } else {
    reports.alerts.push({ level: 'info', message: 'SEO Info: Missing Twitter Card micro-formats.' });
  }

  // 8. Mobile Friendliness
  const viewportMatch = html.match(/<meta\s+[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/i);
  if (viewportMatch && viewportMatch[1]) {
    reports.mobileFriendliness.viewportConfigured = true;
    reports.mobileFriendliness.status = "ok";
  } else {
    reports.seoScore -= 15;
    reports.mobileFriendliness.viewportConfigured = false;
    reports.mobileFriendliness.status = "critical";
    reports.mobileFriendliness.message = "No mobile viewport config tag. Severe mobile layout penalty.";
    reports.alerts.push({ level: 'critical', message: 'SEO Critical: Missing Viewport Meta Tag for mobile scaling.' });
  }

  // 12. Schema Markup Detection (JSON-LD)
  const schemaMatches = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (schemaMatches.length > 0) {
    reports.schemaMarkup.present = true;
    let isValid = true;
    
    schemaMatches.forEach(match => {
      try {
        const schemaObj = JSON.parse(match[1].trim());
        const schemas = Array.isArray(schemaObj) ? schemaObj : [schemaObj];
        
        schemas.forEach(schema => {
          const items = schema['@graph'] || [schema];
          items.forEach(item => {
            if (item && item['@type']) {
              reports.schemaMarkup.types.push(item['@type']);
              reports.schemaMarkup.items.push(item);
            }
          });
        });
      } catch (err) {
        isValid = false;
        reports.alerts.push({ level: 'warning', message: 'SEO Warning: Invalid JSON-LD Schema markup found (Syntax Error).' });
      }
    });

    if (isValid && reports.schemaMarkup.types.length > 0) {
      reports.schemaMarkup.valid = true;
      reports.schemaMarkup.message = `Valid schema detected: ${[...new Set(reports.schemaMarkup.types)].join(', ')}`;
      reports.seoScore += 5; // Bonus for having valid schema
    } else if (isValid) {
      reports.schemaMarkup.message = "Schema block found but no recognized @type definitions.";
    } else {
      reports.schemaMarkup.message = "JSON syntax error in one or more schema blocks.";
    }
  }

  // 9. Keyword Frequency Analysis
  const bodyText = html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-zA-Z]/g, ' ')
    .toLowerCase();

  const words = bodyText.split(/\s+/).filter(w => w.length > 4);
  const stopWords = new Set(["about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"]);
  
  const kwMap = {};
  for (let w of words) {
    if (!stopWords.has(w)) {
      kwMap[w] = (kwMap[w] || 0) + 1;
    }
  }

  const sortedKeywords = Object.keys(kwMap)
    .map(key => ({ keyword: key, count: kwMap[key] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  reports.keywordAnalysis.topKeywords = sortedKeywords;

  // 10. Link Analysis (separating internal vs external & URL quality per page)
  const linkMatches = [...html.matchAll(/<a\s+[^>]*href=["']([^"']*)["']/gi)];
  let internal = 0;
  let external = 0;
  const discoveredInternalUrls = new Set();
  const discoveredExternalUrls = new Set();
  if (url) discoveredInternalUrls.add(url);

  let parsedBase = null;
  try { parsedBase = new URL(url); } catch (e) {}
  
  for (let match of linkMatches) {
    const l = match[1];
    if (!l || l.startsWith("#") || l.startsWith("javascript:") || l.startsWith("mailto:") || l.startsWith("tel:")) continue;
    try {
      const resolved = new URL(l, url);
      const baseHostname = parsedBase ? parsedBase.hostname.replace(/^www\./, '') : '';
      const resolvedHostname = resolved.hostname.replace(/^www\./, '');

      if (parsedBase && (resolvedHostname === baseHostname || resolvedHostname.endsWith('.' + baseHostname))) {
        internal++;
        if (discoveredInternalUrls.size < 100) {
          resolved.hash = '';
          discoveredInternalUrls.add(resolved.href);
        }
      } else if (l.startsWith("http") || l.startsWith("//")) {
        external++;
        if (discoveredExternalUrls.size < 50) {
          discoveredExternalUrls.add(resolved.href);
        }
      }
    } catch (e) {
      if (l.startsWith("/")) {
        internal++;
      } else if (l.startsWith("http")) {
        external++;
      }
    }
  }

  // Site-wide URL Quality evaluation for all discovered page URLs
  const pagesUrlEvaluations = [];
  discoveredInternalUrls.forEach(pageUrl => {
    try {
      const evaluated = evaluateUrlQuality(pageUrl);
      pagesUrlEvaluations.push({
        pageUrl,
        pageLabel: pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/',
        urlQuality: evaluated
      });
    } catch (err) {}
  });

  const totalEvaluated = pagesUrlEvaluations.length;
  const avgSiteUrlScore = totalEvaluated > 0
    ? Math.round(pagesUrlEvaluations.reduce((sum, p) => sum + (p.urlQuality?.score || 0), 0) / totalEvaluated)
    : (reports.urlQuality?.score || 100);

  const gradeDist = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 };
  pagesUrlEvaluations.forEach(p => {
    const g = p.urlQuality?.grade || 'A';
    if (gradeDist[g] !== undefined) gradeDist[g]++;
    else gradeDist['C']++;
  });

  reports.siteWideUrlQuality = {
    totalUrls: totalEvaluated,
    avgScore: avgSiteUrlScore,
    gradeDistribution: gradeDist,
    pages: pagesUrlEvaluations,
    issues: {
      insecureHttp: pagesUrlEvaluations.filter(p => p.urlQuality?.metrics?.protocol?.status === 'critical').length,
      excessiveLength: pagesUrlEvaluations.filter(p => (p.urlQuality?.parsed?.length || 0) > 75).length,
      deepHierarchy: pagesUrlEvaluations.filter(p => (p.urlQuality?.parsed?.depth || 0) > 2).length,
      badCasingOrSeparators: pagesUrlEvaluations.filter(p => p.urlQuality?.metrics?.casingSeparators?.status !== 'ok').length,
      queryBloat: pagesUrlEvaluations.filter(p => (p.urlQuality?.parsed?.paramCount || 0) > 0).length,
      legacyExtensions: pagesUrlEvaluations.filter(p => p.urlQuality?.metrics?.readability?.status !== 'ok').length,
      characterSafety: pagesUrlEvaluations.filter(p => p.urlQuality?.metrics?.characterSafety?.status !== 'ok').length
    }
  };

  reports.links.internalCount = internal;
  reports.links.externalCount = external;

  // Real-time Broken links / 404 detection
  const detect404Pages = async (links, isInternal = true, limit = 10) => {
    const brokenLinks = [];
    const urlsToCheck = Array.from(links).filter(l => l !== url).slice(0, limit);
    const tasks = urlsToCheck.map(async (link) => {
      try {
        const resp = await axios.head(link, { 
          timeout: 2500, 
          httpsAgent, 
          validateStatus: () => true 
        });
        if (resp.status === 404) {
          brokenLinks.push({ url: link, type: isInternal ? 'internal' : 'external', reason: 'HTTP 404 Not Found', foundOn: url });
        } else if (resp.status >= 500) {
          brokenLinks.push({ url: link, type: isInternal ? 'internal' : 'external', reason: `HTTP ${resp.status} Server Error`, foundOn: url });
        }
      } catch (err) {
        brokenLinks.push({ url: link, type: isInternal ? 'internal' : 'external', reason: 'Network/DNS Error', foundOn: url });
      }
    });
    await Promise.all(tasks);
    return brokenLinks;
  };

  // Real-time Redirection detection
  const detectRedirects = async (links, isInternal = true, limit = 10) => {
    const redirects = [];
    const urlsToCheck = Array.from(links).filter(l => l !== url).slice(0, limit);
    const tasks = urlsToCheck.map(async (link) => {
      try {
        const resp = await axios.head(link, { 
          timeout: 2500, 
          httpsAgent, 
          validateStatus: () => true,
          maxRedirects: 0
        });
        if (resp.status >= 300 && resp.status < 400 && resp.headers.location) {
          redirects.push({ url: link, type: isInternal ? 'internal' : 'external', reason: `HTTP ${resp.status} Redirect to ${resp.headers.location}`, foundOn: url, isRedirect: true });
        }
      } catch (err) {
        // ignore
      }
    });
    await Promise.all(tasks);
    return redirects;
  };

  const internalBrokenLinks = await detect404Pages(discoveredInternalUrls, true, 10);
  const externalBrokenLinks = await detect404Pages(discoveredExternalUrls, false, 5);
  const internalRedirects = await detectRedirects(discoveredInternalUrls, true, 10);
  const externalRedirects = await detectRedirects(discoveredExternalUrls, false, 5);
  const brokenLinksList = [...internalBrokenLinks, ...externalBrokenLinks];

  reports.links.brokenCount = brokenLinksList.length;
  reports.links.brokenLinks = [...brokenLinksList, ...internalRedirects, ...externalRedirects];
  if (reports.links.brokenCount > 0) {
    reports.seoScore -= reports.links.brokenCount * 5;
    reports.alerts.push({ level: 'warning', message: `SEO Warning: Detected ${reports.links.brokenCount} broken links (404/500 errors).` });
  }

  // 11. Image Alt and Description Analysis (Real-time check)
  const imgMatches = [...html.matchAll(/<img([^>]*)\/?>/gi)];
  const totalImages = imgMatches.length;
  let missingAlt = 0;
  let emptyAlt = 0;
  let withAlt = 0;
  const missingAltSrcs = [];

  for (let match of imgMatches) {
    const attrs = match[1];
    const srcMatch = attrs.match(/src=["']([^"']*)["']/i) || 
                     attrs.match(/data-src=["']([^"']*)["']/i) ||
                     attrs.match(/srcset=["']([^"']*)["']/i);
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
    const hasAltAttr = attrs.toLowerCase().includes('alt=');
    const src = srcMatch ? srcMatch[1] : '';

    if (!hasAltAttr) {
      missingAlt++;
      if (src) {
        const slicedSrc = src.substring(0, 120);
        missingAltSrcs.push({
          src: slicedSrc,
          suggestedAlt: generateSuggestedAlt(slicedSrc)
        });
      }
    } else if (altMatch && altMatch[1].trim() === '') {
      emptyAlt++;
      if (src) {
        const slicedSrc = src.substring(0, 120);
        missingAltSrcs.push({
          src: slicedSrc,
          suggestedAlt: generateSuggestedAlt(slicedSrc)
        });
      }
    } else {
      withAlt++;
    }
  }

  reports.imageAnalysis = {
    totalImages,
    withAlt,
    missingAlt,
    emptyAlt,
    missingAltSrcs: missingAltSrcs.slice(0, 50),
    status: totalImages === 0 ? "ok" : (missingAlt + emptyAlt) === 0 ? "ok" : "warning",
    message: totalImages === 0 
      ? "No images found on this page."
      : (missingAlt + emptyAlt) === 0
      ? `All ${totalImages} images have valid ALT text attributes.`
      : `${missingAlt + emptyAlt} of ${totalImages} images are missing description ALT attributes.`
  };

  // 12. Duplicate URL & Canonical Collision Detection across discovered site URLs
  try {
    reports.duplicateUrls = detectDuplicateUrls(pagesUrlEvaluations, url);
    if (reports.duplicateUrls?.duplicateClustersCount > 0) {
      reports.seoScore -= Math.min(15, reports.duplicateUrls.duplicateClustersCount * 5);
      reports.alerts.push({
        level: 'warning',
        message: `SEO Warning: Detected ${reports.duplicateUrls.duplicateClustersCount} duplicate URL cluster(s) with ${reports.duplicateUrls.totalDuplicateVariants} redundant variant(s).`
      });
    }
  } catch (err) {
    reports.duplicateUrls = {
      score: 100,
      grade: 'A+',
      rating: 'Clean / Zero Duplicates',
      totalUrlsAudited: (pagesUrlEvaluations || []).length,
      duplicateClustersCount: 0,
      totalDuplicateVariants: 0,
      breakdown: { trailingSlash: 0, casing: 0, protocol: 0, www: 0, queryParams: 0, defaultIndex: 0, titleClones: 0 },
      clusters: [],
      titleDuplicateClusters: [],
      recommendations: []
    };
  }

  // 13. Orphan Page & Internal Link Architecture Detection
  try {
    reports.orphanPages = detectOrphanPages(pagesUrlEvaluations, [], url);
    if (reports.orphanPages?.orphanCount > 0) {
      reports.seoScore -= Math.min(15, reports.orphanPages.orphanCount * 4);
      reports.alerts.push({
        level: 'warning',
        message: `SEO Warning: Detected ${reports.orphanPages.orphanCount} orphan page(s) with 0 inbound internal links.`
      });
    }
  } catch (err) {
    reports.orphanPages = {
      score: 100,
      grade: 'A+',
      rating: 'Optimal Link Architecture',
      totalPages: (pagesUrlEvaluations || []).length,
      orphanCount: 0,
      nearOrphanCount: 0,
      wellConnectedCount: (pagesUrlEvaluations || []).length,
      deepPagesCount: 0,
      avgInboundLinks: '1.0',
      orphanPercentage: 0,
      breakdown: { orphans: 0, nearOrphans: 0, wellConnected: (pagesUrlEvaluations || []).length, deepClicks: 0, sitemapOnly: 0 },
      orphanPages: [],
      nearOrphanPages: [],
      allPages: pagesUrlEvaluations || [],
      recommendations: []
    };
  }

  reports.seoScore = Math.max(10, reports.seoScore);
  return reports;
};

/**
 * Detects duplicate URLs, canonical inconsistencies, and routing collisions across a website.
 * Identifies trailing slash mismatches, casing differences, www vs non-www, HTTP vs HTTPS,
 * query parameter clones, default index extensions (.html, .php, index), and duplicate page titles.
 * 
 * @param {Array<object|string>} pagesList - Array of page objects ({ pageUrl, pageTitle, canonical, ... }) or string URLs.
 * @param {string} rootUrl - Base website root URL.
 * @returns {object} Duplicate URL audit report with health score, clusters, and 301 directives.
 */
const detectDuplicateUrls = (pagesList = [], rootUrl = '') => {
  const normalizedPages = (Array.isArray(pagesList) ? pagesList : []).map(item => {
    if (typeof item === 'string') {
      return { pageUrl: item, pageTitle: '', canonical: '', depth: 0 };
    }
    return {
      pageUrl: item?.pageUrl || item?.url || '',
      pageTitle: item?.pageTitle || item?.title || '',
      canonical: item?.canonical || item?.canonicalUrl || '',
      depth: item?.depth ?? 0
    };
  }).filter(p => p.pageUrl && typeof p.pageUrl === 'string' && p.pageUrl.trim());

  if (rootUrl && !normalizedPages.some(p => p.pageUrl === rootUrl)) {
    normalizedPages.unshift({ pageUrl: rootUrl, pageTitle: '', canonical: '', depth: 0 });
  }

  const clusters = [];
  const clusterMap = new Map();

  const getNormalizedKey = (urlStr) => {
    try {
      let u = urlStr.trim();
      if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
      const parsed = new URL(u);
      
      let hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
      let pathname = parsed.pathname.toLowerCase();
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      pathname = pathname.replace(/\/index\.(html?|php|asp|aspx)$/i, '');
      if (!pathname) pathname = '/';

      const cleanParams = new URLSearchParams();
      for (const [key, val] of parsed.searchParams.entries()) {
        const k = key.toLowerCase();
        if (!/^(utm_|fbclid|gclid|ref|source|mc_cid|mc_eid|sid|phpsessid|jsessionid|_ga|_gl)/.test(k)) {
          cleanParams.append(k, val);
        }
      }
      const search = cleanParams.toString() ? `?${cleanParams.toString()}` : '';

      return `${hostname}${pathname}${search}`;
    } catch (e) {
      return urlStr.toLowerCase().trim();
    }
  };

  normalizedPages.forEach(page => {
    const key = getNormalizedKey(page.pageUrl);
    if (!clusterMap.has(key)) {
      clusterMap.set(key, []);
    }
    clusterMap.get(key).push(page);
  });

  let totalDuplicateVariants = 0;
  let trailingSlashCount = 0;
  let casingMismatchCount = 0;
  let protocolMismatchCount = 0;
  let wwwMismatchCount = 0;
  let paramCloneCount = 0;
  let defaultIndexCount = 0;

  for (const [key, group] of clusterMap.entries()) {
    const uniqueUrls = Array.from(new Set(group.map(g => g.pageUrl.trim())));
    if (uniqueUrls.length > 1) {
      totalDuplicateVariants += (uniqueUrls.length - 1);

      let masterUrl = uniqueUrls[0];
      let bestScore = -1;

      uniqueUrls.forEach(u => {
        let score = 0;
        if (u.startsWith('https://')) score += 10;
        if (!u.includes('www.')) score += 5;
        if (u === u.toLowerCase()) score += 5;
        if (!u.includes('?')) score += 10;
        if (!u.includes('index.html') && !u.includes('index.php')) score += 5;
        if (score > bestScore) {
          bestScore = score;
          masterUrl = u;
        }
      });

      const detectedVectors = [];
      uniqueUrls.forEach(u => {
        if (u === masterUrl) return;

        const uNoSlash = u.replace(/\/$/, '');
        const mNoSlash = masterUrl.replace(/\/$/, '');
        if (uNoSlash === mNoSlash && u !== masterUrl) {
          detectedVectors.push('Trailing Slash Inconsistency');
          trailingSlashCount++;
        }

        if (u.replace(/^https?:\/\//i, '') === masterUrl.replace(/^https?:\/\//i, '') && u.split('://')[0] !== masterUrl.split('://')[0]) {
          detectedVectors.push('HTTP vs HTTPS Protocol Duplication');
          protocolMismatchCount++;
        }

        if (u.replace(/:\/\/www\./i, '://') === masterUrl.replace(/:\/\/www\./i, '://')) {
          detectedVectors.push('www vs Non-www Hostname Duplication');
          wwwMismatchCount++;
        }

        if (u.toLowerCase() === masterUrl.toLowerCase() && u !== masterUrl) {
          detectedVectors.push('URL Slug Casing Discrepancy');
          casingMismatchCount++;
        }

        if (u.split('?')[0] === masterUrl.split('?')[0] && u.includes('?')) {
          detectedVectors.push('Query Parameter Tracking Clone');
          paramCloneCount++;
        }

        if (/index\.(html?|php|asp|aspx)/i.test(u)) {
          detectedVectors.push('Default Directory Index Duplication');
          defaultIndexCount++;
        }
      });

      const uniqueVectors = Array.from(new Set(detectedVectors.length > 0 ? detectedVectors : ['Path / Parameter Collision']));

      clusters.push({
        normalizedKey: key,
        canonicalMaster: masterUrl,
        variants: uniqueUrls.filter(u => u !== masterUrl),
        allUrls: uniqueUrls,
        types: uniqueVectors,
        sampleTitle: group.find(g => g.pageTitle)?.pageTitle || '',
        severity: uniqueVectors.some(v => v.includes('Protocol') || v.includes('www') || v.includes('Casing')) ? 'high' : 'medium',
        impact: 'Dilutes search ranking signals and splits link equity across multiple URL variations.',
        resolution: `Configure 301 permanent redirect pointing all variants to ${masterUrl} and enforce canonical tag: <link rel="canonical" href="${masterUrl}">.`
      });
    }
  }

  // Check for Title Duplication (different URLs having identical titles)
  const titleMap = new Map();
  normalizedPages.forEach(p => {
    const t = (p.pageTitle || '').trim();
    if (t && t.length > 5 && !/^(home|index|welcome|page|default)$/i.test(t)) {
      if (!titleMap.has(t)) titleMap.set(t, []);
      titleMap.get(t).push(p.pageUrl);
    }
  });

  const titleDuplicateClusters = [];
  for (const [titleText, urls] of titleMap.entries()) {
    const unique = Array.from(new Set(urls));
    if (unique.length > 1) {
      titleDuplicateClusters.push({
        title: titleText,
        urls: unique,
        count: unique.length,
        resolution: 'Provide unique descriptive title tags for each distinct page to prevent search keyword cannibalization.'
      });
    }
  }

  let score = 100;
  score -= (trailingSlashCount * 4);
  score -= (casingMismatchCount * 6);
  score -= (protocolMismatchCount * 10);
  score -= (wwwMismatchCount * 8);
  score -= (paramCloneCount * 3);
  score -= (defaultIndexCount * 5);
  score -= (titleDuplicateClusters.length * 5);
  score = Math.max(15, Math.min(100, score));

  let grade = 'A+';
  let rating = 'Clean / Zero Duplicates';
  if (score >= 95) { grade = 'A+'; rating = 'Exceptional (Clean)'; }
  else if (score >= 85) { grade = 'A'; rating = 'Optimal'; }
  else if (score >= 70) { grade = 'B'; rating = 'Minor Duplication Risk'; }
  else if (score >= 50) { grade = 'C'; rating = 'Moderate Duplication Risk'; }
  else { grade = 'F'; rating = 'Severe Duplication Penalty'; }

  return {
    score,
    grade,
    rating,
    totalUrlsAudited: normalizedPages.length,
    duplicateClustersCount: clusters.length,
    totalDuplicateVariants,
    titleDuplicateCount: titleDuplicateClusters.length,
    breakdown: {
      trailingSlash: trailingSlashCount,
      casing: casingMismatchCount,
      protocol: protocolMismatchCount,
      www: wwwMismatchCount,
      queryParams: paramCloneCount,
      defaultIndex: defaultIndexCount,
      titleClones: titleDuplicateClusters.length
    },
    clusters,
    titleDuplicateClusters,
    recommendations: clusters.length === 0 && titleDuplicateClusters.length === 0
      ? ['No duplicate URLs or canonical collision vectors detected across audited pages.']
      : [
          ...(trailingSlashCount > 0 ? [`Enforce standard trailing slash routing rules via 301 redirects (${trailingSlashCount} variant${trailingSlashCount > 1 ? 's' : ''} detected).`] : []),
          ...(protocolMismatchCount > 0 ? ['Enforce global HTTP to HTTPS 301 redirection.'] : []),
          ...(wwwMismatchCount > 0 ? ['Configure domain canonicalization to redirect www to non-www (or vice versa).'] : []),
          ...(casingMismatchCount > 0 ? ['Normalize all URL paths to lowercase to avoid case-sensitive duplicate indexing.'] : []),
          ...(paramCloneCount > 0 ? ['Use self-referencing canonical tags on pages with marketing/tracking query parameters.'] : []),
          ...(titleDuplicateClusters.length > 0 ? [`Resolve ${titleDuplicateClusters.length} duplicate page title clusters to prevent search keyword cannibalization.`] : [])
        ]
  };
};

/**
 * Detects orphan pages and evaluates internal link architecture across a website.
 * Identifies pages with 0 inbound internal links (true orphans), 1 inbound link (near-orphans),
 * sitemap-only unlinked URLs, and deep crawl hierarchy (>3 clicks).
 * 
 * @param {Array<object|string>} pagesList - Discovered/crawled page records with inbound link metadata.
 * @param {Array<string>} sitemapUrls - Set/Array of sitemap URLs.
 * @param {string} rootUrl - Base website root URL.
 * @returns {object} Comprehensive Orphan Pages and Internal Link Architecture Audit Report.
 */
const detectOrphanPages = (pagesList = [], sitemapUrls = [], rootUrl = '') => {
  const normRoot = rootUrl ? rootUrl.replace(/\/$/, '').toLowerCase() : '';
  const sitemapSet = new Set((Array.isArray(sitemapUrls) ? sitemapUrls : []).map(u => (typeof u === 'string' ? u.trim().replace(/\/$/, '').toLowerCase() : '')));

  const normalizedPages = (Array.isArray(pagesList) ? pagesList : []).map(item => {
    if (typeof item === 'string') {
      const isHome = item.replace(/\/$/, '').toLowerCase() === normRoot;
      return {
        pageUrl: item,
        pageLabel: item.replace(/^https?:\/\/[^/]+/, '') || '/',
        pageTitle: '',
        inboundLinksCount: isHome ? 1 : 0,
        inboundSources: isHome ? ['(Root Entrypoint)'] : [],
        clickDepth: isHome ? 0 : 1,
        isInSitemap: sitemapSet.has(item.replace(/\/$/, '').toLowerCase())
      };
    }
    const pUrl = item?.pageUrl || item?.url || '';
    const isHome = pUrl.replace(/\/$/, '').toLowerCase() === normRoot;
    const inCount = typeof item?.inboundLinksCount === 'number' 
      ? item.inboundLinksCount 
      : (Array.isArray(item?.inboundSources) ? item.inboundSources.length : (isHome ? 1 : 0));

    return {
      pageUrl: pUrl,
      pageLabel: item?.pageLabel || pUrl.replace(/^https?:\/\/[^/]+/, '') || '/',
      pageTitle: item?.pageTitle || item?.title || '',
      inboundLinksCount: inCount,
      inboundSources: Array.isArray(item?.inboundSources) ? item.inboundSources : [],
      clickDepth: typeof item?.clickDepth === 'number' ? item.clickDepth : (typeof item?.depth === 'number' ? item.depth : (isHome ? 0 : 1)),
      isInSitemap: sitemapSet.has(pUrl.replace(/\/$/, '').toLowerCase()) || !!item?.isInSitemap
    };
  }).filter(p => p.pageUrl && typeof p.pageUrl === 'string' && p.pageUrl.trim());

  // Include sitemap URLs not present in crawled pages as Sitemap-Only Orphans
  sitemapSet.forEach(sUrl => {
    if (sUrl && !normalizedPages.some(p => p.pageUrl.replace(/\/$/, '').toLowerCase() === sUrl)) {
      normalizedPages.push({
        pageUrl: sUrl,
        pageLabel: sUrl.replace(/^https?:\/\/[^/]+/, '') || '/',
        pageTitle: '(Sitemap XML Entry)',
        inboundLinksCount: 0,
        inboundSources: [],
        clickDepth: 1,
        isInSitemap: true,
        isSitemapOnly: true
      });
    }
  });

  const orphanPages = [];
  const nearOrphanPages = [];
  const wellConnectedPages = [];
  const deepPages = [];

  let totalInboundLinks = 0;

  normalizedPages.forEach(p => {
    const isRoot = normRoot && p.pageUrl.replace(/\/$/, '').toLowerCase() === normRoot;
    const inCount = isRoot ? Math.max(1, p.inboundLinksCount) : p.inboundLinksCount;
    totalInboundLinks += inCount;

    if (!isRoot && inCount === 0) {
      orphanPages.push({
        ...p,
        status: 'orphan',
        severity: 'critical',
        risk: 'Zero internal link equity. Search engine crawlers cannot discover or rank this page organically.',
        remediation: `Add contextual anchor links from relevant parent pages (e.g. main navigation, footer, or category hubs) pointing to ${p.pageLabel || p.pageUrl}.`
      });
    } else if (!isRoot && inCount === 1) {
      nearOrphanPages.push({
        ...p,
        status: 'near-orphan',
        severity: 'warning',
        risk: 'Vulnerable link equity (single inbound link). At high risk of becoming an orphan if the linking page is altered.',
        remediation: `Introduce 2-3 additional internal links from related topic clusters or breadcrumb navigation.`
      });
    } else {
      wellConnectedPages.push({
        ...p,
        status: 'healthy',
        severity: 'ok'
      });
    }

    if (p.clickDepth > 2) {
      deepPages.push(p);
    }
  });

  const totalPages = normalizedPages.length;
  const orphanRatio = totalPages > 0 ? (orphanPages.length / totalPages) : 0;

  let score = 100;
  score -= (orphanPages.length * 8);
  score -= (nearOrphanPages.length * 3);
  score -= (deepPages.length * 2);
  score = Math.max(15, Math.min(100, score));

  let grade = 'A+';
  let rating = 'Optimal Link Architecture';
  if (score >= 95) { grade = 'A+'; rating = 'Exceptional (0 Orphans)'; }
  else if (score >= 85) { grade = 'A'; rating = 'Healthy Link Structure'; }
  else if (score >= 70) { grade = 'B'; rating = 'Minor Link Equity Gaps'; }
  else if (score >= 50) { grade = 'C'; rating = 'High Orphan Risk'; }
  else { grade = 'F'; rating = 'Severe Internal Link Fragmentation'; }

  const avgInboundLinks = totalPages > 0 ? (totalInboundLinks / totalPages).toFixed(1) : '0.0';

  return {
    score,
    grade,
    rating,
    totalPages,
    orphanCount: orphanPages.length,
    nearOrphanCount: nearOrphanPages.length,
    wellConnectedCount: wellConnectedPages.length,
    deepPagesCount: deepPages.length,
    avgInboundLinks,
    orphanPercentage: Math.round(orphanRatio * 100),
    breakdown: {
      orphans: orphanPages.length,
      nearOrphans: nearOrphanPages.length,
      wellConnected: wellConnectedPages.length,
      deepClicks: deepPages.length,
      sitemapOnly: orphanPages.filter(p => p.isSitemapOnly).length
    },
    orphanPages,
    nearOrphanPages,
    allPages: normalizedPages,
    recommendations: orphanPages.length === 0 && nearOrphanPages.length === 0
      ? ['All discovered pages have healthy internal link connectivity and crawl pathways.']
      : [
          ...(orphanPages.length > 0 ? [`Resolve ${orphanPages.length} true orphan page(s) by integrating links into site navigation, footer, or body copy.`] : []),
          ...(nearOrphanPages.length > 0 ? [`Strengthen ${nearOrphanPages.length} near-orphan page(s) with additional supporting internal links.`] : []),
          ...(deepPages.length > 0 ? [`Flatten crawl hierarchy: ${deepPages.length} page(s) require >2 clicks from the homepage.`] : [])
        ]
  };
};

module.exports = { analyzeSeo, evaluateUrlQuality, detectDuplicateUrls, detectOrphanPages };
