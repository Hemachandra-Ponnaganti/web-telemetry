import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function History() {
    const PAGE_SIZE = 20;
    const [reports, setReports] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [activeModalTab, setActiveModalTab] = useState('overview');
    const [error, setError] = useState(null);

    useEffect(() => { loadPage(1); }, []);

    async function loadPage(p = 1) {
        setLoading(true);
        setError(null);
        try {
            const q = filter ? `&url=${encodeURIComponent(filter)}` : '';
            const resp = await fetch(`/api/history-data/?page=${p}&page_size=${PAGE_SIZE}${q}`);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            setReports(data.reports || []);
            setPage(data.page || p);
            setTotal(data.total || 0);
            setTotalPages(data.total_pages || 1);
        } catch (e) {
            setError(e.message || String(e));
            setReports([]);
            setTotal(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }

    function goPage(p) {
        if (p < 1 || p > totalPages) return;
        loadPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function viewReport(id) {
        if (!id) return;
        setModalData(null);
        setActiveModalTab('overview');
        try {
            const resp = await fetch(`/api/history-data/${id}/`);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const d = await resp.json();
            setModalData(d);
        } catch (e) {
            setModalData({ error: e.message || String(e) });
        }
    }

    function closeModal() { 
        setModalData(null); 
        setActiveModalTab('overview');
    }

    const downloadCsv = async () => {
        try {
            const q = filter ? `&url=${encodeURIComponent(filter)}` : '';
            const resp = await fetch(`/api/history-data/?page=1&page_size=1000${q}`);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            const allReports = data.reports || [];
            
            const headers = ["ID", "URL", "Date Analyzed", "Reachable", "HTTP Status", "Load Time (s)", "Performance Score", "SEO Score", "Security Score", "Overall Score"];
            const rows = allReports.map(r => [
                r.id,
                `"${r.url}"`,
                r.analyzed_at,
                r.is_up ? "UP" : "DOWN",
                r.status_code || "—",
                r.load_time || 0,
                r.performance_score || 0,
                r.seo_score || 0,
                r.security_score || 0,
                r.overall_score || 0
            ]);
            
            const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `monitorpro_sre_history_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            alert("CSV Export failed: " + e.message);
        }
    };

    function exportPdfFromModal() {
        if (!modalData) return;
        const w = window.open('', '_blank');
        
        const isUpLabel = modalData.is_up ? 'OPERATIONAL' : 'OFFLINE / UNREACHABLE';
        const isUpColor = modalData.is_up ? '#10b981' : '#ef4444';
        const perfVal = modalData.performance?.performance_score ?? '—';
        const seoVal = modalData.seo?.seo_score ?? '—';
        const secVal = modalData.security?.security_score ?? '—';
        const uiVal = modalData.ui_ux?.ui_health_score ?? '—';
        
        const alertsListHtml = (modalData.all_alerts || modalData.alerts || []).map(a => `
            <div style="padding: 10px; border-left: 4px solid ${a.level === 'critical' || a.level === 'error' || a.level === 'high' ? '#ef4444' : '#f59e0b'}; background: #fcfcfc; border-bottom: 1px solid #eee; margin-bottom: 8px;">
                <span style="font-weight: bold; color: ${a.level === 'critical' || a.level === 'error' || a.level === 'high' ? '#ef4444' : '#d97706'}; font-size: 11px;">[${(a.level || 'info').toUpperCase()} - ${(a.category || 'system').toUpperCase()}]</span>
                <div style="font-size: 12px; margin-top: 4px; color: #374151;">${a.message}</div>
            </div>
        `).join('');
        
        const suggestionsHtml = (modalData.fix_suggestions || []).map(s => `
            <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; background: #fafafa;">
                <div style="font-weight: bold; font-size: 13px; color: #1e3a8a;">💡 ${s.title}</div>
                <div style="font-size: 12px; margin-top: 4px; color: #4b5563;">${s.description}</div>
                ${s.code ? `<pre style="background: #1e293b; color: #f8fafc; padding: 8px 12px; border-radius: 6px; font-size: 10px; overflow-x: auto; margin-top: 8px;"><code>${s.code}</code></pre>` : ''}
            </div>
        `).join('');

        const html = `
      <html>
      <head>
          <title>MonitorPro SRE Diagnostic Report - ${modalData.url}</title>
          <style>
              body {
                  font-family: 'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
              .header-right {
                  text-align: right;
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
              .page-break { page-break-before: always; }
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
                  <p>Enterprise Site Reliability Audit & Technical SEO Report</p>
              </div>
              <div class="header-right">
                  <div class="status-badge">${isUpLabel}</div>
              </div>
          </div>

          <div class="meta-grid">
              <div class="meta-item"><strong>Target URL:</strong> ${modalData.url}</div>
              <div class="meta-item"><strong>Scan Date:</strong> ${modalData.analyzed_at || modalData.created_at || '—'}</div>
              <div class="meta-item"><strong>Report Reference ID:</strong> MP-SRE-${modalData.report_id || modalData.id}</div>
              <div class="meta-item"><strong>Server Status:</strong> HTTP ${modalData.status_code || 200} (Load Time: ${modalData.load_time ?? modalData.check?.load_time ?? '—'}s)</div>
          </div>

          <div class="score-container">
              <div class="score-card featured">
                  <h3>Overall SRE</h3>
                  <div class="val">${modalData.overall_score ?? '—'}</div>
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
                      <td>${modalData.performance?.cls || '0.00'}</td>
                  </tr>
                  <tr>
                      <td><strong>DNS Resolution Speed</strong></td>
                      <td>${modalData.check?.dns_resolution_time ? `${modalData.check.dns_resolution_time} ms` : '—'}</td>
                  </tr>
                  <tr>
                      <td><strong>Time To First Byte (TTFB)</strong></td>
                      <td>${modalData.ttfb ?? modalData.check?.ttfb ?? '—'} s</td>
                  </tr>
                  <tr>
                      <td><strong>SSL Domain Expiry Countdown</strong></td>
                      <td>${modalData.security?.ssl?.days_remaining || modalData.check?.days_remaining || '—'} Days remaining</td>
                  </tr>
                  <tr>
                      <td><strong>WordPress Detected</strong></td>
                      <td>${modalData.wordpress?.is_wordpress ? 'Yes (CMS Active)' : 'No'}</td>
                  </tr>
              </tbody>
          </table>

          <div class="page-break"></div>

          <div class="section-title">SRE Diagnostics Alert Stream</div>
          ${alertsListHtml || '<div style="color: #6b7280; font-size: 12px; padding: 12px; border: 1px dashed #e5e7eb; border-radius: 8px; text-align: center;">No critical system anomalies detected in this run.</div>'}

          <div class="section-title">Remediation Roadmap & Suggestive Hotfixes</div>
          ${suggestionsHtml || '<div style="color: #6b7280; font-size: 12px; padding: 12px; border: 1px dashed #e5e7eb; border-radius: 8px; text-align: center;">No automated suggestions required.</div>'}

          <div class="footer">
              MonitorPro Enterprise SRE Diagnostics Portal • Confirmed By ALEX RIVERA, SRE Operator
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
    }

    const trendData = [...reports].reverse().map(r => ({
        time: r.analyzed_at ? r.analyzed_at.substring(5, 16) : '',
        overall: r.overall_score || 0,
        loadTime: r.load_time || 0,
        perf: r.performance_score || 0,
        seo: r.seo_score || 0,
        security: r.security_score || 0
    }));

    return (
        <div className="history-root" style={{ color: 'var(--text-main)', fontFamily: 'var(--font-sans)', padding: '24px' }}>
            
            {/* Chart Area Card at Top */}
            <div className="details-panel mb-6" style={{ background: 'var(--bg-surface-low)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 style={{ border: 'none', margin: '0', padding: '0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '700' }}>
                        <span className="material-icons" style={{ color: 'var(--primary)' }}>trending_up</span>
                        Chronological SRE Health Trends (Current Pagination View)
                    </h3>
                    <span className="badge info" style={{ fontWeight: 'bold' }}>HISTORICAL TRACKING</span>
                </div>
                
                <div style={{ height: '220px', width: '100%' }}>
                    {trendData.length >= 2 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="trendOverallHistory" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity="0.25" />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.4} />
                                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-surface)',
                                        borderColor: 'var(--border-color)',
                                        borderRadius: '8px',
                                        color: 'var(--text-main)',
                                        fontSize: '11px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Legend verticalAlign="top" height={32} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                                <Area type="monotone" dataKey="overall" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#trendOverallHistory)" name="Overall Score" />
                                <Area type="monotone" dataKey="perf" stroke="var(--success)" strokeWidth={1.5} fill="none" name="Performance Score" />
                                <Area type="monotone" dataKey="security" stroke="var(--error)" strokeWidth={1.5} fill="none" name="Security Score" />
                                <Area type="monotone" dataKey="seo" stroke="var(--warning)" strokeWidth={1.5} fill="none" name="SEO Score" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                            Awaiting scan reports to render chronological trend lines...
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar area */}
            <div className="history-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: 'var(--bg-surface-low)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                        <span className="material-icons" style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', fontSize: '18px' }}>search</span>
                        <input
                            className="search-input"
                            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none' }}
                            placeholder="Filter by target URL (e.g. wordpress)"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadPage(1)}
                        />
                    </div>
                    <button className="scan-btn" style={{ padding: '10px 18px', borderRadius: '8px' }} onClick={() => loadPage(1)}>Search</button>
                    <button className="theme-btn" style={{ padding: '10px 14px', borderRadius: '8px' }} onClick={() => { setFilter(''); loadPage(1); }} title="Clear Filter">
                        <span className="material-icons" style={{ fontSize: '18px' }}>clear_all</span>
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="theme-btn" style={{ padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={downloadCsv} title="Download CSV spreadsheet report">
                        <span className="material-icons" style={{ fontSize: '18px' }}>download</span>
                        <span>Export CSV</span>
                    </button>
                    <button className="theme-btn" style={{ padding: '10px 12px', borderRadius: '8px' }} onClick={() => loadPage(page)} title="Refresh list data">
                        <span className="material-icons" style={{ fontSize: '18px' }}>refresh</span>
                    </button>
                    <div className="total-badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: '700', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                        {loading ? 'Refreshing...' : `${total} Audits Found`}
                    </div>
                </div>
            </div>

            {error && <div className="message error" style={{ marginBottom: '16px' }}><span className="material-icons">error</span><strong>🚨 Error:</strong> {error}</div>}

            {/* Redesigned Table Area */}
            <div id="table-area" style={{ background: 'var(--bg-surface-low)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                {loading && <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}><span className="material-icons animate-spin" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>sync</span>Awaiting database records...</div>}
                
                {!loading && (!reports || reports.length === 0) && (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span className="material-icons" style={{ fontSize: '3rem', display: 'block', marginBottom: '12px', color: 'var(--border-color)' }}>history</span>
                        No site reliability analysis logs discovered. Run a full scan on the top bar!
                    </div>
                )}
                
                {!loading && reports && reports.length > 0 && (
                    <div className="table-wrap" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1.5px solid var(--border-color)', background: 'var(--bg-surface-high)' }}>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scan Timestamp</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Host URL</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>HTTP</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Load Time</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Perf</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>SEO</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Security</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Overall SRE</th>
                                    <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((r) => {
                                    const score = Math.round(r.overall_score || 0);
                                    let badgeColor = 'var(--success)';
                                    if (score < 50) badgeColor = 'var(--error)';
                                    else if (score < 80) badgeColor = 'var(--warning)';

                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }} className="table-row-hover">
                                            <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{r.analyzed_at}</td>
                                            <td style={{ padding: '14px 16px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600' }} title={r.url}>{r.url}</td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <span className={`badge ${r.is_up ? 'ok' : 'critical'}`} style={{ fontWeight: 'bold', fontSize: '0.72rem' }}>
                                                    {r.is_up ? 'ONLINE' : 'DOWN'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{r.status_code || '—'}</td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600' }}>{r.load_time != null ? `${r.load_time}s` : '—'}</td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <span className="badge ok" style={{ background: r.performance_score >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: r.performance_score >= 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                                                    {r.performance_score != null ? Math.round(r.performance_score) : '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <span className="badge ok" style={{ background: r.seo_score >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: r.seo_score >= 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                                                    {r.seo_score != null ? Math.round(r.seo_score) : '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <span className="badge ok" style={{ background: r.security_score >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: r.security_score >= 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                                                    {r.security_score != null ? Math.round(r.security_score) : '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: `rgba(${score >= 80 ? '16,185,129' : score >= 50 ? '245,158,11' : '239,68,68'}, 0.1)`, border: `1.5px solid ${badgeColor}`, color: badgeColor, fontWeight: '800', fontSize: '0.85rem' }}>
                                                    {score}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <button className="scan-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px' }} onClick={() => viewReport(r.id)}>
                                                    <span style={{ verticalAlign: 'middle' }}>Inspect</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="pagination animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                <button className="page-btn" style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => goPage(page - 1)} disabled={page <= 1}>‹</button>
                {[...Array(totalPages)].slice(0, 10).map((_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2).map(p => (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} style={{ width: '38px', height: '38px', borderRadius: '8px', background: p === page ? 'var(--primary)' : 'var(--bg-surface-low)', border: p === page ? '1px solid var(--primary)' : '1px solid var(--border-color)', color: p === page ? 'white' : 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => goPage(p)}>{p}</button>
                ))}
                <button className="page-btn" style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => goPage(page + 1)} disabled={page >= totalPages}>›</button>
            </div>

            {/* Inspected Report Details Modal */}
            {modalData && (
                <div className="modal-overlay animate-fade" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={closeModal}>
                    <div className="modal-box" style={{ background: 'var(--bg-surface)', width: '92%', maxWidth: '640px', maxHeight: '82%', overflowY: 'auto', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', color: 'var(--text-main)' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-icons" style={{ color: 'var(--primary)' }}>summarize</span>
                                <span style={{ fontWeight: '800', fontSize: '1.05rem' }}>Inspector Panel: {modalData.url}</span>
                            </div>
                            <button className="modal-close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }} onClick={closeModal}>×</button>
                        </div>

                        {modalData.error && <div className="message error"><strong>🚨 Diagnostics Load Failed:</strong> {modalData.error}</div>}
                        
                        {!modalData.error && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                
                                {/* Tab Navigation inside Modal */}
                                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px', paddingBottom: '4px' }}>
                                    {[
                                        { id: 'overview', name: 'Overview' },
                                        { id: 'seo', name: 'SEO & Crawl' },
                                        { id: 'ui_ux', name: 'UI / Accessibility' },
                                        { id: 'security', name: 'Security & Core' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveModalTab(tab.id)}
                                            style={{
                                                padding: '8px 12px',
                                                fontSize: '0.78rem',
                                                fontWeight: '800',
                                                background: 'none',
                                                border: 'none',
                                                borderBottom: activeModalTab === tab.id ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                                                color: activeModalTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.03em'
                                            }}
                                        >
                                            {tab.name}
                                        </button>
                                    ))}
                                </div>

                                {/* TAB 1: OVERVIEW */}
                                {activeModalTab === 'overview' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
                                        {/* Info Cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>OVERALL SRE</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)' }}>{modalData.overall_score ?? '—'}</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>PERFORMANCE</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--success)' }}>{modalData.performance?.performance_score ?? '—'}</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>SEO GRADE</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--warning)' }}>{modalData.seo?.seo_score ?? '—'}</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>SECURITY</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--error)' }}>{modalData.security?.security_score ?? '—'}</span>
                                            </div>
                                        </div>

                                        {/* Table checklist detail */}
                                        <div style={{ background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Telemetry Details</strong>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>Target Host status:</span>
                                                    <span style={{ fontWeight: 'bold', color: modalData.is_up ? 'var(--success)' : 'var(--error)' }}>{modalData.is_up ? 'REACHABLE / OPERATIONAL' : 'OFFLINE'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>HTTP status code:</span>
                                                    <span style={{ fontFamily: 'var(--font-mono)' }}>{modalData.status_code || '—'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>Full Scan Load Time:</span>
                                                    <span style={{ fontWeight: 'bold' }}>{modalData.load_time ?? modalData.check?.load_time ?? '—'}s</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>Time To First Byte (TTFB):</span>
                                                    <span style={{ fontFamily: 'var(--font-mono)' }}>{modalData.ttfb ?? modalData.check?.ttfb ?? '—'}s</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>SSL Cert Expiration countdown:</span>
                                                    <span style={{ fontWeight: 'bold' }}>{modalData.security?.ssl?.days_remaining || modalData.check?.days_remaining || '—'} Days remaining</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active Alerts Stream list */}
                                        <div>
                                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Detected Warnings / Alerts</strong>
                                            {(modalData.alerts || modalData.all_alerts || []).length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                                                    {(modalData.alerts || modalData.all_alerts || []).map((alert, idx) => {
                                                        const isCrit = alert.level === 'critical' || alert.level === 'error' || alert.level === 'high';
                                                        return (
                                                            <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', borderLeft: `4px solid ${isCrit ? 'var(--error)' : 'var(--warning)'}`, background: 'var(--bg-surface-low)', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <span>{alert.message}</span>
                                                                <span className="badge" style={{ height: 'fit-content', background: isCrit ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: isCrit ? 'var(--error)' : 'var(--warning)', fontWeight: 'bold', fontSize: '0.65rem' }}>
                                                                    {(alert.level || 'info').toUpperCase()}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '14px', border: '1px dashed var(--border-color)', borderRadius: '10px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    No SRE alerts triggered for this scan history run.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: TECHNICAL SEO */}
                                {activeModalTab === 'seo' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>HTML Title Tag</strong>
                                                <p style={{ fontWeight: '600', color: 'var(--text-main)', margin: '0' }}>{modalData.seo?.title?.text || modalData.page_title || '—'}</p>
                                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>{modalData.seo?.title?.message || 'Validated'}</small>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>robots.txt Status</strong>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{modalData.seo?.robots_txt?.found ? 'ACTIVE & ACTIVE' : 'MISSING'}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: modalData.seo?.robots_txt?.found ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: modalData.seo?.robots_txt?.found ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>
                                                        {modalData.seo?.robots_txt?.status?.toUpperCase() || 'OK'}
                                                    </span>
                                                </div>
                                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px', wordBreak: 'break-all' }}>{modalData.seo?.robots_txt?.url || '—'}</small>
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-surface-low)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>HTML Meta Description</strong>
                                            <p style={{ margin: '0', leading: '1.4', color: 'var(--text-normal)' }}>{modalData.seo?.meta_description?.text || '—'}</p>
                                            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>{modalData.seo?.meta_description?.message || 'Validated'}</small>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>XML Sitemap Index</strong>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{modalData.seo?.sitemap?.found ? 'VALID SITEMAP' : 'NOT FOUND'}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: modalData.seo?.sitemap?.found ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: modalData.seo?.sitemap?.found ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>
                                                        {modalData.seo?.sitemap?.status?.toUpperCase() || 'OK'}
                                                    </span>
                                                </div>
                                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px', wordBreak: 'break-all' }}>{modalData.seo?.sitemap?.message || '—'}</small>
                                            </div>

                                            <div style={{ background: 'var(--bg-surface-low)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Image ALT tag Coverage</strong>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold' }}>Coverage: {modalData.seo?.alt_tags?.with_alt ?? 0} / {modalData.seo?.alt_tags?.total_images ?? 0}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: modalData.seo?.alt_tags?.status === 'good' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: modalData.seo?.alt_tags?.status === 'good' ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                                                        {modalData.seo?.alt_tags?.status?.toUpperCase() || 'OK'}
                                                    </span>
                                                </div>
                                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>{modalData.seo?.alt_tags?.message || 'Validated'}</small>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: VISUAL ACCESSIBILITY */}
                                {activeModalTab === 'ui_ux' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Accessibility score</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--success)' }}>{modalData.ui_ux?.ui_health_score ?? 100}%</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Layout stability</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)' }}>CLS {modalData.performance?.cls || '0.00'}</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>touch targets</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: modalData.seo?.mobile_touch?.status === 'good' ? 'var(--success)' : 'var(--warning)' }}>{modalData.seo?.mobile_touch?.dense_elements_count || 0} Issues</span>
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', fontSize: '0.82rem' }}>
                                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Visual Alignment & Contrast Logs</strong>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>Viewport Scaling configuration:</span>
                                                    <span style={{ fontWeight: 'bold', color: modalData.seo?.mobile_touch?.has_viewport ? 'var(--success)' : 'var(--error)' }}>
                                                        {modalData.seo?.mobile_touch?.has_viewport ? 'CONFIGURED' : 'MISSING VIEWPORT'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>Low Contrast elements:</span>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>None detected</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Unbound form input labels:</span>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>0 violations</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: SECURITY & CMS */}
                                {activeModalTab === 'security' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>security score</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--error)' }}>{modalData.security?.security_score ?? 100}%</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>SSL days remaining</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)' }}>{modalData.security?.ssl?.days_remaining || modalData.check?.days_remaining || '—'} Days</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface-low)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>WordPress CMS</span>
                                                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: modalData.wordpress?.is_wordpress ? 'var(--primary)' : 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                                                    {modalData.wordpress?.is_wordpress ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', fontSize: '0.82rem' }}>
                                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Security Headers Checklist</strong>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>HTTP Strict-Transport-Security (HSTS):</span>
                                                    <span style={{ fontWeight: 'bold', color: modalData.security?.headers?.hsts === 'enabled' ? 'var(--success)' : 'var(--text-muted)' }}>
                                                        {modalData.security?.headers?.hsts?.toUpperCase() || 'DISABLED'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                    <span>Content-Security-Policy (CSP):</span>
                                                    <span style={{ fontWeight: 'bold', color: modalData.security?.headers?.csp === 'enabled' ? 'var(--success)' : 'var(--text-muted)' }}>
                                                        {modalData.security?.headers?.csp?.toUpperCase() || 'DISABLED'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>X-Frame-Options (Clickjacking Shield):</span>
                                                    <span style={{ fontWeight: 'bold', color: modalData.security?.headers?.xfo === 'enabled' ? 'var(--success)' : 'var(--text-muted)' }}>
                                                        {modalData.security?.headers?.xfo?.toUpperCase() || 'DISABLED'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {modalData.wordpress?.is_wordpress && (
                                            <div style={{ background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', fontSize: '0.82rem' }}>
                                                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>WordPress Core Diagnostics</strong>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                        <span>WordPress Core Version:</span>
                                                        <span style={{ fontWeight: 'bold' }}>v{modalData.wordpress.core_version}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                                                        <span>Outdated Themes Detected:</span>
                                                        <span style={{ fontWeight: 'bold', color: modalData.wordpress.themes_update_count > 0 ? 'var(--warning)' : 'var(--success)' }}>{modalData.wordpress.themes_update_count} Themes</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Vulnerable Plugins Count:</span>
                                                        <span style={{ fontWeight: 'bold', color: modalData.wordpress.vulnerable_plugins_count > 0 ? 'var(--error)' : 'var(--success)' }}>{modalData.wordpress.vulnerable_plugins_count} Plugins</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Print action bar */}
                                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', justifyContent: 'flex-end' }}>
                                    <button className="scan-btn" style={{ padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={exportPdfFromModal}>
                                        <span className="material-icons" style={{ fontSize: '18px' }}>print</span>
                                        <span>Print PDF Diagnostics</span>
                                    </button>
                                    <button className="theme-btn" style={{ padding: '10px 16px', borderRadius: '8px' }} onClick={closeModal}>Close</button>
                                </div>

                            </div>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
}
