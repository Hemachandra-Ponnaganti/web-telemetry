import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { 
  Activity, ShieldCheck, ShieldAlert, Wifi, Globe, Database, FileText, 
  AlertTriangle, Download, Printer, CheckCircle2, XCircle, Clock, 
  Layers, Search, AlertCircle, Image, Link, Sparkles
} from 'lucide-react';
import SeoDashboard from './SeoDashboard';
import SSLMonitor from './SSLMonitor';
import AccessibilityAudit from './AccessibilityAudit';

export default function UptimeDashboard({ stats, isSocketConnected, onNavigateToAlt }) {
  const [activeSubTab, setActiveSubTab] = useState('performance'); // performance, seo, ui_ux, security, history
  
  if (!stats) return null;

  const { uptimePercentage, latestStatus, historyLog = [], activeAlerts = [] } = stats;
  const isUp = latestStatus ? latestStatus.isUp : false;
  const ssl = latestStatus ? latestStatus.ssl : {};

  // Extract SRE nested telemetry parsed objects
  const seo = latestStatus?.seo || { seoScore: 100, alerts: [] };
  const {
    title = { text: '', status: 'warning', message: 'No title tag detected.' },
    metaDescription = { text: '', status: 'warning', message: 'No description tag detected.' },
    canonical = { text: '', status: 'ok', message: '' },
    robotsTxt = { exists: false, status: 'warning', message: 'Robots.txt check skipped.' },
    sitemap = { exists: false, status: 'warning', message: 'Sitemap check skipped.' },
    indexability = { isIndexable: true, status: 'ok', message: 'Site is indexable.' },
    links = { internalCount: 0, externalCount: 0, brokenCount: 0, brokenLinks: [], status: 'ok' },
    imageAnalysis = { totalImages: 0, withAlt: 0, missingAlt: 0, emptyAlt: 0, missingAltSrcs: [], status: 'ok', message: '' },
    seoScore = 100
  } = seo;
  const perf = latestStatus?.performance || { performanceScore: 100, vitals: {} };
  const uiUx = latestStatus?.uiUx || { uiHealthScore: 100, lowContrastViolations: [], missingLabelsViolations: [], emptyButtonsViolations: [] };
  const security = latestStatus?.security || { securityScore: 100, headers: { missing: [] } };

  // Calculate chronological trend data for Recharts
  const trendData = [...historyLog]
    .reverse()
    .map(item => {
      const overall = Math.round(
        ((item.performance?.performanceScore || 90) + 
         (item.seo?.seoScore || 85) + 
         (item.security?.securityScore || 90) + 
         (item.uiUx?.uiHealthScore || 85)) / 4
      );
      return {
        time: new Date(item.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        overall,
        loadTime: item.isUp ? parseFloat((item.loadTimeMs / 1000).toFixed(2)) : 0,
        ttfb: item.isUp ? item.ttfbMs : 0,
        perf: item.performance?.performanceScore || 0,
        seo: item.seo?.seoScore || 0,
        security: item.security?.securityScore || 0
      };
    });

  // Export scan logs to CSV spreadsheet
  const downloadCsv = () => {
    const headers = ["Timestamp", "Host URL", "Reachable", "HTTP Status", "Load Time (s)", "DNS Speed (ms)", "SSL (Days Remaining)", "Performance Score", "SEO Score", "Security Score", "Accessibility Score", "Overall SRE"];
    const rows = historyLog.map(h => {
      const perfVal = h.performance?.performanceScore || 90;
      const seoVal = h.seo?.seoScore || 85;
      const secVal = h.security?.securityScore || 90;
      const uiVal = h.uiUx?.uiHealthScore || 85;
      const overall = Math.round((perfVal + seoVal + secVal + uiVal) / 4);
      
      return [
        new Date(h.checkedAt).toISOString(),
        `"${h.url}"`,
        h.isUp ? "UP" : "DOWN",
        h.statusCode || "—",
        h.isUp ? (h.loadTimeMs / 1000).toFixed(2) : 0,
        h.dnsResolutionTimeMs || 0,
        h.ssl?.daysRemaining || 0,
        perfVal,
        seoVal,
        secVal,
        uiVal,
        overall
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `monitorpro_node_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // High-fidelity custom PDF report print template
  const printPdf = (h) => {
    const w = window.open('', '_blank');
    
    const isUpLabel = h.isUp ? 'OPERATIONAL' : 'DOWN / OFFLINE';
    const isUpColor = h.isUp ? '#10b981' : '#ef4444';
    const perfVal = h.performance?.performanceScore || 90;
    const seoVal = h.seo?.seoScore || 85;
    const secVal = h.security?.securityScore || 90;
    const uiVal = h.uiUx?.uiHealthScore || 85;
    const overall = Math.round((perfVal + seoVal + secVal + uiVal) / 4);

    const alertsHtml = (h.errors || []).map(err => `
      <div style="padding: 10px; border-left: 4px solid #ef4444; background: #fff5f5; border-bottom: 1px solid #fee2e2; margin-bottom: 8px; font-size: 12px;">
        <strong>[CRITICAL]</strong> ${err}
      </div>
    `).join('') + (h.seo?.alerts || []).map(a => `
      <div style="padding: 10px; border-left: 4px solid ${a.level === 'critical' ? '#ef4444' : '#f59e0b'}; background: #fafafa; border-bottom: 1px solid #eee; margin-bottom: 8px; font-size: 12px;">
        <strong>[${a.level.toUpperCase()}]</strong> ${a.message}
      </div>
    `).join('');

    const html = `
      <html>
      <head>
          <title>MonitorPro SRE Diagnostic Report - ${h.url}</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  color: #1f2937;
                  line-height: 1.5;
                  padding: 30px;
                  margin: 0;
                  background-color: #ffffff;
              }
              .header {
                  border-bottom: 3px double #e5e7eb;
                  padding-bottom: 20px;
                  margin-bottom: 24px;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-end;
              }
              .header-left h1 {
                  font-size: 24px;
                  margin: 0;
                  color: #1e3a8a;
                  font-weight: 800;
                  letter-spacing: -0.02em;
              }
              .header-left p {
                  margin: 4px 0 0 0;
                  font-size: 12px;
                  color: #6b7280;
                  font-weight: 500;
              }
              .status-badge {
                  display: inline-block;
                  padding: 6px 12px;
                  font-weight: 800;
                  font-size: 11px;
                  border-radius: 9999px;
                  color: white;
                  background-color: ${isUpColor};
              }
              .meta-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 16px;
                  background: #f9fafb;
                  padding: 16px;
                  border-radius: 12px;
                  border: 1px solid #f3f4f6;
                  margin-bottom: 24px;
                  font-size: 12px;
              }
              .meta-item strong {
                  color: #4b5563;
              }
              .score-container {
                  display: grid;
                  grid-template-columns: repeat(5, 1fr);
                  gap: 12px;
                  margin-bottom: 30px;
              }
              .score-card {
                  background: #ffffff;
                  border: 1px solid #e5e7eb;
                  border-radius: 12px;
                  padding: 12px;
                  text-align: center;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
              }
              .score-card.featured {
                  background: #eff6ff;
                  border-color: #bfdbfe;
              }
              .score-card h3 {
                  font-size: 11px;
                  text-transform: uppercase;
                  color: #6b7280;
                  margin: 0 0 8px 0;
                  font-weight: 700;
                  letter-spacing: 0.05em;
              }
              .score-card .val {
                  font-size: 28px;
                  font-weight: 800;
                  color: #1e3a8a;
              }
              .section-title {
                  font-size: 16px;
                  font-weight: 700;
                  color: #1e3a8a;
                  border-bottom: 2px solid #eff6ff;
                  padding-bottom: 6px;
                  margin-top: 30px;
                  margin-bottom: 14px;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                  font-size: 12px;
              }
              th {
                  background: #f8fafc;
                  text-align: left;
                  padding: 8px 12px;
                  font-weight: 700;
                  color: #475569;
                  border-bottom: 2px solid #e2e8f0;
              }
              td {
                  padding: 8px 12px;
                  border-bottom: 1px solid #f1f5f9;
                  color: #334155;
              }
              .footer {
                  margin-top: 40px;
                  border-top: 1px solid #e5e7eb;
                  padding-top: 12px;
                  text-align: center;
                  font-size: 10px;
                  color: #9ca3af;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="header-left">
                  <h1>MonitorPro SRE Diagnostics</h1>
                  <p>Enterprise Site Reliability Audit & Technical SEO Report (Node.js)</p>
              </div>
              <div class="header-right">
                  <div class="status-badge">${isUpLabel}</div>
              </div>
          </div>
 
          <div class="meta-grid">
              <div class="meta-item"><strong>Target URL:</strong> ${h.url}</div>
              <div class="meta-item"><strong>Scan Date:</strong> ${new Date(h.checkedAt).toLocaleString()}</div>
              <div class="meta-item"><strong>Report Reference ID:</strong> MP-NODE-${h._id}</div>
              <div class="meta-item"><strong>Server Status:</strong> HTTP ${h.statusCode || 200} (Load Time: ${h.isUp ? `${(h.loadTimeMs/1000).toFixed(2)}s` : '—'})</div>
          </div>
 
          <div class="score-container">
              <div class="score-card featured">
                  <h3>Overall SRE</h3>
                  <div class="val">${overall}</div>
              </div>
              <div class="score-card">
                  <h3>Performance</h3>
                  <div class="val">${perfVal}</div>
              </div>
              <div class="score-card">
                  <h3>SEO Score</h3>
                  <div class="val">${seoVal}</div>
              </div>
              <div class="score-card">
                  <h3>Security</h3>
                  <div class="val">${secVal}</div>
              </div>
              <div class="score-card">
                  <h3>UI / UX</h3>
                  <div class="val">${uiVal}</div>
              </div>
          </div>
 
          <div class="section-title">Telemetry Scans Summary</div>
          <table>
              <thead>
                  <tr>
                      <th style="width: 40%;">Telemetry Check</th>
                      <th>Observed Value / Status</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td><strong>Core Web Vitals - CLS Hazard Index</strong></td>
                      <td>${h.performance?.vitals?.cls || '0.00'}</td>
                  </tr>
                  <tr>
                      <td><strong>DNS Resolution Speed</strong></td>
                      <td>${h.dnsResolutionTimeMs ? `${h.dnsResolutionTimeMs} ms` : '—'}</td>
                  </tr>
                  <tr>
                      <td><strong>Time To First Byte (TTFB)</strong></td>
                      <td>${h.ttfbMs ? `${h.ttfbMs} ms` : '—'}</td>
                  </tr>
                  <tr>
                      <td><strong>SSL Domain Expiry Countdown</strong></td>
                      <td>${h.ssl?.daysRemaining || '—'} Days remaining</td>
                  </tr>
              </tbody>
          </table>
 
          <div class="section-title">SRE Diagnostics Alert Stream</div>
          ${alertsHtml || '<div style="color: #6b7280; font-size: 12px; padding: 12px; border: 1px dashed #e5e7eb; border-radius: 8px; text-align: center;">No critical system anomalies detected in this run.</div>'}
 
          <div class="footer">
              MonitorPro Enterprise SRE Diagnostics Portal • Confirmed By SRE Node Gateway
          </div>
 
          <script>
              window.onload = function() {
                  setTimeout(function() {
                      window.print();
                  }, 300);
              };
          </script>
      </body>
      </html>
    `;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Real-time Uptime Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up">
        
        {/* Status Indicator */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gateway Status</span>
            <div className="flex items-center gap-2">
              {isSocketConnected && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-widest animate-pulse">
                  LIVE
                </span>
              )}
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isUp ? 'bg-emerald-450' : 'bg-rose-450'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black tracking-tight">{isUp ? 'ONLINE' : 'DOWN'}</h2>
            <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1.5 font-bold uppercase tracking-wide">
              <span className={`h-1.5 w-1.5 rounded-full ${isSocketConnected ? 'bg-indigo-450' : 'bg-slate-500'}`}></span>
              {isSocketConnected ? 'WebSocket live portal' : 'Standard Polls active'}
            </p>
          </div>
        </div>

        {/* Uptime Percent */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Uptime (24h)</span>
            <Activity className="text-violet-400 h-5 w-5" />
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black tracking-tight text-violet-400">{uptimePercentage}%</h2>
            <p className="text-slate-500 text-xs mt-1">SRE Target: &gt;99.9%</p>
          </div>
        </div>

        {/* SSL Shield Validity */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">SSL Security</span>
            {ssl?.valid ? (
              <ShieldCheck className="text-emerald-400 h-5 w-5" />
            ) : (
              <ShieldAlert className="text-rose-400 h-5 w-5" />
            )}
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black tracking-tight">
              {ssl?.valid ? `${ssl.daysRemaining} Days` : 'EXPIRED'}
            </h2>
            <p className="text-slate-500 text-xs mt-1 truncate">
              {ssl?.valid ? `Issued by ${ssl.issuer.split(' ')[0]}` : 'Immediate renewal required'}
            </p>
          </div>
        </div>

        {/* DNS Speed */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">DNS Latency</span>
            <Globe className="text-sky-400 h-5 w-5" />
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black tracking-tight text-sky-400">
              {latestStatus ? latestStatus.dnsResolutionTimeMs : 0}ms
            </h2>
            <p className="text-slate-500 text-xs mt-1">DNS Hops: Operational</p>
          </div>
        </div>

      </div>

      {/* SRE Global SEO Check Widget */}
      <div className="glass-card p-6 mt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2">
              <Globe className="text-indigo-400 h-5 w-5" />
              SRE Global SEO Integrity Auditor
            </h3>
            <p className="text-xs text-slate-500 mt-1">Real-time technical crawler and indexability verification indices.</p>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-widest uppercase">
            Crawl Complete
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Circular Score */}
          <div className="lg:col-span-3 bg-dark-900/20 border border-slate-800/60 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider mb-3 w-full text-left">Audit Score</span>
            
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6"></circle>
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="transparent"
                  stroke={seoScore >= 90 ? '#10b981' : seoScore >= 75 ? '#fbbf24' : '#f87171'}
                  strokeWidth="6"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * seoScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out"
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-2xl font-black ${seoScore >= 90 ? 'text-emerald-400' : seoScore >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>{seoScore}</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">SEO Health</span>
              </div>
            </div>
          </div>

          {/* Audit Details */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Meta Title Auditor */}
            <div className="p-4 bg-dark-900/10 border border-slate-800/40 rounded-xl flex flex-col justify-between hover:border-slate-800/40 transition-all">
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-455" />
                  Meta Title Tag
                </span>
                <p className="text-xs font-semibold text-slate-300 truncate pr-4 font-mono">
                  {title?.text || <span className="text-rose-455 italic">Missing Title</span>}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Length: {title?.text?.length || 0} chars</span>
                {title?.text?.length >= 30 && title?.text?.length <= 65 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Optimal (30-65 chars)
                  </span>
                ) : (
                  <span className="text-amber-450 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Suboptimal length
                  </span>
                )}
              </div>
            </div>

            {/* Meta Description Auditor */}
            <div className="p-4 bg-dark-900/10 border border-slate-800/40 rounded-xl flex flex-col justify-between hover:border-slate-800/40 transition-all">
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-455" />
                  Meta Description
                </span>
                <p className="text-xs font-semibold text-slate-350 truncate pr-4 font-mono">
                  {metaDescription?.text || <span className="text-rose-455 italic">Missing Description</span>}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Length: {metaDescription?.text?.length || 0} chars</span>
                {metaDescription?.text?.length >= 120 && metaDescription?.text?.length <= 160 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Optimal (120-160)
                  </span>
                ) : (
                  <span className="text-amber-450 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Suboptimal length
                  </span>
                )}
              </div>
            </div>

            {/* Alt Tag Compliance */}
            {(() => {
              const total = imageAnalysis?.totalImages || 0;
              const valid = imageAnalysis?.withAlt || 0;
              const missing = (imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0);
              const pct = total > 0 ? Math.round((valid / total) * 100) : 100;
              return (
                <div className="p-4 bg-dark-900/10 border border-slate-800/40 rounded-xl hover:border-slate-800/40 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5 text-indigo-455" />
                      Alt Tag Compliance
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{valid}/{total} Images</span>
                  </div>
                  
                  <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden border border-slate-850/80 mb-2.5">
                    <div className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Compliance Rate: {pct}%</span>
                    {missing > 0 ? (
                      <span
                        className="text-rose-400 font-bold flex items-center gap-1 animate-pulse cursor-pointer hover:underline hover:text-rose-300 transition-colors"
                        onClick={() => onNavigateToAlt && onNavigateToAlt()}
                        title="Click to view Missing ALT details in Site Analysis"
                        style={{ borderBottom: '1px dashed currentColor' }}
                      >
                        <AlertTriangle className="h-3 w-3" /> {missing} Missing ALT ↗
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> 100% Compliant
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Crawlability Probes & Dead Links combined */}
            <div className="p-4 bg-dark-900/10 border border-slate-800/40 rounded-xl flex flex-col justify-between hover:border-slate-800/40 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Link className="h-3.5 w-3.5 text-indigo-455" />
                  Links & Crawl files
                </span>
                {links?.brokenCount > 0 ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                    {links.brokenCount} BROKEN
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LINKS SECURE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-2 text-[10px] text-slate-400">
                <div className="flex flex-col items-center justify-center p-1.5 bg-slate-900/30 rounded border border-slate-800/40 text-center">
                  <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Indexable</span>
                  {indexability?.isIndexable ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Yes</span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-0.5"><XCircle className="h-3 w-3" /> No</span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 bg-slate-900/30 rounded border border-slate-800/40 text-center">
                  <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">robots.txt</span>
                  {robotsTxt?.exists ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Found</span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" /> Missing</span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 bg-slate-900/30 rounded border border-slate-800/40 text-center">
                  <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">sitemap</span>
                  {sitemap?.exists ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Found</span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" /> Missing</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Sub-tab navigation */}
      <div className="flex border-b border-slate-800 gap-4 mt-8">
        {[
          { id: 'performance', label: 'Core Web Vitals' },
          { id: 'seo', label: 'Technical SEO' },
          { id: 'ui_ux', label: 'Visual Accessibility' },
          { id: 'security', label: 'Security Shield' },
          { id: 'history', label: 'Scan History & Trends' }
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id)}
            className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeSubTab === sub.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* 3. Sub-tab panel renders */}
      <div className="animate-fade mt-4">
        
        {/* Core Web Vitals Tab */}
        {activeSubTab === 'performance' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-slate-200 font-extrabold text-lg flex items-center gap-2">
                    <Layers className="text-indigo-400 h-5 w-5" />
                    Core Web Vitals Telemetry
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Grounded real-time browser painting scores and payload budgets.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">Audit Rating:</span>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-black bg-indigo-500/10 border-2 border-indigo-500 text-indigo-400 text-lg">
                    {perf?.grade || 'A'}
                  </div>
                </div>
              </div>

              {/* Vitals Grid cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { name: 'First Contentful Paint', key: 'fcp', unit: 's', desc: 'Measures when first content renders.', target: 'Ideal: < 1.8s',
                    getReason: (v) => v > 3 ? 'Render-blocking scripts or stylesheets delaying initial paint.' : v > 1.8 ? 'Slow server response or large CSS bundle affecting paint start.' : 'FCP is within acceptable range.',
                    getSuggestion: (v) => v > 1.8 ? 'Eliminate render-blocking resources. Inline critical CSS and defer non-critical JS.' : 'No action needed.' },
                  { name: 'Largest Contentful Paint', key: 'lcp', unit: 's', desc: 'Measures main page content load.', target: 'Ideal: < 2.5s',
                    getReason: (v) => v > 4 ? 'Large hero image or video causing slow loading.' : v > 2.5 ? 'Slow server response time or large resource blocking main content.' : 'LCP is within acceptable range.',
                    getSuggestion: (v) => v > 2.5 ? 'Compress images, use modern formats (WebP/AVIF), apply lazy loading, and use a CDN.' : 'No action needed.' },
                  { name: 'Cumulative Layout Shift', key: 'cls', unit: '', desc: 'Measures visual content stability.', target: 'Ideal: < 0.10',
                    getReason: (v) => v > 0.25 ? 'Images or ads without explicit dimensions causing layout shifts.' : v > 0.1 ? 'Dynamic content or web fonts causing elements to shift during load.' : 'CLS is within acceptable range.',
                    getSuggestion: (v) => v > 0.1 ? 'Always set width/height on images and video. Avoid inserting content above existing content.' : 'No action needed.' },
                  { name: 'First Input Delay', key: 'fid', unit: 'ms', desc: 'Measures initial button responsiveness.', target: 'Ideal: < 100ms',
                    getReason: (v) => v > 300 ? 'Heavy JavaScript execution blocking the main thread.' : v > 100 ? 'Long tasks on the main thread delaying user interaction response.' : 'FID is within acceptable range.',
                    getSuggestion: (v) => v > 100 ? 'Break up long JavaScript tasks. Use web workers for heavy computations. Defer unused JS.' : 'No action needed.' },
                  { name: 'Interaction to Next Paint', key: 'inp', unit: 'ms', desc: 'Measures visual feedback latency.', target: 'Ideal: < 200ms',
                    getReason: (v) => v > 500 ? 'Slow event callbacks or expensive DOM updates on user interaction.' : v > 200 ? 'Heavy re-renders or synchronous operations blocking interaction response.' : 'INP is within acceptable range.',
                    getSuggestion: (v) => v > 200 ? 'Optimize event handlers. Minimise synchronous DOM operations. Use requestAnimationFrame for visual updates.' : 'No action needed.' },
                  { name: 'Speed Index', key: 'speedIndex', unit: 's', desc: 'Measures visual progression speed.', target: 'Ideal: < 3.4s',
                    getReason: (v) => v > 5 ? 'Many render-blocking resources slowing visual population of the page.' : v > 3.4 ? 'Slow resource loading order affecting how quickly content becomes visible.' : 'Speed Index is within acceptable range.',
                    getSuggestion: (v) => v > 3.4 ? 'Prioritise above-the-fold content loading. Reduce unused CSS/JS. Enable server-side compression.' : 'No action needed.' },
                ].map(v => {
                  const val = perf?.vitals?.[v.key] || 0;
                  let color = 'text-emerald-400';
                  let status = 'good';
                  if (v.key === 'cls' ? val > 0.25 : v.key === 'lcp' ? val > 4.0 : val > 300) {
                    color = 'text-rose-400'; status = 'poor';
                  } else if (v.key === 'cls' ? val > 0.1 : v.key === 'lcp' ? val > 2.5 : val > 100) {
                    color = 'text-amber-400'; status = 'needs-improvement';
                  }
                  const reason     = v.getReason(val);
                  const suggestion = v.getSuggestion(val);

                  return (
                    <div key={v.key} className={`bg-dark-800/40 border p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/25 transition-all ${status === 'poor' ? 'border-rose-500/30' : status === 'needs-improvement' ? 'border-amber-500/30' : 'border-slate-800/60'}`}>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{v.name}</span>
                        <h4 className={`text-2xl font-black mt-2 ${color}`}>
                          {val}{v.unit}
                        </h4>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800/40 space-y-2 text-[10px]">
                        <p className="text-slate-500">{v.target}</p>
                        {status !== 'good' && (
                          <>
                            <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800/60">
                              <p className="text-slate-400 font-bold mb-0.5">⚠ Reason:</p>
                              <p className="text-slate-500 leading-relaxed">{reason}</p>
                            </div>
                            <div className="p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/15">
                              <p className="text-indigo-400 font-bold mb-0.5">💡 Suggestion:</p>
                              <p className="text-slate-400 leading-relaxed">{suggestion}</p>
                            </div>
                          </>
                        )}
                        {status === 'good' && (
                          <p className="text-emerald-400 font-bold flex items-center gap-1">✓ {reason}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infrastructure Weight details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800/40 text-xs">
                <div className="flex justify-between items-center p-3 bg-dark-800/35 rounded-lg border border-slate-800/40">
                  <span className="text-slate-500 font-medium">Total DOM Nodes Count:</span>
                  <span className="font-bold text-slate-350">{perf?.totalNodes || 240}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-800/35 rounded-lg border border-slate-800/40">
                  <span className="text-slate-500 font-medium">Page Transfer Weight:</span>
                  <span className="font-bold text-slate-350">{perf?.pageSizeKb || 85} KB</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-800/35 rounded-lg border border-slate-800/40">
                  <span className="text-slate-500 font-medium">Unminified Blocking Assets:</span>
                  <span className="font-bold text-slate-350">{perf?.unminifiedCount || 0} scripts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical SEO Tab */}
        {activeSubTab === 'seo' && (
          <SeoDashboard seoData={seo} />
        )}

        {/* Visual Accessibility Tab */}
        {activeSubTab === 'ui_ux' && (
          <AccessibilityAudit uiUxData={uiUx} mobileFriendliness={seo?.mobileFriendliness} />
        )}

        {/* Security Shield Tab */}
        {activeSubTab === 'security' && (
          <SSLMonitor sslData={ssl} securityData={security} />
        )}

        {/* Scan History and Recharts Trends Tab */}
        {activeSubTab === 'history' && (
          <div className="space-y-6">
            
            {/* Top Recharts chronological trends */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-6">
                <div>
                  <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2">
                    <Activity className="text-indigo-400 h-5 w-5" />
                    Chronological SRE Health Trends (Last 30 Checks)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dual-axis telemetry tracking overall score variations vs site load latency speeds.</p>
                </div>
                
                {/* Download CSV button */}
                <button 
                  onClick={downloadCsv}
                  className="px-4 py-2 bg-indigo-600 border-none hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV History</span>
                </button>
              </div>

              <div className="h-60 w-full">
                {trendData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendOverallSreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.3} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px', color: '#cbd5e1', fontSize: '11px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      />
                      <Legend verticalAlign="top" height={32} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="overall" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#trendOverallSreGrad)" name="Overall SRE Score" />
                      <Area type="monotone" dataKey="perf" stroke="#10b981" strokeWidth={1.5} fill="none" name="Performance Score" />
                      <Area type="monotone" dataKey="security" stroke="#0ea5e9" strokeWidth={1.5} fill="none" name="Security Score" />
                      <Area type="monotone" dataKey="seo" stroke="#f59e0b" strokeWidth={1.5} fill="none" name="SEO Score" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl bg-dark-900/20">
                    Awaiting scan ticks to populate history trend lines...
                  </div>
                )}
              </div>
            </div>

            {/* Scans tables and print buttons */}
            <div className="glass-card p-6">
              <h3 className="text-slate-200 font-extrabold text-base border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
                <span>Auditing History Logs</span>
                <span className="text-xs text-slate-500 font-bold bg-slate-800/60 px-2.5 py-0.5 rounded-full">{historyLog.length} scan records</span>
              </h3>
              
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Date/Time</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">HTTP</th>
                      <th className="py-3 px-3">Load Time</th>
                      <th className="py-3 px-3">Perf</th>
                      <th className="py-3 px-3">SEO</th>
                      <th className="py-3 px-3">Security</th>
                      <th className="py-3 px-3">Overall</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLog.map((log) => {
                      const overall = Math.round(
                        ((log.performance?.performanceScore || 90) + 
                         (log.seo?.seoScore || 85) + 
                         (log.security?.securityScore || 90) + 
                         (log.uiUx?.uiHealthScore || 85)) / 4
                      );
                      
                      return (
                        <tr key={log._id} className="border-b border-slate-800/40 hover:bg-dark-900/20 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-mono">
                            {new Date(log.checkedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] ${log.isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                              {log.isUp ? 'UP' : 'DOWN'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-mono">{log.statusCode || '—'}</td>
                          <td className="py-3 px-3 text-slate-300 font-mono">{log.isUp ? `${log.loadTimeMs}ms` : '—'}</td>
                          <td className="py-3 px-3 font-semibold text-emerald-400">{log.performance?.performanceScore || 90}</td>
                          <td className="py-3 px-3 font-semibold text-violet-400">{log.seo?.seoScore || 85}</td>
                          <td className="py-3 px-3 font-semibold text-sky-400">{log.security?.securityScore || 90}</td>
                          <td className="py-3 px-3">
                            <span className="font-extrabold bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                              {overall}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button 
                              onClick={() => printPdf(log)}
                              className="p-1.5 bg-dark-900/60 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 border border-slate-800 transition-all cursor-pointer"
                              title="Print high-fidelity PDF report"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
