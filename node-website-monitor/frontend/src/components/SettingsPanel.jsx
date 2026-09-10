import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  ShieldCheck, AlertTriangle, AlertCircle, Mail, Key, Bell, 
  ToggleLeft, ToggleRight, Sparkles, RefreshCw, Send, CheckCircle2
} from 'lucide-react';

const API_BASE = '/api';

export default function SettingsPanel({ showToast }) {
  const [settings, setSettings] = useState({
    slack_webhook: '',
    telegram_chat_id: '',
    critical_email: '',
    email_host_user: '',
    email_host_password: '',
    alert_email_recipients: '',
    alerts_enabled: true,
    resend_api_key: '',
    resend_from_email: ''
  });
  const [emailLogs, setEmailLogs] = useState([]);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch settings from server
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/settings`);
      if (response.data) {
        setSettings(response.data.settings);
        setEmailLogs(response.data.emailLogs || []);
        setTotalLogsCount(response.data.totalLogsCount || 0);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch SRE settings from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE}/settings`, settings);
      if (response.data.success) {
        showToast('SRE settings and alerts configuration saved.', 'success');
        await fetchSettings();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update alert settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAlerts = async () => {
    const updatedStatus = !settings.alerts_enabled;
    setSettings(prev => ({ ...prev, alerts_enabled: updatedStatus }));
    
    // Save instantly
    try {
      const response = await axios.post(`${API_BASE}/settings`, { 
        ...settings, 
        alerts_enabled: updatedStatus 
      });
      if (response.data.success) {
        showToast(
          updatedStatus ? 'Email notifications enabled!' : 'Email notifications deactivated.',
          updatedStatus ? 'success' : 'info'
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle alerts.', 'error');
      setSettings(prev => ({ ...prev, alerts_enabled: !updatedStatus }));
    }
  };

  // Compile statistics for visual charts
  const categoryDataMap = {};
  const levelDataMap = {};

  emailLogs.forEach(log => {
    categoryDataMap[log.category] = (categoryDataMap[log.category] || 0) + 1;
    levelDataMap[log.level] = (levelDataMap[log.level] || 0) + 1;
  });

  const categoryChartData = Object.keys(categoryDataMap).map(key => ({
    name: key.toUpperCase(),
    value: categoryDataMap[key]
  }));

  const levelChartData = Object.keys(levelDataMap).map(key => ({
    name: key.toUpperCase(),
    value: levelDataMap[key]
  }));

  const COLORS_CATEGORY = ['#6366f1', '#0ea5e9', '#f59e0b', '#ec4899'];
  const COLORS_LEVEL = {
    CRITICAL: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6'
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. Gmail Access & Global Email Alert configurations */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Credentials Form */}
        <form onSubmit={handleSave} className="col-span-12 md:col-span-7 glass-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-4 mb-5">
              <div>
                <h3 className="text-slate-200 font-extrabold text-lg flex items-center gap-2">
                  <Mail className="text-indigo-400 h-5 w-5" />
                  SRE Gmail Alert Gateways
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure Gmail SMTP credentials to dispatch automatic non-blocking alert emails.</p>
              </div>

              {/* Toggle Alerts switch */}
              <button
                type="button"
                onClick={handleToggleAlerts}
                className="flex items-center gap-2 cursor-pointer focus:outline-none"
                title={settings.alerts_enabled ? "Disable all email alerts" : "Enable email alerts"}
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {settings.alerts_enabled ? 'Alerts Active' : 'Alerts Disabled'}
                </span>
                {settings.alerts_enabled ? (
                  <ToggleRight className="h-7 w-7 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-slate-600" />
                )}
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Gmail User */}
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Gmail Username</label>
                  <div className="bg-dark-900 border border-slate-850/60 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-indigo-500/50 transition-all shadow-inner">
                    <Mail className="text-slate-500 h-4 w-4 shrink-0" />
                    <input 
                      type="email"
                      placeholder="username@gmail.com"
                      value={settings.email_host_user}
                      onChange={e => setSettings(prev => ({ ...prev, email_host_user: e.target.value }))}
                      className="bg-transparent border-none outline-none text-xs w-full text-slate-250 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Gmail Password */}
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Gmail App Password</label>
                  <div className="bg-dark-900 border border-slate-850/60 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-indigo-500/50 transition-all shadow-inner">
                    <Key className="text-slate-500 h-4 w-4 shrink-0" />
                    <input 
                      type="password"
                      placeholder="••••••••••••••••"
                      value={settings.email_host_password}
                      onChange={e => setSettings(prev => ({ ...prev, email_host_password: e.target.value }))}
                      className="bg-transparent border-none outline-none text-xs w-full text-slate-250 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Resend API Key */}
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Resend API Key</label>
                  <div className="bg-dark-900 border border-slate-850/60 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-indigo-500/50 transition-all shadow-inner">
                    <Key className="text-slate-500 h-4 w-4 shrink-0" />
                    <input 
                      type="password"
                      placeholder="re_xxxxxxxxxxxxxxxxx"
                      value={settings.resend_api_key || ''}
                      onChange={e => setSettings(prev => ({ ...prev, resend_api_key: e.target.value }))}
                      className="bg-transparent border-none outline-none text-xs w-full text-slate-250 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Resend From Email */}
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Resend From Email</label>
                  <div className="bg-dark-900 border border-slate-850/60 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-indigo-500/50 transition-all shadow-inner">
                    <Mail className="text-slate-500 h-4 w-4 shrink-0" />
                    <input 
                      type="email"
                      placeholder="onboarding@resend.dev"
                      value={settings.resend_from_email || ''}
                      onChange={e => setSettings(prev => ({ ...prev, resend_from_email: e.target.value }))}
                      className="bg-transparent border-none outline-none text-xs w-full text-slate-250 placeholder-slate-600"
                    />
                  </div>
                </div>

              </div>

              {/* Critical Alert Receiver */}
              <div className="space-y-2">
                <label className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Critical Alert Recipient Email</label>
                <div className="bg-dark-900 border border-slate-850/60 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-indigo-500/50 transition-all shadow-inner">
                  <Send className="text-slate-500 h-4 w-4 shrink-0" />
                  <input 
                    type="email"
                    placeholder="alert-recipient@company.com"
                    value={settings.critical_email}
                    onChange={e => setSettings(prev => ({ ...prev, critical_email: e.target.value }))}
                    className="bg-transparent border-none outline-none text-xs w-full text-slate-250 placeholder-slate-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mt-1.5 italic">
                  * Note: For accessing with Gmail securely, configure a 16-character <strong>App Password</strong> in your Google Account Security settings.
                </p>
              </div>

            </div>
          </div>

          <div className="border-t border-slate-800/40 pt-4 flex justify-end gap-3.5">
            <button
              type="button"
              onClick={fetchSettings}
              className="px-4 py-2 bg-dark-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Form
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-indigo-650 to-indigo-550 hover:from-indigo-575 hover:to-indigo-475 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/15 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>

        {/* Dynamic Visual Email Alert Charts */}
        <div className="col-span-12 md:col-span-5 glass-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="text-indigo-400 h-4.5 w-4.5 animate-pulse" />
              SRE Dispatched Alerts Visual Charts
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Real-time charts of system alerts triggered during crawler passes.</p>
          </div>

          {emailLogs.length >= 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-48 w-full items-center">
              
              {/* Category distribution */}
              <div className="h-full flex flex-col items-center justify-center relative">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest absolute top-0 text-center w-full">Alerts by Category</span>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_CATEGORY[index % COLORS_CATEGORY.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px', backgroundColor: '#090d16', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-1.5 text-[8px] text-slate-400 font-bold mt-1">
                  {categoryChartData.map((c, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS_CATEGORY[i % COLORS_CATEGORY.length] }}></span>
                      {c.name} ({c.value})
                    </span>
                  ))}
                </div>
              </div>

              {/* Level Severity Distribution */}
              <div className="h-full flex flex-col items-center justify-center relative">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest absolute top-0 text-center w-full">Alerts by Severity</span>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={levelChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {levelChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_LEVEL[entry.name] || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px', backgroundColor: '#090d16', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-1.5 text-[8px] text-slate-400 font-bold mt-1">
                  {levelChartData.map((l, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS_LEVEL[l.name] || '#6366f1' }}></span>
                      {l.name} ({l.value})
                    </span>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-dark-900/20">
              Awaiting SMTP alerts dispatches to populate metrics...
            </div>
          )}

          <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-800/40 pt-2 flex justify-between">
            <span>Total alerts logged:</span>
            <span className="font-extrabold text-indigo-400">{totalLogsCount} alerts</span>
          </div>
        </div>

      </div>

      {/* 2. Dispatch logs audit streams */}
      <div className="glass-card p-6">
        <div className="border-b border-slate-800/80 pb-3 mb-4 flex justify-between items-center">
          <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2">
            <Bell className="text-indigo-400 h-5 w-5" />
            Gmail SMTP Alert Dispatch Logs
          </h3>
          <span className="text-xs text-slate-500 font-bold bg-slate-850 px-2.5 py-0.5 rounded-full">Audit Log Stream</span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          {emailLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center gap-2 bg-dark-900/20 border border-dashed border-slate-800 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-450" />
              No emails successfully logged in email_delivery.log yet. Make sure SMTP is configured.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Date/Time</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Recipient</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Severity</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.map((log, index) => (
                  <tr key={index} className="border-b border-slate-850/40 hover:bg-dark-900/20 transition-all">
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {new Date(log.checkedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-semibold">{log.subject}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{log.recipient}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-350 text-[9px] font-bold uppercase tracking-wide">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded font-black text-[9px] ${
                        log.level === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                        log.level === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
