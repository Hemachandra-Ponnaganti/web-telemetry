const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../../../sre_settings.json');
const emailLogPath = path.join(__dirname, '../../../email_delivery.log');

/**
 * Get SRE Settings & Email Delivery logs
 */
const getSettings = async (req, res) => {
  let settings = {
    slack_webhook: '',
    telegram_chat_id: '',
    critical_email: '',
    email_host_user: '',
    email_host_password: '',
    alert_email_recipients: '',
    alerts_enabled: true
  };

  // Read sre_settings.json
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      settings = { ...settings, ...JSON.parse(data) };
      // Default alerts_enabled to true if not specified
      if (settings.alerts_enabled === undefined) {
        settings.alerts_enabled = true;
      }
    }
  } catch (err) {
    console.error('⚠️ Failed to read SRE settings file:', err.message);
  }

  // Parse email logs to serve as a history stream and chart data
  let logs = [];
  try {
    if (fs.existsSync(emailLogPath)) {
      const logContent = fs.readFileSync(emailLogPath, 'utf8');
      const blocks = logContent.split('--------------------------------------------------');
      
      blocks.forEach(block => {
        if (!block.trim()) return;
        
        const timeMatch = block.match(/\[(.*?)\]/);
        const recipientMatch = block.match(/EMAIL DISPATCHED TO: (.*?)\n/);
        const subjectMatch = block.match(/SUBJECT: (.*?)\n/);
        
        if (timeMatch && recipientMatch && subjectMatch) {
          const subject = subjectMatch[1];
          let level = 'info';
          if (subject.toLowerCase().includes('critical')) level = 'critical';
          else if (subject.toLowerCase().includes('warning')) level = 'warning';
          
          let category = 'uptime';
          if (subject.toLowerCase().includes('ssl')) category = 'ssl';
          else if (subject.toLowerCase().includes('seo')) category = 'seo';
          else if (subject.toLowerCase().includes('wordpress')) category = 'wordpress';

          logs.push({
            checkedAt: new Date(timeMatch[1]),
            recipient: recipientMatch[1],
            subject: subject,
            level,
            category
          });
        }
      });
    }
  } catch (err) {
    console.error('⚠️ Failed to parse email delivery logs:', err.message);
  }

  // Sort logs by newest first and limit to 15
  logs.sort((a, b) => b.checkedAt - a.checkedAt);

  res.status(200).json({
    settings,
    emailLogs: logs.slice(0, 15),
    totalLogsCount: logs.length
  });
};

/**
 * Save SRE Settings
 */
const saveSettings = async (req, res) => {
  const newSettings = req.body;
  if (!newSettings) {
    return res.status(400).json({ error: 'Missing settings payload.' });
  }

  try {
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(data);
    }

    // Merge settings
    settings = { ...settings, ...newSettings };
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');
    
    res.status(200).json({
      success: true,
      message: 'SRE credentials and alerts settings saved successfully.',
      settings
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to save SRE settings: ${error.message}` });
  }
};

/**
 * Test SMTP connection and dispatch test email
 */
const testEmail = async (req, res) => {
  const nodemailer = require('nodemailer');
  let settings = {
    critical_email: 'alex.rivera@monitorpro.sre',
    email_host_user: '',
    email_host_password: '',
    alerts_enabled: true
  };

  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      settings = { ...settings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('⚠️ Failed to read settings in testEmail:', err.message);
  }

  const recipient = settings.critical_email;
  const hostUser = settings.email_host_user;
  const hostPass = settings.email_host_password;

  if (!recipient) {
    return res.status(400).json({ success: false, error: 'No email recipient configured. Please save a critical email recipient first.' });
  }

  const subject = "TEST SRE ALERT: Gmail Connection Verified";
  const text = `Hello SRE Operator,\n\nThis is a real-time test alert from your MonitorPro SRE Dashboard.\nYour Gmail SMTP configuration is working perfectly!\n\nStatus: OPERATIONAL\nTimestamp: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC\n\nSystem: MonitorPro Enterprise SRE Console`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #4f46e5; margin-top: 0;">TEST SRE ALERT: Gmail Connection Verified</h2>
      <p>Hello SRE Operator,</p>
      <p>This is a real-time test alert from your MonitorPro SRE Dashboard. Your Gmail SMTP configuration is working perfectly!</p>
      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; font-family: monospace; margin: 15px 0;">
        <strong>Status:</strong> OPERATIONAL<br/>
        <strong>Timestamp:</strong> ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
      </div>
      <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">System: MonitorPro Enterprise SRE Console</p>
    </div>
  `;

  // Log to email_delivery.log for SRE audit trail
  const time = new Date().toISOString();
  const logMsg = `[${time}] EMAIL DISPATCHED TO: ${recipient}\nSUBJECT: ${subject}\n\n${text}\n--------------------------------------------------\n\n`;
  try {
    fs.appendFileSync(emailLogPath, logMsg, 'utf-8');
  } catch (err) {
    console.error('⚠️ Failed to log test email:', err.message);
  }

  if (hostUser && hostPass) {
    try {
      const isGmail = hostUser.toLowerCase().includes("@gmail.com");
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

      await transporter.sendMail({
        from: hostUser,
        to: recipient,
        subject,
        text,
        html
      });
      return res.status(200).json({ success: true, message: `Test alert email successfully dispatched to ${recipient} via SMTP.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: `SMTP Connection Failed: ${err.message}` });
    }
  } else {
    return res.status(200).json({ success: true, message: `Test alert email successfully dispatched to console/logs (SMTP Credentials omitted).` });
  }
};

module.exports = {
  getSettings,
  saveSettings,
  testEmail
};
