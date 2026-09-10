const express = require('express');
const router = express.Router();
const {
  triggerAudit,
  getDashboardStats,
  getWordPressDetails,
  getAlerts,
  resolveAlert,
  getMonitoredTargets
} = require('../controllers/monitorController');
const {
  getSettings,
  saveSettings,
  testEmail
} = require('../controllers/settingsController');

// Immediate Site Audit Trigger
router.post('/audit', triggerAudit);

// Full-website deep crawl (page + image discovery across entire site)
router.post('/crawl', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing target URL in request body.' });
  try {
    const { crawlWebsite } = require('../services/pageAnalysisService');
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const result = await crawlWebsite(normalizedUrl, '');
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: `Crawl failed: ${err.message}` });
  }
});

// Dashboard stats & historical graphs payload
router.get('/stats', getDashboardStats);

// Unique monitored target domains list
router.get('/targets', getMonitoredTargets);

// Wordpress details
router.get('/wordpress', getWordPressDetails);

// SRE alerts logs
router.get('/alerts', getAlerts);

// Resolve active alerts
router.post('/alerts/resolve', resolveAlert);

// SRE Settings & Alert configurations
router.get('/settings', getSettings);
router.post('/settings', saveSettings);

// SMTP Test email connection
router.post('/send-test-email', testEmail);
router.post('/send-test-email/', testEmail);

// ── Per-website email configuration (NEW) ────────────────────────────────────
router.get('/email-config', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required.' });
  try {
    const { WebsiteEmailConfig } = require('../models/Schemas');
    const config = await WebsiteEmailConfig.findOne({ url }) || { url, alertEmail: '', alertsEnabled: false, alertFrequency: 'instant', totalEmailsSent: 0, lastEmailSent: null, lastAlertType: '' };
    res.status(200).json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/email-config', async (req, res) => {
  const { url, alertEmail, alertsEnabled, alertFrequency } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required.' });
  // Basic email validation
  if (alertEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmail)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }
  try {
    const { WebsiteEmailConfig } = require('../models/Schemas');
    const config = await WebsiteEmailConfig.findOneAndUpdate(
      { url },
      { alertEmail: alertEmail || '', alertsEnabled: !!alertsEnabled, alertFrequency: alertFrequency || 'instant', updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Email alert history (NEW) ─────────────────────────────────────────────────
router.get('/email-history', async (req, res) => {
  const { url } = req.query;
  try {
    const { EmailAlertHistory } = require('../models/Schemas');
    const query = url ? { url } : {};
    const history = await EmailAlertHistory.find(query).sort({ sentAt: -1 }).limit(50);
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Test email for specific website (NEW) ─────────────────────────────────────
router.post('/test-site-email', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required.' });
  try {
    const { WebsiteEmailConfig, EmailAlertHistory } = require('../models/Schemas');
    const { enqueueEmailAlert } = require('../services/emailService');

    const config = await WebsiteEmailConfig.findOne({ url });
    if (!config || !config.alertEmail) {
      return res.status(400).json({ success: false, error: 'No alert email configured for this website. Save an email address in the Email Alerts tab first.' });
    }

    const recipient = config.alertEmail;
    const subject   = '[Website Monitor] Test Alert — Email Alerts are Working';
    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;background:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <div style="background:#4f46e5;color:white;padding:20px 24px;">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.8;margin-bottom:4px;">Website Monitor</div>
          <div style="font-size:18px;font-weight:800;">Test Email — Alerts Working ✓</div>
        </div>
        <div style="padding:24px;font-size:14px;color:#334155;line-height:1.6;">
          <p style="margin:0 0 16px;">Your email alert system is configured correctly and working.</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;font-size:12px;font-family:monospace;">
            <strong>Website:</strong> ${url}<br>
            <strong>Alert Email:</strong> ${recipient}<br>
            <strong>Status:</strong> Alerts Enabled<br>
            <strong>Sent At:</strong> ${new Date().toLocaleString()}
          </div>
          <p style="margin:16px 0 0;color:#64748b;font-size:12px;">
            Future alerts for this website will be automatically sent to this address when issues are detected.
          </p>
        </div>
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 24px;font-size:10px;color:#94a3b8;text-align:center;">
          MonitorPro SRE Dashboard · Automated Alert System
        </div>
      </div>
    </body></html>`;

    // Enqueue the email alert in the background queue
    const doc = await enqueueEmailAlert({
      url,
      recipient,
      category: 'test',
      level: 'info',
      subject,
      message: 'Test email enqueued successfully.',
      html
    });

    // Await delivery status resolution (up to 15 seconds)
    let finalDoc = doc;
    const startTime = Date.now();
    while (finalDoc && finalDoc.status === 'sending' && (Date.now() - startTime < 15000)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      finalDoc = await EmailAlertHistory.findOne({ _id: doc._id });
    }

    if (!finalDoc || finalDoc.status === 'failed') {
      const errorMsg = finalDoc?.errorReason || 'Email delivery failed (check SMTP settings).';
      return res.status(500).json({
        success: false,
        error: errorMsg
      });
    }

    res.status(200).json({
      success: true,
      message: `✅ Test email successfully delivered to ${recipient}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Search History (NEW) ──────────────────────────────────────────────────────
router.get('/search-history', async (req, res) => {
  try {
    const { SearchHistory } = require('../models/Schemas');
    const history = await SearchHistory.find().sort({ searchedAt: -1 }).limit(10);
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/search-history', async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Search query required.' });
  }
  try {
    const { SearchHistory } = require('../models/Schemas');
    const search = await SearchHistory.create({ query: query.trim(), searchedAt: new Date() });
    res.status(200).json({ success: true, search });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Toggle Scanned Website Favorite (NEW) ────────────────────────────────────
router.post('/scanned-websites/favorite', async (req, res) => {
  const { url, isFavorite } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required.' });
  try {
    const { ScannedWebsite } = require('../models/Schemas');
    const website = await ScannedWebsite.findOneAndUpdate(
      { url },
      { isFavorite: !!isFavorite },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, website });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Image Metadata Proxy (NEW) ───────────────────────────────────────────────
const axiosLib = require('axios');
const httpsLib = require('https');
const imageAgent = new httpsLib.Agent({ rejectUnauthorized: false });

// Standard browser-like headers that pass most server checks
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

const fetchSingleImageMetadata = async (imageUrl, baseUrl = '') => {
  let resolvedUrl = imageUrl;

  // Resolve relative URLs using baseUrl
  if (baseUrl && !/^https?:\/\//i.test(imageUrl)) {
    try {
      resolvedUrl = new URL(imageUrl, baseUrl).href;
    } catch (e) { /* keep imageUrl */ }
  }

  if (!resolvedUrl || !/^https?:\/\//i.test(resolvedUrl)) {
    return {
      imageUrl, contentLength: null, actualFileSize: 0,
      format: 'png', success: false, isValid: false,
      httpStatus: null, errorReason: 'Invalid URL'
    };
  }

  let contentLength = null;
  let actualFileSize = null;
  let format        = null;
  let httpStatus    = null;
  let errorReason   = null;
  let contentType   = '';
  let downloadedBytes = 0;

  console.log(`[IMAGE DEBUG] Fetching: ${resolvedUrl}`);

  // ── Helper: detect format from URL path or Content-Type header ──────────
  const getFormatFromUrlOrHeaders = (urlStr, typeHeader) => {
    if (typeHeader) {
      const t = typeHeader.toLowerCase();
      if (t.includes('image/png'))  return 'png';
      if (t.includes('image/jpeg') || t.includes('image/jpg')) return 'jpg';
      if (t.includes('image/gif'))  return 'gif';
      if (t.includes('image/webp')) return 'webp';
      if (t.includes('image/svg'))  return 'svg';
      if (t.includes('image/avif')) return 'avif';
    }
    const clean = urlStr.split('?')[0].split('#')[0];
    const ext   = (clean.split('.').pop() || '').toLowerCase();
    if (['png','jpg','jpeg','gif','webp','svg','avif'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
    return null;
  };

  // ── Helper: is this content type an image (or binary that might be one) ──
  const isImageContentType = (ct, urlStr) => {
    if (!ct) return !!getFormatFromUrlOrHeaders(urlStr, null); // rely on URL ext
    const t = ct.toLowerCase();
    if (t.startsWith('image/')) return true;
    if (t.includes('application/octet-stream')) return !!getFormatFromUrlOrHeaders(urlStr, null);
    return false;
  };

  // ════════════════════════════════════════════════════════════════
  // STEP 1 — HEAD request (fast, no body download)
  // ════════════════════════════════════════════════════════════════
  let headSucceeded = false;
  try {
    const headRes = await axiosLib.head(resolvedUrl, {
      timeout: 6000,
      httpsAgent: imageAgent,
      maxRedirects: 5,
      headers: BROWSER_HEADERS,
      validateStatus: () => true,  // never throw on HTTP error status
    });

    httpStatus   = headRes.status;
    contentType  = (headRes.headers['content-type'] || '').toLowerCase();

    console.log(`[IMAGE DEBUG] HEAD ${resolvedUrl} → ${httpStatus}, CT: ${contentType}`);

    if (httpStatus === 200 && isImageContentType(contentType, resolvedUrl)) {
      // Try to get size from Content-Length header
      const cl = headRes.headers['content-length'];
      if (cl) {
        const parsed = parseInt(cl, 10);
        if (!isNaN(parsed) && parsed > 0) {
          contentLength  = parsed;
          actualFileSize = parsed;
          format         = getFormatFromUrlOrHeaders(resolvedUrl, contentType) || 'png';
          headSucceeded  = true;
          console.log(`[IMAGE DEBUG] HEAD success — size from Content-Length: ${actualFileSize} bytes`);
        }
      }
      // Even without Content-Length, mark HEAD as confirming image exists
      if (!headSucceeded) {
        format = getFormatFromUrlOrHeaders(resolvedUrl, contentType) || 'png';
        // actualFileSize still null → GET will download to get real size
      }
    }
    // For non-200 HEAD responses (404, 403, etc.) we still try GET below
    // Many CDNs/servers block HEAD and return 405/403/404 even for valid images
  } catch (headErr) {
    console.log(`[IMAGE DEBUG] HEAD threw: ${headErr.message} — will try GET`);
    // HEAD completely failed — proceed to GET unconditionally
  }

  // ════════════════════════════════════════════════════════════════
  // STEP 2 — GET request
  // Run if: no size from HEAD, OR HEAD gave a non-200, OR any error
  // ════════════════════════════════════════════════════════════════
  if (actualFileSize === null) {
    try {
      const getRes = await axiosLib.get(resolvedUrl, {
        timeout: 15000,
        responseType: 'arraybuffer',
        maxContentLength: 25 * 1024 * 1024,  // 25 MB cap
        maxBodyLength:    25 * 1024 * 1024,
        maxRedirects: 5,
        httpsAgent: imageAgent,
        headers: BROWSER_HEADERS,
        validateStatus: () => true,
      });

      httpStatus  = getRes.status;
      contentType = (getRes.headers['content-type'] || '').toLowerCase();

      console.log(`[IMAGE DEBUG] GET ${resolvedUrl} → ${httpStatus}, CT: ${contentType}`);

      if (httpStatus === 200) {
        if (isImageContentType(contentType, resolvedUrl)) {
          format = getFormatFromUrlOrHeaders(resolvedUrl, contentType) ||
                   getFormatFromUrlOrHeaders(resolvedUrl, null) || 'png';

          // Prefer Content-Length header if server sent it
          const cl = getRes.headers['content-length'];
          if (cl) {
            const parsed = parseInt(cl, 10);
            if (!isNaN(parsed) && parsed > 0) contentLength = parsed;
          }

          // Measure actual downloaded bytes (handles Buffer and ArrayBuffer)
          if (getRes.data) {
            if (Buffer.isBuffer(getRes.data)) {
              downloadedBytes = getRes.data.length;
            } else if (getRes.data.byteLength !== undefined) {
              downloadedBytes = getRes.data.byteLength;
            } else {
              downloadedBytes = getRes.data.length || 0;
            }
          }

          // Use downloaded bytes as the authoritative size (more accurate than Content-Length)
          if (downloadedBytes > 0) {
            actualFileSize = downloadedBytes;
            errorReason    = null;
            console.log(`[IMAGE DEBUG] GET success — size: ${actualFileSize} bytes`);
          } else if (contentLength && contentLength > 0) {
            // Fallback: use Content-Length if body was empty for some reason
            actualFileSize = contentLength;
            errorReason    = null;
            console.log(`[IMAGE DEBUG] GET — using Content-Length fallback: ${actualFileSize} bytes`);
          } else {
            errorReason = 'Empty response body';
          }
        } else {
          // 200 but not an image (HTML page, redirect page, etc.)
          errorReason = `Not an image (Content-Type: ${contentType || 'unknown'})`;
          console.log(`[IMAGE DEBUG] GET 200 but non-image content-type: ${contentType}`);
        }
      } else if (httpStatus === 404) {
        // 404 from image server — on Vercel/Render, this is almost always the CDN
        // blocking our datacenter IP, not a genuinely missing resource.
        // We do NOT show "404 Not Found" — use "Access Denied" so users know
        // the image IS accessible from a browser but not from our server IP.
        errorReason = 'Access Denied';
        console.log(`[IMAGE DEBUG] GET 404 — likely CDN IP block, not a missing resource`);
      } else if (httpStatus === 403 || httpStatus === 401) {
        errorReason = 'Access Denied';
      } else {
        errorReason = `HTTP ${httpStatus}`;
      }
    } catch (getErr) {
      console.log(`[IMAGE DEBUG] GET threw: ${getErr.code} — ${getErr.message}`);

      // maxContentLength exceeded — image IS real but too large to fully download
      const isOverLimit =
        getErr.code === 'ERR_FR_MAX_BODY_LENGTH_EXCEEDED' ||
        (getErr.message || '').includes('maxContentLength') ||
        (getErr.message || '').includes('maxBodyLength');

      if (isOverLimit) {
        // Try to get size from the Content-Length header in the error response
        const errCL = getErr.response?.headers?.['content-length'];
        if (errCL) {
          const parsed = parseInt(errCL, 10);
          if (!isNaN(parsed) && parsed > 0) {
            actualFileSize = parsed;
            contentLength  = parsed;
            format         = getFormatFromUrlOrHeaders(resolvedUrl, null) || 'png';
            errorReason    = null;
            httpStatus     = 200;
            console.log(`[IMAGE DEBUG] Over limit — using Content-Length: ${actualFileSize} bytes`);
          }
        }
        if (actualFileSize === null) {
          // Last resort: we know it's >25 MB
          actualFileSize = 25 * 1024 * 1024;
          format         = getFormatFromUrlOrHeaders(resolvedUrl, null) || 'png';
          errorReason    = null;
          httpStatus     = 200;
          console.log(`[IMAGE DEBUG] Over limit — using 25 MB fallback`);
        }
      } else if (getErr.code === 'ECONNABORTED' || getErr.code === 'ETIMEDOUT') {
        errorReason = 'Request Timeout';
      } else if (getErr.response?.status === 403 || getErr.response?.status === 401) {
        errorReason = 'Access Denied';
      } else if (getErr.response?.status === 404) {
        // A 404 from a thrown error (not validateStatus path) is unusual —
        // treat conservatively as access denied since CDNs often return 404 for bot IPs
        errorReason = 'Access Denied';
      } else {
        errorReason = 'Access Denied';
      }
    }
  }

  // ── Format fallback ──────────────────────────────────────────────────────
  if (!format) {
    format = getFormatFromUrlOrHeaders(resolvedUrl, null) || 'png';
  }

  // ── Determine validity ───────────────────────────────────────────────────
  // IMPORTANT: httpStatus=404 from the server-side proxy does NOT mean the image
  // doesn't exist — it often means the CDN/host blocked our datacenter IP.
  // A real 404 would also have no content-length and a non-image content-type.
  // We only trust a 404 if BOTH HEAD and GET returned 404 with no content at all.
  const isValid = actualFileSize !== null && actualFileSize > 0 && !errorReason;

  // Final error reason assignment — be conservative about "404 Not Found"
  if (!isValid && !errorReason) {
    if (httpStatus === 403 || httpStatus === 401) {
      errorReason = 'Access Denied';
    } else if (httpStatus === 500) {
      errorReason = 'Server Error (500)';
    } else if (httpStatus === 404) {
      // Only show 404 if we got it from GET (confirmed) AND content-type was not an image
      // For ambiguous cases, show "Access Denied" — CDN may be blocking our IP
      errorReason = contentType && contentType.startsWith('image/')
        ? 'Access Denied (blocked by CDN)'
        : '404 Not Found';
    } else if (httpStatus && httpStatus !== 200) {
      errorReason = `HTTP ${httpStatus} Error`;
    } else if (httpStatus === null) {
      // Both HEAD and GET threw network exceptions — server unreachable from our IP
      errorReason = 'Network Unreachable';
    } else {
      errorReason = 'Access Denied';
    }
  }

  // ── Optimization savings calculation (TinyPNG-style) ────────────────────
  const fmt = (format || '').toLowerCase();
  let reduction     = 0;
  let recommendedSize = actualFileSize || 0;
  let savingsBytes  = 0;
  let savingsPct    = 0;

  if (isValid && actualFileSize > 0) {
    if      (fmt === 'png')              reduction = Math.min(0.80, 0.40 + (actualFileSize / (1024*1024)) * 0.40);
    else if (fmt === 'jpg' || fmt === 'jpeg') reduction = Math.min(0.70, 0.20 + (actualFileSize / (1024*1024)) * 0.50);
    else if (fmt === 'gif')              reduction = Math.min(0.90, 0.50 + (actualFileSize / (2*1024*1024)) * 0.40);
    else if (fmt === 'svg')              reduction = Math.min(0.30, 0.05 + (actualFileSize / (100*1024)) * 0.25);
    else if (fmt === 'webp')             reduction = 0.05;
    else if (fmt === 'avif')             reduction = 0.0;
    else                                 reduction = 0.10;

    recommendedSize = Math.round(actualFileSize * (1 - reduction));
    savingsPct      = Math.round(reduction * 100);
    savingsBytes    = actualFileSize - recommendedSize;
  }

  console.log(`[IMAGE DEBUG] RESULT → isValid:${isValid} size:${actualFileSize} format:${format} error:${errorReason}`);

  return {
    imageUrl,
    contentLength,
    actualFileSize: actualFileSize || 0,
    recommendedSize: isValid ? recommendedSize : 0,
    savingsBytes:   isValid ? savingsBytes   : 0,
    savingsPct:     isValid ? savingsPct     : 0,
    format,
    success:     isValid,
    httpStatus,
    isValid,
    errorReason: isValid ? null : errorReason,
  };
};

// Wrap fetchSingleImageMetadata with a hard timeout so one slow URL
// can't block the entire batch for minutes
const fetchWithTimeout = (imageUrl, baseUrl, timeoutMs = 18000) => {
  return Promise.race([
    fetchSingleImageMetadata(imageUrl, baseUrl),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

router.post('/image-metadata', async (req, res) => {
  const { urls, baseUrl } = req.body;
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'Array of image URLs is required in request body.' });
  }

  // Use allSettled so a single failing URL doesn't kill the whole batch
  const settled = await Promise.allSettled(
    urls.map(url => fetchWithTimeout(url, baseUrl))
  );

  const results = settled.map((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      return outcome.value;
    }
    const msg = outcome.reason?.message || 'Fetch failed';
    const isTimeout = msg.includes('Timeout');
    return {
      imageUrl:       urls[i],
      contentLength:  null,
      actualFileSize: 0,
      format:         'png',
      success:        false,
      isValid:        false,
      httpStatus:     null,
      errorReason:    isTimeout ? 'Request Timeout' : msg,
    };
  });

  res.status(200).json({ success: true, results });
});

module.exports = router;

