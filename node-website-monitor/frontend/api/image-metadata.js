/**
 * Vercel Serverless Function: /api/image-metadata
 *
 * Runs directly on Vercel — no Render cold-start, no proxy timeout.
 * This replaces the Render-proxied route that was causing "pending forever"
 * in production because Render's free tier sleeps after 15 min inactivity.
 *
 * Localhost: handled by vite.config.js proxy → http://localhost:5000
 * Production: handled by THIS file running on Vercel infrastructure
 */

const https = require('https');
const http  = require('http');
const { URL } = require('url');

// Vercel function max duration (seconds) — set in vercel.json if needed
// Default is 10s on Hobby, 60s on Pro. We keep individual fetches under 8s.

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

// ── Format detection ─────────────────────────────────────────────────────────
function getFormat(urlStr, contentType) {
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (ct.includes('image/png'))  return 'png';
    if (ct.includes('image/jpeg') || ct.includes('image/jpg')) return 'jpg';
    if (ct.includes('image/gif'))  return 'gif';
    if (ct.includes('image/webp')) return 'webp';
    if (ct.includes('image/svg'))  return 'svg';
    if (ct.includes('image/avif')) return 'avif';
  }
  const clean = urlStr.split('?')[0].split('#')[0];
  const ext   = (clean.split('.').pop() || '').toLowerCase();
  if (['png','jpg','jpeg','gif','webp','svg','avif'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return 'png';
}

// ── Is this a valid image content-type? ─────────────────────────────────────
function isImageType(contentType, urlStr) {
  if (!contentType) return !!getFormat(urlStr, null);
  const ct = contentType.toLowerCase();
  if (ct.startsWith('image/')) return true;
  if (ct.includes('application/octet-stream')) return true;
  return false;
}

// ── Make an HTTP/HTTPS request with timeout, following redirects ─────────────
function makeRequest(urlStr, method, timeoutMs) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const done = (val) => { if (!resolved) { resolved = true; resolve(val); } };
    const fail = (err) => { if (!resolved) { resolved = true; reject(err); } };

    const attempt = (currentUrl, redirectsLeft) => {
      let parsedUrl;
      try { parsedUrl = new URL(currentUrl); } catch (e) { return fail(e); }

      const lib = parsedUrl.protocol === 'https:' ? https : http;
      const options = {
        hostname: parsedUrl.hostname,
        port:     parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path:     parsedUrl.pathname + parsedUrl.search,
        method,
        headers:  BROWSER_HEADERS,
        rejectUnauthorized: false,
        timeout: timeoutMs,
      };

      const req = lib.request(options, (res) => {
        const status = res.statusCode;
        const headers = res.headers;

        console.log(`[IMG] ${method} ${currentUrl} → ${status} CT:${headers['content-type'] || ''} CL:${headers['content-length'] || ''}`);

        // Follow redirects (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(status) && headers.location && redirectsLeft > 0) {
          res.resume(); // discard body
          const nextUrl = headers.location.startsWith('http')
            ? headers.location
            : new URL(headers.location, currentUrl).href;
          return attempt(nextUrl, redirectsLeft - 1);
        }

        if (method === 'HEAD') {
          res.resume(); // no body on HEAD
          return done({ status, headers, data: null });
        }

        // GET — collect body up to 25 MB
        const MAX_BYTES = 25 * 1024 * 1024;
        let totalBytes = 0;
        const chunks = [];

        res.on('data', (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes <= MAX_BYTES) {
            chunks.push(chunk);
          } else if (!resolved) {
            // Over limit — resolve with what we have + content-length header
            res.destroy();
            done({ status, headers, data: Buffer.concat(chunks), overLimit: true });
          }
        });

        res.on('end', () => {
          done({ status, headers, data: Buffer.concat(chunks) });
        });

        res.on('error', fail);
      });

      req.on('timeout', () => {
        req.destroy();
        fail(new Error(`TIMEOUT after ${timeoutMs}ms`));
      });

      req.on('error', fail);
      req.end();
    };

    attempt(urlStr, 5);
  });
}

// ── Fetch a single image and return metadata ─────────────────────────────────
async function fetchImageMetadata(imageUrl, baseUrl) {
  let resolvedUrl = imageUrl;

  if (baseUrl && !/^https?:\/\//i.test(imageUrl)) {
    try { resolvedUrl = new URL(imageUrl, baseUrl).href; } catch (e) {}
  }

  if (!resolvedUrl || !/^https?:\/\//i.test(resolvedUrl)) {
    return { imageUrl, actualFileSize: 0, isValid: false, httpStatus: null, errorReason: 'Invalid URL', format: 'png', contentLength: null };
  }

  console.log(`[IMG] Fetching: ${resolvedUrl}`);

  let httpStatus    = null;
  let contentType   = '';
  let contentLength = null;
  let actualFileSize = null;
  let errorReason   = null;
  let format        = null;

  // ── STEP 1: HEAD ──────────────────────────────────────────────────────────
  try {
    const head = await makeRequest(resolvedUrl, 'HEAD', 4000);
    httpStatus  = head.status;
    contentType = (head.headers['content-type'] || '').toLowerCase();

    if (head.status === 200 && isImageType(contentType, resolvedUrl)) {
      const cl = head.headers['content-length'];
      if (cl) {
        const parsed = parseInt(cl, 10);
        if (!isNaN(parsed) && parsed > 0) {
          contentLength  = parsed;
          actualFileSize = parsed;
          format         = getFormat(resolvedUrl, contentType);
          console.log(`[IMG] HEAD hit — size: ${actualFileSize} bytes`);
        }
      }
      if (!format) format = getFormat(resolvedUrl, contentType);
    }
    // Non-200 from HEAD → fall through to GET (CDNs often block HEAD)
  } catch (headErr) {
    console.log(`[IMG] HEAD threw: ${headErr.message} — trying GET`);
  }

  // ── STEP 2: GET (if HEAD didn't give us a size) ───────────────────────────
  if (actualFileSize === null) {
    try {
      const get = await makeRequest(resolvedUrl, 'GET', 5000);
      httpStatus  = get.status;
      contentType = (get.headers['content-type'] || '').toLowerCase();

      if (get.status === 200) {
        if (isImageType(contentType, resolvedUrl)) {
          format = getFormat(resolvedUrl, contentType);

          const cl = get.headers['content-length'];
          if (cl) {
            const parsed = parseInt(cl, 10);
            if (!isNaN(parsed) && parsed > 0) contentLength = parsed;
          }

          if (get.overLimit) {
            // Over 25 MB — use Content-Length if available, else 25 MB floor
            actualFileSize = contentLength || (25 * 1024 * 1024);
            errorReason    = null;
            console.log(`[IMG] GET over-limit — size: ${actualFileSize} bytes`);
          } else if (get.data && get.data.length > 0) {
            actualFileSize = get.data.length;
            errorReason    = null;
            console.log(`[IMG] GET success — size: ${actualFileSize} bytes`);
          } else if (contentLength && contentLength > 0) {
            actualFileSize = contentLength;
            errorReason    = null;
          } else {
            errorReason = 'Empty response body';
          }
        } else {
          errorReason = 'Access Denied'; // 200 but HTML/non-image = CDN block page
        }
      } else if (get.status === 403 || get.status === 401) {
        errorReason = 'Access Denied';
      } else {
        // Any other status (including 404) from a datacenter IP = CDN block, not missing
        errorReason = 'Access Denied';
      }
    } catch (getErr) {
      console.log(`[IMG] GET threw: ${getErr.message}`);
      if (getErr.message.includes('TIMEOUT')) {
        errorReason = 'Request Timeout';
      } else {
        errorReason = 'Access Denied';
      }
    }
  }

  if (!format) format = getFormat(resolvedUrl, null) || 'png';

  const isValid = actualFileSize !== null && actualFileSize > 0 && !errorReason;

  if (!isValid && !errorReason) {
    errorReason = httpStatus === null ? 'Network Unreachable' : 'Access Denied';
  }

  // ── Savings calculation ───────────────────────────────────────────────────
  let recommendedSize = 0, savingsBytes = 0, savingsPct = 0;
  if (isValid && actualFileSize > 0) {
    const f = format.toLowerCase();
    let r = 0.10;
    if      (f === 'png')               r = Math.min(0.80, 0.40 + (actualFileSize / (1024*1024)) * 0.40);
    else if (f === 'jpg' || f === 'jpeg') r = Math.min(0.70, 0.20 + (actualFileSize / (1024*1024)) * 0.50);
    else if (f === 'gif')               r = Math.min(0.90, 0.50 + (actualFileSize / (2*1024*1024)) * 0.40);
    else if (f === 'svg')               r = Math.min(0.30, 0.05 + (actualFileSize / (100*1024)) * 0.25);
    else if (f === 'webp')              r = 0.05;
    else if (f === 'avif')              r = 0.0;

    recommendedSize = Math.round(actualFileSize * (1 - r));
    savingsPct      = Math.round(r * 100);
    savingsBytes    = actualFileSize - recommendedSize;
  }

  console.log(`[IMG] RESULT ${resolvedUrl} → valid:${isValid} size:${actualFileSize} err:${errorReason}`);

  return {
    imageUrl,
    contentLength,
    actualFileSize: actualFileSize || 0,
    recommendedSize: isValid ? recommendedSize : 0,
    savingsBytes:    isValid ? savingsBytes    : 0,
    savingsPct:      isValid ? savingsPct      : 0,
    format,
    success:     isValid,
    httpStatus,
    isValid,
    errorReason: isValid ? null : errorReason,
  };
}

// ── Body parser helper (Vercel does NOT auto-parse JSON bodies) ──────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    // Already parsed by a middleware (e.g. during local testing via Express)
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// ── Vercel Serverless Function handler ───────────────────────────────────────
module.exports = async (req, res) => {
  // CORS — allow requests from any Vercel deployment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Parse body manually — Vercel serverless functions do not auto-parse JSON
  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const { urls, baseUrl } = body;
  if (!urls || !Array.isArray(urls)) {
    res.status(400).json({ error: 'Array of image URLs is required.' });
    return;
  }

  console.log(`[IMG API] Processing ${urls.length} URL(s), baseUrl: ${baseUrl}`);

  // Wrap each fetch with a hard 9s timeout so one slow URL
  // can't blow past Vercel Hobby's 10s function limit
  const withTimeout = (fn, ms) => Promise.race([
    fn,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
  ]);

  const settled = await Promise.allSettled(
    urls.map(u => withTimeout(fetchImageMetadata(u, baseUrl || ''), 9000))
  );

  const results = settled.map((outcome, i) => {
    if (outcome.status === 'fulfilled') return outcome.value;
    return {
      imageUrl:       urls[i],
      contentLength:  null,
      actualFileSize: 0,
      format:         'png',
      success:        false,
      isValid:        false,
      httpStatus:     null,
      errorReason:    outcome.reason?.message || 'Fetch failed',
    };
  });

  res.status(200).json({ success: true, results });
};
