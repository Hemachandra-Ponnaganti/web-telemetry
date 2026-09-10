import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Mail, Bell, BellOff, Send, CheckCircle2, AlertCircle,
  RefreshCw, Clock, Shield, Globe, Activity, ToggleLeft, ToggleRight,
  AlertTriangle, Info, Inbox
} from 'lucide-react';

const API_BASE = '/api';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const LEVEL_COLORS = {
  critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  info:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const ALERT_TRIGGERS = [
  { icon: Globe,    color: 'text-rose-400',   label: 'Website Down',                desc: 'Fires when HTTP status ≠ 200 or connection fails' },
  { icon: Shield,   color: 'text-amber-400',  label: 'SSL Expiring (≤7 days)',       desc: 'Warning sent when SSL expires within a week' },
  { icon: Shield,   color: 'text-rose-400',   label: 'SSL Critical (≤1 day)',        desc: 'Critical alert when SSL expires within 24 hours' },
  { icon: Activity, color: 'text-amber-400',  label: 'Low Performance Score',        desc: 'Performance score drops below 60' },
  { icon: Activity, color: 'text-amber-400',  label: 'Low SEO Score',                desc: 'SEO score drops below 60' },
  { icon: Shield,   color: 'text-amber-400',  label: 'Low Security Score',           desc: 'Security score drops below 60' },
  { icon: Bell,     color: 'text-rose-400',   label: 'Broken Links Found',           desc: 'One or more broken links detected' },
  { icon: Bell,     color: 'text-amber-400',  label: 'Missing Meta Description',     desc: 'Homepage missing meta description tag' },
  { icon: Bell,     color: 'text-amber-400',  label: 'Missing Image ALT Tags',       desc: 'Images found without ALT text' },
  { icon: AlertTriangle, color: 'text-rose-400', label: 'Scan Failure',             desc: 'Monitoring scan fails to complete' },
];

export default function EmailAlertSettings({ siteUrl, showToast }) {
  const [config, setConfig] = useState({
    alertEmail:     '',
    alertsEnabled:  false,
    alertFrequency: 'instant',
    totalEmailsSent: 0,
    lastEmailSent:   null,
    lastAlertType:   '',
  });
  const [emailInput, setEmailInput]   = useState('');
  const [emailError, setEmailError]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [testing, setTesting]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [saved, setSaved]             = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchConfig = async () => {
    if (!siteUrl) return;
    setLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/email-config?url=${encodeURIComponent(siteUrl)}`);
      const data = resp.data || {};
      setConfig(data);
      setEmailInput(data.alertEmail || '');
    } catch (err) {
      console.error('Failed to load email config:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!siteUrl) return;
    setHistoryLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/email-history?url=${encodeURIComponent(siteUrl)}`);
      setEmailHistory(resp.data || []);
    } catch (err) {
      console.error('Failed to load email history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchHistory();
  }, [siteUrl]);

  useEffect(() => {
    if (!siteUrl) return;
    
    const isLocalDev = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const socketUrl = isLocalDev
      ? 'http://localhost:5000'
      : 'https://monitor-hg6i.onrender.com';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('emailStatusChanged', (updatedEmail) => {
      // Normalize URLs
      const normSite = siteUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
      const normEmailSite = updatedEmail.url.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
      if (normSite !== normEmailSite) return;

      setEmailHistory(prev => {
        const exists = prev.some(item => item._id === updatedEmail._id);
        if (exists) {
          return prev.map(item => item._id === updatedEmail._id ? updatedEmail : item);
        } else {
          return [updatedEmail, ...prev];
        }
      });
      
      if (updatedEmail.status === 'delivered') {
        setConfig(prev => ({
          ...prev,
          totalEmailsSent: (prev.totalEmailsSent || 0) + 1,
          lastEmailSent: updatedEmail.deliveredAt || new Date(),
          lastAlertType: updatedEmail.alertType
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [siteUrl]);

  const handleSave = async () => {
    // Validate email
    if (emailInput && !isValidEmail(emailInput)) {
      setEmailError('Please enter a valid email address (e.g. user@gmail.com)');
      return;
    }
    setEmailError('');
    setSaving(true);
    try {
      const resp = await axios.post(`${API_BASE}/email-config`, {
        url:            siteUrl,
        alertEmail:     emailInput,
        alertsEnabled:  config.alertsEnabled,
        alertFrequency: config.alertFrequency,
      });
      if (resp.data.success) {
        setConfig(prev => ({ ...prev, alertEmail: emailInput }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        showToast('Email alert settings saved successfully!', 'success');
        fetchConfig();
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save email settings.';
      setEmailError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!config.alertEmail && !emailInput) {
      setEmailError('Enter an email address before enabling alerts.');
      return;
    }
    const newEnabled = !config.alertsEnabled;
    setConfig(prev => ({ ...prev, alertsEnabled: newEnabled }));
    try {
      await axios.post(`${API_BASE}/email-config`, {
        url:            siteUrl,
        alertEmail:     emailInput || config.alertEmail,
        alertsEnabled:  newEnabled,
        alertFrequency: config.alertFrequency,
      });
      showToast(newEnabled ? 'Email alerts enabled for this website.' : 'Email alerts disabled.', newEnabled ? 'success' : 'info');
    } catch (err) {
      setConfig(prev => ({ ...prev, alertsEnabled: !newEnabled }));
      showToast('Failed to toggle alerts.', 'error');
    }
  };

  const handleTestEmail = async () => {
    if (!config.alertEmail) {
      showToast('Save an email address first before sending a test.', 'error');
      return;
    }
    setTesting(true);
    try {
      const resp = await axios.post(`${API_BASE}/test-site-email`, { url: siteUrl });
      if (resp.data.success) {
        showToast(resp.data.message, 'success');
        fetchHistory();
      } else {
        showToast(resp.data.error || 'Test email failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Test email failed.', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (!siteUrl) {
    return (
      <div className="glass-card p-10 text-center max-w-2xl mx-auto my-6 animate-fade-in-up">
        <Mail className="h-10 w-10 text-slate-600 mx-auto mb-4 animate-bounce" />
        <h4 className="font-extrabold text-slate-400">No Website Selected</h4>
        <p className="text-xs text-slate-500 mt-2">Enter a URL and run a scan first, then configure email alerts for that website.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Header */}
      <div>
        <h2 className="text-slate-200 font-extrabold text-lg flex items-center gap-2">
          <Mail className="text-indigo-400 h-5 w-5" /> Email Alert Settings
        </h2>
        <p className="text-[10px] text-slate-500 mt-0.5 font-bold">
          Configuring alerts for: <span className="text-indigo-400 font-mono">{siteUrl}</span>
        </p>
      </div>

      {/* ── Main Config Card ─────────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
          <div>
            <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-400" /> Alert Configuration
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">When enabled, alerts for this website are sent to the email below.</p>
          </div>
          {/* Enable toggle */}
          <button onClick={handleToggle} className="flex items-center gap-2 cursor-pointer focus:outline-none" title="Toggle email alerts">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.alertsEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
              {config.alertsEnabled ? 'Enabled' : 'Disabled'}
            </span>
            {config.alertsEnabled
              ? <ToggleRight className="h-7 w-7 text-emerald-400" />
              : <ToggleLeft className="h-7 w-7 text-slate-600" />}
          </button>
        </div>

        {/* Alert email input */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Alert Email Address *
          </label>
          <div className={`flex items-center gap-2 bg-slate-900/60 border rounded-xl px-3.5 py-2.5 transition-all ${emailError ? 'border-rose-500/50' : 'border-slate-800 focus-within:border-indigo-500/60'}`}>
            <Mail className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="email"
              placeholder="your@gmail.com"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
              className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-600 w-full"
            />
            {emailInput && isValidEmail(emailInput) && (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
          </div>
          {emailError && (
            <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 shrink-0" /> {emailError}
            </p>
          )}
          <p className="text-[10px] text-slate-500 italic">
            All monitoring alerts for <span className="text-slate-400 font-mono">{siteUrl}</span> will be sent to this address.
          </p>
        </div>

        {/* Alert frequency */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Alert Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'instant', label: 'Instant',       desc: 'Send immediately' },
              { value: 'daily',   label: 'Daily Summary',  desc: 'Once per 24h' },
              { value: 'weekly',  label: 'Weekly Summary', desc: 'Once per week' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setConfig(prev => ({ ...prev, alertFrequency: opt.value }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  config.alertFrequency === opt.value
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wider">{opt.label}</p>
                <p className="text-[9px] mt-0.5 opacity-70">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Status row (last sent / total) */}
        {(config.totalEmailsSent > 0 || config.lastEmailSent) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/40">
            <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Sent</p>
              <p className="text-lg font-black text-indigo-400">{config.totalEmailsSent || 0}</p>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Last Sent</p>
              <p className="text-[10px] font-bold text-slate-300">
                {config.lastEmailSent ? new Date(config.lastEmailSent).toLocaleString() : '—'}
              </p>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Last Type</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase">{config.lastAlertType || '—'}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/40">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all disabled:opacity-60"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Alert Settings'}
          </button>

          <button
            onClick={handleTestEmail}
            disabled={testing || !config.alertEmail}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
          >
            {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>

          <button
            onClick={() => { fetchConfig(); fetchHistory(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Settings saved. Alerts for <strong>{siteUrl}</strong> will be sent to <strong>{emailInput}</strong>.
          </div>
        )}
      </div>

      {/* ── Alert Triggers Reference Card ───────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-sm mb-4 flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <AlertTriangle className="text-amber-400 h-4 w-4" /> Alert Triggers
          <span className="ml-auto text-[9px] text-slate-500 font-bold uppercase tracking-wider">Auto-fires on these events</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ALERT_TRIGGERS.map((t, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-slate-800/20 border border-slate-800/40 rounded-xl">
              <t.icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${t.color}`} />
              <div>
                <p className="text-[10px] font-bold text-slate-300">{t.label}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Email Alert History ──────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-sm mb-4 flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <Inbox className="text-indigo-400 h-4 w-4" /> Email Alert History
          <span className="ml-auto text-[9px] text-slate-500 font-bold">{emailHistory.length} records</span>
        </h3>

        {historyLoading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-5 w-5 text-indigo-400 rotate-infinite mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading history...</p>
          </div>
        ) : emailHistory.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20 flex flex-col items-center gap-2">
            <Inbox className="h-6 w-6 text-slate-700" />
            <p className="text-xs text-slate-500 font-bold">No email alerts sent yet for this website.</p>
            <p className="text-[10px] text-slate-600">Alerts will appear here after monitoring triggers them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0">
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/80">
                  <th className="py-2.5 px-3">Sent At</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {emailHistory.map((entry, idx) => {
                  let effectiveStatus = entry.status;
                  if (!effectiveStatus) {
                    effectiveStatus = entry.delivered ? 'delivered' : 'failed';
                  }

                  const getStatusBadge = (status) => {
                    switch (status) {
                      case 'delivered':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
                            ✅ Delivered
                          </span>
                        );
                      case 'sending':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider animate-pulse">
                            ⏳ Sending
                          </span>
                        );
                      case 'failed':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 text-rose-450 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider">
                            ❌ Failed
                          </span>
                        );
                      case 'bounced':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-black uppercase tracking-wider">
                            ⚠️ Bounced
                          </span>
                        );
                      default:
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[9px] font-black uppercase tracking-wider">
                            ❔ Unknown
                          </span>
                        );
                    }
                  };

                  const getStatusColorText = (status) => {
                    switch (status) {
                      case 'delivered': return 'text-emerald-400';
                      case 'sending': return 'text-amber-400';
                      case 'failed': return 'text-rose-400';
                      case 'bounced': return 'text-orange-400';
                      default: return 'text-slate-400';
                    }
                  };

                  return (
                    <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-850/30 transition-all">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[9px]">
                        {new Date(entry.sentAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-350 max-w-[200px] truncate" title={entry.subject}>
                        {entry.subject}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[9px]">{entry.alertEmail}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-450 rounded text-[8px] font-bold uppercase">{entry.alertType}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${LEVEL_COLORS[entry.level] || LEVEL_COLORS.info}`}>
                          {entry.level?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center relative group select-none">
                        <div className="cursor-help inline-block">
                          {getStatusBadge(effectiveStatus)}
                        </div>
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-950 border border-slate-800/80 text-slate-300 text-[10px] rounded-xl p-3 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 text-left leading-normal">
                          <div className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-850 pb-1.5 mb-2 flex justify-between">
                            <span>Delivery Details</span>
                            <span className={getStatusColorText(effectiveStatus)}>{effectiveStatus?.toUpperCase()}</span>
                          </div>
                          <div className="space-y-1.5 font-sans">
                            <div><span className="font-bold text-slate-500">Sent:</span> {new Date(entry.sentAt).toLocaleString()}</div>
                            <div><span className="font-bold text-slate-500">Delivered:</span> {entry.deliveredAt ? new Date(entry.deliveredAt).toLocaleString() : '—'}</div>
                            {entry.messageId && (
                              <div className="truncate"><span className="font-bold text-slate-500">Msg ID:</span> <span className="font-mono text-[9px] text-slate-400">{entry.messageId}</span></div>
                            )}
                            {entry.errorReason && (
                              <div className="text-rose-400 mt-1.5 border-t border-slate-850 pt-1.5 leading-relaxed">
                                <span className="font-bold text-rose-350">Reason:</span> {entry.errorReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
