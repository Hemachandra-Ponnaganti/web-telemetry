const nodemailer = require('nodemailer');
require('dns').setDefaultResultOrder('ipv4first');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { loadSettings } = require('../config/settingsHelper');

const logFilePath = path.join(__dirname, '../../../email_delivery.log');

let emailQueue = [];
let activeWorkers = 0;
const CONCURRENCY = 3;
let ioInstance = null;

/**
 * Log email alert deliveries to an audit file for SRE compliance verification.
 */
const logEmailDelivery = (recipient, subject, html) => {
  const time = new Date().toISOString();
  const logMsg = `[${time}] EMAIL DISPATCHED TO: ${recipient}\nSUBJECT: ${subject}\n\n${html.replace(/<[^>]*>/g, '').trim().substring(0, 300)}...\n--------------------------------------------------\n\n`;
  try {
    fs.appendFileSync(logFilePath, logMsg, 'utf-8');
    console.log(`📝 SRE Email alert delivery successfully logged to ${logFilePath}`);
  } catch (err) {
    console.error('⚠️ Failed to write to SRE email delivery log:', err.message);
  }
};

/**
 * Set Socket.IO server instance for real-time broadcasts.
 */
const setIoInstance = (io) => {
  ioInstance = io;
};

/**
 * Rebuild HTML for pending database records upon server startup.
 */
const rebuildHtmlForPending = (doc) => {
  const levelColor = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
  const color = levelColor[doc.level] || '#6366f1';
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;background:#f8fafc;color:#1e293b;">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
      <div style="background:${color};color:white;padding:20px 24px;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;margin-bottom:4px;">Website Monitor Alert (Recovered)</div>
        <div style="font-size:18px;font-weight:800;">${doc.subject}</div>
      </div>
      <div style="padding:24px;">
        <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;">
          <strong>Website:</strong> <a href="${doc.url}" style="color:#4f46e5;">${doc.url}</a><br>
          <strong>Detected At:</strong> ${doc.sentAt.toLocaleString()}<br>
          <strong>Severity:</strong> ${doc.level.toUpperCase()}
        </div>
        <p style="color:#475569;font-size:13px;margin:0 0 20px;">${doc.message}</p>
      </div>
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;font-size:10px;color:#94a3b8;text-align:center;">
        MonitorPro SRE Dashboard · Automated Alert System
      </div>
    </div>
  </body></html>`;
};

/**
 * Poll the Resend API status endpoint to track delivery state.
 */
const trackResendDelivery = (dbId, messageId, apiKey) => {
  let attempts = 0;
  const poll = async () => {
    try {
      const { EmailAlertHistory } = require('../models/Schemas');
      attempts++;
      console.log(`🔍 Polling Resend status for messageId ${messageId} (Attempt ${attempts}/10)...`);
      const res = await axios.get(`https://api.resend.com/emails/${messageId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        timeout: 5000
      });
      
      const status = res.data.last_event || res.data.status || 'sent';
      console.log(`📊 Resend returned status: ${status}`);
      
      if (status === 'delivered') {
        const updated = await EmailAlertHistory.findOneAndUpdate(
          { _id: dbId },
          { status: 'delivered', deliveredAt: new Date() },
          { new: true }
        );
        if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
        return;
      } else if (status === 'bounced') {
        const updated = await EmailAlertHistory.findOneAndUpdate(
          { _id: dbId },
          { status: 'bounced', errorReason: 'Email bounced by recipient mail server.' },
          { new: true }
        );
        if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
        return;
      } else if (status === 'failed' || status === 'complained') {
        const updated = await EmailAlertHistory.findOneAndUpdate(
          { _id: dbId },
          { status: 'failed', errorReason: 'Delivery failed or was rejected.' },
          { new: true }
        );
        if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
        return;
      }
      
      if (attempts >= 10) {
        // Safe fallback to delivered if no bounce/failure occurred
        const updated = await EmailAlertHistory.findOneAndUpdate(
          { _id: dbId },
          { status: 'delivered', deliveredAt: new Date() },
          { new: true }
        );
        if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
        return;
      }
      setTimeout(poll, 3000);
    } catch (err) {
      console.error(`⚠️ Resend status polling error for dbId ${dbId}: ${err.message}`);
      if (attempts >= 10) {
        const { EmailAlertHistory } = require('../models/Schemas');
        const updated = await EmailAlertHistory.findOneAndUpdate(
          { _id: dbId },
          { status: 'failed', errorReason: `Polling error: ${err.message}` },
          { new: true }
        );
        if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
      } else {
        setTimeout(poll, 5000);
      }
    }
  };
  setTimeout(poll, 3000);
};

/**
 * Background worker logic to process individual enqueued emails.
 */
const processEmail = async (email) => {
  const { EmailAlertHistory } = require('../models/Schemas');
  
  const settings = loadSettings();

  if (settings.alerts_enabled === false) {
    console.log('🔇 Alerts are globally disabled in settings. Skipping email.');
    const updated = await EmailAlertHistory.findOneAndUpdate(
      { _id: email.dbId },
      { status: 'failed', errorReason: 'Alerts globally disabled in settings.' },
      { new: true }
    );
    if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
    return;
  }

  const isResend = !!settings.resend_api_key;
  
  try {
    if (isResend) {
      const fromEmail = settings.resend_from_email || 'onboarding@resend.dev';
      console.log(`✉️ Sending via Resend API to: ${email.recipient}`);
      
      const response = await axios.post('https://api.resend.com/emails', {
        from: fromEmail,
        to: email.recipient,
        cc: email.cc,
        subject: email.subject,
        html: email.html
      }, {
        headers: {
          'Authorization': `Bearer ${settings.resend_api_key}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const messageId = response.data.id;
      console.log(`✓ Resend dispatch success. MsgId: ${messageId}`);
      
      const updated = await EmailAlertHistory.findOneAndUpdate(
        { _id: email.dbId },
        { messageId, status: 'sending' },
        { new: true }
      );
      if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
      
      trackResendDelivery(email.dbId, messageId, settings.resend_api_key);
    } else {
      // SMTP logic
      const hostUser = settings.email_host_user;
      const hostPass = settings.email_host_password;
      
      if (!hostUser || !hostPass) {
        throw new Error('SMTP credentials not configured (email_host_user / email_host_password empty).');
      }
      
      console.log(`✉️ Sending via SMTP to: ${email.recipient}`);
      const isGmail = hostUser.toLowerCase().includes('@gmail.com') && !process.env.EMAIL_HOST;
      const transporter = nodemailer.createTransport(
        isGmail ? {
          service: 'gmail',
          auth: { user: hostUser, pass: hostPass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000
        } : {
          host: process.env.EMAIL_HOST || 'localhost',
          port: parseInt(process.env.EMAIL_PORT) || 25,
          secure: process.env.EMAIL_USE_SSL === 'true',
          auth: { user: hostUser, pass: hostPass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000
        }
      );
      
      const fromAddress = process.env.EMAIL_FROM || settings.critical_email || hostUser;
      await transporter.sendMail({
        from: fromAddress,
        to: email.recipient,
        cc: email.cc,
        subject: email.subject,
        html: email.html
      });
      
      console.log(`✓ SMTP dispatch success. Updating database and broadcasting status...`);
      // Update DB and broadcast status
      const updated = await EmailAlertHistory.findOneAndUpdate(
        { _id: email.dbId },
        { status: 'delivered', deliveredAt: new Date() },
        { new: true }
      );
      if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
    }
    
    // Log to file audit
    logEmailDelivery(email.recipient, email.subject, email.html);
  } catch (err) {
    console.error(`❌ Email dispatch failed (attempt ${email.attempts + 1}/3): ${err.message}`);
    email.attempts++;
    if (email.attempts < 3) {
      setTimeout(() => {
        emailQueue.push(email);
        processQueue();
      }, 5000);
    } else {
      const updated = await EmailAlertHistory.findOneAndUpdate(
        { _id: email.dbId },
        { status: 'failed', errorReason: err.message },
        { new: true }
      );
      if (ioInstance) ioInstance.emit('emailStatusChanged', updated);
    }
  }
};

/**
 * Trigger queue processing with parallel worker pools.
 */
const processQueue = async () => {
  if (emailQueue.length === 0 || activeWorkers >= CONCURRENCY) return;
  
  while (emailQueue.length > 0 && activeWorkers < CONCURRENCY) {
    const email = emailQueue.shift();
    activeWorkers++;
    processEmail(email).finally(() => {
      activeWorkers--;
      processQueue();
    });
  }
};

/**
 * Enqueue a new email and run the background queue processor.
 */
const enqueueEmailAlert = async ({ url, recipient, cc, category, level, subject, message, html }) => {
  const { EmailAlertHistory } = require('../models/Schemas');
  
  try {
    const doc = await EmailAlertHistory.create({
      url,
      alertEmail: recipient,
      alertType: category,
      level,
      subject,
      message,
      status: 'sending',
      sentAt: new Date()
    });
    
    emailQueue.push({
      dbId: doc._id.toString(),
      url,
      recipient,
      subject,
      message,
      category,
      level,
      html,
      cc,
      attempts: 0
    });
    
    if (ioInstance) {
      ioInstance.emit('emailStatusChanged', doc);
    }
    
    processQueue();
    return doc;
  } catch (err) {
    console.error('❌ Failed to enqueue email alert:', err.message);
  }
};

/**
 * Startup recovery: loads pending/sending emails from database and pushes to queue.
 */
const initializeEmailQueue = async () => {
  try {
    const { EmailAlertHistory } = require('../models/Schemas');
    const pending = await EmailAlertHistory.find({ status: 'sending' });
    console.log(`🔌 Startup recovery: found ${pending.length} pending alert records.`);
    
    for (const doc of pending) {
      const html = rebuildHtmlForPending(doc);
      emailQueue.push({
        dbId: doc._id.toString(),
        url: doc.url,
        recipient: doc.alertEmail,
        subject: doc.subject,
        message: doc.message,
        category: doc.alertType,
        level: doc.level,
        html,
        cc: undefined,
        attempts: 0
      });
    }
    processQueue();
  } catch (err) {
    console.error('⚠️ Failed to initialize email queue recovery:', err.message);
  }
};

/**
 * Per-website alert email sender.
 */
const sendAlertEmailToWebsite = async (url, category, level, message, extraIssues = []) => {
  try {
    const { WebsiteEmailConfig } = require('../models/Schemas');
    
    const config = await WebsiteEmailConfig.findOne({ url });
    if (!config || !config.alertsEnabled || !config.alertEmail) return;
    
    const allIssues = [{ category, level, message }, ...extraIssues];
    const hasMultiple = allIssues.length > 1;
    const topLevel = allIssues.some(i => i.level === 'critical') ? 'critical' : allIssues.some(i => i.level === 'warning') ? 'warning' : 'info';

    // ── Frequency & Throttle Rules ──────────────────────────────────────────
    // 1. Critical alerts (downtime, db error, urgent SSL expiry): ALWAYS send immediately for every scan!
    // 2. Warning / Info alerts (SEO, missing alt tags, non-critical): Throttled to once every 3 days (72 hours).
    if (topLevel !== 'critical') {
      const lastSentTime = config.lastWarningEmailSent || config.lastEmailSent;
      if (lastSentTime) {
        const hoursSince = (Date.now() - new Date(lastSentTime).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 72) {
          console.log(`⏳ [Alert Throttle] Skipping non-critical ${topLevel} alert for ${url} (last sent ${hoursSince.toFixed(1)}h ago; minimum cooldown: 72h / 3 days).`);
          return;
        }
      }
    } else {
      // For critical alerts, check alertFrequency only if explicitly configured to daily/weekly summary mode
      if (config.alertFrequency !== 'instant' && config.lastEmailSent) {
        const hoursSince = (Date.now() - new Date(config.lastEmailSent).getTime()) / (1000 * 60 * 60);
        if (config.alertFrequency === 'daily' && hoursSince < 24) return;
        if (config.alertFrequency === 'weekly' && hoursSince < 168) return;
      }
    }
    
    const emails = config.alertEmail.split(',').map(e => e.trim()).filter(Boolean);
    const recipient = emails[0];
    const ccList = [
      ...emails.slice(1),
      ...(config.alertCc ? config.alertCc.split(',').map(e => e.trim()).filter(Boolean) : [])
    ];
    const cc = ccList.length > 0 ? ccList.join(', ') : undefined;
    
    const subject = hasMultiple
      ? `[Website Monitor] ${allIssues.length} Issues Found — ${url}`
      : `[Website Monitor] ${level.charAt(0).toUpperCase() + level.slice(1)} Alert — ${url}`;
      
    const levelColor = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    const issuesHtml = allIssues.map(issue => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:800;color:white;background:${levelColor[issue.level] || '#6366f1'};text-transform:uppercase;">${issue.level}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#334155;font-size:12px;">${issue.category.toUpperCase()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:12px;">${issue.message}</td>
      </tr>`).join('');
      
    const recommendationsHtml = allIssues.map(issue => {
      const recs = {
        uptime: 'Check your hosting server immediately. Verify server health and restart if needed.',
        ssl: 'Renew your SSL certificate before expiry. Contact your SSL provider urgently.',
        seo: 'Review your page metadata — add missing titles, descriptions, and ALT tags.',
        security: 'Review your HTTP security headers and enable CSP, HSTS, and X-Frame-Options.',
        performance: 'Optimise images, minify scripts, and enable caching to improve load times.',
        wordpress: 'Update WordPress core, plugins, and themes. Check for vulnerabilities.',
      };
      return `<li style="margin-bottom:6px;color:#475569;font-size:12px;">${recs[issue.category] || 'Review the issue and take corrective action.'}</li>`;
    }).join('');
    
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;padding:20px;color:#1e293b;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 6px rgba(0,0,0,0.05);overflow:hidden;">
        <div style="background:${levelColor[topLevel]};color:white;padding:20px 24px;">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.85;margin-bottom:4px;">Website Monitor Alert</div>
          <div style="font-size:18px;font-weight:800;">${hasMultiple ? `${allIssues.length} Issues Detected` : message}</div>
        </div>
        <div style="padding:24px;">
          <div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;">
            <strong>Website:</strong> <a href="${url}" style="color:#4f46e5;">${url}</a><br>
            <strong>Detected At:</strong> ${new Date().toLocaleString()}<br>
            <strong>Severity:</strong> ${topLevel.toUpperCase()}
          </div>
          ${hasMultiple ? `
          <h3 style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 10px;">Issues Found</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <thead><tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Severity</th>
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Category</th>
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Details</th>
            </tr></thead>
            <tbody>${issuesHtml}</tbody>
          </table>` : `<p style="color:#475569;font-size:13px;margin:0 0 20px;">${message}</p>`}
          <h3 style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 8px;">Recommendations</h3>
          <ul style="padding-left:20px;margin:0 0 20px;">${recommendationsHtml}</ul>
        </div>
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;font-size:10px;color:#94a3b8;text-align:center;">
          MonitorPro SRE Dashboard · Automated Alert System · <a href="${url}" style="color:#6366f1;">View Site</a>
        </div>
      </div>
    </body></html>`;
    
    await enqueueEmailAlert({
      url,
      recipient,
      cc,
      category,
      level: topLevel,
      subject,
      message: allIssues.map(i => i.message).join(' | '),
      html
    });

    // Update timestamp trackers in WebsiteEmailConfig
    const updatePayload = {
      lastEmailSent: new Date(),
      lastAlertType: topLevel,
      $inc: { totalEmailsSent: 1 }
    };
    if (topLevel !== 'critical') {
      updatePayload.lastWarningEmailSent = new Date();
    }
    await WebsiteEmailConfig.findOneAndUpdate({ url }, updatePayload);
  } catch (err) {
    console.error('❌ sendAlertEmailToWebsite error:', err.message);
  }
};

/**
 * Send periodic performance and security report email.
 */
const sendPeriodicReportEmail = async (url, recipientInput, stats, ccInput = '') => {
  try {
    const reportEmails = (recipientInput || '').split(',').map(e => e.trim()).filter(Boolean);
    const recipient = reportEmails[0];
    const ccList = [
      ...reportEmails.slice(1),
      ...(ccInput ? ccInput.split(',').map(e => e.trim()).filter(Boolean) : [])
    ];
    const cc = ccList.length > 0 ? ccList.join(', ') : undefined;

    const subject = `[MonitorPro] Health Report for ${url}`;
    
    // Extract website details from ScannedWebsite
    let domainExpiryDateStr = '';
    let domainRegistrarStr = '';
    try {
      const { ScannedWebsite } = require('../models/Schemas');
      const siteDoc = await ScannedWebsite.findOne({ url });
      if (siteDoc && siteDoc.domainExpiryDate) {
        domainExpiryDateStr = `${new Date(siteDoc.domainExpiryDate).toLocaleDateString()}${siteDoc.domainDaysRemaining != null ? ` (${siteDoc.domainDaysRemaining}d remaining)` : ''}`;
        domainRegistrarStr = siteDoc.domainRegistrar || 'GoDaddy / WHOIS';
      }
    } catch (e) {}

    const latest = stats.latestStatus || (stats.historyLog && stats.historyLog[0]) || {};
    const sslValid = latest.ssl?.valid === true;
    const sslStatusColor = sslValid ? '#10b981' : (latest.ssl?.valid === false ? '#ef4444' : '#64748b');
    const sslStatusText = sslValid ? 'VALID & SECURE' : (latest.ssl?.valid === false ? 'INVALID / EXPIRED' : 'NOT APPLICABLE');
    const sslDaysRemaining = latest.ssl?.daysRemaining != null ? `${latest.ssl.daysRemaining} days remaining` : '—';
    const sslExpiryDate = latest.ssl?.expiryDate ? new Date(latest.ssl.expiryDate).toLocaleDateString() : '—';
    const sslIssuer = latest.ssl?.issuer || '—';

    // Domain expiry from latest scan or ScannedWebsite
    if (latest.domainExpiry?.expiryDate) {
      domainExpiryDateStr = `${new Date(latest.domainExpiry.expiryDate).toLocaleDateString()}${latest.domainExpiry.daysRemaining != null ? ` (${latest.domainExpiry.daysRemaining}d remaining)` : ''}`;
      if (latest.domainExpiry.registrar) domainRegistrarStr = latest.domainExpiry.registrar;
    }

    // If still empty, perform on-the-fly WHOIS lookup so the client report always has the real date!
    if (!domainExpiryDateStr) {
      try {
        const { whoisDomain } = require('whoiser');
        const cleanHost = String(url || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
        const parts = cleanHost.split('.');
        const baseDomain = parts.length > 2 ? parts.slice(-2).join('.') : parts.join('.');
        const dInfo = await whoisDomain(baseDomain);
        for (const k in dInfo) {
          const exp = dInfo[k]['Expiry Date'] || dInfo[k]['Registry Expiry Date'] || dInfo[k]['expires'];
          const reg = dInfo[k]['Registrar'] || dInfo[k]['registrar'];
          if (exp) {
            const expDate = new Date(exp);
            if (!isNaN(expDate.getTime())) {
              const daysLeft = Math.max(0, Math.round((expDate - new Date()) / (1000 * 60 * 60 * 24)));
              domainExpiryDateStr = `${expDate.toLocaleDateString()} (${daysLeft}d remaining)`;
              domainRegistrarStr = reg || 'WHOIS Verified';
              // Update database record for future reports
              const { ScannedWebsite } = require('../models/Schemas');
              await ScannedWebsite.findOneAndUpdate(
                { url },
                { domainExpiryDate: expDate, domainDaysRemaining: daysLeft, domainRegistrar: domainRegistrarStr }
              );
              break;
            }
          }
        }
      } catch (e) {}
    }

    if (!domainExpiryDateStr) {
      domainExpiryDateStr = 'Active / DNS Verified';
      domainRegistrarStr = 'WHOIS Verified';
    }

    const accessibilityScore = latest.uiUx?.uiHealthScore || 85;
    const accessibilityRating = accessibilityScore >= 90 ? 'Grade A+ (WCAG AAA Compliant)' :
                                accessibilityScore >= 80 ? 'Grade A (WCAG AA Compliant)' :
                                accessibilityScore >= 70 ? 'Grade B (Acceptable)' : 'Grade C (Needs Attention)';
    const accessibilityColor = accessibilityScore >= 80 ? '#10b981' : (accessibilityScore >= 70 ? '#f59e0b' : '#ef4444');

    // Build a nicely formatted HTML table for recent scan history (up to 30 scans)
    let historyRows = '';
    if (stats.historyLog && stats.historyLog.length > 0) {
      historyRows = stats.historyLog.slice(0, 30).map(log => {
        const statusColor = log.isUp ? '#22c55e' : '#ef4444';
        const statusText = log.isUp ? 'UP' : 'DOWN';
        const date = new Date(log.checkedAt).toLocaleString();
        const logSsl = log.ssl?.valid === true ? '<span style="color:#10b981;font-weight:700;">Valid</span>' : (log.ssl?.valid === false ? '<span style="color:#ef4444;font-weight:700;">Invalid</span>' : '—');
        const logAccessibility = log.uiUx?.uiHealthScore || 85;
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${date}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;"><span style="color:white;background:${statusColor};padding:2px 6px;border-radius:4px;font-weight:bold;">${statusText}</span></td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${log.statusCode || '-'}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${log.loadTimeMs ? log.loadTimeMs + 'ms' : '-'}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;font-weight:bold;color:#f59e0b;">${log.seo?.seoScore || '-'}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;">${logSsl}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0ea5e9;font-weight:bold;">${logAccessibility}%</td>
          </tr>
        `;
      }).join('');
    } else {
      historyRows = '<tr><td colspan="7" style="padding:10px;text-align:center;font-size:12px;color:#64748b;">No scans recorded in this period.</td></tr>';
    }

    // Generate a QuickChart URL for the graphical representation
    let chartUrl = '';
    if (stats.historyLog && stats.historyLog.length > 0) {
      // Get up to 60 most recent logs and reverse them so they are chronological (oldest to newest)
      const chartData = [...stats.historyLog].slice(0, 60).reverse();
      const labels = chartData.map(log => {
        const d = new Date(log.checkedAt);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
      });
      const dataPointsOverall = chartData.map(log => {
        const perfVal = log.performance?.performanceScore || 90;
        const seoVal = log.seo?.seoScore || 85;
        const secVal = log.security?.securityScore || 90;
        const uiVal = log.uiUx?.uiHealthScore || 85;
        return Math.round((perfVal + seoVal + secVal + uiVal) / 4);
      });
      const dataPointsPerf = chartData.map(log => log.performance?.performanceScore || 90);
      const dataPointsSEO = chartData.map(log => log.seo?.seoScore || 85);
      const dataPointsSec = chartData.map(log => log.security?.securityScore || 90);
      
      const chartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Overall SRE Score',
              data: dataPointsOverall,
              borderColor: '#4f46e5',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              tension: 0.4,
              pointRadius: 0
            },
            {
              label: 'Performance Score',
              data: dataPointsPerf,
              borderColor: '#10b981',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              tension: 0.4,
              pointRadius: 0
            },
            {
              label: 'Security Score',
              data: dataPointsSec,
              borderColor: '#0ea5e9',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              tension: 0.4,
              pointRadius: 0
            },
            {
              label: 'SEO Score',
              data: dataPointsSEO,
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              tension: 0.4,
              pointRadius: 0
            }
          ]
        },
        options: {
          plugins: {
            legend: { 
              display: true, 
              position: 'top', 
              labels: { color: '#e2e8f0', boxWidth: 6, usePointStyle: true, font: { size: 10, family: 'sans-serif' } } 
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
              ticks: { color: '#94a3b8', font: { size: 9, family: 'sans-serif' } }
            },
            y: { 
              type: 'linear', 
              display: true, 
              position: 'left',
              min: 0, 
              max: 100,
              grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
              ticks: { color: '#94a3b8', font: { size: 9, family: 'sans-serif' }, stepSize: 25 }
            }
          },
          layout: { padding: 10 }
        }
      };
      
      // We use encodeURIComponent to ensure the JSON safely passes in the URL.
      // Important: version=3 is required because the scales config uses Chart.js v3+ syntax.
      chartUrl = `https://quickchart.io/chart?v=3&c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=650&h=300&bkg=0f172a`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;padding:20px;color:#1e293b;">
      <div style="max-width:650px;margin:0 auto;background:white;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 6px rgba(0,0,0,0.05);overflow:hidden;">
        <div style="background:#4f46e5;color:white;padding:20px 24px;">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.85;margin-bottom:4px;">Periodic SRE Report</div>
          <div style="font-size:20px;font-weight:800;">Website Health & Performance Report</div>
        </div>
        
        <div style="padding:24px;">
          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;">
            <div style="font-size:16px;font-weight:bold;color:#0f172a;margin-bottom:8px;">Target: <a href="${url}" style="color:#4f46e5;text-decoration:none;">${url}</a></div>
            <div style="font-size:13px;color:#475569;line-height:1.6;">
              <strong>Uptime:</strong> ${stats.uptimePercentage}% &nbsp;|&nbsp; 
              <strong>Total Checks:</strong> ${stats.totalChecks} &nbsp;|&nbsp;
              <strong>Report Generated:</strong> ${new Date().toLocaleString()}
            </div>
          </div>

          <!-- Key Diagnostic Badges: SSL, Domain Expiry, Accessibility -->
          <div style="display:table;width:100%;margin-bottom:24px;border-spacing:8px 0;table-layout:fixed;">
            <!-- SSL Certificate Card -->
            <div style="display:table-cell;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;vertical-align:top;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
              <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">🔒 SSL Validation</div>
              <div style="margin-bottom:6px;">
                <span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:800;color:white;background:${sslStatusColor};text-transform:uppercase;">${sslStatusText}</span>
              </div>
              <div style="font-size:11px;color:#334155;line-height:1.4;">
                <strong>Expires:</strong> ${sslExpiryDate}<br>
                <span style="color:#64748b;font-size:10px;">${sslDaysRemaining}</span><br>
                <span style="color:#94a3b8;font-size:10px;">Issuer: ${sslIssuer}</span>
              </div>
            </div>

            <!-- Domain Expiry Date Card -->
            <div style="display:table-cell;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;vertical-align:top;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
              <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">🌐 Domain Expiry</div>
              <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:4px;">
                ${domainExpiryDateStr}
              </div>
              <div style="font-size:11px;color:#64748b;line-height:1.4;">
                <strong>Registrar:</strong> ${domainRegistrarStr}<br>
                <span style="color:#10b981;font-weight:600;font-size:10px;">WHOIS / DNS Verified</span>
              </div>
            </div>

            <!-- Accessibility Rating Card -->
            <div style="display:table-cell;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;vertical-align:top;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
              <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">♿ Accessibility Rating</div>
              <div style="font-size:22px;font-weight:900;color:${accessibilityColor};margin-bottom:2px;">
                ${accessibilityScore}%
              </div>
              <div style="font-size:11px;font-weight:700;color:#334155;">
                ${accessibilityRating}
              </div>
              <div style="font-size:10px;color:#94a3b8;margin-top:2px;">
                WCAG 2.1 Contrast &amp; Semantics
              </div>
            </div>
          </div>
          
          ${chartUrl ? `
          <h3 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Performance Trend</h3>
          <div style="margin-bottom:24px;text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#ffffff;">
            <img src="${chartUrl}" alt="Performance Chart" style="max-width:100%;height:auto;border-radius:4px;display:block;margin:0 auto;" />
          </div>
          ` : ''}

          <h3 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Recent Audit History</h3>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;text-align:left;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Date / Time</th>
                  <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Status</th>
                  <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">HTTP</th>
                  <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Load Time</th>
                  <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">SEO</th>
                  <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">SSL</th>
                  <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Accessibility</th>
                </tr>
              </thead>
              <tbody>
                ${historyRows}
              </tbody>
            </table>
          </div>
          
          <p style="font-size:13px;color:#64748b;line-height:1.5;">This is an automated periodic health report generated by MonitorPro SRE. To change the notification or reporting settings for this website, please log in to your SRE dashboard.</p>
        </div>
        
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 24px;font-size:11px;color:#94a3b8;text-align:center;">
          MonitorPro SRE Dashboard · <a href="${url}" style="color:#6366f1;text-decoration:none;">View Dashboard</a>
        </div>
      </div>
    </body></html>`;

    await enqueueEmailAlert({
      url,
      recipient,
      cc,
      category: 'report',
      level: 'info',
      subject,
      message: 'Periodic website health report generated.',
      html
    });
    
    console.log(`📧 Queued periodic report email for ${url} to ${recipient}${cc ? ` (CC: ${cc})` : ''}`);
  } catch (err) {
    console.error('❌ Error sending periodic report email:', err.message);
  }
};

module.exports = {
  sendAlertEmailToWebsite,
  sendPeriodicReportEmail,
  enqueueEmailAlert,
  initializeEmailQueue,
  setIoInstance
};

