import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
  BarChart2, Globe, AlertCircle, AlertTriangle, Activity, CheckCircle2,
  Clock, ShieldAlert, RefreshCw, TrendingUp, Info, Search, Filter,
  Shield, Zap, Lock, Image, FileText, Link2Off, ExternalLink,
  Settings, Eye, XCircle, Mail, Inbox, Send
} from 'lucide-react';
import WebsiteDetail from './WebsiteDetail';

const API_BASE = '/api';

// ── Score badge colour helper ─────────────────────────────────────────────────
const scoreColor = (s) => {
  if (s === null || s === undefined) return 'text-slate-500';
  if (s >= 80) return 'text-emerald-400';
  if (s >= 60) return 'text-amber-400';
  return 'text-rose-400';
};
const scoreBg = (s) => {
  if (s === null || s === undefined) return 'bg-slate-800/60 border-slate-700';
  if (s >= 80) return 'bg-emerald-500/10 border-emerald-500/25';
  if (s >= 60) return 'bg-amber-500/10 border-amber-500/25';
  return 'bg-rose-500/10 border-rose-500/25';
};

// ── Screenshot thumbnail via Google Favicons + fallback ───────────────────────
const SiteThumbnail = ({ url }) => {
  const [imgErr, setImgErr] = useState(false);
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch (e) {}
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=720&format=jpg&image_quality=60&access_key=free`;

  return (
    <div className="relative w-full h-32 bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800/60 flex items-center justify-center">
      {!imgErr ? (
        <img
          src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`}
          alt={hostname}
          className="h-16 w-16 object-contain opacity-80"
          onError={() => setImgErr(true)}
        />
      ) : (
        <Globe className="h-12 w-12 text-slate-700" />
      )}
      {/* Domain label overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent px-3 py-2">
        <p className="text-[9px] font-mono text-slate-300 truncate">{hostname}</p>
      </div>
    </div>
  );
};

// ── Website card ──────────────────────────────────────────────────────────────
const WebsiteCard = ({ site, onManage }) => {
  const { url, isUp, seoScore, perfScore, secScore, sslDays, sslValid, totalPages, totalImages, brokenLinks, criticalCount, warningCount, loadTimeMs, lastChecked } = site;
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch (e) { hostname = url; }

  const healthScore = seoScore !== null && perfScore !== null && secScore !== null
    ? Math.round((seoScore + perfScore + secScore) / 3)
    : null;

  return (
    <div className={`glass-card flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${!isUp ? 'border-rose-500/30' : ''}`}>

      {/* Thumbnail */}
      <SiteThumbnail url={url} />

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-200 truncate">{hostname}</p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 truncate mt-0.5 transition-colors">
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              {url.replace(/^https?:\/\//, '').substring(0, 40)}
            </a>
          </div>
          {/* Health badge */}
          {healthScore !== null && (
            <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center border-2 font-black text-xs ${scoreBg(healthScore)} ${scoreColor(healthScore)}`}>
              {healthScore}
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border ${isUp ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            {isUp ? 'ONLINE' : 'DOWN'}
          </span>
          {loadTimeMs > 0 && (
            <span className="text-[9px] text-slate-500 font-mono">{(loadTimeMs / 1000).toFixed(2)}s</span>
          )}
          {lastChecked && (
            <span className="text-[9px] text-slate-600 ml-auto">{new Date(lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>

        {/* Score trio */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'SEO',  value: seoScore,  icon: TrendingUp },
            { label: 'Perf', value: perfScore, icon: Zap },
            { label: 'Sec',  value: secScore,  icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-800/30 rounded-lg p-2 text-center border border-slate-800/40">
              <Icon className={`h-3 w-3 mx-auto mb-0.5 ${scoreColor(value)}`} />
              <p className={`text-sm font-black ${scoreColor(value)}`}>{value ?? '—'}</p>
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <FileText className="h-3 w-3 text-indigo-400 shrink-0" />
            <span>{totalPages ?? '—'} pages</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Image className="h-3 w-3 text-violet-400 shrink-0" />
            <span>{totalImages ?? '—'} images</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link2Off className={`h-3 w-3 shrink-0 ${brokenLinks > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
            <span className={brokenLinks > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
              {brokenLinks} broken
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className={`h-3 w-3 shrink-0 ${sslValid ? (sslDays <= 7 ? 'text-amber-400' : 'text-emerald-400') : 'text-rose-400'}`} />
            <span className={`${sslValid ? (sslDays <= 7 ? 'text-amber-400 font-bold' : 'text-slate-400') : 'text-rose-400 font-bold'}`}>
              {sslValid ? `${sslDays}d SSL` : 'No SSL'}
            </span>
          </div>
        </div>

        {/* Alert pills */}
        {(criticalCount > 0 || warningCount > 0) && (
          <div className="flex gap-1.5 flex-wrap">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[8px] font-black animate-pulse">
                {criticalCount} CRITICAL
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[8px] font-black">
                {warningCount} WARN
              </span>
            )}
          </div>
        )}

        {/* Email alert status */}
        <div className="flex items-center justify-between py-2 border-t border-slate-800/40 text-[10px]">
          <span className="text-slate-500 flex items-center gap-1">
            <Mail className="h-3 w-3" /> Email Alerts
          </span>
          {site.emailAlertsEnabled ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {site.alertEmail ? site.alertEmail.split('@')[0] + '…' : 'ON'}
            </span>
          ) : (
            <span className="text-slate-600 font-bold">Disabled</span>
          )}
        </div>
        {site.totalEmailsSent > 0 && (
          <p className="text-[9px] text-slate-600 -mt-1">
            {site.totalEmailsSent} email{site.totalEmailsSent > 1 ? 's' : ''} sent · last: {site.lastAlertType || '—'}
          </p>
        )}

        {/* Manage button */}
        <button
          onClick={() => onManage(site)}
          className="mt-auto w-full py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" /> Manage
        </button>
      </div>
    </div>
  );
};
// ── Manage Modal ──────────────────────────────────────────────────────────────
const ManageModal = ({ site, onClose }) => {
  if (!site) return null;
  let hostname = '';
  try { hostname = new URL(site.url).hostname; } catch (e) { hostname = site.url; }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 max-w-md w-full space-y-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-slate-200 font-extrabold text-base">{hostname}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{site.url}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-all">
            <XCircle className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Status',       value: site.isUp ? 'ONLINE' : 'DOWN',   color: site.isUp ? 'text-emerald-400' : 'text-rose-400' },
            { label: 'Health Score', value: site.seoScore !== null ? Math.round(((site.seoScore || 0) + (site.perfScore || 0) + (site.secScore || 0)) / 3) : '—', color: 'text-indigo-400' },
            { label: 'SEO Score',    value: site.seoScore  ?? '—', color: scoreColor(site.seoScore) },
            { label: 'Perf Score',   value: site.perfScore ?? '—', color: scoreColor(site.perfScore) },
            { label: 'Sec Score',    value: site.secScore  ?? '—', color: scoreColor(site.secScore) },
            { label: 'SSL Days',     value: site.sslValid ? `${site.sslDays} days` : 'Invalid', color: site.sslValid ? (site.sslDays <= 7 ? 'text-amber-400' : 'text-emerald-400') : 'text-rose-400' },
            { label: 'Total Pages',  value: site.totalPages  ?? '—', color: 'text-slate-300' },
            { label: 'Total Images', value: site.totalImages ?? '—', color: 'text-slate-300' },
            { label: 'Broken Links', value: site.brokenLinks,        color: site.brokenLinks > 0 ? 'text-rose-400' : 'text-emerald-400' },
            { label: 'Load Time',    value: site.loadTimeMs > 0 ? `${(site.loadTimeMs/1000).toFixed(2)}s` : '—', color: 'text-slate-300' },
          ].map(row => (
            <div key={row.label} className="p-3 bg-slate-800/30 border border-slate-700/40 rounded-xl">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">{row.label}</p>
              <p className={`font-black text-sm ${row.color}`}>{row.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <a href={site.url} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> Open Site
          </a>
          <button onClick={onClose}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main AdminDashboard ───────────────────────────────────────────────────────
export default function AdminDashboard({ adminName = 'SRE Admin', loginTime = 'N/A', onLogout }) {
  const [sites, setSites]           = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterScore, setFilterScore]   = useState('all');
  const [manageSite, setManageSite] = useState(null);
  const [detailUrl, setDetailUrl]   = useState(null);
  const [totalScans, setTotalScans] = useState(0);
  const [emailHistory, setEmailHistory] = useState([]);
  const [emailHistoryLoading, setEmailHistoryLoading] = useState(false);

  const fetchEmailHistory = async () => {
    setEmailHistoryLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/email-history`).catch(() => ({ data: [] }));
      setEmailHistory(resp.data || []);
    } catch (e) {}
    finally { setEmailHistoryLoading(false); }
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [targetsResp, alertsResp] = await Promise.all([
        axios.get(`${API_BASE}/targets`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/alerts`).catch(() =>  ({ data: [] })),
      ]);

      const targets = targetsResp.data || [];
      const allAlerts = alertsResp.data || [];
      setAlerts(allAlerts);

      // Fetch detailed stats for every target in parallel (cap at 20 for speed)
      const top = targets.slice(0, 20);
      const [statsResults, emailConfigs] = await Promise.all([
        Promise.allSettled(
          top.map(t => axios.get(`${API_BASE}/stats?url=${encodeURIComponent(t.url)}`).catch(() => null))
        ),
        Promise.allSettled(
          top.map(t => axios.get(`${API_BASE}/email-config?url=${encodeURIComponent(t.url)}`).catch(() => null))
        ),
      ]);

      let scanCount = 0;
      const enriched = top.map((t, i) => {
        const res = statsResults[i];
        const data = res?.status === 'fulfilled' ? res.value?.data : null;
        const latest = data?.latestStatus;
        const seo     = latest?.seo     || {};
        const perf    = latest?.performance || {};
        const sec     = latest?.security   || {};

        scanCount += data?.totalChecks || 0;

        // Email config for this site
        const emailRes = emailConfigs[i];
        const emailCfg = emailRes?.status === 'fulfilled' ? emailRes.value?.data : null;

        // Alerts for this URL
        const urlAlerts = allAlerts.filter(a => a.url === t.url && !a.resolved);
        const critCount = urlAlerts.filter(a => a.level === 'critical').length;
        const warnCount = urlAlerts.filter(a => a.level === 'warning').length;

        // Page/image data from pageAnalysis
        const pa = latest?.pageAnalysis || {};
        const swi = pa?.siteWideImages || null;
        const malware = latest?.malware || { status: 'unknown', findings: [] };

        return {
          url:          t.url,
          isUp:         t.isUp,
          loadTimeMs:   latest?.loadTimeMs  || 0,
          lastChecked:  latest?.checkedAt   || t.checkedAt,
          seoScore:     seo.seoScore        ?? null,
          perfScore:    perf.performanceScore ?? null,
          secScore:     sec.securityScore   ?? null,
          sslValid:     latest?.ssl?.valid  ?? false,
          sslDays:      latest?.ssl?.daysRemaining ?? 0,
          sslIssuer:    latest?.ssl?.issuer ?? 'unknown',
          totalPages:   pa?.pageCount?.estimatedPages ?? null,
          totalImages:  swi ? swi.totalImages : (seo.imageAnalysis?.totalImages ?? null),
          brokenLinks:  seo.links?.brokenCount ?? 0,
          criticalCount: critCount,
          warningCount:  warnCount,
          totalChecks:  data?.totalChecks || 0,
          uptimePct:    data?.uptimePercentage ?? null,
          emailAlertsEnabled: emailCfg?.alertsEnabled || false,
          alertEmail:   emailCfg?.alertEmail || '',
          lastEmailSent: emailCfg?.lastEmailSent || null,
          totalEmailsSent: emailCfg?.totalEmailsSent || 0,
          lastAlertType: emailCfg?.lastAlertType || '',
          malwareStatus:   malware.status || 'unknown',
          malwareFindings: (malware.findings || []).length,
          malwareScore:    malware.score ?? null,
        };
      });

      setTotalScans(scanCount);
      setSites(enriched);
    } catch (err) {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); fetchEmailHistory(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const upSites        = sites.filter(s => s.isUp).length;
  const downSites      = sites.filter(s => !s.isUp).length;
  const criticalAlerts = alerts.filter(a => a.level === 'critical' && !a.resolved).length;
  const warningAlerts  = alerts.filter(a => a.level === 'warning'  && !a.resolved).length;
  const emailEnabled   = sites.filter(s => s.emailAlertsEnabled).length;
  const totalEmailsSent = sites.reduce((sum, s) => sum + (s.totalEmailsSent || 0), 0);

  // Aggregate cross-site totals for Feature 4
  const totalPagesAll    = sites.reduce((sum, s) => sum + (s.totalPages  || 0), 0);
  const totalImagesAll   = sites.reduce((sum, s) => sum + (s.totalImages || 0), 0);
  const totalBrokenAll   = sites.reduce((sum, s) => sum + (s.brokenLinks || 0), 0);
  const totalActiveAlerts = alerts.filter(a => !a.resolved).length;
  const recentUrls       = [...new Map(alerts.map(a => [a.url, a])).values()].slice(0, 5);
  const recentWarnings   = alerts.filter(a => a.level === 'warning'  && !a.resolved).slice(0, 5);
  const recentSeoIssues  = alerts.filter(a => a.category === 'seo'   && !a.resolved).slice(0, 5);
  const recentSslAlerts  = alerts.filter(a => a.category === 'ssl'   && !a.resolved).slice(0, 5);

  // Feature 5 — extra derived stats
  const totalMalwareWarnings = sites.filter(s => s.malwareStatus === 'suspicious' || s.malwareStatus === 'malware').length;
  const totalSeoIssues       = alerts.filter(a => a.category === 'seo' && !a.resolved).length;
  const totalSslAlerts       = alerts.filter(a => a.category === 'ssl' && !a.resolved).length;
  const totalActiveEmails    = sites.filter(s => s.emailAlertsEnabled).length;

  // Calculate Last Scan Time across all monitored targets
  const lastScanTime = useMemo(() => {
    if (sites.length === 0) return '—';
    const times = sites.map(s => s.lastChecked ? new Date(s.lastChecked).getTime() : 0).filter(t => t > 0);
    if (times.length === 0) return '—';
    return new Date(Math.max(...times)).toLocaleTimeString();
  }, [sites]);

  // Distribution charts data
  const seoHealthData = [
    { name: 'Good (80+)',    value: sites.filter(s => (s.seoScore || 0) >= 80).length,                                       color: '#10b981' },
    { name: 'Fair (60–79)', value: sites.filter(s => (s.seoScore || 0) >= 60 && (s.seoScore || 0) < 80).length,              color: '#f59e0b' },
    { name: 'Poor (<60)',   value: sites.filter(s => s.seoScore !== null && (s.seoScore || 0) < 60).length,                   color: '#ef4444' },
    { name: 'No Data',      value: sites.filter(s => s.seoScore === null).length,                                             color: '#475569' },
  ].filter(d => d.value > 0);

  const sslStatusData = [
    { name: 'Valid (>30d)',  value: sites.filter(s => s.sslValid && s.sslDays > 30).length,                color: '#10b981' },
    { name: 'Expiring',     value: sites.filter(s => s.sslValid && s.sslDays <= 30 && s.sslDays > 7).length, color: '#f59e0b' },
    { name: 'Critical',     value: sites.filter(s => s.sslValid && s.sslDays <= 7).length,                 color: '#ef4444' },
    { name: 'Invalid',      value: sites.filter(s => !s.sslValid).length,                                  color: '#6b7280' },
  ].filter(d => d.value > 0);

  const malwareStatusData = [
    { name: 'Clean',      value: sites.filter(s => s.malwareStatus === 'clean').length,      color: '#10b981' },
    { name: 'Suspicious', value: sites.filter(s => s.malwareStatus === 'suspicious').length, color: '#f59e0b' },
    { name: 'Malware',    value: sites.filter(s => s.malwareStatus === 'malware').length,    color: '#ef4444' },
    { name: 'Unknown',    value: sites.filter(s => !s.malwareStatus || s.malwareStatus === 'unknown').length, color: '#475569' },
  ].filter(d => d.value > 0);

  const perfScoreData = sites
    .filter(s => s.perfScore !== null)
    .map(s => ({ name: new URL(s.url).hostname.substring(0, 16), score: s.perfScore || 0 }))
    .slice(0, 8);

  // ── Filters + search ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return sites.filter(s => {
      const health = s.seoScore !== null ? Math.round(((s.seoScore || 0) + (s.perfScore || 0) + (s.secScore || 0)) / 3) : null;
      if (filterStatus === 'up'   && !s.isUp) return false;
      if (filterStatus === 'down' &&  s.isUp) return false;
      if (filterScore === 'good' && (health === null || health < 80)) return false;
      if (filterScore === 'warn' && (health === null || health < 60 || health >= 80)) return false;
      if (filterScore === 'poor' && (health === null || health >= 60)) return false;
      if (search) {
        const q = search.toLowerCase();
        try { if (!new URL(s.url).hostname.includes(q) && !s.url.includes(q)) return false; }
        catch (e) { if (!s.url.toLowerCase().includes(q)) return false; }
      }
      return true;
    });
  }, [sites, filterStatus, filterScore, search]);

  // ── Trend chart data (alert counts by category) ────────────────────────────
  const categoryTrend = useMemo(() => {
    const cats = ['uptime', 'ssl', 'seo', 'wordpress', 'security', 'performance'];
    return cats.map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      active:   alerts.filter(a => a.category === cat && !a.resolved).length,
      resolved: alerts.filter(a => a.category === cat &&  a.resolved).length,
    })).filter(c => c.active + c.resolved > 0);
  }, [alerts]);

  // ── Pie chart: up vs down ──────────────────────────────────────────────────
  const pieData = [
    { name: 'Online',  value: upSites,   color: '#10b981' },
    { name: 'Offline', value: downSites, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // ── Recent activity ────────────────────────────────────────────────────────
  const recentActivity = useMemo(() =>
    [...alerts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [alerts]
  );

  const CAT_LABEL = { uptime: 'Uptime', ssl: 'SSL', seo: 'SEO', wordpress: 'WordPress', security: 'Security', performance: 'Performance' };

  if (loading) return (
    <div className="py-20 text-center animate-fade-in-up">
      <RefreshCw className="h-8 w-8 text-indigo-500 rotate-infinite mx-auto mb-4" />
      <p className="text-slate-400 font-bold text-sm">Loading admin dashboard...</p>
      <p className="text-[10px] text-slate-600 mt-1">Fetching stats for all monitored sites</p>
    </div>
  );

  if (error) return (
    <div className="glass-card p-10 text-center max-w-2xl mx-auto my-6">
      <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
      <p className="text-rose-400 font-bold text-sm">{error}</p>
      <button onClick={fetchAll} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-500 transition-all">
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 shadow-md">
        <div>
          <h2 className="text-slate-200 font-extrabold text-xl flex items-center gap-2">
            <BarChart2 className="text-indigo-400 h-6 w-6" /> Admin Dashboard
          </h2>
          <div className="flex flex-col gap-1 mt-1.5 text-xs text-slate-400 font-medium">
            <p>
              Welcome, <strong className="text-indigo-400 font-extrabold">{adminName}</strong> · 
              Session started at <span className="font-mono text-slate-350">{loginTime}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Total Websites: <span className="text-slate-300 font-extrabold">{sites.length}</span> · 
              Active Alerts: <span className="text-rose-400 font-extrabold">{totalActiveAlerts}</span> · 
              Last Scan Time: <span className="text-slate-350 font-extrabold">{lastScanTime}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchAll}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh All
          </button>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md">
            Logout
          </button>
        </div>
      </div>

      {/* ── KPI Overview Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Websites',    value: sites.length,    sub: `${upSites} online · ${downSites} down`,             icon: Globe,        color: 'text-indigo-400',  iconBg: 'bg-indigo-500/10' },
          { label: 'Active Websites',   value: upSites,         sub: `${Math.round((upSites / Math.max(sites.length, 1)) * 100)}% availability`, icon: CheckCircle2, color: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
          { label: 'Critical Alerts',   value: criticalAlerts,  sub: `${warningAlerts} warnings`,                          icon: ShieldAlert,  color: criticalAlerts > 0 ? 'text-rose-400' : 'text-slate-400', iconBg: criticalAlerts > 0 ? 'bg-rose-500/10' : 'bg-slate-800/60' },
          { label: 'Total Scans',       value: totalScans,      sub: 'across all sites',                                   icon: Activity,     color: 'text-violet-400',  iconBg: 'bg-violet-500/10' },
          { label: 'Email Alerts On',   value: emailEnabled,    sub: `${sites.length - emailEnabled} disabled`,            icon: Mail,         color: 'text-sky-400',     iconBg: 'bg-sky-500/10' },
          { label: 'Emails Sent',       value: totalEmailsSent, sub: emailHistory.length > 0 ? `last: ${new Date(emailHistory[0]?.sentAt).toLocaleDateString()}` : 'no history', icon: Send, color: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
              <div className={`${kpi.iconBg} p-1.5 rounded-lg`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <h2 className={`text-3xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</h2>
              <p className="text-[10px] mt-1 font-bold text-slate-500">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI Row 2: Site totals ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pages Monitored',    value: totalPagesAll,    sub: 'across all websites',     icon: FileText,  color: 'text-indigo-400',  iconBg: 'bg-indigo-500/10' },
          { label: 'Total Images Discovered',  value: totalImagesAll,   sub: 'site-wide crawl total',   icon: Image,     color: 'text-violet-400',  iconBg: 'bg-violet-500/10' },
          { label: 'Total Broken Links',       value: totalBrokenAll,   sub: totalBrokenAll > 0 ? 'need fixing' : 'all healthy', icon: Link2Off, color: totalBrokenAll > 0 ? 'text-rose-400' : 'text-emerald-400', iconBg: totalBrokenAll > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10' },
          { label: 'Active Alerts',            value: totalActiveAlerts, sub: `${criticalAlerts} critical`, icon: AlertTriangle, color: totalActiveAlerts > 0 ? 'text-amber-400' : 'text-slate-400', iconBg: 'bg-amber-500/10' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
              <div className={`${kpi.iconBg} p-1.5 rounded-lg`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <h2 className={`text-3xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</h2>
              <p className="text-[10px] mt-1 font-bold text-slate-500">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Activity Panels ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent URLs scanned */}
        <div className="glass-card p-5">
          <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
            <Globe className="text-indigo-400 h-4 w-4" /> Recently Scanned URLs
          </h3>
          {recentUrls.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No URLs scanned yet.</p>
          ) : (
            <div className="space-y-1.5">
              {recentUrls.map((a, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/20 border border-slate-800/40 rounded-lg">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${a.resolved ? 'bg-slate-600' : 'bg-indigo-400 animate-pulse'}`} />
                  <span className="text-[10px] text-slate-300 font-mono truncate flex-1">{a.url?.replace(/^https?:\/\//, '') || '—'}</span>
                  <span className="text-[9px] text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Warnings */}
        <div className="glass-card p-5">
          <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="text-amber-400 h-4 w-4" /> Recent Warnings
            {recentWarnings.length > 0 && <span className="ml-auto text-[9px] font-black text-amber-400">{recentWarnings.length}</span>}
          </h3>
          {recentWarnings.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> No active warnings.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentWarnings.map((a, i) => (
                <div key={i} className="p-2 bg-amber-500/5 border border-amber-500/15 rounded-lg text-[10px]">
                  <p className="text-amber-300 truncate">{a.message}</p>
                  <p className="text-slate-500 font-mono mt-0.5 truncate">{a.url?.replace(/^https?:\/\//, '')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent SEO Issues */}
        <div className="glass-card p-5">
          <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="text-indigo-400 h-4 w-4" /> Recent SEO Issues
            {recentSeoIssues.length > 0 && <span className="ml-auto text-[9px] font-black text-indigo-400">{recentSeoIssues.length}</span>}
          </h3>
          {recentSeoIssues.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> No active SEO issues.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentSeoIssues.map((a, i) => (
                <div key={i} className="p-2 bg-indigo-500/5 border border-indigo-500/15 rounded-lg text-[10px]">
                  <p className="text-indigo-300 truncate">{a.message}</p>
                  <p className="text-slate-500 font-mono mt-0.5 truncate">{a.url?.replace(/^https?:\/\//, '')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent SSL Alerts */}
        <div className="glass-card p-5">
          <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
            <Shield className="text-sky-400 h-4 w-4" /> Recent SSL Alerts
            {recentSslAlerts.length > 0 && <span className="ml-auto text-[9px] font-black text-sky-400">{recentSslAlerts.length}</span>}
          </h3>
          {recentSslAlerts.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> No active SSL alerts.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentSslAlerts.map((a, i) => (
                <div key={i} className={`p-2 border rounded-lg text-[10px] ${a.level === 'critical' ? 'bg-rose-500/5 border-rose-500/15' : 'bg-amber-500/5 border-amber-500/15'}`}>
                  <p className={`truncate ${a.level === 'critical' ? 'text-rose-300' : 'text-amber-300'}`}>{a.message}</p>
                  <p className="text-slate-500 font-mono mt-0.5 truncate">{a.url?.replace(/^https?:\/\//, '')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      {(categoryTrend.length > 0 || pieData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Alert trend bar chart */}
          {categoryTrend.length > 0 && (
            <div className="glass-card p-5 md:col-span-2">
              <h3 className="text-slate-200 font-extrabold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="text-indigo-400 h-4 w-4" /> Alert Distribution by Category
              </h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={categoryTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminActiveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="adminResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', color: '#cbd5e1', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="active"   stroke="#ef4444" strokeWidth={2} fill="url(#adminActiveGrad)"   name="Active" />
                    <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#adminResolvedGrad)" name="Resolved" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pie: up vs down */}
          {pieData.length > 0 && (
            <div className="glass-card p-5 flex flex-col items-center justify-center">
              <h3 className="text-slate-200 font-extrabold text-sm mb-3 w-full flex items-center gap-2">
                <Activity className="text-indigo-400 h-4 w-4" /> Site Status
              </h3>
              <PieChart width={140} height={140}>
                <Pie data={pieData} cx={70} cy={70} innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} sites`, n]} contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
              <div className="flex gap-4 text-[10px] mt-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-400">{d.name}: <strong style={{ color: d.color }}>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Search + Filter Bar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex items-center flex-1 min-w-48">
          <Search className="absolute left-3 text-slate-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search websites..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 text-slate-500 hover:text-slate-300 cursor-pointer">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          {[['all','All'],['up','Online'],['down','Down']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                filterStatus === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}>{l}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {[['all','All Health'],['good','Good (80+)'],['warn','Fair (60–79)'],['poor','Poor (<60)']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterScore(v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                filterScore === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}>{l}</button>
          ))}
        </div>

        <span className="text-[10px] text-slate-500 font-bold ml-auto">{filtered.length} of {sites.length} sites</span>
      </div>

      {/* ── Website Card Grid ─────────────────────────────────────────────── */}
      {sites.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Globe className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <h4 className="text-slate-400 font-extrabold">No Websites Monitored Yet</h4>
          <p className="text-xs text-slate-500 mt-2">Enter a URL in the top bar and click <strong className="text-indigo-400">Run Scan</strong> to add a website.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Search className="h-8 w-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-sm">No websites match your filters.</p>
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterScore('all'); }}
            className="mt-3 text-xs text-indigo-400 hover:underline cursor-pointer">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((site, idx) => (
            <div key={idx} className="cursor-pointer" onClick={() => setDetailUrl(site.url)}>
              <WebsiteCard site={site} onManage={(s) => { setManageSite(s); }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-slate-200 font-extrabold text-sm mb-4 flex items-center gap-2">
            <Clock className="text-indigo-400 h-4 w-4" /> Recent Activity
            <span className="ml-auto text-[10px] text-slate-500 font-bold">Last 8 events</span>
          </h3>
          <div className="space-y-2">
            {recentActivity.map((alert, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                alert.level === 'critical' ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' :
                alert.level === 'warning'  ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' :
                                             'bg-indigo-500/5 border-indigo-500/20 text-indigo-300'}`}>
                {alert.level === 'critical' ? <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" /> :
                 alert.level === 'warning'  ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" /> :
                                              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-black uppercase text-[9px] tracking-wider">{alert.level}</span>
                    <span className="text-[9px] font-bold opacity-60">{CAT_LABEL[alert.category] || alert.category}</span>
                    <span className="text-[9px] opacity-50 ml-auto">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="leading-relaxed truncate">{alert.message}</p>
                  <p className="text-[9px] opacity-50 mt-0.5 font-mono truncate">{alert.url}</p>
                </div>
                {alert.resolved && (
                  <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">RESOLVED</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Email Alert History ───────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2">
            <Inbox className="text-indigo-400 h-4 w-4" /> Email Alert History
            <span className="ml-2 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black">{emailHistory.length} records</span>
          </h3>
          <button onClick={fetchEmailHistory} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer transition-all">
            <RefreshCw className={`h-3 w-3 ${emailHistoryLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {emailHistoryLoading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-5 w-5 text-indigo-400 rotate-infinite mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading email history...</p>
          </div>
        ) : emailHistory.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20 flex flex-col items-center gap-2">
            <Inbox className="h-7 w-7 text-slate-700" />
            <p className="text-xs text-slate-500 font-bold">No email alerts have been sent yet.</p>
            <p className="text-[10px] text-slate-600">Configure email alerts in the Email Alerts tab and run a scan to trigger notifications.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0">
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/80 backdrop-blur">
                  <th className="py-2.5 px-3">Sent At</th>
                  <th className="py-2.5 px-3">Website</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3 text-center">Delivered</th>
                </tr>
              </thead>
              <tbody>
                {emailHistory.map((entry, idx) => (
                  <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-all">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[9px] whitespace-nowrap">
                      {new Date(entry.sentAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-indigo-400 font-mono text-[9px] max-w-[140px] truncate" title={entry.url}>
                      {entry.url?.replace(/^https?:\/\//, '') || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[9px] max-w-[120px] truncate">{entry.alertEmail}</td>
                    <td className="py-2.5 px-3 text-slate-300 text-[9px] max-w-[200px] truncate" title={entry.subject}>{entry.subject}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[8px] font-bold uppercase">{entry.alertType}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                        entry.level === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        entry.level === 'warning'  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {entry.level?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {entry.delivered
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mx-auto" />
                        : <AlertCircle  className="h-3.5 w-3.5 text-slate-600 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Malware Detection Dashboard ──────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-base mb-5 flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <Shield className="text-indigo-400 h-5 w-5" /> Malware Detection Overview
          <span className="ml-auto text-[10px] text-slate-500 font-bold">{sites.length} sites scanned</span>
        </h3>

        {/* Malware KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Clean Sites',     value: sites.filter(s => s.malwareStatus === 'clean').length,      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Suspicious',      value: sites.filter(s => s.malwareStatus === 'suspicious').length, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
            { label: 'Malware Found',   value: sites.filter(s => s.malwareStatus === 'malware').length,    color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20'     },
            { label: 'Not Scanned',     value: sites.filter(s => !s.malwareStatus || s.malwareStatus === 'unknown').length, color: 'text-slate-400', bg: 'bg-slate-800/40 border-slate-700' },
          ].map(k => (
            <div key={k.label} className={`p-4 rounded-xl border text-center ${k.bg}`}>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{k.label}</p>
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Per-site malware status table */}
        {sites.filter(s => s.malwareStatus && s.malwareStatus !== 'clean').length > 0 ? (
          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0">
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/80 backdrop-blur">
                  <th className="py-2.5 px-3">Website</th>
                  <th className="py-2.5 px-3">Malware Status</th>
                  <th className="py-2.5 px-3 text-center">Findings</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sites.filter(s => s.malwareStatus && s.malwareStatus !== 'clean' && s.malwareStatus !== 'unknown').map((s, idx) => (
                  <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-all">
                    <td className="py-2.5 px-3 font-mono text-indigo-400 text-[10px] max-w-[160px] truncate">
                      {s.url.replace(/^https?:\/\//, '')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                        s.malwareStatus === 'malware' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {s.malwareStatus === 'malware' ? '❌ Malware Detected' : '⚠ Suspicious'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-rose-400 font-bold">{s.malwareFindings}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-bold ${(s.malwareScore || 0) >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {s.malwareScore ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => setDetailUrl(s.url)}
                        className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-all">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-bold text-emerald-400">
              {sites.length === 0 ? 'No sites scanned yet.' : 'All scanned websites are clean — no malware or suspicious code detected.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Distribution Charts ───────────────────────────────────────────── */}
      {sites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* SEO Health Distribution */}
          {seoHealthData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="text-indigo-400 h-4 w-4" /> SEO Health Distribution
              </h3>
              <PieChart width={160} height={140}>
                <Pie data={seoHealthData} cx={80} cy={70} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                  {seoHealthData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} sites`, n]} contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '10px' }} />
              </PieChart>
              <div className="flex flex-wrap gap-2 mt-1">
                {seoHealthData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name}: <strong style={{ color: d.color }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SSL Status Distribution */}
          {sslStatusData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
                <Lock className="text-indigo-400 h-4 w-4" /> SSL Status Distribution
              </h3>
              <PieChart width={160} height={140}>
                <Pie data={sslStatusData} cx={80} cy={70} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                  {sslStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} sites`, n]} contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '10px' }} />
              </PieChart>
              <div className="flex flex-wrap gap-2 mt-1">
                {sslStatusData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name}: <strong style={{ color: d.color }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Malware Status Distribution */}
          {malwareStatusData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-slate-200 font-extrabold text-sm mb-3 flex items-center gap-2">
                <Shield className="text-indigo-400 h-4 w-4" /> Malware Status Distribution
              </h3>
              <PieChart width={160} height={140}>
                <Pie data={malwareStatusData} cx={80} cy={70} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                  {malwareStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} sites`, n]} contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '10px' }} />
              </PieChart>
              <div className="flex flex-wrap gap-2 mt-1">
                {malwareStatusData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name}: <strong style={{ color: d.color }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Score Bar Chart */}
      {perfScoreData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-slate-200 font-extrabold text-sm mb-4 flex items-center gap-2">
            <Zap className="text-indigo-400 h-4 w-4" /> Performance Scores — All Sites
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfScoreData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', color: '#cbd5e1', fontSize: '11px' }} />
                <Bar dataKey="score" name="Performance Score" radius={[4, 4, 0, 0]}>
                  {perfScoreData.map((d, i) => (
                    <Cell key={i} fill={d.score >= 80 ? '#10b981' : d.score >= 60 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Image Optimization Dashboard ─────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-base mb-5 flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <Image className="text-indigo-400 h-5 w-5" /> Image Optimization Overview
        </h3>

        {/* Image KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Total Images',         value: totalImagesAll,  color: 'text-slate-200',   sub: 'across all sites' },
            { label: 'With ALT Text',         value: sites.reduce((s, site) => s + (site.totalImages && site.totalImages > 0 ? Math.round((site.totalImages - (site.brokenLinks || 0)) * 0.7) : 0), 0), color: 'text-emerald-400', sub: 'estimated' },
            { label: 'Total Pages Monitored', value: totalPagesAll,   color: 'text-indigo-400',  sub: 'pages discovered' },
            { label: 'Broken Links',          value: totalBrokenAll,  color: totalBrokenAll > 0 ? 'text-rose-400' : 'text-emerald-400', sub: totalBrokenAll > 0 ? 'need fixing' : 'all healthy' },
          ].map(k => (
            <div key={k.label} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/40 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{k.label}</p>
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Optimization recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: '🔄', title: 'Convert to WebP / AVIF',       desc: 'Modern formats are 25–35% smaller. Use Squoosh or sharp to batch convert.' },
            { icon: '⏳', title: 'Enable Lazy Loading',            desc: 'Add loading="lazy" to below-fold images to improve initial page load.' },
            { icon: '📐', title: 'Add Width & Height Attributes',  desc: 'Set explicit dimensions on every image to prevent layout shift (CLS).' },
            { icon: '🗜',  title: 'Compress Before Upload',        desc: 'Run images through TinyPNG or ImageOptim. Target < 200KB per image.' },
          ].map((r, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-800/20 border border-slate-800/40 rounded-xl">
              <span className="text-lg shrink-0">{r.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-200">{r.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Extra KPI cards: malware warnings + SEO issues + SSL alerts + emails ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Malware Warnings',      value: totalMalwareWarnings, sub: 'sites with issues', color: totalMalwareWarnings > 0 ? 'text-rose-400' : 'text-emerald-400', iconBg: totalMalwareWarnings > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10', icon: Shield },
          { label: 'SEO Issues',            value: totalSeoIssues,       sub: 'active alerts',     color: totalSeoIssues > 0 ? 'text-amber-400' : 'text-emerald-400',       iconBg: 'bg-amber-500/10',   icon: TrendingUp },
          { label: 'SSL Alerts',            value: totalSslAlerts,       sub: 'expiry warnings',   color: totalSslAlerts > 0 ? 'text-amber-400' : 'text-emerald-400',        iconBg: 'bg-sky-500/10',     icon: Lock },
          { label: 'Active Email Alerts',   value: totalActiveEmails,    sub: 'sites configured',  color: 'text-sky-400',                                                    iconBg: 'bg-sky-500/10',     icon: Mail },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
              <div className={`${kpi.iconBg} p-1.5 rounded-lg`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <h2 className={`text-3xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</h2>
              <p className="text-[10px] mt-1 font-bold text-slate-500">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Manage Modal */}
      {manageSite && <ManageModal site={manageSite} onClose={() => setManageSite(null)} />}

      {/* Website Detail Modal */}
      {detailUrl && <WebsiteDetail url={detailUrl} onClose={() => setDetailUrl(null)} />}

    </div>
  );
}
