const fs = require('fs');
const path = require('path');

const getSettingsCandidatePaths = () => {
  return [
    process.env.SRE_SETTINGS_PATH,
    path.join(__dirname, '../../../../sre_settings.json'), // web-telemetry/sre_settings.json
    path.join(__dirname, '../../../sre_settings.json'),    // node-website-monitor/sre_settings.json
    path.join(__dirname, '../../sre_settings.json'),       // backend/sre_settings.json
    path.join(process.cwd(), 'sre_settings.json'),        // process cwd
    path.join(process.cwd(), '..', 'sre_settings.json'),
    path.join(process.cwd(), '../..', 'sre_settings.json'),
  ].filter(Boolean);
};

const getSettingsPath = () => {
  const candidates = getSettingsCandidatePaths();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(__dirname, '../../sre_settings.json');
};

const loadSettings = () => {
  let settings = {
    slack_webhook: process.env.SLACK_WEBHOOK || '',
    telegram_chat_id: process.env.TELEGRAM_CHAT_ID || '',
    critical_email: process.env.CRITICAL_EMAIL || '',
    email_host_user: process.env.EMAIL_HOST_USER || '',
    email_host_password: process.env.EMAIL_HOST_PASSWORD || '',
    alert_email_recipients: process.env.ALERT_EMAIL_RECIPIENTS || '',
    resend_api_key: process.env.RESEND_API_KEY || '',
    resend_from_email: process.env.RESEND_FROM_EMAIL || '',
    alerts_enabled: process.env.ALERTS_ENABLED !== 'false'
  };

  const filePath = getSettingsPath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      settings = { ...settings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('⚠️ Failed to load settings from', filePath, err.message);
  }

  // Ensure env vars take priority if set
  if (process.env.RESEND_API_KEY) settings.resend_api_key = process.env.RESEND_API_KEY;
  if (process.env.EMAIL_HOST_USER && !settings.email_host_user) settings.email_host_user = process.env.EMAIL_HOST_USER;
  if (process.env.EMAIL_HOST_PASSWORD && !settings.email_host_password) settings.email_host_password = process.env.EMAIL_HOST_PASSWORD;
  if (process.env.CRITICAL_EMAIL && !settings.critical_email) settings.critical_email = process.env.CRITICAL_EMAIL;

  return settings;
};

const saveSettingsToFile = (newSettings) => {
  const current = loadSettings();
  const merged = { ...current, ...newSettings };
  const jsonStr = JSON.stringify(merged, null, 4);

  const targetPaths = [
    getSettingsPath(),
    path.join(__dirname, '../../sre_settings.json'),
    path.join(__dirname, '../../../../sre_settings.json')
  ];

  for (const p of targetPaths) {
    try {
      fs.writeFileSync(p, jsonStr, 'utf8');
    } catch (err) {
      // Ignore if directory doesn't exist
    }
  }

  return merged;
};

module.exports = {
  getSettingsPath,
  loadSettings,
  saveSettingsToFile
};
