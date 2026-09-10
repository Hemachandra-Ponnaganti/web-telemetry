import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import {
  Globe, XCircle, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle,
  Shield, Zap, TrendingUp, Lock, Image, FileText, Link2Off,
  Activity, Clock, ExternalLink, Info
} from 'lucide-react';

const API_BASE = '/api';

const score = (s) => {
  if (s === null || s === undefined) return { color: 'text-slate-400', bg: 'bg-slate-800/60 border-slate-700' };
  if (s >= 80) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' };
  if (s >= 60) return { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25'   };
  return         { color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/25'     };
};

const pct = (v, max) => Math.round(((v || 0) / Math.max(max, 1)) * 100);

export default function WebsiteDetail({ url, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);
    axios.get(`${API_BASE}/stats?url=${encodeURIComponent(url)}`)
      .then(r => { setData(r.data); })
      .catch(e => { setError(e.message); })
      .finally(() => setLoading(false));
  }, [url]);

  if (!url) return null;

  let hostname = '';
  try { hostname = new URL(url).hostname; } catch (e) { hostname = url; }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-5xl my-6 overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <img
              src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=64`}
              alt={hostname} className="h-8 w-8 rounded-lg object-contain bg-slate-800 p-1"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div>
              <h2 className="text-slate-200 font-extrabold text-lg">{hostname}</h2>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                <ExternalLink className="h-2.5 w-2.5" />{url}
              </a>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-all">
            <XCircle className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center">
              <RefreshCw className="h-8 w-8 text-indigo-500 rotate-infinite mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-sm">Loading website details...</p>
            </div>
          )}

          {error && (
            <div className="py-10 text-center">
              <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
              <p className="text-rose-400 font-bold text-sm">{error}</p>
            </div>
          )}

          {data && !loading && (() => {
            const latest  = data.latestStatus || {};
            const seo      = latest.seo      || {};
            const perf     = latest.performance || {};
            const sec      = latest.security   || {};
            const ssl      = latest.ssl        || {};
            const pa       = latest.pageAnalysis || {};
            const swi      = pa.siteWideImages  || null;
            const imgTotal = swi ? swi.totalImages : (seo.imageAnalysis?.totalImages || 0);
            const imgWithAlt = swi ? swi.withAlt : (seo.imageAnalysis?.withAlt || 0);
            const altPct   = imgTotal > 0 ? Math.round((imgWithAlt / imgTotal) * 100) : 100;
            const titlePct = seo.title?.text ? (seo.title.text.length >= 30 && seo.title.text.length <= 65 ? 100 : 50) : 0;
            const descPct  = seo.metaDescription?.text ? (seo.metaDescription.text.length >= 120 && seo.metaDescription.text.length <= 160 ? 100 : 50) : 0;
            const isUp     = latest.isUp;

            // Trend data from history
            const trendData = [...(data.historyLog || [])]
              .reverse().slice(-15)
              .map(h => ({
                time: new Date(h.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                seo:  h.seo?.seoScore || 0,
                perf: h.performance?.performanceScore || 0,
                sec:  h.security?.securityScore || 0,
                load: h.isUp ? parseFloat((h.loadTimeMs / 1000).toFixed(2)) : 0,
              }));

            // Radar data
            const radarData = [
              { subject: 'SEO',         value: seo.seoScore || 0 },
              { subject: 'Performance', value: perf.performanceScore || 0 },
              { subject: 'Security',    value: sec.securityScore || 0 },
              { subject: 'Uptime',      value: data.uptimePercentage || 0 },
              { subject: 'Alt Tags',    value: altPct },
            ];

            return (
              <>
                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Status',       value: isUp ? 'ONLINE' : 'DOWN',              color: isUp ? 'text-emerald-400' : 'text-rose-400' },
                    { label: 'Uptime',       value: `${data.uptimePercentage || 0}%`,        color: 'text-violet-400' },
                    { label: 'Response',     value: latest.loadTimeMs ? `${latest.loadTimeMs}ms` : '—', color: 'text-sky-400' },
                    { label: 'Total Scans',  value: data.totalChecks || 0,                   color: 'text-slate-300' },
                  ].map(k => (
                    <div key={k.label} className="glass-card p-4">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">{k.label}</p>
                      <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Score cards + Radar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scores */}
                  <div className="space-y-3">
                    {[
                      { label: 'Performance Score', value: perf.performanceScore, icon: Zap },
                      { label: 'SEO Score',         value: seo.seoScore,          icon: TrendingUp },
                      { label: 'Security Score',    value: sec.securityScore,     icon: Shield },
                    ].map(({ label, value, icon: Icon }) => {
                      const s = score(value);
                      return (
                        <div key={label} className={`p-4 rounded-xl border ${s.bg} flex items-center gap-4`}>
                          <Icon className={`h-6 w-6 ${s.color} shrink-0`} />
                          <div className="flex-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className={`text-2xl font-black ${s.color}`}>{value ?? '—'}</p>
                              <div className="flex-1 bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div className={`h-full rounded-full transition-all duration-700 ${s.color.replace('text-', 'bg-')}`} style={{ width: `${value || 0}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Radar */}
                  <div className="glass-card p-4 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 w-full">Health Overview</p>
                    <RadarChart width={220} height={200} data={radarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
                      <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '10px' }} />
                    </RadarChart>
                  </div>
                </div>

                {/* SSL + coverage row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`glass-card p-4 border-l-4 ${ssl.valid ? (ssl.daysRemaining <= 7 ? 'border-l-amber-500' : 'border-l-emerald-500') : 'border-l-rose-500'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className={`h-4 w-4 ${ssl.valid ? (ssl.daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400') : 'text-rose-400'}`} />
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SSL Certificate</p>
                    </div>
                    <p className={`text-xl font-black ${ssl.valid ? (ssl.daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400') : 'text-rose-400'}`}>
                      {ssl.valid ? `${ssl.daysRemaining}d left` : 'Invalid'}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{ssl.issuer || '—'}</p>
                  </div>
                  {[
                    { label: 'Total Pages',  value: pa?.pageCount?.estimatedPages ?? '—', icon: FileText,  color: 'text-indigo-400' },
                    { label: 'Total Images', value: imgTotal,                             icon: Image,     color: 'text-violet-400' },
                    { label: 'Broken Links', value: seo.links?.brokenCount || 0,          icon: Link2Off,  color: seo.links?.brokenCount > 0 ? 'text-rose-400' : 'text-slate-400' },
                  ].map(k => (
                    <div key={k.label} className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <k.icon className={`h-4 w-4 ${k.color}`} />
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{k.label}</p>
                      </div>
                      <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Coverage bars */}
                <div className="glass-card p-5 space-y-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coverage Analysis</p>
                  {[
                    { label: 'Meta Description Coverage', value: descPct,  sub: seo.metaDescription?.text ? `${seo.metaDescription.text.length} chars` : 'Missing' },
                    { label: 'Title Tag Coverage',        value: titlePct, sub: seo.title?.text ? `${seo.title.text.length} chars` : 'Missing' },
                    { label: 'Image ALT Tag Coverage',    value: altPct,   sub: `${imgWithAlt}/${imgTotal} images` },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold">{bar.label}</span>
                        <span className="font-bold">{bar.value}% <span className="text-slate-600">({bar.sub})</span></span>
                      </div>
                      <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div className={`h-full rounded-full transition-all duration-700 ${bar.value >= 80 ? 'bg-emerald-500' : bar.value >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${bar.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trend Chart */}
                {trendData.length >= 2 && (
                  <div className="glass-card p-5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Score Trends (Last {trendData.length} Scans)</p>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            {[['seo','#f59e0b'],['perf','#10b981'],['sec','#0ea5e9']].map(([k,c]) => (
                              <linearGradient key={k} id={`wd-${k}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={c} stopOpacity={0}    />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.3} />
                          <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', color: '#cbd5e1', fontSize: '10px' }} />
                          <Area type="monotone" dataKey="seo"  stroke="#f59e0b" strokeWidth={2} fill="url(#wd-seo)"  name="SEO" />
                          <Area type="monotone" dataKey="perf" stroke="#10b981" strokeWidth={2} fill="url(#wd-perf)" name="Perf" />
                          <Area type="monotone" dataKey="sec"  stroke="#0ea5e9" strokeWidth={2} fill="url(#wd-sec)"  name="Security" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Recent Alerts */}
                {data.activeAlerts?.length > 0 && (
                  <div className="glass-card p-5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                      Recent Alerts <span className="text-rose-400">({data.activeAlerts.length})</span>
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {data.activeAlerts.slice(0, 8).map((a, i) => (
                        <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border text-[10px] ${
                          a.level === 'critical' ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' :
                          a.level === 'warning'  ? 'bg-amber-500/5 border-amber-500/15 text-amber-300' :
                                                   'bg-indigo-500/5 border-indigo-500/15 text-indigo-300'}`}>
                          {a.level === 'critical' ? <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" /> :
                           a.level === 'warning'  ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" /> :
                                                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />}
                          <div className="min-w-0">
                            <span className="font-black uppercase text-[8px] tracking-wider opacity-70">{a.category}</span>
                            <p className="truncate">{a.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Scans */}
                {data.historyLog?.length > 0 && (
                  <div className="glass-card p-5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Recent Scans</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {data.historyLog.slice(0, 6).map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-slate-800/20 border border-slate-800/40 rounded-lg text-[10px]">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${h.isUp ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                          <span className="text-slate-500 font-mono">{new Date(h.checkedAt).toLocaleString()}</span>
                          <span className={`ml-auto font-bold ${h.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{h.isUp ? 'UP' : 'DOWN'}</span>
                          {h.loadTimeMs > 0 && <span className="text-slate-500">{h.loadTimeMs}ms</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
