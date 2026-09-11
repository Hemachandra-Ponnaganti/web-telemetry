const { checkWebsiteStatus, compileStats } = require('../services/monitorService');
const { auditWordPressSite } = require('../services/wordpressService');
const { MonitorHistory, WordPressMonitor, Alert } = require('../models/Schemas');

/**
 * Trigger immediate site uptime and WordPress health audits concurrently.
 */
const triggerAudit = async (req, res) => {
  const { url, analysisFrequency } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing target URL in request body.' });
  }

  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Concurrent execution of uptime check and WordPress crawler
    await Promise.all([
      checkWebsiteStatus(normalizedUrl, analysisFrequency),
      auditWordPressSite(normalizedUrl).catch(() => null) // WordPress check can return null if not wordpress site
    ]);

    // Gather newly compiled stats
    const freshStats = await compileStats(normalizedUrl);

    // Broadcast audit completion to all WebSocket clients instantly
    const io = req.app.get('io');
    if (io) {
      console.log(`📡 WebSocket Emitter: Broadcasting manual audit completion for ${normalizedUrl}`);
      io.emit('auditCompleted', freshStats);
    }

    res.status(200).json({
      success: true,
      message: 'SRE concurrent audit completed successfully.',
      stats: freshStats
    });
  } catch (error) {
    res.status(500).json({ error: `Immediate audit execution failure: ${error.message}` });
  }
};

/**
 * Fetch overview dashboard telemetry and historical metrics.
 */
const getDashboardStats = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Target URL is required.' });
  }

  try {
    const stats = await compileStats(url);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: `Dashboard telemetry compilation failed: ${error.message}` });
  }
};

/**
 * Retrieve WordPress monitoring details.
 */
const getWordPressDetails = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Target URL is required.' });
  }

  try {
    const details = await WordPressMonitor.findOne({ url });
    res.status(200).json(details || { message: 'No WordPress audit records exist for this URL.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Fetch and return generated system alerts.
 */
const getAlerts = async (req, res) => {
  const { url } = req.query;
  const filter = url ? { url } : {};
  try {
    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resolve active downtime or security alerts.
 */
const resolveAlert = async (req, res) => {
  const { alertId } = req.body;
  if (!alertId) {
    return res.status(400).json({ error: 'Alert ID is required.' });
  }

  try {
    const alert = await Alert.findByIdAndUpdate(alertId, {
      resolved: true,
      resolvedAt: new Date()
    }, { new: true });
    
    res.status(200).json({ success: true, message: 'Alert resolved successfully.', alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieve all monitored targets and their latest status telemetry.
 */
/**
 * Retrieve all monitored targets and their latest status telemetry.
 */
const getMonitoredTargets = async (req, res) => {
  const getHostname = (urlStr) => {
    try {
      const withProtocol = urlStr.includes('://') ? urlStr : `https://${urlStr}`;
      return new URL(withProtocol).hostname;
    } catch (e) {
      return urlStr;
    }
  };

  try {
    const { ScannedWebsite, MonitorHistory } = require('../models/Schemas');
    let dbTargets = await ScannedWebsite.find({}).sort({ lastScannedAt: -1 });

    let targets = [];
    if (!dbTargets || dbTargets.length === 0) {
      const histories = await MonitorHistory.find({}).sort({ checkedAt: -1 });
      const targetsMap = {};
      for (const h of histories) {
        if (!targetsMap[h.url]) {
          let perf = {};
          try { perf = JSON.parse(h.performanceData || '{}'); } catch(e) {}
          let seo = {};
          try { seo = JSON.parse(h.seoData || '{}'); } catch(e) {}
          
          targetsMap[h.url] = {
            url: h.url,
            name: getHostname(h.url),
            isUp: h.isUp,
            statusCode: h.statusCode,
            loadTimeMs: h.loadTimeMs,
            performanceScore: perf.performanceScore || 85,
            grade: perf.grade || 'A',
            seoScore: seo.seoScore || 80,
            sslDaysRemaining: h.ssl?.daysRemaining || 45,
            checkedAt: h.checkedAt,
            lastScannedAt: h.checkedAt,
            scanCount: 1,
            isFavorite: false,
            analysisFrequency: '1h'
          };
        }
      }
      targets = Object.values(targetsMap);
    } else {
      // For each ScannedWebsite, get its latest MonitorHistory for scores
      for (const t of dbTargets) {
        const latestHistory = await MonitorHistory.findOne({ url: t.url }).sort({ checkedAt: -1 });
        let perf = {};
        try { perf = JSON.parse(latestHistory?.performanceData || '{}'); } catch(e) {}
        let seo = {};
        try { seo = JSON.parse(latestHistory?.seoData || '{}'); } catch(e) {}

        const siteNameStr = typeof t.name === 'string' ? t.name : (t.name?.text || getHostname(t.url));

        targets.push({
          url: t.url,
          name: siteNameStr,
          isUp: t.isUp,
          statusCode: t.statusCode,
          loadTimeMs: latestHistory?.loadTimeMs || 0,
          performanceScore: perf.performanceScore || 88,
          grade: perf.grade || 'A',
          seoScore: seo.seoScore || 85,
          sslDaysRemaining: latestHistory?.ssl?.daysRemaining ?? 45,
          checkedAt: t.lastScannedAt || new Date(),
          lastScannedAt: t.lastScannedAt,
          scanCount: t.scanCount || 1,
          isFavorite: !!t.isFavorite,
          analysisFrequency: t.analysisFrequency || '1h'
        });
      }
    }

    res.status(200).json(targets);
  } catch (error) {
    res.status(500).json({ error: `Failed to compile monitored targets: ${error.message}` });
  }
};

/**
 * Delete a monitored website target from the database catalog.
 */
const deleteMonitoredTarget = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required.' });
  try {
    const { ScannedWebsite, MonitorHistory } = require('../models/Schemas');
    await ScannedWebsite.deleteOne({ url });
    await MonitorHistory.deleteMany({ url });
    res.status(200).json({ success: true, message: `Removed ${url} from monitored targets.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  triggerAudit,
  getDashboardStats,
  getWordPressDetails,
  getAlerts,
  resolveAlert,
  getMonitoredTargets,
  deleteMonitoredTarget
};
