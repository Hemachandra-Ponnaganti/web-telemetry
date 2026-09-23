import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../apiConfig';
import { 
  FileText, CheckCircle2, XCircle, AlertTriangle, Layers, 
  Search, Link as LinkIcon, Image, Globe, Sparkles,
  ShieldCheck, ShieldAlert, FolderTree, Hash, ArrowRight,
  ExternalLink, Compass, Check, Copy, Sliders, CheckCircle,
  RefreshCw, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  BarChart3, PieChart, Info, HelpCircle, Download, CheckCheck,
  ListChecks, CheckSquare, Layers2, GitFork, Split, Files,
  ArrowRightLeft, Shield, AlertOctagon, CopyCheck,
  Unlink, Network, Waypoints, CornerDownRight, Share2, Code2
} from 'lucide-react';

/**
 * Client-side Technical SEO URL Quality Evaluation Engine.
 * Evaluates protocol security, character length, directory hierarchy,
 * slug cleanliness, casing, word separators, parameter bloat, safe encodings, and legacy extensions.
 */
export const evaluateUrlQualityClient = (urlStr) => {
  const defaultMetrics = {
    protocol: { name: 'Protocol Security', score: 20, maxScore: 20, status: 'ok', value: 'HTTPS (Encrypted)', message: 'Secured with HTTPS protocol.' },
    length: { name: 'URL Length', score: 15, maxScore: 15, status: 'ok', value: '0 chars', message: 'Optimal URL length.' },
    depth: { name: 'Directory Depth', score: 15, maxScore: 15, status: 'ok', value: '0 levels', message: 'Optimal directory crawl depth.' },
    casingSeparators: { name: 'Casing & Word Separators', score: 15, maxScore: 15, status: 'ok', value: 'Lowercase & Hyphens', message: 'Clean lowercase syntax.' },
    queryParams: { name: 'Query Parameter Bloat', score: 15, maxScore: 15, status: 'ok', value: '0 params (Clean/Static)', message: 'Clean static URL with no parameter bloat.' },
    characterSafety: { name: 'Character Safety & Encoding', score: 10, maxScore: 10, status: 'ok', value: 'Clean ASCII', message: 'Safe ASCII characters.' },
    readability: { name: 'Slug Architecture & Semantics', score: 10, maxScore: 10, status: 'ok', value: 'Clean Semantic Slug', message: 'Modern extension-free RESTful slug architecture.' }
  };

  if (!urlStr || typeof urlStr !== 'string' || !urlStr.trim()) {
    return {
      score: 50,
      grade: 'C',
      rating: 'Fair',
      url: '',
      parsed: { protocol: 'https', hostname: 'example.com', pathname: '/', paramCount: 0, depth: 0, length: 0 },
      metrics: defaultMetrics,
      recommendations: ['Provide a valid URL to analyze.'],
      breadcrumbSegments: ['example.com'],
      serpPreview: { domain: 'example.com', breadcrumb: 'example.com', displayUrl: '' }
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
      parsed: { protocol: 'https', hostname: 'invalid-url', pathname: '/', paramCount: 0, depth: 0, length: (urlStr || '').length },
      metrics: defaultMetrics,
      recommendations: ['Invalid URL format. Ensure valid domain and syntax.'],
      breadcrumbSegments: ['invalid-url'],
      serpPreview: { domain: 'invalid-url', breadcrumb: 'invalid-url', displayUrl: urlStr }
    };
  }

  const protocol = (parsed.protocol || 'https:').toLowerCase();
  const hostname = (parsed.hostname || 'example.com').toLowerCase();
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
      message: 'Secured with HTTPS protocol. Meets modern search ranking security standards.'
    };
  } else {
    metrics.protocol = {
      name: 'Protocol Security',
      score: 0,
      maxScore: 20,
      status: 'critical',
      value: 'HTTP (Insecure)',
      message: 'Insecure HTTP protocol. Search engines prioritize HTTPS and flag HTTP URLs.'
    };
    recommendations.push('Migrate URL to HTTPS and configure permanent 301 redirects from HTTP.');
  }

  // 2. URL Length (Weight: 15 pts)
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
      message: `Excessive URL length (${urlLength} chars). Long URLs risk truncation in search results.`
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
      message: 'Standard directory depth (3 levels). Acceptable for deep categories.'
    };
  } else {
    totalScore += 4;
    metrics.depth = {
      name: 'Directory Depth',
      score: 4,
      maxScore: 15,
      status: 'warning',
      value: `${depth} levels (Deep)`,
      message: `Deeply nested path structure (${depth} levels). Flatter URL architectures rank better.`
    };
    recommendations.push(`Reduce directory nesting depth (currently ${depth} levels). Aim for 2 to 3 path segments.`);
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
    recommendations.push('Use hyphens (-) instead of underscores (_) as word separators per Google guidelines.');
  }
  if (hasSpacesOrEncoded) {
    casingScore -= 6;
    casingIssues.push('Spaces / %20 encoding');
    recommendations.push('Remove whitespace / %20 encodings from URLs and replace with clean hyphens (-).');
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
  let paramCount = 0;
  try {
    paramCount = Array.from(parsed.searchParams.keys()).length;
  } catch (e) {}
  const hasSessionId = /sessionid|phpsessid|jsessionid|sid|aspsessionid/i.test(search);

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

  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

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

  const breadcrumbSegments = [hostname, ...segments.map(s => s.replace(/[-_]/g, ' '))];

  return {
    score: finalScore,
    grade,
    rating,
    url: fullUrl,
    parsed: {
      protocol: (parsed.protocol || 'https').replace(':', ''),
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
 * Client-Side Duplicate URL & Canonical Conflict Detection Engine.
 * Normalizes URLs, identifies duplicate clusters, trailing slash variants,
 * uppercase/lowercase discrepancies, HTTP/HTTPS, www/non-www, and query parameter bloat.
 */
export const detectDuplicateUrlsClient = (pagesList = [], rootUrl = '') => {
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
        impact: 'Splits link equity and causes search engine canonical confusion across multiple URL duplicates.',
        resolution: `301 redirect all duplicate variants to ${masterUrl} and enforce self-referencing canonical tag.`
      });
    }
  }

  // Check for duplicate titles
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
 * Client-Side Orphan Page & Internal Link Topology Detection Engine.
 * Analyzes inbound link graph, distinguishes true orphans (0 inbound links),
 * near-orphans (1 inbound link), deep hierarchy pages (>2 clicks), and sitemap-only orphan pages.
 */
export const detectOrphanPagesClient = (pagesList = [], sitemapUrls = [], rootUrl = '') => {
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

export default function SeoDashboard({ seoData, crawlData = null, onNavigateToAlt }) {
  const [altSearch, setAltSearch] = useState('');
  const [customTestUrl, setCustomTestUrl] = useState('');
  const [customEvaluated, setCustomEvaluated] = useState(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Safely parse incoming seoData
  const safeSeoData = useMemo(() => {
    if (!seoData) return null;
    if (typeof seoData === 'string') {
      try {
        return JSON.parse(seoData);
      } catch (e) {
        return null;
      }
    }
    return seoData;
  }, [seoData]);

  if (!safeSeoData) {
    return (
      <div className="glass-card p-10 text-center text-slate-500 max-w-2xl mx-auto my-6 animate-fade-in-up">
        <Globe className="h-10 w-10 text-slate-600 mx-auto mb-4 animate-bounce" />
        <h4 className="font-extrabold text-slate-400">No SEO Audit Metrics Available</h4>
        <p className="text-xs text-slate-500 mt-2">Run a scan above to see real-time Technical SEO audits, tags, and link integrity indices.</p>
      </div>
    );
  }

  const title = safeSeoData.title || { text: '', status: 'warning', message: 'No title tag detected.' };
  const metaDescription = safeSeoData.metaDescription || { text: '', status: 'warning', message: 'No description tag detected.' };
  const keywordsMeta = safeSeoData.keywordsMeta || { text: 'No keywords found', status: 'warning', message: 'No meta keywords tag detected.' };
  const headings = {
    h1: Array.isArray(safeSeoData.headings?.h1) ? safeSeoData.headings.h1 : [],
    h2: Array.isArray(safeSeoData.headings?.h2) ? safeSeoData.headings.h2 : [],
    h3: Array.isArray(safeSeoData.headings?.h3) ? safeSeoData.headings.h3 : [],
    status: safeSeoData.headings?.status || 'ok'
  };
  const canonical = safeSeoData.canonical || { text: '', status: 'ok', message: '' };
  const robotsTxt = safeSeoData.robotsTxt || { exists: false, status: 'warning', message: 'Robots.txt check skipped.' };
  const sitemap = safeSeoData.sitemap || { exists: false, status: 'warning', message: 'Sitemap check skipped.' };
  const schemaMarkup = safeSeoData.schemaMarkup || { present: false, valid: false, types: [], items: [], message: 'No Schema markup detected.' };
  const openGraph = safeSeoData.openGraph || { ogTitle: '', ogImage: '', status: 'warning' };
  const twitterCard = safeSeoData.twitterCard || { twitterCard: '', status: 'warning' };
  const indexability = safeSeoData.indexability || { isIndexable: true, status: 'ok', message: 'Site is indexable.' };
  const mobileFriendliness = safeSeoData.mobileFriendliness || { viewportConfigured: true, touchTargetIssues: 0, status: 'ok' };
  const keywordAnalysis = {
    topKeywords: Array.isArray(safeSeoData.keywordAnalysis?.topKeywords) ? safeSeoData.keywordAnalysis.topKeywords : [],
    status: safeSeoData.keywordAnalysis?.status || 'ok'
  };
  const links = {
    internalCount: safeSeoData.links?.internalCount || 0,
    externalCount: safeSeoData.links?.externalCount || 0,
    brokenCount: safeSeoData.links?.brokenCount || 0,
    brokenLinks: Array.isArray(safeSeoData.links?.brokenLinks) ? safeSeoData.links.brokenLinks : [],
    status: safeSeoData.links?.status || 'ok'
  };
  const imageAnalysis = {
    totalImages: safeSeoData.imageAnalysis?.totalImages || 0,
    withAlt: safeSeoData.imageAnalysis?.withAlt || 0,
    missingAlt: safeSeoData.imageAnalysis?.missingAlt || 0,
    emptyAlt: safeSeoData.imageAnalysis?.emptyAlt || 0,
    missingAltSrcs: Array.isArray(safeSeoData.imageAnalysis?.missingAltSrcs) ? safeSeoData.imageAnalysis.missingAltSrcs : [],
    status: safeSeoData.imageAnalysis?.status || 'ok',
    message: safeSeoData.imageAnalysis?.message || ''
  };
  const alerts = Array.isArray(safeSeoData.alerts) ? safeSeoData.alerts : [];
  const seoScore = typeof safeSeoData.seoScore === 'number' ? safeSeoData.seoScore : 100;
  const initialUrlQuality = safeSeoData.urlQuality || null;

  // Fallback / Active URL Quality computation
  const activeTargetUrl = safeSeoData.url || (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
  const baseEvaluatedQuality = useMemo(() => {
    return initialUrlQuality || evaluateUrlQualityClient(activeTargetUrl);
  }, [initialUrlQuality, activeTargetUrl]);

  const activeUrlQuality = customEvaluated || baseEvaluatedQuality;

  const handleTestCustomUrl = (e) => {
    e?.preventDefault();
    if (!customTestUrl.trim()) {
      setCustomEvaluated(null);
      return;
    }
    const result = evaluateUrlQualityClient(customTestUrl.trim());
    setCustomEvaluated(result);
  };

  const handleResetUrlTest = () => {
    setCustomTestUrl('');
    setCustomEvaluated(null);
  };

  const handleCopySerpSnippet = () => {
    if (activeUrlQuality?.url) {
      navigator.clipboard?.writeText(activeUrlQuality.url);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getGradientId = (score) => {
    if (score >= 90) return 'url(#seoEmeraldGrad)';
    if (score >= 75) return 'url(#seoAmberGrad)';
    return 'url(#seoRoseGrad)';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (grade === 'B') return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    if (grade === 'C') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (grade === 'D') return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  const filteredAltSrcs = (imageAnalysis.missingAltSrcs || []).filter(item => {
    const srcStr = typeof item === 'string' ? item : (item?.src || '');
    return srcStr.toLowerCase().includes(altSearch.toLowerCase());
  });

  // ── Site-Wide Multi-Page URL Quality Audit Engine State ──────────────────────
  const [siteUrlFilter, setSiteUrlFilter] = useState('all'); // 'all', 'A+', 'A', 'B', 'C', 'F', 'issues', 'deep', 'long', 'params'
  const [siteUrlSearch, setSiteUrlSearch] = useState('');
  const [siteUrlSort, setSiteUrlSort] = useState('score-asc'); // 'score-asc', 'score-desc', 'length-desc', 'depth-desc', 'url-asc'
  const [isAuditingAllPages, setIsAuditingAllPages] = useState(false);
  const [auditSuccessMessage, setAuditSuccessMessage] = useState('');
  const [expandedUrlRow, setExpandedUrlRow] = useState(null);
  const [liveSiteWideData, setLiveSiteWideData] = useState(null);
  const [copiedUrlIndex, setCopiedUrlIndex] = useState(null);

  // Unified discovered pages collection from all data vectors
  const allDiscoveredPages = useMemo(() => {
    const pageMap = new Map();

    // 1. Priority: liveSiteWideData from on-demand crawl
    if (Array.isArray(liveSiteWideData?.pages)) {
      liveSiteWideData.pages.forEach(p => {
        if (p?.pageUrl && !pageMap.has(p.pageUrl)) {
          pageMap.set(p.pageUrl, {
            pageUrl: p.pageUrl,
            pageLabel: p.pageLabel || p.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/',
            pageTitle: p.pageTitle || '',
            urlQuality: p.urlQuality || evaluateUrlQualityClient(p.pageUrl)
          });
        }
      });
    }

    // 2. From crawlData (BFS crawl perPage or siteWideUrlQuality)
    if (Array.isArray(crawlData?.siteWideUrlQuality?.pages)) {
      crawlData.siteWideUrlQuality.pages.forEach(p => {
        if (p?.pageUrl && !pageMap.has(p.pageUrl)) {
          pageMap.set(p.pageUrl, {
            pageUrl: p.pageUrl,
            pageLabel: p.pageLabel || p.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/',
            pageTitle: p.pageTitle || '',
            urlQuality: p.urlQuality || evaluateUrlQualityClient(p.pageUrl)
          });
        }
      });
    }

    if (Array.isArray(crawlData?.siteWideImages?.perPage)) {
      crawlData.siteWideImages.perPage.forEach(p => {
        if (p?.pageUrl && !pageMap.has(p.pageUrl)) {
          pageMap.set(p.pageUrl, {
            pageUrl: p.pageUrl,
            pageLabel: p.pageLabel || p.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/',
            pageTitle: p.pageTitle || '',
            urlQuality: p.urlQuality || evaluateUrlQualityClient(p.pageUrl)
          });
        }
      });
    }

    // 3. From safeSeoData (siteWideUrlQuality or discovered internal links)
    if (Array.isArray(safeSeoData?.siteWideUrlQuality?.pages)) {
      safeSeoData.siteWideUrlQuality.pages.forEach(p => {
        if (p?.pageUrl && !pageMap.has(p.pageUrl)) {
          pageMap.set(p.pageUrl, {
            pageUrl: p.pageUrl,
            pageLabel: p.pageLabel || p.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/',
            pageTitle: p.pageTitle || '',
            urlQuality: p.urlQuality || evaluateUrlQualityClient(p.pageUrl)
          });
        }
      });
    }

    // 4. Ensure root activeTargetUrl is included
    if (activeTargetUrl && !pageMap.has(activeTargetUrl)) {
      pageMap.set(activeTargetUrl, {
        pageUrl: activeTargetUrl,
        pageLabel: '/',
        pageTitle: title?.text || '',
        urlQuality: baseEvaluatedQuality
      });
    }

    return Array.from(pageMap.values());
  }, [liveSiteWideData, crawlData, safeSeoData, activeTargetUrl, baseEvaluatedQuality, title]);

  // Aggregate Site-Wide Statistics across all discovered pages
  const siteWideSummary = useMemo(() => {
    const totalUrls = allDiscoveredPages.length;
    if (totalUrls === 0) {
      return {
        totalUrls: 0,
        avgScore: 100,
        avgDepth: 0,
        avgLength: 0,
        grades: { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 },
        issues: { insecure: 0, length: 0, depth: 0, casing: 0, query: 0, unsafe: 0, extensions: 0 }
      };
    }

    let scoreSum = 0;
    let depthSum = 0;
    let lengthSum = 0;
    const grades = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 };
    const issues = { insecure: 0, length: 0, depth: 0, casing: 0, query: 0, unsafe: 0, extensions: 0 };

    allDiscoveredPages.forEach(p => {
      const q = p.urlQuality || evaluateUrlQualityClient(p.pageUrl);
      const s = q?.score ?? 100;
      const g = q?.grade ?? 'A';
      const depth = q?.parsed?.depth ?? 0;
      const len = q?.parsed?.length ?? (p.pageUrl || '').length;

      scoreSum += s;
      depthSum += depth;
      lengthSum += len;

      if (grades[g] !== undefined) grades[g]++;
      else if (g === 'D') grades['C']++;
      else grades['F']++;

      if (q?.metrics?.protocol?.status === 'critical') issues.insecure++;
      if (len > 75) issues.length++;
      if (depth > 2) issues.depth++;
      if (q?.metrics?.casingSeparators?.status !== 'ok') issues.casing++;
      if ((q?.parsed?.paramCount || 0) > 0) issues.query++;
      if (q?.metrics?.characterSafety?.status !== 'ok') issues.unsafe++;
      if (q?.metrics?.readability?.status !== 'ok') issues.extensions++;
    });

    return {
      totalUrls,
      avgScore: Math.round(scoreSum / totalUrls),
      avgDepth: (depthSum / totalUrls).toFixed(1),
      avgLength: Math.round(lengthSum / totalUrls),
      grades,
      issues
    };
  }, [allDiscoveredPages]);

  // Filtered & Sorted Pages
  const filteredAndSortedPages = useMemo(() => {
    return allDiscoveredPages
      .filter(p => {
        const q = p.urlQuality || evaluateUrlQualityClient(p.pageUrl);
        const searchLow = siteUrlSearch.trim().toLowerCase();
        if (searchLow) {
          const matchUrl = (p.pageUrl || '').toLowerCase().includes(searchLow);
          const matchLabel = (p.pageLabel || '').toLowerCase().includes(searchLow);
          const matchTitle = (p.pageTitle || '').toLowerCase().includes(searchLow);
          if (!matchUrl && !matchLabel && !matchTitle) return false;
        }

        if (siteUrlFilter === 'all') return true;
        if (siteUrlFilter === 'A+' || siteUrlFilter === 'A' || siteUrlFilter === 'B' || siteUrlFilter === 'C' || siteUrlFilter === 'F') {
          return q?.grade === siteUrlFilter;
        }
        if (siteUrlFilter === 'issues') {
          return (q?.score || 100) < 90 || (q?.recommendations || []).length > 0;
        }
        if (siteUrlFilter === 'deep') {
          return (q?.parsed?.depth || 0) > 2;
        }
        if (siteUrlFilter === 'long') {
          return (q?.parsed?.length || (p.pageUrl || '').length) > 70;
        }
        if (siteUrlFilter === 'params') {
          return (q?.parsed?.paramCount || 0) > 0;
        }
        return true;
      })
      .sort((a, b) => {
        const qA = a.urlQuality || evaluateUrlQualityClient(a.pageUrl);
        const qB = b.urlQuality || evaluateUrlQualityClient(b.pageUrl);
        if (siteUrlSort === 'score-asc') return (qA?.score || 0) - (qB?.score || 0);
        if (siteUrlSort === 'score-desc') return (qB?.score || 0) - (qA?.score || 0);
        if (siteUrlSort === 'length-desc') return (qB?.parsed?.length || 0) - (qA?.parsed?.length || 0);
        if (siteUrlSort === 'depth-desc') return (qB?.parsed?.depth || 0) - (qA?.parsed?.depth || 0);
        if (siteUrlSort === 'url-asc') return (a.pageUrl || '').localeCompare(b.pageUrl || '');
        return 0;
      });
  }, [allDiscoveredPages, siteUrlSearch, siteUrlFilter, siteUrlSort]);

  // Live Deep Crawl Trigger
  const handleAuditAllSitePages = async () => {
    if (isAuditingAllPages) return;
    setIsAuditingAllPages(true);
    setAuditSuccessMessage('');
    try {
      const resp = await axios.post(`${API_BASE}/api/seo/site-url-audit`, {
        url: activeTargetUrl
      });
      if (resp.data?.success && resp.data?.siteWideUrlQuality) {
        setLiveSiteWideData(resp.data.siteWideUrlQuality);
        setAuditSuccessMessage(`Crawled & scored ${resp.data.siteWideUrlQuality.totalUrls} site pages successfully!`);
        setTimeout(() => setAuditSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to trigger site-wide URL audit:', err);
      // Fallback: client-side deep evaluation on all available links
      setAuditSuccessMessage(`Evaluated ${allDiscoveredPages.length} discovered site URLs.`);
      setTimeout(() => setAuditSuccessMessage(''), 4000);
    } finally {
      setIsAuditingAllPages(false);
    }
  };

  const handleCopyPageUrl = (urlToCopy, idx) => {
    if (urlToCopy) {
      navigator.clipboard?.writeText(urlToCopy);
      setCopiedUrlIndex(idx);
      setTimeout(() => setCopiedUrlIndex(null), 1800);
    }
  };

  const handleExportCsv = () => {
    if (!allDiscoveredPages.length) return;
    const header = ['Page URL', 'Path Slug', 'Title', 'Score', 'Grade', 'Rating', 'Depth', 'Length', 'Protocol', 'Issues'];
    const rows = allDiscoveredPages.map(p => {
      const q = p.urlQuality || evaluateUrlQualityClient(p.pageUrl);
      return [
        `"${p.pageUrl}"`,
        `"${p.pageLabel || ''}"`,
        `"${(p.pageTitle || '').replace(/"/g, '""')}"`,
        q.score,
        q.grade,
        q.rating,
        q.parsed?.depth ?? 0,
        q.parsed?.length ?? p.pageUrl.length,
        q.parsed?.protocol ?? 'https',
        `"${(q.recommendations || []).join('; ').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    let hostName = 'site';
    try { hostName = new URL(activeTargetUrl).hostname; } catch (e) {}
    link.setAttribute('download', `url-quality-audit-${hostName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Duplicate URL & Canonicalization Detection State ──────────────────────
  const [duplicateFilter, setDuplicateFilter] = useState('all'); // 'all', 'trailing', 'casing', 'protocol', 'www', 'queryParams', 'titleClones'
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const [customDupInput, setCustomDupInput] = useState('');
  const [customDupResult, setCustomDupResult] = useState(null);
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [copiedRedirectIdx, setCopiedRedirectIdx] = useState(null);
  const [dupSuccessMessage, setDupSuccessMessage] = useState('');
  const [expandedDupClusterIdx, setExpandedDupClusterIdx] = useState(null);

  // Duplicate URL Report Memoization
  const duplicateAuditReport = useMemo(() => {
    if (customDupResult) return customDupResult;
    if (crawlData?.duplicateUrls && crawlData.duplicateUrls.totalUrlsAudited > 0) {
      return crawlData.duplicateUrls;
    }
    if (safeSeoData?.duplicateUrls && safeSeoData.duplicateUrls.totalUrlsAudited > 0) {
      return safeSeoData.duplicateUrls;
    }
    return detectDuplicateUrlsClient(allDiscoveredPages, activeTargetUrl);
  }, [customDupResult, crawlData, safeSeoData, allDiscoveredPages, activeTargetUrl]);

  // Filtered Duplicate Clusters
  const filteredDuplicateClusters = useMemo(() => {
    const rawClusters = duplicateAuditReport?.clusters || [];
    return rawClusters.filter(c => {
      const searchLow = duplicateSearch.trim().toLowerCase();
      if (searchLow) {
        const matchKey = (c.normalizedKey || '').toLowerCase().includes(searchLow);
        const matchMaster = (c.canonicalMaster || '').toLowerCase().includes(searchLow);
        const matchVariants = (c.variants || []).some(v => v.toLowerCase().includes(searchLow));
        if (!matchKey && !matchMaster && !matchVariants) return false;
      }

      if (duplicateFilter === 'all') return true;
      if (duplicateFilter === 'trailing') return (c.types || []).some(t => t.includes('Trailing'));
      if (duplicateFilter === 'casing') return (c.types || []).some(t => t.includes('Casing'));
      if (duplicateFilter === 'protocol') return (c.types || []).some(t => t.includes('Protocol'));
      if (duplicateFilter === 'www') return (c.types || []).some(t => t.includes('www'));
      if (duplicateFilter === 'queryParams') return (c.types || []).some(t => t.includes('Query Parameter'));
      if (duplicateFilter === 'index') return (c.types || []).some(t => t.includes('Directory Index'));
      return true;
    });
  }, [duplicateAuditReport, duplicateSearch, duplicateFilter]);

  // Handle Custom Duplicate URL Simulation
  const handleSimulateCustomDuplicates = (e) => {
    e?.preventDefault();
    if (!customDupInput.trim()) {
      setCustomDupResult(null);
      return;
    }
    const urls = customDupInput
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      setCustomDupResult(null);
      return;
    }

    const res = detectDuplicateUrlsClient(urls, activeTargetUrl);
    setCustomDupResult(res);
  };

  const handleResetDupSimulation = () => {
    setCustomDupInput('');
    setCustomDupResult(null);
  };

  // Trigger Live Deep Duplicate Crawl
  const handleScanForDuplicates = async () => {
    if (isScanningDuplicates) return;
    setIsScanningDuplicates(true);
    setDupSuccessMessage('');
    try {
      const resp = await axios.post(`${API_BASE}/api/seo/duplicate-urls`, {
        url: activeTargetUrl,
        pages: allDiscoveredPages
      });
      if (resp.data?.success && resp.data?.duplicateUrls) {
        setCustomDupResult(resp.data.duplicateUrls);
        setDupSuccessMessage(`Audit completed: analyzed ${resp.data.duplicateUrls.totalUrlsAudited} URLs, found ${resp.data.duplicateUrls.duplicateClustersCount} duplicate cluster(s).`);
        setTimeout(() => setDupSuccessMessage(''), 4000);
      }
    } catch (err) {
      const fallback = detectDuplicateUrlsClient(allDiscoveredPages, activeTargetUrl);
      setCustomDupResult(fallback);
      setDupSuccessMessage(`Evaluated ${allDiscoveredPages.length} discovered site URLs.`);
      setTimeout(() => setDupSuccessMessage(''), 4000);
    } finally {
      setIsScanningDuplicates(false);
    }
  };

  const handleCopyRedirectSnippet = (masterUrl, variants, idx) => {
    const nginxRules = (variants || []).map(v => {
      try {
        const p = new URL(v).pathname;
        return `rewrite ^${p}$ ${masterUrl} permanent;`;
      } catch (e) {
        return `rewrite ^${v}$ ${masterUrl} permanent;`;
      }
    }).join('\n');

    const canonicalTag = `<link rel="canonical" href="${masterUrl}" />`;
    const snippet = `<!-- HTML Canonical Tag -->\n${canonicalTag}\n\n# Nginx 301 Permanent Redirects:\n${nginxRules}`;

    navigator.clipboard?.writeText(snippet);
    setCopiedRedirectIdx(idx);
    setTimeout(() => setCopiedRedirectIdx(null), 2000);
  };

  const handleExportDuplicateCsv = () => {
    if (!duplicateAuditReport?.clusters?.length) return;
    const header = ['Cluster Key', 'Canonical Master URL', 'Duplicate Variants', 'Detected Vectors', 'Severity', '301 Resolution'];
    const rows = duplicateAuditReport.clusters.map(c => [
      `"${c.normalizedKey}"`,
      `"${c.canonicalMaster}"`,
      `"${(c.variants || []).join(' | ').replace(/"/g, '""')}"`,
      `"${(c.types || []).join('; ').replace(/"/g, '""')}"`,
      `"${c.severity}"`,
      `"${c.resolution.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    let hostName = 'site';
    try { hostName = new URL(activeTargetUrl).hostname; } catch (e) {}
    link.setAttribute('download', `duplicate-urls-${hostName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Orphan Page & Internal Link Topology Audit State ────────────────────────
  const [orphanFilter, setOrphanFilter] = useState('all'); // 'all', 'orphans', 'nearOrphans', 'healthy', 'deep', 'sitemapOnly'
  const [orphanSearch, setOrphanSearch] = useState('');
  const [orphanSort, setOrphanSort] = useState('risk-desc'); // 'risk-desc', 'inbound-asc', 'inbound-desc', 'depth-desc', 'url-asc'
  const [customOrphanInput, setCustomOrphanInput] = useState('');
  const [customOrphanResult, setCustomOrphanResult] = useState(null);
  const [isScanningOrphans, setIsScanningOrphans] = useState(false);
  const [orphanSuccessMessage, setOrphanSuccessMessage] = useState('');
  const [expandedOrphanRow, setExpandedOrphanRow] = useState(null);
  const [copiedOrphanUrlIdx, setCopiedOrphanUrlIdx] = useState(null);

  // Sitemap URLs extracted from crawl or SEO audit
  const sitemapUrlsList = useMemo(() => {
    if (Array.isArray(crawlData?.sitemapUrls)) return crawlData.sitemapUrls;
    if (Array.isArray(crawlData?.sitemap?.urls)) return crawlData.sitemap.urls;
    if (Array.isArray(safeSeoData?.sitemap?.urls)) return safeSeoData.sitemap.urls;
    return [];
  }, [crawlData, safeSeoData]);

  // Orphan Pages Report Calculation Memo
  const orphanAuditReport = useMemo(() => {
    if (customOrphanResult) return customOrphanResult;
    if (crawlData?.orphanPages && crawlData.orphanPages.totalPages > 0) {
      return crawlData.orphanPages;
    }
    if (safeSeoData?.orphanPages && safeSeoData.orphanPages.totalPages > 0) {
      return safeSeoData.orphanPages;
    }
    return detectOrphanPagesClient(allDiscoveredPages, sitemapUrlsList, activeTargetUrl);
  }, [customOrphanResult, crawlData, safeSeoData, allDiscoveredPages, sitemapUrlsList, activeTargetUrl]);

  // Filtered & Sorted Orphan Pages
  const filteredOrphanPages = useMemo(() => {
    const rawPages = orphanAuditReport?.allPages || [];
    return rawPages
      .filter(p => {
        const searchLow = orphanSearch.trim().toLowerCase();
        if (searchLow) {
          const matchUrl = (p.pageUrl || '').toLowerCase().includes(searchLow);
          const matchLabel = (p.pageLabel || '').toLowerCase().includes(searchLow);
          const matchTitle = (p.pageTitle || '').toLowerCase().includes(searchLow);
          const matchSources = (p.inboundSources || []).some(s => s.toLowerCase().includes(searchLow));
          if (!matchUrl && !matchLabel && !matchTitle && !matchSources) return false;
        }

        const isHome = activeTargetUrl && p.pageUrl.replace(/\/$/, '').toLowerCase() === activeTargetUrl.replace(/\/$/, '').toLowerCase();
        const inCount = isHome ? Math.max(1, p.inboundLinksCount) : (p.inboundLinksCount ?? 0);

        if (orphanFilter === 'all') return true;
        if (orphanFilter === 'orphans') return !isHome && inCount === 0;
        if (orphanFilter === 'nearOrphans') return !isHome && inCount === 1;
        if (orphanFilter === 'healthy') return isHome || inCount >= 2;
        if (orphanFilter === 'deep') return (p.clickDepth || 0) > 2;
        if (orphanFilter === 'sitemapOnly') return !!p.isSitemapOnly;
        return true;
      })
      .sort((a, b) => {
        const isHomeA = activeTargetUrl && a.pageUrl.replace(/\/$/, '').toLowerCase() === activeTargetUrl.replace(/\/$/, '').toLowerCase();
        const isHomeB = activeTargetUrl && b.pageUrl.replace(/\/$/, '').toLowerCase() === activeTargetUrl.replace(/\/$/, '').toLowerCase();
        const inA = isHomeA ? 999 : (a.inboundLinksCount ?? 0);
        const inB = isHomeB ? 999 : (b.inboundLinksCount ?? 0);

        if (orphanSort === 'risk-desc') {
          // True orphans (0) first, then near-orphans (1), then healthy
          return inA - inB;
        }
        if (orphanSort === 'inbound-asc') return inA - inB;
        if (orphanSort === 'inbound-desc') return inB - inA;
        if (orphanSort === 'depth-desc') return (b.clickDepth ?? 0) - (a.clickDepth ?? 0);
        if (orphanSort === 'url-asc') return (a.pageUrl || '').localeCompare(b.pageUrl || '');
        return 0;
      });
  }, [orphanAuditReport, orphanSearch, orphanFilter, orphanSort, activeTargetUrl]);

  // Handle Custom Orphan URL Simulation
  const handleSimulateCustomOrphans = (e) => {
    e?.preventDefault();
    if (!customOrphanInput.trim()) {
      setCustomOrphanResult(null);
      return;
    }
    const lines = customOrphanInput
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setCustomOrphanResult(null);
      return;
    }

    // Convert list to pages with 0 inbound links (except homepage)
    const res = detectOrphanPagesClient(lines, sitemapUrlsList, activeTargetUrl);
    setCustomOrphanResult(res);
  };

  const handleResetOrphanSimulation = () => {
    setCustomOrphanInput('');
    setCustomOrphanResult(null);
  };

  // Trigger Live Deep Orphan Scan
  const handleScanForOrphans = async () => {
    if (isScanningOrphans) return;
    setIsScanningOrphans(true);
    setOrphanSuccessMessage('');
    try {
      const resp = await axios.post(`${API_BASE}/api/seo/orphan-pages`, {
        url: activeTargetUrl,
        pages: allDiscoveredPages,
        sitemapUrls: sitemapUrlsList
      });
      if (resp.data?.success && resp.data?.orphanPages) {
        setCustomOrphanResult(resp.data.orphanPages);
        setOrphanSuccessMessage(`Internal link audit complete: evaluated ${resp.data.orphanPages.totalPages} pages, detected ${resp.data.orphanPages.orphanCount} true orphan(s) and ${resp.data.orphanPages.nearOrphanCount} near-orphan(s).`);
        setTimeout(() => setOrphanSuccessMessage(''), 4500);
      }
    } catch (err) {
      console.error('Orphan scan fallback:', err);
      const fallback = detectOrphanPagesClient(allDiscoveredPages, sitemapUrlsList, activeTargetUrl);
      setCustomOrphanResult(fallback);
      setOrphanSuccessMessage(`Topology audit evaluated ${allDiscoveredPages.length} discovered site URLs.`);
      setTimeout(() => setOrphanSuccessMessage(''), 4000);
    } finally {
      setIsScanningOrphans(false);
    }
  };

  const handleCopyOrphanUrl = (urlToCopy, idx) => {
    if (urlToCopy) {
      navigator.clipboard?.writeText(urlToCopy);
      setCopiedOrphanUrlIdx(idx);
      setTimeout(() => setCopiedOrphanUrlIdx(null), 1800);
    }
  };

  const handleExportOrphanCsv = () => {
    if (!orphanAuditReport?.allPages?.length) return;
    const header = ['Page URL', 'Path Slug', 'Page Title', 'Inbound Links Count', 'Inbound Source URLs', 'Click Depth', 'In Sitemap', 'Status', 'SEO Risk / Recommendation'];
    const rows = orphanAuditReport.allPages.map(p => {
      const isHome = activeTargetUrl && p.pageUrl.replace(/\/$/, '').toLowerCase() === activeTargetUrl.replace(/\/$/, '').toLowerCase();
      const inCount = isHome ? Math.max(1, p.inboundLinksCount) : (p.inboundLinksCount ?? 0);
      const statusStr = isHome ? 'Root Entrypoint' : (inCount === 0 ? 'True Orphan' : (inCount === 1 ? 'Near-Orphan' : 'Well-Connected'));
      const recStr = inCount === 0 
        ? `Orphan: Zero internal links. Add navigation/footer links pointing to ${p.pageUrl}` 
        : (inCount === 1 ? 'Near-Orphan: Single inbound link. Add 2+ contextual links.' : 'Healthy internal link equity.');
      return [
        `"${p.pageUrl}"`,
        `"${p.pageLabel || ''}"`,
        `"${(p.pageTitle || '').replace(/"/g, '""')}"`,
        inCount,
        `"${(p.inboundSources || []).join('; ').replace(/"/g, '""')}"`,
        p.clickDepth ?? 1,
        p.isInSitemap ? 'Yes' : 'No',
        statusStr,
        `"${recStr.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    let hostName = 'site';
    try { hostName = new URL(activeTargetUrl).hostname; } catch (e) {}
    link.setAttribute('download', `orphan-pages-audit-${hostName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>

      {/* ── Summary stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">SEO Score</span>
          <div className="mt-2">
            <h2 className={`text-2xl font-black tracking-tight ${getScoreColor(seoScore)}`}>{seoScore}</h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">Out of 100</p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between border-l-2 border-l-indigo-500">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
            URL Quality
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${getGradeColor(activeUrlQuality?.grade || 'A')}`}>
              {activeUrlQuality?.grade || 'A'}
            </span>
          </span>
          <div className="mt-2">
            <h2 className={`text-2xl font-black tracking-tight ${getScoreColor(activeUrlQuality?.score || 95)}`}>
              {activeUrlQuality?.score || 95}
            </h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">{activeUrlQuality?.rating || 'Excellent'}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Pages</span>
          <div className="mt-2">
            <h2 className="text-2xl font-black tracking-tight text-indigo-400">
              {crawlData?.pageCount?.estimatedPages || crawlData?.site_structure?.total_pages || safeSeoData?.siteWideUrlQuality?.totalUrls || '—'}
            </h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">
              {crawlData ? 'BFS crawled' : (safeSeoData?.siteWideUrlQuality?.totalUrls ? 'Discovered links' : 'Run scan to count')}
            </p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Images</span>
          <div className="mt-2">
            <h2 className="text-2xl font-black tracking-tight text-violet-400">{imageAnalysis?.totalImages || 0}</h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">Detected on page</p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Internal Links</span>
          <div className="mt-2">
            <h2 className="text-2xl font-black tracking-tight text-sky-400">{links?.internalCount || 0}</h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">Same-domain links</p>
          </div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Broken Links</span>
          <div className="mt-2">
            <h2 className={`text-2xl font-black tracking-tight ${(links?.brokenCount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{links?.brokenCount || 0}</h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">{(links?.brokenCount || 0) > 0 ? 'Need fixing' : 'All healthy'}</p>
          </div>
        </div>
      </div>

      {/* ── SEO issues summary ─────────────────────────────────────────────── */}
      {alerts && alerts.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="text-amber-400 h-4 w-4" />
            SEO Issues & Recommendations
            <span className="ml-auto px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black">{alerts.length}</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-[10px] ${
                alert.level === 'critical' ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' :
                alert.level === 'warning'  ? 'bg-amber-500/5 border-amber-500/15 text-amber-300' :
                                             'bg-indigo-500/5 border-indigo-500/15 text-indigo-300'
              }`}>
                {alert.level === 'critical' ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" /> :
                 alert.level === 'warning'  ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" /> :
                                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />}
                <p className="leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Broken link recommendations ────────────────────────────────────── */}
      {(links?.brokenCount || 0) > 0 && (
        <div className="glass-card p-6 border-l-4 border-l-rose-500">
          <h3 className="text-slate-200 font-extrabold text-sm mb-4 flex items-center gap-2">
            <XCircle className="text-rose-400 h-4 w-4" />
            Broken Link Recommendations — How to Fix
          </h3>
          <div className="space-y-3">
            {links.brokenLinks.map((bl, idx) => (
              <div key={idx} className={`p-4 border rounded-xl space-y-2 ${bl.isRedirect ? 'bg-amber-500/5 border-amber-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider shrink-0 mt-0.5 ${bl.isRedirect ? 'text-amber-400' : 'text-rose-400'}`}>{bl.type} {bl.isRedirect ? 'Redirect' : ''}</span>
                  <p className={`font-mono text-[10px] break-all ${bl.isRedirect ? 'text-amber-300' : 'text-rose-300'}`}>{bl.url}</p>
                </div>
                <p className="text-[10px] text-slate-400">Reason: <span className={`font-bold ${bl.isRedirect ? 'text-amber-300' : 'text-rose-300'}`}>{bl.reason}</span></p>
                {bl.foundOn && (
                  <p className="text-[10px] text-slate-400">Found on: <a href={bl.foundOn} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-mono break-all">{bl.foundOn}</a></p>
                )}
                <div className="pt-2 border-t border-rose-500/15">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">{bl.isRedirect ? 'Consideration:' : 'How to Fix:'}</p>
                  <ul className="space-y-1">
                    {bl.isRedirect ? (
                      <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-amber-400">→</span> Ensure redirect chains are kept short to preserve SEO link equity.</li>
                    ) : bl.type === 'internal' ? (
                      <>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Update the link to point to the correct page URL</li>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> If the page was removed, set up a 301 redirect to the new URL</li>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Check for typos in the link href attribute</li>
                      </>
                    ) : (
                      <>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Replace with an updated external URL if the resource moved</li>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Remove the link if the external resource no longer exists</li>
                        <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><span className="text-emerald-400">→</span> Use a web archive (web.archive.org) to find the original content</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* SEO Circular Score */}
        <div className="col-span-12 md:col-span-4 glass-card p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider w-full text-left mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            SEO Performance Rating
          </h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="seoEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="seoAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="seoRoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
              <circle cx="72" cy="72" r="62" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8"></circle>
              <circle
                cx="72"
                cy="72"
                r="62"
                fill="transparent"
                stroke={getGradientId(seoScore)}
                strokeWidth="8"
                strokeDasharray={389.5}
                strokeDashoffset={389.5 - (389.5 * seoScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-in-out"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl font-black tracking-tight ${getScoreColor(seoScore)}`}>{seoScore}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">SEO Score</span>
            </div>
          </div>
        </div>

        {/* Search Engine Indexability Probes */}
        <div className="col-span-12 md:col-span-8 glass-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-indigo-400" />
              Indexability & Crawler Probes
            </span>
            
            <div className="space-y-3.5 mt-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Search Engine Indexable:</span>
                {indexability?.isIndexable ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Yes (Noindex Absent)
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Blocked (Meta Noindex)
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Mobile Viewport Configured:</span>
                {mobileFriendliness?.viewportConfigured ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Fully Responsive
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Suboptimal (Missing)
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Canonical Tag Configured:</span>
                {canonical?.text ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 truncate max-w-[240px]" title={canonical.text}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Configured
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Missing
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic mt-4 border-t border-slate-800/40 pt-3">
            * All variables crawled directly from live response body.
          </p>
        </div>

      </div>

      {/* ── Technical SEO: URL Quality & Architecture Scoring ─────────────────── */}
      <div className="glass-card p-6 space-y-6 border-t-2 border-t-indigo-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-slate-100 font-black text-base flex items-center gap-2.5">
              <Compass className="text-indigo-400 h-5 w-5" />
              Technical SEO: URL Quality &amp; Structure Scoring
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Multi-factor architectural analysis evaluating URL length, crawl depth, casing, parameter bloat, safe encoding, and SERP click-through appeal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${getGradeColor(activeUrlQuality?.grade || 'A')}`}>
              Grade {activeUrlQuality?.grade || 'A'}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {activeUrlQuality?.score || 95}/100 • {activeUrlQuality?.rating || 'Excellent'}
            </span>
          </div>
        </div>

        {/* Interactive Custom URL Tester Bar */}
        <form onSubmit={handleTestCustomUrl} className="flex flex-col sm:flex-row items-center gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Inspect any custom URL structure (e.g., https://example.com/blog/seo-guide/)..." 
              className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/80 transition-all font-mono"
              value={customTestUrl}
              onChange={e => setCustomTestUrl(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Sliders className="h-3.5 w-3.5" />
              Evaluate URL
            </button>
            {customEvaluated && (
              <button
                type="button"
                onClick={handleResetUrlTest}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all"
                title="Reset to monitored website URL"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* URL Quality Score Hero & SERP Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Gauge & Main Rating */}
          <div className="col-span-12 lg:col-span-4 p-5 bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-between text-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
                <FolderTree className="h-3.5 w-3.5 text-indigo-400" /> Structure Health
              </span>
              <span className={`px-2 py-0.5 rounded font-black text-[10px] border ${getGradeColor(activeUrlQuality?.grade || 'A')}`}>
                {activeUrlQuality?.grade || 'A'} Grade
              </span>
            </div>

            <div className="relative w-36 h-36 my-2 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="60" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="8"></circle>
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="transparent"
                  stroke={getGradientId(activeUrlQuality?.score || 95)}
                  strokeWidth="8"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * (activeUrlQuality?.score || 95)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out"
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-black tracking-tight ${getScoreColor(activeUrlQuality?.score || 95)}`}>
                  {activeUrlQuality?.score || 95}
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Quality Score</span>
              </div>
            </div>

            <div className="w-full text-left pt-3 border-t border-slate-800/60 mt-2 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Target Rating:</span>
                <span className="font-extrabold text-slate-200">{activeUrlQuality?.rating || 'Excellent'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Crawl Depth:</span>
                <span className="font-mono font-bold text-indigo-400">{activeUrlQuality?.parsed?.depth ?? 0} levels</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Length:</span>
                <span className="font-mono font-bold text-slate-300">{activeUrlQuality?.parsed?.length ?? (activeUrlQuality?.url || '').length} chars</span>
              </div>
            </div>
          </div>

          {/* Google SERP Search Snippet Preview */}
          <div className="col-span-12 lg:col-span-8 p-5 bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-indigo-400" />
                  Google SERP Snippet &amp; Breadcrumb Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopySerpSnippet}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded text-[10px] font-semibold transition-all flex items-center gap-1.5 border border-slate-700/40"
                  title="Copy formatted URL"
                >
                  {copiedSnippet ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedSnippet ? 'Copied' : 'Copy URL'}
                </button>
              </div>

              {/* SERP Card Representation */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/90 shadow-inner space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-indigo-400">
                    G
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-slate-200 block truncate">{activeUrlQuality?.parsed?.hostname || 'example.com'}</span>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">
                      {activeUrlQuality?.serpPreview?.breadcrumb || activeUrlQuality?.url || 'example.com'}
                    </span>
                  </div>
                </div>

                <a 
                  href={activeUrlQuality?.url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-bold text-blue-400 hover:underline block truncate"
                >
                  {title?.text || `${activeUrlQuality?.parsed?.hostname || 'Target Website'} - Home`}
                </a>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {metaDescription?.text || 'No meta description provided. Search engines will automatically extract a snippet from on-page content.'}
                </p>
              </div>

              {/* Visual Breadcrumb Path Hierarchy */}
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">URL Path Hierarchy Breadcrumb</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(activeUrlQuality?.breadcrumbSegments || [activeUrlQuality?.parsed?.hostname || 'domain']).map((seg, i) => (
                    <React.Fragment key={i}>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
                        i === 0 
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' 
                          : 'bg-slate-800/40 text-slate-300 border-slate-700/50'
                      }`}>
                        {seg || '/'}
                      </span>
                      {i < (activeUrlQuality?.breadcrumbSegments?.length || 1) - 1 && (
                        <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic mt-3 pt-2 border-t border-slate-800/40">
              * Evaluated URL: <span className="font-mono text-slate-400 break-all">{activeUrlQuality?.url || activeTargetUrl}</span>
            </p>
          </div>

        </div>

        {/* 6 Core URL Quality Dimension Breakdown Cards */}
        <div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-3">
            Architectural Dimension Scorecard
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            
            {/* Protocol Security */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  Protocol Security
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                  activeUrlQuality?.metrics?.protocol?.status === 'ok' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {activeUrlQuality?.metrics?.protocol?.score ?? 20}/20 pts
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">{activeUrlQuality?.metrics?.protocol?.value || 'HTTPS (Encrypted)'}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{activeUrlQuality?.metrics?.protocol?.message}</p>
            </div>

            {/* URL Length */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Character Length
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                  activeUrlQuality?.metrics?.length?.status === 'ok' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : activeUrlQuality?.metrics?.length?.status === 'warning'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {activeUrlQuality?.metrics?.length?.score ?? 15}/15 pts
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">{activeUrlQuality?.metrics?.length?.value || 'Optimal Length'}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{activeUrlQuality?.metrics?.length?.message}</p>
            </div>

            {/* Directory Crawl Depth */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <FolderTree className="h-4 w-4 text-indigo-400" />
                  Directory Crawl Depth
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                  activeUrlQuality?.metrics?.depth?.status === 'ok' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {activeUrlQuality?.metrics?.depth?.score ?? 15}/15 pts
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">{activeUrlQuality?.metrics?.depth?.value || 'Shallow'}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{activeUrlQuality?.metrics?.depth?.message}</p>
            </div>

            {/* Casing & Word Separators */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-indigo-400" />
                  Casing &amp; Word Separators
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                  activeUrlQuality?.metrics?.casingSeparators?.status === 'ok' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {activeUrlQuality?.metrics?.casingSeparators?.score ?? 15}/15 pts
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">{activeUrlQuality?.metrics?.casingSeparators?.value || 'Lowercase & Hyphens'}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{activeUrlQuality?.metrics?.casingSeparators?.message}</p>
            </div>

            {/* Query Parameters Bloat */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-indigo-400" />
                  Query Parameter Bloat
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                  activeUrlQuality?.metrics?.queryParams?.status === 'ok' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {activeUrlQuality?.metrics?.queryParams?.score ?? 15}/15 pts
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">{activeUrlQuality?.metrics?.queryParams?.value || 'Clean/Static'}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{activeUrlQuality?.metrics?.queryParams?.message}</p>
            </div>

            {/* Character Safety & Slug Semantics */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  Character Safety &amp; Semantics
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                  (activeUrlQuality?.metrics?.characterSafety?.status === 'ok' && activeUrlQuality?.metrics?.readability?.status === 'ok')
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {((activeUrlQuality?.metrics?.characterSafety?.score ?? 10) + (activeUrlQuality?.metrics?.readability?.score ?? 10))}/20 pts
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">
                {activeUrlQuality?.metrics?.readability?.value || 'Clean RESTful Slug'}
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {activeUrlQuality?.metrics?.characterSafety?.message} {activeUrlQuality?.metrics?.readability?.message}
              </p>
            </div>

          </div>
        </div>

        {/* Actionable URL Recommendations */}
        {(activeUrlQuality?.recommendations || []).length > 0 && (
          <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-2">
            <span className="text-indigo-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              URL Optimization Directives
            </span>
            <ul className="space-y-1.5">
              {(activeUrlQuality?.recommendations || []).map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            SITE-WIDE ALL-PAGES URL QUALITY AUDIT SUITE
            ══════════════════════════════════════════════════════════════════════════════ */}
        <div className="pt-6 border-t border-slate-800/80 space-y-5">
          
          {/* Section Header & Global Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Full Website Audit
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {allDiscoveredPages.length} Pages Audited
                </span>
              </div>
              <h4 className="text-slate-100 font-extrabold text-sm md:text-base flex items-center gap-2">
                <Layers2 className="h-4.5 w-4.5 text-indigo-400" />
                Site-Wide All-Pages URL Quality Audit
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-factor Technical SEO evaluation across every discovered page, path depth, and URL slug on this website.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleAuditAllSitePages}
                disabled={isAuditingAllPages}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAuditingAllPages ? 'animate-spin' : ''}`} />
                {isAuditingAllPages ? 'Auditing All Pages...' : 'Audit All Site Pages'}
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={allDiscoveredPages.length === 0}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                title="Export URL Quality Report as CSV"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {auditSuccessMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-fade-in-up">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{auditSuccessMessage}</span>
            </div>
          )}

          {/* Site-Wide URL Quality KPI Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Card 1: Average Health */}
            <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Site URL Quality Avg</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-2xl font-black ${getScoreColor(siteWideSummary.avgScore)}`}>
                  {siteWideSummary.avgScore}
                  <span className="text-xs font-bold text-slate-500">/100</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getGradeColor(
                  siteWideSummary.avgScore >= 90 ? 'A+' : siteWideSummary.avgScore >= 80 ? 'A' : siteWideSummary.avgScore >= 70 ? 'B' : 'C'
                )}`}>
                  {siteWideSummary.avgScore >= 90 ? 'A+ Optimal' : siteWideSummary.avgScore >= 80 ? 'A Healthy' : siteWideSummary.avgScore >= 70 ? 'B Good' : 'C Fair'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Across {siteWideSummary.totalUrls} discovered site routes
              </p>
            </div>

            {/* Card 2: Grade Spectrum */}
            <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Quality Distribution</span>
              
              {/* Stacked colored bar */}
              <div className="mt-2 h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                {siteWideSummary.totalUrls > 0 ? (
                  <>
                    <div style={{ width: `${(siteWideSummary.grades['A+'] / siteWideSummary.totalUrls) * 100}%` }} className="bg-emerald-500 h-full" title={`A+ Grade: ${siteWideSummary.grades['A+']}`} />
                    <div style={{ width: `${(siteWideSummary.grades['A'] / siteWideSummary.totalUrls) * 100}%` }} className="bg-teal-400 h-full" title={`A Grade: ${siteWideSummary.grades['A']}`} />
                    <div style={{ width: `${(siteWideSummary.grades['B'] / siteWideSummary.totalUrls) * 100}%` }} className="bg-sky-400 h-full" title={`B Grade: ${siteWideSummary.grades['B']}`} />
                    <div style={{ width: `${(siteWideSummary.grades['C'] / siteWideSummary.totalUrls) * 100}%` }} className="bg-amber-400 h-full" title={`C Grade: ${siteWideSummary.grades['C']}`} />
                    <div style={{ width: `${(siteWideSummary.grades['F'] / siteWideSummary.totalUrls) * 100}%` }} className="bg-rose-500 h-full" title={`F Grade: ${siteWideSummary.grades['F']}`} />
                  </>
                ) : (
                  <div className="w-full bg-slate-700 h-full" />
                )}
              </div>

              <div className="flex items-center justify-between text-[9px] font-bold text-slate-300 mt-2 pt-1 border-t border-slate-800/60">
                <span className="text-emerald-400">A+: {siteWideSummary.grades['A+']}</span>
                <span className="text-teal-400">A: {siteWideSummary.grades['A']}</span>
                <span className="text-sky-400">B: {siteWideSummary.grades['B']}</span>
                <span className="text-amber-400">C: {siteWideSummary.grades['C']}</span>
                <span className="text-rose-400">F: {siteWideSummary.grades['F']}</span>
              </div>
            </div>

            {/* Card 3: Hierarchy & Length */}
            <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Architecture Dimensions</span>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal">Avg Depth</span>
                  <span>{siteWideSummary.avgDepth} lvls</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal">Avg Length</span>
                  <span>{siteWideSummary.avgLength} chars</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Max Crawl Depth: 3 levels
              </p>
            </div>

            {/* Card 4: Issues Detected */}
            <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Detected Bottlenecks</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {siteWideSummary.issues.deep > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {siteWideSummary.issues.depth} Deep Pages (&gt;2)
                  </span>
                )}
                {siteWideSummary.issues.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {siteWideSummary.issues.length} Long URLs (&gt;75ch)
                  </span>
                )}
                {siteWideSummary.issues.query > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    {siteWideSummary.issues.query} Query Params
                  </span>
                )}
                {siteWideSummary.issues.insecure > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    {siteWideSummary.issues.insecure} Insecure HTTP
                  </span>
                )}
                {siteWideSummary.issues.deep === 0 && siteWideSummary.issues.length === 0 && siteWideSummary.issues.query === 0 && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Zero Critical URL Bottlenecks
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-500 mt-1">Real-time BFS indexing</span>
            </div>

          </div>

          {/* Search, Filter & Sorting Bar */}
          <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={siteUrlSearch}
                onChange={(e) => setSiteUrlSearch(e.target.value)}
                placeholder="Filter by slug, path or title..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            {/* Filter Pills & Sort Select */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
              
              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto text-[10px] font-bold">
                {[
                  { id: 'all', label: `All (${allDiscoveredPages.length})` },
                  { id: 'A+', label: `A+ (${siteWideSummary.grades['A+']})` },
                  { id: 'A', label: `A (${siteWideSummary.grades['A']})` },
                  { id: 'B', label: `B (${siteWideSummary.grades['B']})` },
                  { id: 'issues', label: `Issues (${siteWideSummary.grades['B'] + siteWideSummary.grades['C'] + siteWideSummary.grades['F']})` },
                  { id: 'deep', label: `Deep >2 (${siteWideSummary.issues.depth})` },
                  { id: 'long', label: `Long >70 (${siteWideSummary.issues.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSiteUrlFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      siteUrlFilter === tab.id 
                        ? 'bg-indigo-600 text-white shadow-sm font-black' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 text-[10px] text-slate-400">
                <ArrowUpDown className="h-3 w-3 text-indigo-400" />
                <select
                  value={siteUrlSort}
                  onChange={(e) => setSiteUrlSort(e.target.value)}
                  className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer text-[10px]"
                >
                  <option value="score-asc" className="bg-slate-900 text-slate-200">Score (Lowest First)</option>
                  <option value="score-desc" className="bg-slate-900 text-slate-200">Score (Highest First)</option>
                  <option value="depth-desc" className="bg-slate-900 text-slate-200">Depth (Deepest First)</option>
                  <option value="length-desc" className="bg-slate-900 text-slate-200">Length (Longest First)</option>
                  <option value="url-asc" className="bg-slate-900 text-slate-200">URL Slug (A-Z)</option>
                </select>
              </div>

            </div>

          </div>

          {/* Interactive Multi-Page URL Audit Table */}
          <div className="rounded-2xl border border-slate-800/90 overflow-hidden bg-slate-900/40">
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-10 border-b border-slate-800">
                  <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Page Path &amp; Structure</th>
                    <th className="py-3 px-3 text-center">Depth</th>
                    <th className="py-3 px-3 text-center">Length</th>
                    <th className="py-3 px-3 text-center">Quality Score</th>
                    <th className="py-3 px-3">Architectural Traits</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredAndSortedPages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <FolderTree className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-bold text-slate-400">No pages matched this filter query.</p>
                        <p className="text-[11px] text-slate-500 mt-1">Try selecting "All" or clearing the search box.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedPages.map((p, idx) => {
                      const evaluated = p.urlQuality || evaluateUrlQualityClient(p.pageUrl);
                      const isExpanded = expandedUrlRow === p.pageUrl;
                      const hasIssues = evaluated.score < 90 || (evaluated.recommendations || []).length > 0;

                      return (
                        <React.Fragment key={p.pageUrl || idx}>
                          <tr className={`hover:bg-slate-800/30 transition-all ${isExpanded ? 'bg-indigo-950/20' : ''}`}>
                            
                            {/* Page URL & Slug */}
                            <td className="py-3 px-4 max-w-[280px]">
                              <div className="flex items-center gap-2">
                                <div className="font-mono text-xs font-semibold text-indigo-300 truncate" title={p.pageUrl}>
                                  {p.pageLabel || '/'}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPageUrl(p.pageUrl, idx)}
                                  className="text-slate-500 hover:text-slate-300 transition-all shrink-0 cursor-pointer"
                                  title="Copy URL"
                                >
                                  {copiedUrlIndex === idx ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                                <a
                                  href={p.pageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-500 hover:text-slate-300 transition-all shrink-0"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              {p.pageTitle && (
                                <span className="text-[10px] text-slate-400 truncate block mt-0.5" title={p.pageTitle}>
                                  {p.pageTitle}
                                </span>
                              )}
                            </td>

                            {/* Hierarchy Depth */}
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                (evaluated.parsed?.depth ?? 0) === 0 ? 'bg-emerald-500/10 text-emerald-400' :
                                (evaluated.parsed?.depth ?? 0) <= 2 ? 'bg-sky-500/10 text-sky-400' :
                                'bg-amber-500/10 text-amber-400 font-black'
                              }`}>
                                {(evaluated.parsed?.depth ?? 0) === 0 ? 'Root (0)' : `Lvl ${evaluated.parsed?.depth}`}
                              </span>
                            </td>

                            {/* Character Length */}
                            <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-400">
                              <span className={evaluated.parsed?.length > 70 ? 'text-amber-400 font-bold' : ''}>
                                {evaluated.parsed?.length ?? p.pageUrl.length} ch
                              </span>
                            </td>

                            {/* Quality Score & Grade */}
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[10px] border shadow-sm ${getGradeColor(evaluated.grade)}`}>
                                <span>{evaluated.score}</span>
                                <span className="opacity-80 text-[9px]">({evaluated.grade})</span>
                              </span>
                            </td>

                            {/* Detected Traits */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap max-w-[220px]">
                                {evaluated.parsed?.protocol === 'https' ? (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    HTTPS
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    HTTP
                                  </span>
                                )}

                                {evaluated.metrics?.casingSeparators?.status === 'ok' ? (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-800 text-slate-300">
                                    Clean Slug
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Casing Flag
                                  </span>
                                )}

                                {(evaluated.parsed?.paramCount || 0) > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {evaluated.parsed.paramCount} Params
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomTestUrl(p.pageUrl);
                                    setCustomEvaluated(evaluated);
                                    // Smooth scroll to SERP preview at top
                                    window.scrollTo({ top: 180, behavior: 'smooth' });
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Inspect in Live SERP Simulator"
                                >
                                  <Compass className="h-3 w-3" />
                                  Inspect
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setExpandedUrlRow(isExpanded ? null : p.pageUrl)}
                                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                  title="Toggle diagnostics"
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </td>

                          </tr>

                          {/* Accordion Expandable Diagnostics Drawer */}
                          {isExpanded && (
                            <tr className="bg-slate-950/80 border-b border-indigo-900/30">
                              <td colSpan={6} className="p-4">
                                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                                  
                                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                      <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                                      Detailed Dimension Breakdown for <span className="font-mono text-indigo-300">{p.pageLabel || '/'}</span>
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getGradeColor(evaluated.grade)}`}>
                                      Grade: {evaluated.grade} ({evaluated.score}/100)
                                    </span>
                                  </div>

                                  {/* 6 Dimension Mini Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                                    {Object.entries(evaluated.metrics || {}).map(([key, m]) => (
                                      <div key={key} className="p-2 bg-slate-950 rounded-lg border border-slate-800/60 text-[10px]">
                                        <span className="text-slate-400 block font-semibold truncate">{m.name}</span>
                                        <span className={`font-mono font-bold block mt-0.5 ${m.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                          {m.score}/{m.maxScore} pts
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Recommendations List */}
                                  {(evaluated.recommendations || []).length > 0 && (
                                    <div className="pt-2">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                        Actionable Recommendations:
                                      </span>
                                      <ul className="space-y-1">
                                        {evaluated.recommendations.map((rec, rIdx) => (
                                          <li key={rIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                                            <span className="text-indigo-400 font-bold shrink-0">→</span>
                                            <span>{rec}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          DUPLICATE URL & CANONICAL CONFLICT DETECTION ENGINE
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 space-y-6 border border-slate-800/80">
        
        {/* Header & Global Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                Canonical Routing Audit
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {duplicateAuditReport.totalUrlsAudited} Pages Analyzed
              </span>
            </div>
            <h3 className="text-slate-100 font-black text-base md:text-lg flex items-center gap-2">
              <Split className="h-5 w-5 text-purple-400" />
              Duplicate URL &amp; Canonical Conflict Detection
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Identifies URL variations (trailing slash mismatches, casing conflicts, www/non-www duplicates, HTTP/HTTPS splits, and tracking parameter bloat) that dilute PageRank and cannibalize search rankings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleScanForDuplicates}
              disabled={isScanningDuplicates}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-550 hover:to-indigo-550 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanningDuplicates ? 'animate-spin' : ''}`} />
              {isScanningDuplicates ? 'Scanning Duplicates...' : 'Scan for Duplicates'}
            </button>

            <button
              type="button"
              onClick={handleExportDuplicateCsv}
              disabled={duplicateAuditReport.clusters.length === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Export Duplicate URLs Report as CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Success / Feedback Toast Banner */}
        {dupSuccessMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{dupSuccessMessage}</span>
          </div>
        )}

        {/* KPI Scorecards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Health Score */}
          <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Duplicate URL Health</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-black ${getScoreColor(duplicateAuditReport.score)}`}>
                {duplicateAuditReport.score}
                <span className="text-xs font-bold text-slate-500">/100</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getGradeColor(duplicateAuditReport.grade)}`}>
                {duplicateAuditReport.rating}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {duplicateAuditReport.clusters.length === 0 ? 'Zero collision risks detected' : `${duplicateAuditReport.clusters.length} active collision group(s)`}
            </p>
          </div>

          {/* Card 2: Duplicate Clusters */}
          <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Collision Clusters</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-200">
                {duplicateAuditReport.duplicateClustersCount}
              </span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">groups</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Affecting multiple route variations
            </p>
          </div>

          {/* Card 3: Redundant Variants */}
          <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Redundant URL Variants</span>
            <div className="mt-2">
              <span className={`text-2xl font-black ${duplicateAuditReport.totalDuplicateVariants > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {duplicateAuditReport.totalDuplicateVariants}
              </span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">duplicate paths</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Splitting PageRank link equity
            </p>
          </div>

          {/* Card 4: Vector Breakdown */}
          <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Collision Breakdown</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {duplicateAuditReport.breakdown.trailingSlash > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {duplicateAuditReport.breakdown.trailingSlash} Slash (/)
                </span>
              )}
              {duplicateAuditReport.breakdown.casing > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {duplicateAuditReport.breakdown.casing} Casing
                </span>
              )}
              {duplicateAuditReport.breakdown.protocol > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  {duplicateAuditReport.breakdown.protocol} HTTP/HTTPS
                </span>
              )}
              {duplicateAuditReport.breakdown.www > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {duplicateAuditReport.breakdown.www} www/non-www
                </span>
              )}
              {duplicateAuditReport.breakdown.queryParams > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {duplicateAuditReport.breakdown.queryParams} Query Clones
                </span>
              )}
              {duplicateAuditReport.breakdown.titleClones > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  {duplicateAuditReport.breakdown.titleClones} Title Clones
                </span>
              )}
              {duplicateAuditReport.duplicateClustersCount === 0 && duplicateAuditReport.breakdown.titleClones === 0 && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  No Collision Vectors
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-500 mt-1">Cross-route canonical heuristic</span>
          </div>

        </div>

        {/* Interactive Custom Duplicate Simulator */}
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Compass className="h-4 w-4 text-purple-400" />
              Live Duplicate URL Simulator &amp; Conflict Tester
            </span>
            {customDupResult && (
              <button
                type="button"
                onClick={handleResetDupSimulation}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                Reset to Site URLs
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Paste one or multiple test URLs (separated by newlines or commas) to instantly check for canonical collisions against standard routing rules.
          </p>

          <form onSubmit={handleSimulateCustomDuplicates} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customDupInput}
              onChange={(e) => setCustomDupInput(e.target.value)}
              placeholder="e.g. https://domain.com/about, https://domain.com/about/, https://domain.com/About"
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-550 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-purple-600/20 shrink-0 flex items-center justify-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Test Duplication
            </button>
          </form>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={duplicateSearch}
              onChange={(e) => setDuplicateSearch(e.target.value)}
              placeholder="Search duplicate clusters or URLs..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-mono"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto text-[10px] font-bold w-full md:w-auto">
            {[
              { id: 'all', label: `All Clusters (${duplicateAuditReport.clusters.length})` },
              { id: 'trailing', label: `Trailing Slash (${duplicateAuditReport.breakdown.trailingSlash})` },
              { id: 'casing', label: `Casing (${duplicateAuditReport.breakdown.casing})` },
              { id: 'protocol', label: `Protocol / WWW (${duplicateAuditReport.breakdown.protocol + duplicateAuditReport.breakdown.www})` },
              { id: 'queryParams', label: `Query Clones (${duplicateAuditReport.breakdown.queryParams})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDuplicateFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  duplicateFilter === tab.id 
                    ? 'bg-purple-600 text-white shadow-sm font-black' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Duplicate Clusters Explorer Cards */}
        {duplicateAuditReport.clusters.length === 0 ? (
          <div className="py-12 px-6 text-center rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-3">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="h-8 w-8 animate-pulse" />
            </div>
            <h4 className="font-extrabold text-slate-100 text-sm md:text-base">
              Clean Canonical Architecture — Zero Duplicate URL Collisions Detected
            </h4>
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
              All audited pages on <span className="font-mono text-emerald-400 font-semibold">{activeTargetUrl}</span> adhere to consistent URL paths, clean lowercase casing, standard trailing slash conventions, and secure HTTPS protocol without splitting PageRank.
            </p>
          </div>
        ) : filteredDuplicateClusters.length === 0 ? (
          <div className="py-10 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            <FolderTree className="h-7 w-7 mx-auto mb-2 text-slate-600" />
            <p className="font-bold text-slate-400 text-xs">No clusters matched this filter query.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDuplicateClusters.map((cluster, cIdx) => {
              const isExpanded = expandedDupClusterIdx === cIdx;

              return (
                <div key={cluster.normalizedKey || cIdx} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/90 space-y-4 hover:border-purple-500/40 transition-all">
                  
                  {/* Cluster Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {cluster.variants.length} Duplicate Variant{cluster.variants.length > 1 ? 's' : ''}
                        </span>
                        {cluster.types.map((t, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {t}
                          </span>
                        ))}
                      </div>
                      <h5 className="font-mono text-xs font-bold text-slate-200">
                        Path Key: <span className="text-purple-300 font-semibold">{cluster.normalizedKey}</span>
                      </h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyRedirectSnippet(cluster.canonicalMaster, cluster.variants, cIdx)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        title="Copy 301 Redirect Rule & Canonical Tag"
                      >
                        {copiedRedirectIdx === cIdx ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[11px]">Copy 301 Rule</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedDupClusterIdx(isExpanded ? null : cIdx)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        title="Toggle resolution snippet"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Canonical Master vs Duplicate Variants Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 text-xs">
                    
                    {/* Master Canonical Target */}
                    <div className="md:col-span-6 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Recommended Canonical Master URL
                      </span>
                      <div className="font-mono text-xs font-bold text-emerald-300 break-all">
                        {cluster.canonicalMaster}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Search crawlers should index only this single primary destination.
                      </span>
                    </div>

                    {/* Duplicate Variants */}
                    <div className="md:col-span-6 p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Colliding Duplicate URL Variants ({cluster.variants.length})
                      </span>
                      <ul className="space-y-1 max-h-28 overflow-y-auto font-mono text-[11px] text-rose-300">
                        {cluster.variants.map((v, vIdx) => (
                          <li key={vIdx} className="flex items-center gap-1.5 break-all">
                            <span className="text-rose-400 font-black">×</span>
                            <span>{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* SEO Directives & Resolution Snippet */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 font-bold">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      <span>SEO Impact &amp; 301 Directive:</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {cluster.impact} {cluster.resolution}
                    </p>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Nginx 301 Redirect Snippet:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg text-[10px] font-mono text-indigo-300 overflow-x-auto">
                          {cluster.variants.map(v => {
                            try {
                              const p = new URL(v).pathname;
                              return `rewrite ^${p}$ ${cluster.canonicalMaster} permanent;`;
                            } catch (e) {
                              return `rewrite ^${v}$ ${cluster.canonicalMaster} permanent;`;
                            }
                          }).join('\n')}
                        </pre>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Duplicate Page Titles Section (if any detected) */}
        {duplicateAuditReport.titleDuplicateClusters?.length > 0 && (
          <div className="p-4 bg-slate-900/70 rounded-2xl border border-purple-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <CopyCheck className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">
                Identical Page Title Collisions ({duplicateAuditReport.titleDuplicateClusters.length} Clusters)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multiple distinct URLs share the exact same &lt;title&gt; tag, which causes keyword cannibalization in search engine result pages.
            </p>

            <div className="space-y-2">
              {duplicateAuditReport.titleDuplicateClusters.map((td, tIdx) => (
                <div key={tIdx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="font-bold text-slate-200">
                    Title: <span className="text-indigo-300 font-mono">"{td.title}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                    <span className="text-amber-400 font-bold">Shared across {td.count} URLs:</span>
                    {td.urls.map((u, uIdx) => (
                      <span key={uIdx} className="font-mono text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[200px]" title={u}>
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          ORPHAN PAGE & INTERNAL LINK TOPOLOGY AUDIT SUITE
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 space-y-6 border border-slate-800/80">
        
        {/* Header & Global Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Network className="h-3 w-3" />
                Internal Link Architecture Audit
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {orphanAuditReport.totalPages} Total Discovered Pages
              </span>
            </div>
            <h3 className="text-slate-100 font-black text-base md:text-lg flex items-center gap-2">
              <Unlink className="text-amber-400 h-5 w-5" />
              Orphan Page &amp; Internal Link Topology Audit
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Detects true orphan pages (0 inbound links), vulnerable near-orphans (1 inbound link), deep crawl depth bottlenecks (&gt;2 clicks), and pages present only in sitemap.xml without internal HTML links.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleScanForOrphans}
              disabled={isScanningOrphans}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Run live internal link topology & orphan page crawler"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanningOrphans ? 'animate-spin' : ''}`} />
              {isScanningOrphans ? 'Analyzing Topology...' : 'Deep Orphan Audit'}
            </button>

            <button
              type="button"
              onClick={handleExportOrphanCsv}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700/60 flex items-center gap-1.5 cursor-pointer"
              title="Export internal link connectivity and orphan report as CSV"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              Export Links CSV
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {orphanSuccessMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{orphanSuccessMessage}</span>
          </div>
        )}

        {/* 4 KPI Cards: Link Architecture Health */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Link Architecture Health Score */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Topology Score</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getGradeColor(orphanAuditReport.grade)}`}>
                {orphanAuditReport.grade}
              </span>
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-black ${getScoreColor(orphanAuditReport.score)}`}>
                  {orphanAuditReport.score}
                </span>
                <span className="text-xs text-slate-500 font-bold">/100</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{orphanAuditReport.rating}</p>
            </div>
            <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${orphanAuditReport.score >= 85 ? 'bg-emerald-500' : orphanAuditReport.score >= 65 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${orphanAuditReport.score}%` }}
              ></div>
            </div>
          </div>

          {/* 2. True Orphan Pages (0 Inbound Links) */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
            orphanAuditReport.orphanCount > 0 
              ? 'bg-rose-950/20 border-rose-500/30' 
              : 'bg-slate-900 to-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">True Orphans</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                orphanAuditReport.orphanCount > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {orphanAuditReport.orphanCount > 0 ? 'Critical Risk' : 'Optimal'}
              </span>
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-black ${orphanAuditReport.orphanCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {orphanAuditReport.orphanCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">pages</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {orphanAuditReport.orphanCount > 0 ? '0 internal inbound links detected' : 'All pages internally discoverable'}
              </p>
            </div>
            <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
              <Unlink className="h-3 w-3 text-rose-400" />
              <span>Receives zero internal PageRank</span>
            </div>
          </div>

          {/* 3. Near-Orphan Pages (1 Inbound Link) */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
            orphanAuditReport.nearOrphanCount > 0 
              ? 'bg-amber-950/20 border-amber-500/30' 
              : 'bg-slate-900 to-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Near-Orphans</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                orphanAuditReport.nearOrphanCount > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {orphanAuditReport.nearOrphanCount > 0 ? 'Vulnerable' : 'Robust'}
              </span>
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-black ${orphanAuditReport.nearOrphanCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {orphanAuditReport.nearOrphanCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">pages</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Only 1 single inbound link path
              </p>
            </div>
            <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
              <CornerDownRight className="h-3 w-3 text-amber-400" />
              <span>High risk of breaking on site edits</span>
            </div>
          </div>

          {/* 4. Connectivity & Hierarchy Depth */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Link Density</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Depth Stats
              </span>
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-indigo-400">
                  {orphanAuditReport.avgInboundLinks}
                </span>
                <span className="text-xs text-slate-400 font-medium">avg links / page</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {orphanAuditReport.deepPagesCount} page(s) require &gt;2 clicks
              </p>
            </div>
            <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
              <Waypoints className="h-3 w-3 text-indigo-400" />
              <span>{orphanAuditReport.wellConnectedCount} well-connected URLs (2+ links)</span>
            </div>
          </div>

        </div>

        {/* Live Interactive Link Simulation / Custom URLs Tester */}
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Share2 className="h-3.5 w-3.5 text-amber-400" />
              Simulate &amp; Audit Custom Internal Link Topology
            </span>
            {customOrphanResult && (
              <button
                type="button"
                onClick={handleResetOrphanSimulation}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
              >
                Reset to Discovered Pages
              </button>
            )}
          </div>
          <form onSubmit={handleSimulateCustomOrphans} className="space-y-2.5">
            <textarea
              rows={2}
              value={customOrphanInput}
              onChange={(e) => setCustomOrphanInput(e.target.value)}
              placeholder="Paste custom page URLs or sitemap links (separated by newlines or commas) to audit internal link connectivity..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 font-mono resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Simulates orphan detection, link equity distribution, and crawl hierarchy.
              </span>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-amber-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Network className="h-3.5 w-3.5" />
                Run Topology Test
              </button>
            </div>
          </form>
        </div>

        {/* Search, Filter Tabs & Sorting Bar */}
        <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={orphanSearch}
              onChange={(e) => setOrphanSearch(e.target.value)}
              placeholder="Search by slug, title, or inbound source..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-mono"
            />
          </div>

          {/* Filter Pills & Sort Select */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto text-[10px] font-bold">
              {[
                { id: 'all', label: `All (${orphanAuditReport.totalPages})` },
                { id: 'orphans', label: `Orphans (${orphanAuditReport.orphanCount})`, alert: orphanAuditReport.orphanCount > 0 },
                { id: 'nearOrphans', label: `Near-Orphans (${orphanAuditReport.nearOrphanCount})` },
                { id: 'healthy', label: `Connected (${orphanAuditReport.wellConnectedCount})` },
                { id: 'deep', label: `Deep >2 (${orphanAuditReport.deepPagesCount})` },
                ...(orphanAuditReport.breakdown.sitemapOnly > 0 ? [{ id: 'sitemapOnly', label: `Sitemap Only (${orphanAuditReport.breakdown.sitemapOnly})` }] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrphanFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    orphanFilter === tab.id 
                      ? 'bg-amber-600 text-white shadow-sm font-black' 
                      : tab.alert
                        ? 'text-rose-400 hover:bg-rose-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 text-[10px] text-slate-400">
              <ArrowUpDown className="h-3 w-3 text-amber-400" />
              <select
                value={orphanSort}
                onChange={(e) => setOrphanSort(e.target.value)}
                className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer text-[10px]"
              >
                <option value="risk-desc" className="bg-slate-900 text-slate-200">Orphan Risk (Critical First)</option>
                <option value="inbound-asc" className="bg-slate-900 text-slate-200">Inbound Links (Lowest First)</option>
                <option value="inbound-desc" className="bg-slate-900 text-slate-200">Inbound Links (Highest First)</option>
                <option value="depth-desc" className="bg-slate-900 text-slate-200">Crawl Depth (Deepest First)</option>
                <option value="url-asc" className="bg-slate-900 text-slate-200">URL Slug (A-Z)</option>
              </select>
            </div>

          </div>

        </div>

        {/* Directory Table: Internal Link Connectivity & Orphans */}
        <div className="rounded-2xl border border-slate-800/90 overflow-hidden bg-slate-900/40">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-10 border-b border-slate-800">
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Page Slug &amp; Title</th>
                  <th className="py-3 px-3 text-center">Inbound Links</th>
                  <th className="py-3 px-3">Inbound Linking Source Pages</th>
                  <th className="py-3 px-3 text-center">Crawl Depth</th>
                  <th className="py-3 px-3 text-center">Sitemap</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrphanPages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p className="font-bold text-slate-300">No pages matched this link filter query.</p>
                      <p className="text-[11px] text-slate-500 mt-1">All pages in this view meet internal link connectivity standards.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrphanPages.map((p, idx) => {
                    const isHome = activeTargetUrl && p.pageUrl.replace(/\/$/, '').toLowerCase() === activeTargetUrl.replace(/\/$/, '').toLowerCase();
                    const inCount = isHome ? Math.max(1, p.inboundLinksCount) : (p.inboundLinksCount ?? 0);
                    const isOrphan = !isHome && inCount === 0;
                    const isNearOrphan = !isHome && inCount === 1;
                    const isExpanded = expandedOrphanRow === p.pageUrl;

                    return (
                      <React.Fragment key={p.pageUrl || idx}>
                        <tr className={`hover:bg-slate-800/30 transition-all ${
                          isOrphan ? 'bg-rose-950/15' : isNearOrphan ? 'bg-amber-950/10' : ''
                        } ${isExpanded ? 'bg-indigo-950/25' : ''}`}>
                          
                          {/* Page URL & Slug */}
                          <td className="py-3 px-4 max-w-[260px]">
                            <div className="flex items-center gap-2">
                              <div className={`font-mono text-xs font-semibold truncate ${
                                isOrphan ? 'text-rose-300' : isNearOrphan ? 'text-amber-300' : 'text-indigo-300'
                              }`} title={p.pageUrl}>
                                {p.pageLabel || '/'}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyOrphanUrl(p.pageUrl, idx)}
                                className="text-slate-500 hover:text-slate-300 transition-all shrink-0 cursor-pointer"
                                title="Copy URL"
                              >
                                {copiedOrphanUrlIdx === idx ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <a
                                href={p.pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-slate-300 transition-all shrink-0"
                                title="Open page in new tab"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            {p.pageTitle && (
                              <span className="text-[10px] text-slate-400 truncate block mt-0.5" title={p.pageTitle}>
                                {p.pageTitle}
                              </span>
                            )}
                          </td>

                          {/* Inbound Links Count Badge */}
                          <td className="py-3 px-3 text-center">
                            {isHome ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Root Domain
                              </span>
                            ) : isOrphan ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1 shadow-sm">
                                <XCircle className="h-3 w-3" /> 0 Inbound (Orphan)
                              </span>
                            ) : isNearOrphan ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> 1 Link (Near-Orphan)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> {inCount} Inbound Links
                              </span>
                            )}
                          </td>

                          {/* Inbound Linking Source Pages */}
                          <td className="py-3 px-3">
                            {isOrphan ? (
                              <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold">
                                <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
                                <span>No inbound internal links found</span>
                              </div>
                            ) : (p.inboundSources || []).length === 0 ? (
                              <span className="text-slate-500 text-[10px] italic">Root entrypoint</span>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap max-w-[280px]">
                                {p.inboundSources.slice(0, 2).map((s, sIdx) => {
                                  let sLabel = s;
                                  try { sLabel = new URL(s).pathname || s; } catch (e) {}
                                  return (
                                    <span key={sIdx} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 truncate max-w-[130px]" title={`Linked from: ${s}`}>
                                      ← {sLabel}
                                    </span>
                                  );
                                })}
                                {p.inboundSources.length > 2 && (
                                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                    +{p.inboundSources.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Hierarchy Crawl Depth */}
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              (p.clickDepth ?? 1) === 0 ? 'bg-emerald-500/10 text-emerald-400' :
                              (p.clickDepth ?? 1) <= 2 ? 'bg-sky-500/10 text-sky-400' :
                              'bg-amber-500/15 text-amber-400 font-black'
                            }`}>
                              {(p.clickDepth ?? 1) === 0 ? 'Root' : `Depth ${p.clickDepth ?? 1}`}
                            </span>
                          </td>

                          {/* Sitemap Presence */}
                          <td className="py-3 px-3 text-center">
                            {p.isInSitemap ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Listed in sitemap.xml">
                                XML Sitemap
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400" title="Not found in sitemap.xml">
                                Unlisted
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomTestUrl(p.pageUrl);
                                  setCustomEvaluated(evaluateUrlQualityClient(p.pageUrl));
                                  window.scrollTo({ top: 180, behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Inspect in URL Quality Suite"
                              >
                                <Compass className="h-3 w-3" />
                                Inspect
                              </button>

                              <button
                                type="button"
                                onClick={() => setExpandedOrphanRow(isExpanded ? null : p.pageUrl)}
                                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                title="Toggle link equity diagnostics"
                              >
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>

                        </tr>

                        {/* Accordion Expandable Diagnostics Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80 border-b border-amber-900/30">
                            <td colSpan={6} className="p-4">
                              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                                
                                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                    <Network className="h-3.5 w-3.5 text-amber-400" />
                                    Internal Link Topology Analysis for <span className="font-mono text-amber-300">{p.pageLabel || '/'}</span>
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black border ${
                                    isOrphan ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                                    isNearOrphan ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  }`}>
                                    {isOrphan ? 'True Orphan Page (0 Inbound)' : isNearOrphan ? 'Near-Orphan (1 Inbound)' : 'Well Connected'}
                                  </span>
                                </div>

                                {/* Inbound Linking Sources Directory */}
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                    Inbound Linking Parent URLs ({(p.inboundSources || []).length}):
                                  </span>
                                  {(p.inboundSources || []).length === 0 ? (
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                                      <span>This page is not linked from any other page in the website crawl. Search engine spiders cannot crawl or assign link juice to this URL organically.</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {p.inboundSources.map((source, sIdx) => (
                                        <div key={sIdx} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-xs">
                                          <div className="flex items-center gap-2 font-mono text-indigo-300 truncate" title={source}>
                                            <CornerDownRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                            <span>{source}</span>
                                          </div>
                                          <a
                                            href={source}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-400 hover:text-slate-200 text-[10px] shrink-0 font-semibold underline ml-2"
                                          >
                                            Visit Source
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* SEO Remediation Guidelines */}
                                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Recommended Link Architecture Remediation:
                                  </span>
                                  <p className="text-slate-300 leading-relaxed">
                                    {isOrphan 
                                      ? `Add contextual internal links pointing to "${p.pageLabel || p.pageUrl}" from top-level category pages, main navigation menus, or footer links to pass internal PageRank equity.`
                                      : isNearOrphan 
                                        ? `Strengthen internal connectivity by introducing 2–3 additional links from related topical clusters, sidebar widgets, or breadcrumbs.`
                                        : `Link architecture is healthy. Ensure anchor texts remain descriptive and relevant to "${p.pageTitle || p.pageLabel}".`
                                    }
                                  </p>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* HTML Header Tags & Crawl Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Meta elements */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-4">
          <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <FileText className="text-indigo-400 h-4.5 w-4.5" />
            HTML Header Metadata
          </h3>
          
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">Meta Title Tag</span>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60 text-slate-300 font-medium font-mono break-all leading-normal">
                {title?.text || '—'}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">{title?.message}</span>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">Meta Description</span>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60 text-slate-300 font-medium leading-relaxed">
                {metaDescription?.text || '—'}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">{metaDescription?.message}</span>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">Meta Keywords</span>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60 text-slate-300 font-medium leading-relaxed break-words">
                {keywordsMeta?.text || 'No keywords found'}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">{keywordsMeta?.message}</span>
            </div>
          </div>
        </div>

        {/* Crawlability Files Validation */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-4">
          <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Globe className="text-indigo-400 h-4.5 w-4.5" />
            Crawlability & File Validations
          </h3>
          
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">robots.txt Validation</span>
              <div className={`p-3.5 rounded-xl border text-slate-300 font-medium ${robotsTxt?.exists ? 'bg-emerald-950/15 border-emerald-900/25 text-emerald-300' : 'bg-rose-950/15 border-rose-900/25 text-rose-300'}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold">{robotsTxt?.exists ? 'Found & Active' : 'Missing File'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${robotsTxt?.exists ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {robotsTxt?.status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{robotsTxt?.message}</p>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">sitemap.xml Validation</span>
              <div className={`p-3.5 rounded-xl border text-slate-300 font-medium ${sitemap?.exists ? 'bg-emerald-950/15 border-emerald-900/25 text-emerald-300' : 'bg-rose-950/15 border-rose-900/25 text-rose-300'}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold">{sitemap?.exists ? 'Found & Parsed' : 'Missing Index'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sitemap?.exists ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {sitemap?.status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{sitemap?.message}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Schema Markup Validation */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-4">
          <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Code2 className="text-indigo-400 h-4.5 w-4.5" />
            Schema.org Rich Snippets (JSON-LD)
          </h3>
          
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-2">Schema Detection Status</span>
              <div className={`p-3.5 rounded-xl border text-slate-300 font-medium ${schemaMarkup?.valid ? 'bg-emerald-950/15 border-emerald-900/25 text-emerald-300' : (schemaMarkup?.present ? 'bg-amber-950/15 border-amber-900/25 text-amber-300' : 'bg-slate-800/40 border-slate-700/50 text-slate-400')}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold">{schemaMarkup?.valid ? 'Valid JSON-LD Schema Found' : (schemaMarkup?.present ? 'Schema Detected with Issues' : 'No Schema Markup')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${schemaMarkup?.valid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (schemaMarkup?.present ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-700 text-slate-400 border border-slate-600')}`}>
                    {schemaMarkup?.valid ? 'VALID' : (schemaMarkup?.present ? 'WARNING' : 'MISSING')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{schemaMarkup?.message}</p>
                
                {schemaMarkup?.valid && schemaMarkup?.types?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-900/30">
                    <span className="text-[9px] font-black uppercase text-emerald-500/70 tracking-widest block mb-2">Detected Entities</span>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(schemaMarkup.types)].map((type, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-md text-[10px] text-emerald-300 font-mono">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Heading Structure & Keyword Density mapping */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Hierarchy and keywords density map */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-6">
          <div>
            <h3 className="text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Layers className="text-indigo-400 h-4.5 w-4.5" />
              H1 Page Headings Hierarchy
            </h3>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {(headings?.h1 || []).length === 0 ? (
                <div className="p-3.5 bg-rose-950/10 border border-rose-900/20 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="text-rose-400 h-4 w-4 shrink-0" />
                  <span className="text-rose-400 text-xs font-bold leading-normal">No H1 heading tag detected on this page! Suboptimal structural indexability.</span>
                </div>
              ) : (
                (headings.h1 || []).map((h, i) => (
                  <div key={i} className="text-xs p-2.5 bg-indigo-950/15 border border-indigo-900/25 text-indigo-350 rounded-lg font-semibold flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse"></span>
                    {h}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Sparkles className="text-indigo-400 h-4.5 w-4.5" />
              Top 5 High-Frequency Keyword Density
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {(keywordAnalysis?.topKeywords || []).length === 0 ? (
                <div className="text-slate-500 text-xs italic py-2">No frequency keyword analysis performed.</div>
              ) : (
                (keywordAnalysis.topKeywords || []).map((k, idx) => (
                  <div key={idx} className="px-3.5 py-2 bg-dark-800/40 border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 transition-all hover:border-indigo-500/30">
                    <span className="text-indigo-400 font-bold">{k.keyword}</span>
                    <span className="text-slate-500 font-mono text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">{k.count} times</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Image Alt tags analysis */}
        <div className="col-span-12 md:col-span-6 glass-card p-6 space-y-4">
          <h3 className="text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Image className="text-indigo-400 h-4.5 w-4.5" />
              Image Alt Tag Compliance
            </span>
            {imageAnalysis.totalImages > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800/60 text-slate-400 rounded-md">
                Compliance: {imageAnalysis.withAlt} / {imageAnalysis.totalImages}
              </span>
            )}
          </h3>
          
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3.5 text-center">
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 text-[10px] font-bold block uppercase mb-1">Total Images</span>
                <span className="text-lg font-black text-slate-350">{imageAnalysis?.totalImages || 0}</span>
              </div>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 text-[10px] font-bold block uppercase mb-1">Valid ALT</span>
                <span className="text-lg font-black text-emerald-400">{imageAnalysis?.withAlt || 0}</span>
              </div>
              <div className="p-3 bg-dark-800/30 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 text-[10px] font-bold block uppercase mb-1">Missing ALT</span>
                {(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0) > 0 && onNavigateToAlt ? (
                  <button
                    className="sre-alt-badge-clickable text-lg font-black text-rose-400 focus:outline-none"
                    onClick={onNavigateToAlt}
                    title="Click to view Missing ALT details in Site Analysis"
                    aria-label={`${(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0)} Missing ALT tags — click to view details`}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateToAlt(); } }}
                  >
                    <span>{(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0)}</span>
                    <span className="text-[10px] ml-1 opacity-75">↗</span>
                  </button>
                ) : (
                  <span className={`text-lg font-black ${(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0)}
                  </span>
                )}
                {(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0) > 0 && onNavigateToAlt && (
                  <p className="text-[9px] text-rose-400 mt-1 font-bold">Click to view →</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">{imageAnalysis?.message}</p>

            {(imageAnalysis?.missingAltSrcs || []).length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block text-[9px]">Missing ALT descriptive tags list</span>
                  <div className="relative flex items-center w-36">
                    <Search className="absolute left-2 text-slate-500 h-3 w-3" />
                    <input 
                      type="text" 
                      placeholder="Filter by src..." 
                      className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-0.5 text-[9px] pl-6 font-medium text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500"
                      value={altSearch}
                      onChange={e => setAltSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {filteredAltSrcs.length === 0 ? (
                    <div className="text-[9px] text-slate-600 italic">No matching image sources.</div>
                  ) : (
                    filteredAltSrcs.map((item, i) => {
                      const src = typeof item === 'string' ? item : (item?.src || '');
                      const suggestedAlt = typeof item === 'string' ? null : (item?.suggestedAlt || item?.suggested_alt);
                      
                      return (
                        <div key={i} className="p-2.5 bg-rose-950/10 border border-rose-900/15 rounded-xl space-y-1.5 transition-all hover:bg-rose-950/20">
                          <div className="font-mono text-[9px] text-rose-300 truncate" title={src}>
                            <span className="text-rose-500 font-bold">SRC:</span> {src}
                          </div>
                          {suggestedAlt && (
                            <div className="flex items-center gap-1.5 text-[9.5px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg text-emerald-300 font-semibold w-fit">
                              <Sparkles className="h-3 w-3 text-emerald-400 shrink-0 animate-pulse" />
                              <span>Suggested ALT: <strong className="text-emerald-200 italic">"{suggestedAlt}"</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Crawled Links index */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <LinkIcon className="text-indigo-400 h-4.5 w-4.5" />
            Crawled Links Integrity Audit
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-850/60 text-slate-400 rounded-md">
            Internal: {links?.internalCount || 0} • External: {links?.externalCount || 0}
          </span>
        </h3>
        
        <div className="space-y-3">
          {(links?.brokenCount || 0) === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center gap-2 bg-dark-900/20 border border-dashed border-slate-800 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              All internal and external links are structurally verified and operational (zero broken links).
            </div>
          ) : (
            <div className="space-y-2.5">
              <span className="text-rose-455 font-bold uppercase tracking-wider block text-[9px] mb-2">Detected Broken Link Anomalies</span>
              <div className="space-y-2">
                {(links.brokenLinks || []).map((bl, idx) => (
                  <div key={idx} className={`p-3 border rounded-xl flex justify-between items-center text-xs ${bl.isRedirect ? 'bg-amber-950/10 border-amber-900/20' : 'bg-rose-950/10 border-rose-900/20'}`}>
                    <div className="truncate max-w-[80%] pr-4">
                      <span className={`font-extrabold uppercase tracking-widest text-[9px] block mb-0.5 ${bl.isRedirect ? 'text-amber-400' : 'text-rose-400'}`}>{bl.type} URL {bl.isRedirect ? 'Redirect' : 'Broken'}</span>
                      <span className="font-mono text-slate-350 break-all truncate block" title={bl.url}>{bl.url}</span>
                      {bl.foundOn && (
                        <span className="text-[10px] text-slate-500 block mt-1">Found on: <a href={bl.foundOn} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{bl.foundOn}</a></span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-bold tracking-wide uppercase text-[9px] shrink-0 border ${bl.isRedirect ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/20 text-rose-455 border-rose-500/20'}`}>
                      {bl.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SEO Optimization Details ───────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Sparkles className="text-indigo-400 h-5 w-5" />
          SEO Optimization Details
        </h3>

        {/* SEO Health Score summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border text-xs ${title?.text ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
            <p className="font-bold uppercase tracking-wider text-[9px] mb-1 text-slate-400">Title Tag</p>
            <p className={`font-extrabold text-sm ${title?.text ? 'text-emerald-400' : 'text-rose-400'}`}>
              {title?.text ? `${title.text.length} chars` : 'MISSING'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{title?.message}</p>
          </div>
          <div className={`p-4 rounded-xl border text-xs ${metaDescription?.text ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
            <p className="font-bold uppercase tracking-wider text-[9px] mb-1 text-slate-400">Meta Description</p>
            <p className={`font-extrabold text-sm ${metaDescription?.text ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metaDescription?.text ? `${metaDescription.text.length} chars` : 'MISSING'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{metaDescription?.message}</p>
          </div>
          <div className={`p-4 rounded-xl border text-xs ${(headings?.h1?.length === 1) ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-amber-500/5 border-amber-500/15'}`}>
            <p className="font-bold uppercase tracking-wider text-[9px] mb-1 text-slate-400">H1 Headings</p>
            <p className={`font-extrabold text-sm ${headings?.h1?.length === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {headings?.h1?.length || 0} found
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {(headings?.h1 || []).length === 0 ? 'No H1 tag — add one' : (headings?.h1 || []).length > 1 ? 'Multiple H1 — use only one' : 'Single H1 — optimal'}
            </p>
          </div>
        </div>

        {/* Heading Structure */}
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5">Heading Structure</p>
          <div className="space-y-1.5">
            {(headings?.h1 || []).length === 0 && (headings?.h2 || []).length === 0 && (headings?.h3 || []).length === 0 ? (
              <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl flex items-center gap-2 text-xs text-rose-400">
                <XCircle className="h-4 w-4 shrink-0" /> No heading tags detected on this page.
              </div>
            ) : (
              <>
                {(headings?.h1 || []).map((h, i) => (
                  <div key={`h1-${i}`} className="flex items-center gap-2 p-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg">
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded shrink-0">H1</span>
                    <span className="text-xs text-slate-300 truncate">{h}</span>
                  </div>
                ))}
                {(headings?.h2 || []).slice(0, 5).map((h, i) => (
                  <div key={`h2-${i}`} className="flex items-center gap-2 p-2 bg-slate-800/20 border border-slate-800/40 rounded-lg ml-3">
                    <span className="text-[9px] font-black text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded shrink-0">H2</span>
                    <span className="text-xs text-slate-400 truncate">{h}</span>
                  </div>
                ))}
                {(headings?.h2 || []).length > 5 && (
                  <p className="text-[9px] text-slate-500 italic ml-3">+{(headings?.h2 || []).length - 5} more H2 headings</p>
                )}
                {(headings?.h3 || []).slice(0, 3).map((h, i) => (
                  <div key={`h3-${i}`} className="flex items-center gap-2 p-2 bg-slate-800/10 border border-slate-800/30 rounded-lg ml-6">
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-800/30 px-1.5 py-0.5 rounded shrink-0">H3</span>
                    <span className="text-xs text-slate-500 truncate">{h}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ALT Tag summary */}
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5">ALT Tag Coverage</p>
          <div className="flex items-center gap-4 p-3 bg-slate-800/20 border border-slate-800/40 rounded-xl text-xs">
            <div className="text-center">
              <p className="text-lg font-black text-slate-200">{imageAnalysis?.totalImages || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-emerald-400">{imageAnalysis?.withAlt || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold">With ALT</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-rose-400">{(imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0)}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Missing</p>
            </div>
            <div className="flex-1">
              <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800 mt-1">
                {(() => {
                  const total = imageAnalysis?.totalImages || 0;
                  const pct = total > 0 ? Math.round(((imageAnalysis?.withAlt || 0) / total) * 100) : 100;
                  return <div className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />;
                })()}
              </div>
              <p className="text-[9px] text-slate-500 mt-1 text-right">
                {imageAnalysis?.totalImages > 0 ? Math.round(((imageAnalysis?.withAlt || 0) / imageAnalysis.totalImages) * 100) : 100}% compliant
              </p>
            </div>
          </div>
        </div>

        {/* SEO Recommendations */}
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5">SEO Recommendations</p>
          <div className="space-y-2">
            {(() => {
              const recs = [];
              if (!metaDescription?.text) recs.push({ level: 'critical', text: 'Add a meta description (120–160 chars) to improve search engine click-through rates.' });
              if (metaDescription?.text && (metaDescription.text.length < 120 || metaDescription.text.length > 160)) recs.push({ level: 'warning', text: `Improve meta description length: currently ${metaDescription.text.length} chars, ideal is 120–160.` });
              if (!title?.text) recs.push({ level: 'critical', text: 'Add a page title tag (30–65 chars). Missing title severely hurts SEO rankings.' });
              if (title?.text && (title.text.length < 30 || title.text.length > 65)) recs.push({ level: 'warning', text: `Improve title length: currently ${title.text.length} chars, ideal is 30–65.` });
              if ((headings?.h1 || []).length === 0) recs.push({ level: 'critical', text: 'Add exactly one H1 heading to every page for clear topic signaling.' });
              if ((headings?.h1 || []).length > 1) recs.push({ level: 'warning', text: `Reduce H1 count to one (currently ${headings.h1.length}). Multiple H1 tags confuse search engines.` });
              const missingAlt = (imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0);
              if (missingAlt > 0) recs.push({ level: 'warning', text: `Add ALT text to ${missingAlt} image${missingAlt > 1 ? 's' : ''}. Missing ALT tags hurt accessibility and image SEO.` });
              if ((links?.brokenCount || 0) > 0) recs.push({ level: 'warning', text: `Fix ${links.brokenCount} broken link${links.brokenCount > 1 ? 's' : ''}. Broken links hurt crawlability and user experience.` });
              if (!canonical?.text) recs.push({ level: 'warning', text: 'Add a canonical URL tag to prevent duplicate content issues.' });
              if (!robotsTxt?.exists) recs.push({ level: 'warning', text: 'Create a robots.txt file to guide search engine crawlers.' });
              if (!sitemap?.exists) recs.push({ level: 'warning', text: 'Add a sitemap.xml to help search engines discover all your pages.' });
              if (recs.length === 0) recs.push({ level: 'ok', text: 'All major SEO factors are properly configured. Keep monitoring for changes.' });
              return recs;
            })().map((rec, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-[10px] leading-relaxed ${
                rec.level === 'critical' ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' :
                rec.level === 'warning'  ? 'bg-amber-500/5 border-amber-500/15 text-amber-300' :
                                           'bg-emerald-500/5 border-emerald-500/15 text-emerald-300'
              }`}>
                {rec.level === 'critical' ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" /> :
                 rec.level === 'warning'  ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" /> :
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />}
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page SEO Analysis Table ────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <FileText className="text-indigo-400 h-5 w-5" />
          Page SEO Analysis Table
          {crawlData?.siteWideImages?.perPage?.length > 0 && (
            <span className="ml-auto px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black">
              {crawlData.siteWideImages.perPage.length} pages
            </span>
          )}
        </h3>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/80 backdrop-blur">
                <th className="py-3 px-3">URL</th>
                <th className="py-3 px-3 text-center">URL Quality</th>
                <th className="py-3 px-3">Title</th>
                <th className="py-3 px-3 text-center">Title Len</th>
                <th className="py-3 px-3">Meta Description</th>
                <th className="py-3 px-3 text-center">Desc Len</th>
                <th className="py-3 px-3">SEO Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Build rows — use crawl per-page data if available, else just homepage
                const crawlPages = crawlData?.siteWideImages?.perPage || [];
                const rows = crawlPages.length > 0
                  ? crawlPages.map(p => ({
                      url:   p.pageLabel || p.pageUrl,
                      fullUrl: p.pageUrl,
                      titleText: p.pageTitle || '',
                      descText:  p.pageDesc  || '',
                    }))
                  : [{
                      url: '/ (homepage)',
                      fullUrl: activeTargetUrl,
                      titleText: title?.text || '',
                      descText:  metaDescription?.text || '',
                    }];

                // Detect duplicates
                const titleCounts = {};
                const descCounts  = {};
                rows.forEach(r => {
                  if (r.titleText) titleCounts[r.titleText] = (titleCounts[r.titleText] || 0) + 1;
                  if (r.descText)  descCounts[r.descText]   = (descCounts[r.descText]   || 0) + 1;
                });

                return rows.map((row, idx) => {
                  const { url, fullUrl, titleText, descText } = row;
                  const pageUrlEval = evaluateUrlQualityClient(fullUrl || url);
                  const isDupTitle = titleText && titleCounts[titleText] > 1;
                  const isDupDesc  = descText  && descCounts[descText]   > 1;
                  const issues = [];
                  if (!titleText) issues.push('No title');
                  else if (titleText.length < 30 || titleText.length > 65) issues.push('Title length');
                  if (isDupTitle) issues.push('Dup title');
                  if (!descText)  issues.push('No desc');
                  else if (descText.length < 120 || descText.length > 160) issues.push('Desc length');
                  if (isDupDesc)  issues.push('Dup desc');
                  if (pageUrlEval.score < 70) issues.push('URL Structure');
                  const status = issues.length === 0 ? 'ok' : issues.some(i => i.startsWith('No ')) ? 'poor' : 'warning';
                  return (
                    <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-all">
                      <td className="py-2.5 px-3 font-mono text-indigo-400 text-[10px] max-w-[140px] truncate" title={fullUrl || url}>
                        {url}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] border ${getGradeColor(pageUrlEval.grade)}`}>
                          {pageUrlEval.score} ({pageUrlEval.grade})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[160px]">
                        <p className={`text-[10px] truncate ${isDupTitle ? 'text-amber-300' : 'text-slate-300'}`} title={titleText}>
                          {titleText || <span className="text-rose-400 italic">Missing</span>}
                        </p>
                        {isDupTitle && <span className="text-[8px] text-amber-400 font-bold">DUPLICATE</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-bold text-[10px] ${titleText.length >= 30 && titleText.length <= 65 ? 'text-emerald-400' : titleText.length > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {titleText.length}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px]">
                        <p className={`text-[10px] truncate ${isDupDesc ? 'text-amber-300' : 'text-slate-400'}`} title={descText}>
                          {descText || <span className="text-rose-400 italic">Missing</span>}
                        </p>
                        {isDupDesc && <span className="text-[8px] text-amber-400 font-bold">DUPLICATE</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-bold text-[10px] ${descText.length >= 120 && descText.length <= 160 ? 'text-emerald-400' : descText.length > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {descText.length}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border whitespace-nowrap ${
                          status === 'ok'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          status === 'poor' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {status === 'ok' ? '✓ GOOD' : issues.slice(0, 2).join(', ')}
                        </span>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        {(!crawlData || !crawlData.siteWideImages?.perPage?.length) && (
          <p className="text-[9px] text-slate-500 italic mt-3">
            * Showing homepage data only. Click <strong>Run Scan</strong> then wait for the deep crawl to complete to see all pages.
          </p>
        )}
      </div>

      {/* ── SEO Warning Engine ────────────────────────────────────────────── */}
      {(() => {
        const crawlPages = crawlData?.siteWideImages?.perPage || [];
        const rows = crawlPages.length > 0
          ? crawlPages.map(p => ({ url: p.pageLabel || p.pageUrl, titleText: p.pageTitle || '', descText: p.pageDesc || '' }))
          : [{ url: '/ (homepage)', titleText: title?.text || '', descText: metaDescription?.text || '' }];

        const titleCounts = {};
        const descCounts  = {};
        rows.forEach(r => {
          if (r.titleText) titleCounts[r.titleText] = (titleCounts[r.titleText] || 0) + 1;
          if (r.descText)  descCounts[r.descText]   = (descCounts[r.descText]   || 0) + 1;
        });

        const warnings = [];
        rows.forEach(r => {
          if (!r.titleText) {
            warnings.push({ url: r.url, issue: 'Missing Title', value: '0 chars', fix: 'Add a descriptive page title (30–60 characters)', level: 'critical' });
          } else if (r.titleText.length < 30) {
            warnings.push({ url: r.url, issue: 'Title Too Short', value: `${r.titleText.length} chars`, fix: 'Recommended: 30–60 characters. Expand the title to better describe the page.', level: 'warning' });
          } else if (r.titleText.length > 60) {
            warnings.push({ url: r.url, issue: 'Title Too Long', value: `${r.titleText.length} chars`, fix: 'Recommended: 30–60 characters. Shorten the title to avoid truncation in SERPs.', level: 'warning' });
          }
          if (titleCounts[r.titleText] > 1) {
            warnings.push({ url: r.url, issue: 'Duplicate Title', value: `"${r.titleText.substring(0, 30)}…"`, fix: 'Each page should have a unique title tag to rank independently.', level: 'warning' });
          }
          if (!r.descText) {
            warnings.push({ url: r.url, issue: 'Missing Meta Description', value: '0 chars', fix: 'Add a meta description (120–160 characters) to improve click-through rates.', level: 'critical' });
          } else if (r.descText.length < 120) {
            warnings.push({ url: r.url, issue: 'Meta Description Too Short', value: `${r.descText.length} chars`, fix: 'Recommended: 120–160 characters. Expand the description to improve SEO visibility.', level: 'warning' });
          } else if (r.descText.length > 160) {
            warnings.push({ url: r.url, issue: 'Meta Description Too Long', value: `${r.descText.length} chars`, fix: 'Recommended: 120–160 characters. Shorten to avoid truncation in search results.', level: 'warning' });
          }
          if (descCounts[r.descText] > 1 && r.descText) {
            warnings.push({ url: r.url, issue: 'Duplicate Meta Description', value: `"${r.descText.substring(0, 30)}…"`, fix: 'Each page should have a unique meta description.', level: 'warning' });
          }
        });

        if (warnings.length === 0) return (
          <div className="glass-card p-5 flex items-center gap-3 border-l-4 border-l-emerald-500">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-emerald-400">No SEO Warnings</p>
              <p className="text-[10px] text-slate-500 mt-0.5">All page titles and meta descriptions are within recommended ranges.</p>
            </div>
          </div>
        );

        return (
          <div className="glass-card p-6">
            <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
              <AlertTriangle className="text-amber-400 h-5 w-5" />
              SEO Warnings
              <span className="ml-auto px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-black">{warnings.length} issues</span>
            </h3>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0">
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/80 backdrop-blur">
                    <th className="py-2.5 px-3">Page URL</th>
                    <th className="py-2.5 px-3">Issue Type</th>
                    <th className="py-2.5 px-3">Current Value</th>
                    <th className="py-2.5 px-3">Recommended Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((w, idx) => (
                    <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-all">
                      <td className="py-2.5 px-3 font-mono text-indigo-400 text-[10px] max-w-[140px] truncate" title={w.url}>{w.url}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${w.level === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {w.issue}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono text-[10px]">{w.value}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px] max-w-[220px]">{w.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── Heading Structure Analysis ────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <Layers className="text-indigo-400 h-5 w-5" />
          Heading Structure Analysis
        </h3>

        {/* Heading score */}
        {(() => {
          let score = 100;
          const warns = [];
          if ((headings?.h1 || []).length === 0) { score -= 40; warns.push({ level: 'critical', text: 'Missing H1 — every page needs exactly one H1 heading for topic clarity.' }); }
          else if ((headings?.h1 || []).length > 1) { score -= 20; warns.push({ level: 'warning', text: `Multiple H1 tags (${headings.h1.length}) — use only one H1 per page.` }); }
          if ((headings?.h2 || []).length === 0) { score -= 15; warns.push({ level: 'warning', text: 'No H2 tags — add H2 headings to structure page content into sections.' }); }
          if ((headings?.h2 || []).length > 0 && (headings?.h1 || []).length === 0) { score -= 10; warns.push({ level: 'warning', text: 'Poor heading hierarchy — H2 tags exist but H1 is missing.' }); }

          const hScore = Math.max(0, score);
          const hColor = hScore >= 80 ? 'text-emerald-400' : hScore >= 60 ? 'text-amber-400' : 'text-rose-400';
          const hBorder = hScore >= 80 ? 'border-emerald-500/20' : hScore >= 60 ? 'border-amber-500/20' : 'border-rose-500/20';

          return (
            <div className="space-y-4">
              {/* Score badge */}
              <div className={`flex items-center gap-3 p-3 bg-blue-100 border ${hBorder} rounded-xl`}>
                <div className={`text-2xl font-black ${hColor}`}>{hScore}</div>
                <div>
                  <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Heading Score</p>
                  <p className="text-[9px] text-blue-700 mt-0.5">Based on H1, H2, H3 structure and hierarchy</p>
                </div>
              </div>

              {/* Warnings */}
              {warns.map((w, i) => (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border text-[10px] ${w.level === 'critical' ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' : 'bg-amber-500/5 border-amber-500/15 text-amber-300'}`}>
                  {w.level === 'critical' ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />}
                  <span>{w.text}</span>
                </div>
              ))}

              {/* Heading tree */}
              <div className="space-y-1.5">
                {(headings?.h1 || []).length > 0 && (headings.h1 || []).map((h, i) => (
                  <div key={`h1-${i}`} className="flex items-start gap-2 p-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg">
                    <span className="shrink-0 text-[8px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded">H1</span>
                    <span className="text-xs text-blue-600 font-semibold">{h}</span>
                  </div>
                ))}
                {(headings?.h2 || []).length > 0 && (headings.h2 || []).slice(0, 8).map((h, i) => (
                  <div key={`h2-${i}`} className="flex items-start gap-2 p-2 bg-slate-800/20 border border-slate-800/40 rounded-lg ml-4">
                    <span className="shrink-0 text-[8px] font-black text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded">H2</span>
                    <span className="text-xs text-slate-300">{h}</span>
                  </div>
                ))}
                {(headings?.h2 || []).length > 8 && <p className="text-[9px] text-slate-500 italic ml-4">+{(headings.h2 || []).length - 8} more H2 headings</p>}
                {(headings?.h3 || []).length > 0 && (headings.h3 || []).slice(0, 6).map((h, i) => (
                  <div key={`h3-${i}`} className="flex items-start gap-2 p-2 bg-slate-800/10 border border-slate-800/20 rounded-lg ml-8">
                    <span className="shrink-0 text-[8px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">H3</span>
                    <span className="text-xs text-slate-400">{h}</span>
                  </div>
                ))}
                {(headings?.h3 || []).length > 6 && <p className="text-[9px] text-slate-500 italic ml-8">+{(headings.h3 || []).length - 6} more H3 headings</p>}
                {(!(headings?.h1 || []).length && !(headings?.h2 || []).length && !(headings?.h3 || []).length) && (
                  <div className="p-4 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No heading tags detected on this page.
                  </div>
                )}
              </div>

              {/* H count summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'H1 Count', count: (headings?.h1 || []).length, ideal: '= 1', ok: (headings?.h1 || []).length === 1 },
                  { label: 'H2 Count', count: (headings?.h2 || []).length, ideal: '≥ 2', ok: (headings?.h2 || []).length >= 2 },
                  { label: 'H3 Count', count: (headings?.h3 || []).length, ideal: 'optional', ok: true },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-slate-800/30 border border-slate-700/40 rounded-xl text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={`text-xl font-black ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{item.count}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Ideal: {item.ideal}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── SEO Issues Panel ──────────────────────────────────────────────── */}
      {(() => {
        const issues = [];
        if (!title?.text) issues.push({ icon: '❌', type: 'Missing Title Tag', rec: 'Add a unique, descriptive title tag (30–60 characters) to every page. This is the most important on-page SEO element.' });
        else if (title.text.length < 30) issues.push({ icon: '⚠', type: 'Title Too Short', rec: `Current: ${title.text.length} chars. Expand to at least 30 characters to better describe the page and target keywords.` });
        else if (title.text.length > 60) issues.push({ icon: '⚠', type: 'Title Too Long', rec: `Current: ${title.text.length} chars. Shorten to under 60 chars to avoid truncation in Google search results.` });
        if (!metaDescription?.text) issues.push({ icon: '❌', type: 'Missing Meta Description', rec: 'Add a compelling meta description (120–160 chars). It appears in SERPs and directly affects click-through rates.' });
        else if (metaDescription.text.length < 120) issues.push({ icon: '⚠', type: 'Meta Description Too Short', rec: `Current: ${metaDescription.text.length} chars. Aim for 120–160 characters to maximise SERP real estate.` });
        else if (metaDescription.text.length > 160) issues.push({ icon: '⚠', type: 'Meta Description Too Long', rec: `Current: ${metaDescription.text.length} chars. Trim to under 160 chars to prevent truncation in search results.` });
        if ((headings?.h1 || []).length === 0) issues.push({ icon: '❌', type: 'Missing H1 Heading', rec: 'Every page must have exactly one H1 heading. It signals the main topic to search engines.' });
        if ((headings?.h1 || []).length > 1) issues.push({ icon: '⚠', type: 'Multiple H1 Tags', rec: `Found ${headings.h1.length} H1 tags. Use only one H1 per page — use H2/H3 for sub-sections.` });
        if ((headings?.h2 || []).length === 0) issues.push({ icon: '⚠', type: 'No H2 Tags', rec: 'Add H2 headings to structure your content into clear sections for both users and crawlers.' });
        const missingAlt = (imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0);
        if (missingAlt > 0) issues.push({ icon: '⚠', type: 'Missing Image ALT Text', rec: `${missingAlt} image${missingAlt > 1 ? 's' : ''} missing ALT attributes. ALT text improves accessibility and helps images rank in Google Images.` });
        if ((links?.brokenCount || 0) > 0) issues.push({ icon: '❌', type: 'Broken Links', rec: `${links.brokenCount} broken link${links.brokenCount > 1 ? 's' : ''} detected. Fix or remove broken links — they hurt crawlability and user experience.` });
        if (!canonical?.text) issues.push({ icon: '⚠', type: 'Missing Canonical Tag', rec: 'Add a canonical URL to prevent duplicate content penalties when pages are accessible via multiple URLs.' });
        if (!robotsTxt?.exists) issues.push({ icon: '⚠', type: 'Missing robots.txt', rec: 'Create a robots.txt file to guide search engine crawlers and prevent indexing of unwanted pages.' });
        if (!sitemap?.exists) issues.push({ icon: '⚠', type: 'Missing sitemap.xml', rec: 'Submit a sitemap.xml to help search engines discover and index all your pages efficiently.' });
        if (!mobileFriendliness?.viewportConfigured) issues.push({ icon: '❌', type: 'Missing Viewport Meta Tag', rec: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness.' });

        if (issues.length === 0) return null;
        return (
          <div className="glass-card p-6">
            <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
              <Sparkles className="text-indigo-400 h-5 w-5" />
              SEO Issues &amp; Recommendations
              <span className="ml-auto px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black">{issues.length} to fix</span>
            </h3>
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div key={idx} className="p-4 bg-slate-800/20 border border-slate-700/40 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{issue.icon}</span>
                    <p className="text-xs font-extrabold text-slate-200">{issue.type}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pl-6">{issue.rec}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
