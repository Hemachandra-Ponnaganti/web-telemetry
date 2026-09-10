const { checkWebsiteStatus, compileStats } = require('../services/monitorService');
const { auditWordPressSite } = require('../services/wordpressService');
const { MonitorHistory, WordPressMonitor, Alert } = require('../models/Schemas');

/**
 * Trigger immediate site uptime and WordPress health audits concurrently.
 */
const triggerAudit = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing target URL in request body.' });
  }

  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Concurrent execution of uptime check and WordPress crawler
    await Promise.all([
      checkWebsiteStatus(normalizedUrl),
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
    const { ScannedWebsite } = require('../models/Schemas');
    let targets = await ScannedWebsite.find({});
    
    // Fallback if ScannedWebsite is empty
    if (!targets || targets.length === 0) {
      const histories = await MonitorHistory.find({});
      const targetsMap = {};
      for (const h of histories) {
        const url = h.url;
        const checkedAt = new Date(h.checkedAt);
        if (!targetsMap[url] || new Date(targetsMap[url].checkedAt) < checkedAt) {
          targetsMap[url] = {
            url: h.url,
            name: getHostname(h.url),
            isUp: h.isUp,
            statusCode: h.statusCode,
            loadTimeMs: h.loadTimeMs,
            checkedAt: h.checkedAt,
            lastScannedAt: h.checkedAt,
            scanCount: 1,
            isFavorite: false
          };
        }
      }
      targets = Object.values(targetsMap);
    } else {
      // Map scanned websites to frontend schema format
      targets = targets.map(t => ({
        url: t.url,
        name: t.name || getHostname(t.url),
        isUp: t.isUp,
        statusCode: t.statusCode,
        checkedAt: t.lastScannedAt || new Date(),
        lastScannedAt: t.lastScannedAt,
        scanCount: t.scanCount || 1,
        isFavorite: !!t.isFavorite
      }));
    }
    
    res.status(200).json(targets);
  } catch (error) {
    res.status(500).json({ error: `Failed to compile monitored targets: ${error.message}` });
  }
};

module.exports = {
  triggerAudit,
  getDashboardStats,
  getWordPressDetails,
  getAlerts,
  resolveAlert,
  getMonitoredTargets
};
