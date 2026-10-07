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
const enqueueEmailAlert = async ({ url, recipient, category, level, subject, message, html }) => {
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
        attempts: 0
      });
    }
    processQueue();
  } catch (err) {
    console.error('⚠️ Failed to initialize email queue recovery:', err.message);
  }
};

/**
 * Global SRE warning/critical alerts.
 */
const sendAlertEmail = async (url, category, level, message) => {
  const time = new Date().toLocaleString();
  
  const settings = loadSettings();
  
  const recipient = settings.critical_email;
  const subject = `[${level.toUpperCase()}] SRE Alert Triggered - ${url}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 20px; }
        .card { max-width: 580px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; }
        .header { background: #4f46e5; color: white; padding: 24px; font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 0.02em; }
        .header.critical { background: #ef4444; }
        .header.warning { background: #f59e0b; }
        .content { padding: 24px; font-size: 14px; line-height: 1.6; }
        .badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: 800; border-radius: 9999px; text-transform: uppercase; color: white; margin-bottom: 12px; }
        .badge.critical { background: #ef4444; }
        .badge.warning { background: #f59e0b; }
        .badge.info { background: #3b82f6; }
        .details { background: #f1f5f9; padding: 14px; border-radius: 8px; margin-top: 16px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; }
        .footer { text-align: center; font-size: 10px; color: #94a3b8; padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header ${level}">
          MonitorPro SRE Gateway Alert
        </div>
        <div class="content">
          <span class="badge ${level}">${level}</span>
          <div style="font-weight: 800; font-size: 15px; margin-bottom: 8px;">Anomalous Site Event Discovered!</div>
          <p>During the automated real-time SRE check, our monitoring system flagged a state exception on the target host.</p>
          
          <div class="details">
            <strong>URL:</strong> ${url}<br>
            <strong>Category:</strong> ${category.toUpperCase()}<br>
            <strong>Alert Message:</strong> ${message}<br>
            <strong>Detected At:</strong> ${time} UTC
          </div>
          
          <p style="margin-top: 16px;">Please log in to your SRE portal to verify details and run live traceroutes.</p>
        </div>
        <div class="footer">
          MonitorPro Node SRE Module • Authorized email dispatch
        </div>
      </div>
    </body>
    </html>
  `;
  
  await enqueueEmailAlert({
    url,
    recipient,
    category,
    level,
    subject,
    message,
    html
  });
};

/**
 * Per-website alert email sender.
 */
const sendAlertEmailToWebsite = async (url, category, level, message, extraIssues = []) => {
  try {
    const { WebsiteEmailConfig } = require('../models/Schemas');
    
    const config = await WebsiteEmailConfig.findOne({ url });
    if (!config || !config.alertsEnabled || !config.alertEmail) return;
    
    // Check frequency throttle for non-instant modes
    if (config.alertFrequency !== 'instant' && config.lastEmailSent) {
      const now = Date.now();
      const last = new Date(config.lastEmailSent).getTime();
      const hoursSince = (now - last) / (1000 * 60 * 60);
      if (config.alertFrequency === 'daily' && hoursSince < 24) return;
      if (config.alertFrequency === 'weekly' && hoursSince < 168) return;
    }
    
    const recipient = config.alertEmail;
    
    const allIssues = [{ category, level, message }, ...extraIssues];
    const hasMultiple = allIssues.length > 1;
    const topLevel = allIssues.some(i => i.level === 'critical') ? 'critical' : allIssues.some(i => i.level === 'warning') ? 'warning' : 'info';
    
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
      category,
      level: topLevel,
      subject,
      message: allIssues.map(i => i.message).join(' | '),
      html
    });
  } catch (err) {
    console.error('❌ sendAlertEmailToWebsite error:', err.message);
  }
};

/**
 * Send periodic performance and security report email.
 */
const sendPeriodicReportEmail = async (url, recipient, stats) => {
  try {
    const subject = `[MonitorPro] 48-Hour Health Report for ${url}`;
    
    // Build a nicely formatted HTML table for recent scan history
    let historyRows = '';
    if (stats.historyLog && stats.historyLog.length > 0) {
      historyRows = stats.historyLog.slice(0, 10).map(log => {
        const statusColor = log.isUp ? '#22c55e' : '#ef4444';
        const statusText = log.isUp ? 'UP' : 'DOWN';
        const date = new Date(log.checkedAt).toLocaleString();
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${date}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;"><span style="color:white;background:${statusColor};padding:2px 6px;border-radius:4px;font-weight:bold;">${statusText}</span></td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${log.statusCode || '-'}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${log.loadTimeMs ? log.loadTimeMs + 'ms' : '-'}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;font-weight:bold;color:#f59e0b;">${log.seo?.seoScore || '-'}</td>
          </tr>
        `;
      }).join('');
    } else {
      historyRows = '<tr><td colspan="5" style="padding:10px;text-align:center;font-size:12px;color:#64748b;">No scans recorded in this period.</td></tr>';
    }

    // Generate a QuickChart URL for the graphical representation
    let chartUrl = '';
    if (stats.historyLog && stats.historyLog.length > 0) {
      // Get up to 20 most recent logs and reverse them so they are chronological (oldest to newest)
      const chartData = [...stats.historyLog].slice(0, 20).reverse();
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
          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
            <div style="font-size:16px;font-weight:bold;color:#0f172a;margin-bottom:8px;">Target: <a href="${url}" style="color:#4f46e5;text-decoration:none;">${url}</a></div>
            <div style="font-size:13px;color:#475569;">
              <strong>Uptime:</strong> ${stats.uptimePercentage}% <br>
              <strong>Total Checks:</strong> ${stats.totalChecks}
            </div>
          </div>
          
          ${chartUrl ? `
          <h3 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Performance Trend</h3>
          <div style="margin-bottom:24px;text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#ffffff;">
            <img src="${chartUrl}" alt="Performance Chart" style="max-width:100%;height:auto;border-radius:4px;display:block;margin:0 auto;" />
          </div>
          ` : ''}

          <h3 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Recent Audit History (Last 10 Scans)</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;text-align:left;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Date / Time</th>
                <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Status</th>
                <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">HTTP</th>
                <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Load Time</th>
                <th style="padding:10px;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">SEO</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows}
            </tbody>
          </table>
          
          <p style="font-size:13px;color:#64748b;line-height:1.5;">This is an automated 48-hour periodic health report generated by MonitorPro. To change the notification settings for this website, please log in to your SRE dashboard.</p>
        </div>
        
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 24px;font-size:11px;color:#94a3b8;text-align:center;">
          MonitorPro SRE Dashboard · <a href="${url}" style="color:#6366f1;text-decoration:none;">View Dashboard</a>
        </div>
      </div>
    </body></html>`;

    await enqueueEmailAlert({
      url,
      recipient,
      category: 'report',
      level: 'info',
      subject,
      message: 'Periodic 48-hour website health report generated.',
      html
    });
    
    console.log(`📧 Queued periodic 48h report email for ${url} to ${recipient}`);
  } catch (err) {
    console.error('❌ Error sending periodic report email:', err.message);
  }
};

module.exports = {
  sendAlertEmail,
  sendAlertEmailToWebsite,
  sendPeriodicReportEmail,
  enqueueEmailAlert,
  initializeEmailQueue,
  setIoInstance
};

