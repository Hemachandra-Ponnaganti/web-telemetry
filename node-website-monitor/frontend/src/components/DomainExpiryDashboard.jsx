import React, { useState, useMemo } from 'react';
import {
  Globe, AlertTriangle, CheckCircle2, XCircle, Clock,
  Calendar, RefreshCw, Bell, Shield, TrendingDown, Info
} from 'lucide-react';

// ── Mock domain data — works immediately, no external API needed ─────────────
const MOCK_DOMAINS = [
  {
    id: 1,
    domain: 'wordpress.org',
    registrar: 'Network Solutions',
    registrationDate: '2000-01-15',
    expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nameservers: ['ns1.wordpress.org', 'ns2.wordpress.org'],
    autoRenew: true,
  },
  {
    id: 2,
    domain: 'example.com',
    registrar: 'GoDaddy',
    registrationDate: '2015-03-22',
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nameservers: ['ns1.example.com', 'ns2.example.com'],
    autoRenew: false,
  },
  {
    id: 3,
    domain: 'mysite.net',
    registrar: 'Namecheap',
    registrationDate: '2019-07-10',
    expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nameservers: ['ns1.namecheap.com', 'ns2.namecheap.com'],
    autoRenew: false,
  },
  {
    id: 4,
    domain: 'oldproject.io',
    registrar: 'Dynadot',
    registrationDate: '2018-11-01',
    expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nameservers: ['ns1.dynadot.com', 'ns2.dynadot.com'],
    autoRenew: false,
  },
  {
    id: 5,
    domain: 'clientsite.co',
    registrar: 'Cloudflare Registrar',
    registrationDate: '2021-06-18',
    expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
    autoRenew: true,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const getDaysRemaining = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
};

const getStatus = (days) => {
  if (days < 0)  return { label: 'Expired',         color: 'red',    level: 'critical' };
  if (days < 30) return { label: 'Expiring Soon',   color: 'orange', level: 'high' };
  if (days < 60) return { label: 'Expiring Soon',   color: 'yellow', level: 'medium' };
  return           { label: 'Active',               color: 'green',  level: 'ok' };
};

const statusStyles = {
  green:  { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',  bar: 'bg-emerald-500', icon: CheckCircle2 },
  yellow: { badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',        bar: 'bg-amber-500',   icon: AlertTriangle },
  orange: { badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/25',     bar: 'bg-orange-500',  icon: AlertTriangle },
  red:    { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',           bar: 'bg-rose-500',    icon: XCircle },
};

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
};

// ── Alert History mock ────────────────────────────────────────────────────────
const ALERT_HISTORY = [
  { id: 1, domain: 'mysite.net',    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), threshold: 30,  status: 'sent' },
  { id: 2, domain: 'example.com',   sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), threshold: 60,  status: 'sent' },
  { id: 3, domain: 'oldproject.io', sentAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(), threshold: 0, status: 'sent' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function DomainExpiryDashboard({ isDark }) {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [showAlertHistory, setShowAlertHistory] = useState(false);

  const enriched = useMemo(() =>
    MOCK_DOMAINS.map(d => {
      const days = getDaysRemaining(d.expiryDate);
      const status = getStatus(days);
      return { ...d, daysRemaining: days, status };
    }),
    []
  );

  // Summary counts
  const summary = useMemo(() => ({
    total:         enriched.length,
    active:        enriched.filter(d => d.status.color === 'green').length,
    expiringSoon:  enriched.filter(d => d.status.color === 'yellow' || d.status.color === 'orange').length,
    expired:       enriched.filter(d => d.status.color === 'red').length,
  }), [enriched]);

  // Warning banners — domains expiring within 30 days or already expired
  const warnings = useMemo(() =>
    enriched.filter(d => d.daysRemaining <= 30).sort((a, b) => a.daysRemaining - b.daysRemaining),
    [enriched]
  );

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* ── PAGE TITLE ────────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe className="w-40 h-40 text-indigo-500" />
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">DOMAIN EXPIRY MONITORING</span>
        <h2 className="text-xl font-extrabold text-slate-200 tracking-tight flex items-center gap-2">
          Domain Expiry Dashboard
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            {summary.total} Domains
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Track registration and expiry dates for all monitored domains.</p>
      </div>

      {/* ── WARNING BANNERS ───────────────────────────────────────────── */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map(d => {
            const st = statusStyles[d.status.color];
            const Icon = st.icon;
            return (
              <div key={d.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold ${st.badge} animate-fade-in-up`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>
                  {d.daysRemaining < 0
                    ? <><strong>{d.domain}</strong> has <strong>expired</strong> {Math.abs(d.daysRemaining)} days ago.</>
                    : <><strong>{d.domain}</strong> expires in <strong>{d.daysRemaining} days</strong> on {formatDate(d.expiryDate)}. Renew now to avoid downtime.</>
                  }
                </span>
                {!d.autoRenew && (
                  <span className="ml-auto shrink-0 text-[9px] font-black uppercase tracking-widest opacity-70">Auto-renew OFF</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SUMMARY CARDS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Domains',   value: summary.total,        color: 'text-slate-200',   bg: 'bg-dark-900/10 border-slate-800/40' },
          { label: 'Active',          value: summary.active,       color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/15' },
          { label: 'Expiring Soon',   value: summary.expiringSoon, color: 'text-amber-400',   bg: 'bg-amber-500/5 border-amber-500/15' },
          { label: 'Expired',         value: summary.expired,      color: 'text-rose-400',    bg: 'bg-rose-500/5 border-rose-500/15' },
        ].map(card => (
          <div key={card.label} className={`border p-4 rounded-xl flex flex-col justify-between ${card.bg}`}>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</span>
            <span className={`text-3xl font-black mt-2 ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* ── DOMAIN TABLE ──────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <h3 className="text-slate-200 font-bold text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            Domain Registry
          </h3>
          <button
            onClick={() => setShowAlertHistory(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            <Bell className="h-3 w-3" />
            {showAlertHistory ? 'Hide Alerts' : 'Alert History'}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['Domain', 'Registrar', 'Registered', 'Expires', 'Days Left', 'Status', 'Auto-Renew'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map(d => {
                const st = statusStyles[d.status.color];
                const Icon = st.icon;
                // Progress bar: 0–365 days maps to 0–100%
                const pct = Math.max(0, Math.min(100, (d.daysRemaining / 365) * 100));
                return (
                  <tr
                    key={d.id}
                    className="border-b border-slate-800/30 hover:bg-slate-800/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedDomain(selectedDomain?.id === d.id ? null : d)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="font-bold text-slate-200 font-mono text-xs">{d.domain}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{d.registrar}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{formatDate(d.registrationDate)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-300 font-mono font-semibold">{formatDate(d.expiryDate)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${st.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-black ${d.daysRemaining < 0 ? 'text-rose-400' : d.daysRemaining < 30 ? 'text-orange-400' : d.daysRemaining < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {d.daysRemaining < 0 ? `${Math.abs(d.daysRemaining)}d ago` : `${d.daysRemaining}d`}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.badge}`}>
                        <Icon className="h-2.5 w-2.5" />
                        {d.status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.autoRenew ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/60 text-slate-500 border border-slate-700/40'}`}>
                        {d.autoRenew ? 'ON' : 'OFF'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded detail panel */}
        {selectedDomain && (
          <div className="border-t border-slate-800/60 px-6 py-5 bg-slate-900/30 animate-fade-in-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Domain Detail</span>
                <h4 className="text-base font-extrabold text-slate-200 font-mono mt-0.5">{selectedDomain.domain}</h4>
              </div>
              <button onClick={() => setSelectedDomain(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                { label: 'Registrar',        value: selectedDomain.registrar },
                { label: 'Registered',       value: formatDate(selectedDomain.registrationDate) },
                { label: 'Expires',          value: formatDate(selectedDomain.expiryDate) },
                { label: 'Days Remaining',   value: selectedDomain.daysRemaining < 0 ? `Expired ${Math.abs(selectedDomain.daysRemaining)}d ago` : `${selectedDomain.daysRemaining} days` },
              ].map(item => (
                <div key={item.label} className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">{item.label}</span>
                  <span className="font-bold text-slate-200">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Nameservers</span>
              <div className="flex flex-wrap gap-2">
                {selectedDomain.nameservers.map(ns => (
                  <span key={ns} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400 text-[10px] font-mono">{ns}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ALERT HISTORY ─────────────────────────────────────────────── */}
      {showAlertHistory && (
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up">
          <div className="px-6 py-4 border-b border-slate-800/60">
            <h3 className="text-slate-200 font-bold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              Email Alert History
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Alerts sent at 90, 60, 30, 15 and 7 days before expiry, plus on expiry.</p>
          </div>
          <div className="divide-y divide-slate-800/40">
            {ALERT_HISTORY.map(alert => (
              <div key={alert.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <Bell className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200">
                    {alert.threshold === 0
                      ? <><span className="text-rose-400">{alert.domain}</span> — Expiry alert (domain expired)</>
                      : <><span className="text-amber-400">{alert.domain}</span> — {alert.threshold}-day expiry warning</>
                    }
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Sent: {new Date(alert.sentAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  {alert.status}
                </span>
              </div>
            ))}
          </div>

          {/* Alert schedule info */}
          <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-900/20">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Alert Schedule</span>
            <div className="flex flex-wrap gap-2">
              {[90, 60, 30, 15, 7].map(days => (
                <span key={days} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                  {days} days before
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
                On expiry
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── STATUS LEGEND ─────────────────────────────────────────────── */}
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-indigo-400" />
          Status Legend
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '> 60 days remaining', badge: statusStyles.green.badge,  dot: 'bg-emerald-500' },
            { label: '30–60 days remaining', badge: statusStyles.yellow.badge, dot: 'bg-amber-500' },
            { label: '< 30 days remaining', badge: statusStyles.orange.badge, dot: 'bg-orange-500' },
            { label: 'Expired',             badge: statusStyles.red.badge,    dot: 'bg-rose-500' },
          ].map(item => (
            <span key={item.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${item.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
