/**
 * pageAnalysisService.js
 *
 * Full-website BFS crawler for page discovery and image analysis.
 * Designed to run independently of the main monitoring scan so it
 * never blocks uptime checks, SEO audits, or any other existing feature.
 *
 * Crawl strategy:
 *   1. Fetch sitemap.xml — seed the queue with all <loc> URLs (same origin only).
 *   2. BFS over internal links up to MAX_PAGES pages and MAX_DEPTH levels deep.
 *   3. Concurrency-limited fetching (CONCURRENCY simultaneous requests).
 *   4. Per-request timeout of PAGE_TIMEOUT_MS.
 *   5. Collect every <img> on every page, deduplicate by resolved src.
 */

const axios  = require('axios');
const https  = require('https');

// ── Tuning constants ──────────────────────────────────────────────────────────
const MAX_PAGES       = 100;   // hard cap on pages crawled
const MAX_DEPTH       = 4;     // BFS depth limit
const CONCURRENCY     = 5;     // parallel fetches at a time
const PAGE_TIMEOUT_MS = 5000;  // per-page fetch timeout

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const httpClient = axios.create({
  timeout: PAGE_TIMEOUT_MS,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MonitorProSRE/2.0; +https://monitorpro.sre)' },
  validateStatus: () => true,
  httpsAgent,
  maxRedirects: 5,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise a URL: strip fragment, trailing slash, lowercase scheme+host */
const normalise = (raw) => {
  try {
    const u = new URL(raw);
    u.hash = '';
    // Remove trailing slash from pathname (except root)
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch (e) {
    return null;
  }
};

/** Extract all same-origin <a href> links from HTML */
const extractInternalLinks = (html, pageUrl, hostname) => {
  const links = new Set();
  const re = /<a[\s][^>]*href=["']([^"'#?][^"']*)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      const abs = new URL(href, pageUrl);
      if (abs.hostname === hostname) {
        const norm = normalise(abs.href);
        if (norm) links.add(norm);
      }
    } catch (e) {}
  }
  return links;
};

/** Extract all <img> tags and return structured records */
const extractImages = (html, pageUrl) => {
  if (!html) return [];
  const images = [];
  const re = /<img([^>]*)\/?>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    // src / data-src / srcset (take first token)
    const srcM = attrs.match(/\bsrc=["']([^"']*)["']/i)
              || attrs.match(/\bdata-src=["']([^"']*)["']/i)
              || attrs.match(/\bsrcset=["']([^"']*?)["']/i);
    const altM  = attrs.match(/\balt=["']([^"']*)["']/i);
    const hasAlt = /\balt=/i.test(attrs);
    const loading = (attrs.match(/\bloading=["']([^"']*)["']/i) || [])[1] || '';

    const rawSrc = srcM ? srcM[1].split(',')[0].trim().split(' ')[0] : '';
    if (!rawSrc || rawSrc.startsWith('data:')) continue;

    let resolvedSrc = rawSrc;
    if (!rawSrc.startsWith('http')) {
      try { resolvedSrc = new URL(rawSrc, pageUrl).href; } catch (e) { continue; }
    }

    const altText  = altM ? altM[1].trim() : null;
    const altStatus = !hasAlt ? 'missing' : altText === '' ? 'empty' : 'ok';

    images.push({
      src:          resolvedSrc.substring(0, 300),
      altStatus,
      alt:          altText,
      isLazyLoaded: loading.toLowerCase() === 'lazy',
      foundOnPage:  pageUrl,
    });
  }
  return images;
};

/** Suggest a human-readable ALT text from an image src */
const suggestAlt = (src) => {
  if (!src) return 'Website image';
  let decoded = src;
  try { decoded = decodeURIComponent(src); } catch (e) {}
  const parts  = decoded.split('?')[0].split('/');
  let filename = parts.pop() || '';
  const folder = parts[parts.length - 1] || '';
  let base     = filename.replace(/\.[a-zA-Z0-9]+$/, '');
  const isHash = /^[0-9a-fA-F-_]{8,}$/.test(base.replace(/[-_]/g, ''));
  if (isHash) base = folder && !/^(uploads|images|assets|media|static|img)$/i.test(folder) ? `${folder} image` : 'Content illustration';
  base = base.replace(/[-_]\d+x\d+/g, '').replace(/[-_](scaled|thumb|thumbnail|medium|large)/gi, '');
  base = base.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_+]/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = base.toLowerCase();
  if (lower === 'logo')   base = 'Brand logo';
  else if (lower === 'banner') base = 'Hero banner';
  else if (lower === 'icon')   base = 'Navigation icon';
  else if (lower === 'avatar') base = 'User avatar';
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Website image';
};

/** Run an array of async tasks with a concurrency limit */
const runWithConcurrency = async (tasks, limit) => {
  const results = [];
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  });
  await Promise.all(workers);
  return results;
};

// ── Sitemap seed ──────────────────────────────────────────────────────────────

const seedFromSitemap = async (origin, hostname) => {
  const urls = new Set();
  try {
    const resp = await httpClient.get(`${origin}/sitemap.xml`, { timeout: 6000 });
    if (resp.status === 200 && typeof resp.data === 'string') {
      // Handle sitemap index (nested sitemaps)
      const indexMatches = [...resp.data.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)];
      for (const m of indexMatches) {
        const loc = m[1].trim();
        if (!loc) continue;
        // If it's a sub-sitemap, fetch it too
        if (loc.endsWith('.xml')) {
          try {
            const sub = await httpClient.get(loc, { timeout: 4000 });
            if (sub.status === 200 && typeof sub.data === 'string') {
              const subLocs = [...sub.data.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)];
              for (const sm of subLocs) {
                const sloc = sm[1].trim();
                try {
                  const parsed = new URL(sloc);
                  if (parsed.hostname === hostname) {
                    const norm = normalise(parsed.href);
                    if (norm) urls.add(norm);
                  }
                } catch (e) {}
              }
            }
          } catch (e) {}
        } else {
          try {
            const parsed = new URL(loc);
            if (parsed.hostname === hostname) {
              const norm = normalise(parsed.href);
              if (norm) urls.add(norm);
            }
          } catch (e) {}
        }
        if (urls.size >= MAX_PAGES * 2) break; // don't over-seed
      }
    }
  } catch (e) {}
  return urls;
};

// ── Main crawler ──────────────────────────────────────────────────────────────

/**
 * Crawl the entire website using BFS.
 *
 * @param {string} startUrl   - The URL entered by the user (homepage).
 * @param {string} homepageHtml - Already-fetched homepage HTML (reuse, no double fetch).
 * @returns {Promise<object>}  site_structure payload + per-page breakdown.
 */
const crawlWebsite = async (startUrl, homepageHtml = '') => {
  const startTime = Date.now();
  const parsed    = new URL(startUrl);
  const hostname  = parsed.hostname;
  const origin    = parsed.origin;
  const normStart = normalise(startUrl);

  // Visited set and BFS queue: { url, depth }
  const visited  = new Set();
  const queue    = [];
  const pageData = []; // { pageUrl, pageLabel, totalImages, withAlt, missingAlt, lazyLoaded }

  // All images across the site, keyed by src for deduplication
  const imageMap = new Map(); // src -> { altStatus, alt, isLazyLoaded, foundOnPage, appearsOnPages }

  // ── Seed from sitemap ──
  const sitemapUrls = await seedFromSitemap(origin, hostname);
  let usedSitemap   = sitemapUrls.size > 0;

  // Always start with the homepage
  queue.push({ url: normStart, depth: 0 });
  visited.add(normStart);

  // Add sitemap URLs to queue (depth 1 since we haven't crawled them yet)
  for (const u of sitemapUrls) {
    if (!visited.has(u) && visited.size < MAX_PAGES) {
      visited.add(u);
      queue.push({ url: u, depth: 1 });
    }
  }

  // ── BFS loop ──
  while (queue.length > 0 && pageData.length < MAX_PAGES) {
    // Take a batch of up to CONCURRENCY items
    const batch = queue.splice(0, CONCURRENCY);

    const tasks = batch.map(({ url: pageUrl, depth }) => async () => {
      // Fetch HTML — reuse homepage HTML if this is the start URL
      let html = '';
      const isHomepage = pageUrl === normStart || pageUrl === normStart + '/';
      if (isHomepage && homepageHtml) {
        html = homepageHtml;
      } else {
        try {
          const resp = await httpClient.get(pageUrl, { timeout: PAGE_TIMEOUT_MS });
          if (resp.status === 200 && typeof resp.data === 'string') {
            html = resp.data;
          } else {
            return; // skip non-200 pages
          }
        } catch (e) {
          return; // skip unreachable pages
        }
      }

      // Extract images
      const imgs = extractImages(html, pageUrl);
      let withAlt = 0, missingAlt = 0, lazyLoaded = 0;

      for (const img of imgs) {
        if (img.altStatus === 'ok') withAlt++;
        else missingAlt++;
        if (img.isLazyLoaded) lazyLoaded++;

        // Merge into site-wide image map
        if (img.src) {
          if (imageMap.has(img.src)) {
            imageMap.get(img.src).appearsOnPages.add(pageUrl);
          } else {
            imageMap.set(img.src, {
              src:          img.src,
              altStatus:    img.altStatus,
              alt:          img.alt,
              isLazyLoaded: img.isLazyLoaded,
              foundOnPage:  pageUrl,
              appearsOnPages: new Set([pageUrl]),
            });
          }
        }
      }

      const pageLabel = pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/';
      // Extract title and meta description for SEO table
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const descMatch  = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                         html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      const pageTitle   = titleMatch ? titleMatch[1].trim().substring(0, 120) : '';
      const pageDesc    = descMatch  ? descMatch[1].trim().substring(0, 200)  : '';

      pageData.push({
        pageUrl,
        pageLabel,
        pageTitle,
        pageDesc,
        totalImages: imgs.length,
        withAlt,
        missingAlt,
        lazyLoaded,
      });

      // Discover new internal links (only if within depth limit)
      if (depth < MAX_DEPTH && pageData.length < MAX_PAGES) {
        const links = extractInternalLinks(html, pageUrl, hostname);
        for (const link of links) {
          if (!visited.has(link) && pageData.length + queue.length < MAX_PAGES) {
            visited.add(link);
            queue.push({ url: link, depth: depth + 1 });
          }
        }
      }
    });

    await runWithConcurrency(tasks, CONCURRENCY);
  }

  // ── Aggregate site-wide image stats ──
  let totalImages    = 0;
  let imagesWithAlt  = 0;
  let imagesWithoutAlt = 0;
  let lazyLoadedTotal = 0;

  for (const [, img] of imageMap) {
    totalImages++;
    if (img.altStatus === 'ok') imagesWithAlt++;
    else imagesWithoutAlt++;
    if (img.isLazyLoaded) lazyLoadedTotal++;
  }

  // Build missing-ALT list (capped at 100 for payload size)
  const missingAltImages = [];
  for (const [, img] of imageMap) {
    if (img.altStatus !== 'ok') {
      missingAltImages.push({
        src:           img.src,
        altStatus:     img.altStatus,
        suggestedAlt:  suggestAlt(img.src),
        foundOnPage:   img.foundOnPage,
        appearsOnPages: [...img.appearsOnPages].slice(0, 10),
      });
      if (missingAltImages.length >= 100) break;
    }
  }

  const crawlLimitReached = pageData.length >= MAX_PAGES;
  const elapsedMs = Date.now() - startTime;

  return {
    // ── API contract field (as specified in requirements) ──
    site_structure: {
      total_pages:          pageData.length,
      total_images:         totalImages,
      images_with_alt:      imagesWithAlt,
      images_without_alt:   imagesWithoutAlt,
    },
    // ── Extended fields for dashboard ──
    pageCount: {
      estimatedPages:    pageData.length,
      sitemapCount:      usedSitemap ? sitemapUrls.size : 0,
      internalLinkCount: visited.size,
      source:            usedSitemap ? 'sitemap.xml + BFS crawl' : 'BFS crawl',
      confidence:        usedSitemap ? 'high' : pageData.length > 1 ? 'medium' : 'low',
    },
    siteWideImages: {
      totalImages,
      withAlt:           imagesWithAlt,
      missingAlt:        imagesWithoutAlt,
      lazyLoaded:        lazyLoadedTotal,
      altCompliancePct:  totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 100,
      pagesScanned:      pageData.length,
      pagesWithImages:   pageData.filter(p => p.totalImages > 0).length,
      missingAltImages,
      perPage:           pageData,
    },
    crawlMeta: {
      pagesDiscovered:   visited.size,
      pagesCrawled:      pageData.length,
      crawlLimitReached,
      maxPagesLimit:     MAX_PAGES,
      maxDepthLimit:     MAX_DEPTH,
      elapsedMs,
      usedSitemap,
    },
    analyzedAt: new Date().toISOString(),
  };
};

// ── Tech stack detection (unchanged) ─────────────────────────────────────────

const detectTechStack = (html = '', headers = {}) => {
  const detected = [];
  const h = html.toLowerCase();
  const server  = (headers['server'] || '').toLowerCase();
  const powered = (headers['x-powered-by'] || '').toLowerCase();

  if (h.includes('__next') || h.includes('_next/static') || h.includes('next/dist')) detected.push({ name: 'Next.js', category: 'Framework', icon: '▲' });
  if (h.includes('react') || h.includes('__react') || h.includes('data-reactroot') || h.includes('data-reactid')) detected.push({ name: 'React', category: 'UI Library', icon: '⚛' });
  if (h.includes('ng-version') || h.includes('ng-app') || h.includes('angular') || h.includes('[ng-')) detected.push({ name: 'Angular', category: 'Framework', icon: '🅰' });
  if (h.includes('vue') || h.includes('__vue') || h.includes('data-v-') || h.includes('v-app')) detected.push({ name: 'Vue.js', category: 'Framework', icon: '💚' });
  if (h.includes('nuxt') || h.includes('__nuxt')) detected.push({ name: 'Nuxt.js', category: 'Framework', icon: '🟢' });
  if (h.includes('svelte') || h.includes('__svelte')) detected.push({ name: 'Svelte', category: 'Framework', icon: '🔥' });
  if (h.includes('/wp-content/') || h.includes('/wp-includes/') || h.includes('wp-json')) detected.push({ name: 'WordPress', category: 'CMS', icon: '🔵' });
  if (h.includes('shopify') || h.includes('cdn.shopify.com') || h.includes('myshopify.com')) detected.push({ name: 'Shopify', category: 'E-Commerce', icon: '🛍' });
  if (h.includes('woocommerce') || (h.includes('wc-') && h.includes('wp-content'))) detected.push({ name: 'WooCommerce', category: 'E-Commerce', icon: '🛒' });
  if (h.includes('drupal') || h.includes('/sites/default/files/')) detected.push({ name: 'Drupal', category: 'CMS', icon: '💧' });
  if (h.includes('joomla') || h.includes('/media/jui/')) detected.push({ name: 'Joomla', category: 'CMS', icon: '🟡' });
  if (h.includes('ghost') || h.includes('ghost-url')) detected.push({ name: 'Ghost', category: 'CMS', icon: '👻' });
  if (h.includes('webflow') || h.includes('data-wf-')) detected.push({ name: 'Webflow', category: 'Builder', icon: '🌊' });
  if (h.includes('squarespace') || h.includes('static.squarespace.com')) detected.push({ name: 'Squarespace', category: 'Builder', icon: '⬛' });
  if (h.includes('wix.com') || h.includes('wixsite.com') || h.includes('_wix_')) detected.push({ name: 'Wix', category: 'Builder', icon: '🔷' });
  if (powered.includes('php') || h.includes('.php') || h.includes('<?php')) detected.push({ name: 'PHP', category: 'Backend', icon: '🐘' });
  if (powered.includes('express') || powered.includes('node')) detected.push({ name: 'Node.js / Express', category: 'Backend', icon: '🟩' });
  if (powered.includes('django') || h.includes('csrfmiddlewaretoken') || h.includes('django')) detected.push({ name: 'Django', category: 'Backend', icon: '🐍' });
  if (powered.includes('laravel') || h.includes('laravel') || h.includes('laravel_session')) detected.push({ name: 'Laravel', category: 'Backend', icon: '🔴' });
  if (powered.includes('rails') || h.includes('rails') || h.includes('data-turbo')) detected.push({ name: 'Ruby on Rails', category: 'Backend', icon: '💎' });
  if (server.includes('nginx')) detected.push({ name: 'Nginx', category: 'Server', icon: '🟢' });
  if (server.includes('apache')) detected.push({ name: 'Apache', category: 'Server', icon: '🪶' });
  if (server.includes('cloudflare')) detected.push({ name: 'Cloudflare', category: 'CDN', icon: '🌐' });
  if (h.includes('bootstrap') || h.includes('btn-primary') || h.includes('col-md-') || h.includes('navbar-toggler')) detected.push({ name: 'Bootstrap', category: 'CSS Framework', icon: '🅱' });
  if (h.includes('tailwind') || h.includes('tw-') || h.includes('class="flex ') || h.includes("class='flex ")) detected.push({ name: 'Tailwind CSS', category: 'CSS Framework', icon: '🌬' });
  if (h.includes('bulma') || (h.includes('is-primary') && h.includes('columns'))) detected.push({ name: 'Bulma', category: 'CSS Framework', icon: '💪' });
  if (h.includes('materialize') || h.includes('material-icons')) detected.push({ name: 'Materialize', category: 'CSS Framework', icon: '🎨' });
  if (h.includes('foundation') && h.includes('zurb')) detected.push({ name: 'Foundation', category: 'CSS Framework', icon: '🏗' });
  if (h.includes('jquery') || h.includes('jquery.min.js') || h.includes('jquery-')) detected.push({ name: 'jQuery', category: 'JS Library', icon: '💲' });
  if (h.includes('lodash') || h.includes('underscore.js')) detected.push({ name: 'Lodash', category: 'JS Library', icon: '🔧' });
  if (h.includes('gsap') || h.includes('greensock')) detected.push({ name: 'GSAP', category: 'Animation', icon: '✨' });
  if (h.includes('three.js') || h.includes('threejs')) detected.push({ name: 'Three.js', category: '3D Library', icon: '🎲' });
  if (h.includes('d3.js') || h.includes('d3.min.js') || h.includes('d3-')) detected.push({ name: 'D3.js', category: 'Data Viz', icon: '📊' });
  if (h.includes('chart.js') || h.includes('chartjs')) detected.push({ name: 'Chart.js', category: 'Data Viz', icon: '📈' });
  if (h.includes('google-analytics') || h.includes('gtag') || h.includes("ga('create'")) detected.push({ name: 'Google Analytics', category: 'Analytics', icon: '📉' });
  if (h.includes('googletagmanager') || h.includes('gtm.js')) detected.push({ name: 'Google Tag Manager', category: 'Analytics', icon: '🏷' });
  if (h.includes('hotjar') || h.includes("hj('")) detected.push({ name: 'Hotjar', category: 'Analytics', icon: '🔥' });
  if (h.includes('intercom') || h.includes('intercomSettings')) detected.push({ name: 'Intercom', category: 'Support', icon: '💬' });
  if (h.includes('zendesk') || h.includes('zopim')) detected.push({ name: 'Zendesk', category: 'Support', icon: '🎫' });
  if (h.includes('stripe') || h.includes('js.stripe.com')) detected.push({ name: 'Stripe', category: 'Payments', icon: '💳' });
  if (h.includes('paypal') || h.includes('paypalobjects.com')) detected.push({ name: 'PayPal', category: 'Payments', icon: '🅿' });

  const seen = new Set();
  return detected.filter(t => { if (seen.has(t.name)) return false; seen.add(t.name); return true; });
};

// ── analyzePageStructure — called by existing checkWebsiteStatus ──────────────
// This is the FAST path: only homepage HTML, no extra fetches.
// It provides tech stack + a quick page/image estimate so the main scan
// always completes quickly. The deep crawl is done via /api/crawl separately.

const analyzePageStructure = async (url, html = '', headers = {}) => {
  const techStack = detectTechStack(html, headers);

  // Quick page count from sitemap (no BFS here — keep it fast)
  let sitemapCount = 0;
  let internalLinkCount = 0;
  try {
    const origin = new URL(url).origin;
    const hostname = new URL(url).hostname;
    const sitemapResp = await httpClient.get(`${origin}/sitemap.xml`, { timeout: 4000 });
    if (sitemapResp.status === 200 && typeof sitemapResp.data === 'string') {
      sitemapCount = (sitemapResp.data.match(/<loc>/g) || []).length;
    }
    if (html) {
      const linkMatches = [...html.matchAll(/<a\s+[^>]*href=["']([^"'#?]*)["']/gi)];
      const paths = new Set();
      for (const m of linkMatches) {
        const href = m[1];
        if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
        try {
          const abs = new URL(href, url);
          if (abs.hostname === hostname && abs.pathname !== '/') paths.add(abs.pathname);
        } catch (e) {}
      }
      internalLinkCount = paths.size;
    }
  } catch (e) {}

  const estimatedPages = sitemapCount > 0 ? sitemapCount : Math.max(1, internalLinkCount + 1);

  return {
    pageCount: {
      estimatedPages,
      sitemapCount,
      internalLinkCount,
      source: sitemapCount > 0 ? 'sitemap.xml' : 'internal-links',
      confidence: sitemapCount > 0 ? 'high' : internalLinkCount > 0 ? 'medium' : 'low',
    },
    techStack,
    // siteWideImages is null here — populated by the /api/crawl deep scan
    siteWideImages: null,
    analyzedAt: new Date().toISOString(),
  };
};

module.exports = { analyzePageStructure, detectTechStack, crawlWebsite };
