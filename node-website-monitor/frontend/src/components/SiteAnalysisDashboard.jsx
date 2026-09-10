import { useState, useEffect, useRef } from 'react';
import {
  FileText, Image, Link, Link2Off, Globe, Layers, CheckCircle2,
  AlertTriangle, AlertCircle, Info, Search, Cpu, Code, Package,
  BarChart2, ExternalLink, Hash, RefreshCw
} from 'lucide-react';

// Category colour mapping for tech stack badges
const CATEGORY_COLORS = {
  'Framework':     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'UI Library':    'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'CMS':           'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'E-Commerce':    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Builder':       'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Backend':       'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Server':        'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'CDN':           'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'CSS Framework': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'JS Library':    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Animation':     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  '3D Library':    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Data Viz':      'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Analytics':     'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Support':       'bg-lime-500/10 text-lime-400 border-lime-500/20',
  'Payments':      'bg-green-500/10 text-green-400 border-green-500/20',
};

const categoryColor = (cat) => CATEGORY_COLORS[cat] || 'bg-slate-800 text-slate-400 border-slate-700';

const CONFIDENCE_LABELS = {
  high:   { label: 'High (Sitemap)', color: 'text-emerald-400' },
  medium: { label: 'Medium (Links)', color: 'text-amber-400' },
  low:    { label: 'Low (Estimate)', color: 'text-slate-400' },
};

export default function SiteAnalysisDashboard({ pageAnalysisData, seoData, activeAlerts = [], crawlData = null, crawlLoading = false, altHighlight = false }) {
  const [techFilter, setTechFilter] = useState('');
  const [imgPageFilter, setImgPageFilter] = useState('all');
  const altSectionRef = useRef(null);

  // Auto-scroll + highlight when altHighlight prop is set
  useEffect(() => {
    if (altHighlight && altSectionRef.current) {
      altSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [altHighlight]);

  if (!pageAnalysisData && !seoData && !crawlData && !crawlLoading) {
    return (
      <div className="glass-card p-10 text-center max-w-2xl mx-auto my-6 animate-fade-in-up">
        <BarChart2 className="h-10 w-10 text-slate-600 mx-auto mb-4 animate-bounce" />
        <h4 className="font-extrabold text-slate-400">No Site Analysis Data Yet</h4>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          Enter a URL above and click <strong className="text-indigo-400">Run Scan</strong> to generate
          page count, image analysis, meta description, technology stack, and link reports.
        </p>
      </div>
    );
  }

  // ── Data extraction ──────────────────────────────────────────────────────
  // crawlData (deep BFS crawl) takes priority over pageAnalysisData (quick homepage scan)
  const deepCrawl     = crawlData?.siteWideImages || null;
  const crawlMeta     = crawlData?.crawlMeta || null;
  const deepPageCount = crawlData?.pageCount || null;

  const {
    pageCount: quickPageCount = { estimatedPages: 0, sitemapCount: 0, internalLinkCount: 0, source: 'unknown', confidence: 'low' },
    techStack = [],
  } = pageAnalysisData || {};

  // Use deep crawl page count if available, else quick estimate
  const pageCount = deepPageCount || quickPageCount;

  const {
    metaDescription = { text: '', status: 'warning', message: '' },
    imageAnalysis = { totalImages: 0, withAlt: 0, missingAlt: 0, emptyAlt: 0, missingAltSrcs: [], status: 'ok', message: '' },
    links = { internalCount: 0, externalCount: 0, brokenCount: 0, brokenLinks: [] },
  } = seoData || {};

  // Priority: deep BFS crawl > quick site-wide > homepage-only seoData
  const imgSource    = deepCrawl;
  const usingSiteWide = imgSource && imgSource.pagesScanned > 0;

  const totalImages      = usingSiteWide ? imgSource.totalImages      : (imageAnalysis?.totalImages || 0);
  const withAltCount     = usingSiteWide ? imgSource.withAlt          : (imageAnalysis?.withAlt || 0);
  const missingAltCount  = usingSiteWide ? imgSource.missingAlt       : ((imageAnalysis?.missingAlt || 0) + (imageAnalysis?.emptyAlt || 0));
  const lazyLoadedCount  = usingSiteWide ? (imgSource.lazyLoaded || 0) : 0;
  const altCompliancePct = usingSiteWide ? imgSource.altCompliancePct  : (totalImages > 0 ? Math.round((withAltCount / totalImages) * 100) : 100);
  const pagesScanned     = usingSiteWide ? imgSource.pagesScanned      : 1;
  const perPage          = usingSiteWide ? (imgSource.perPage || [])   : [];
  const missingAltImages = usingSiteWide
    ? (imgSource.missingAltImages || [])
    : (imageAnalysis?.missingAltSrcs || []).map(i => ({
        src: typeof i === 'string' ? i : i.src,
        suggestedAlt: typeof i === 'object' ? i.suggestedAlt : null,
        foundOnPage: null,
        altStatus: 'missing',
        appearsOnPages: []
      }));

  // Unique pages for the per-page filter dropdown
  const uniquePages = [...new Set(missingAltImages.map(i => i.foundOnPage).filter(Boolean))];
  const filteredMissingImgs = imgPageFilter === 'all'
    ? missingAltImages
    : missingAltImages.filter(i => i.foundOnPage === imgPageFilter);

  const brokenCount   = links?.brokenCount || 0;
  const internalCount = links?.internalCount || 0;
  const externalCount = links?.externalCount || 0;

  const metaDescText   = metaDescription?.text || '';
  const metaDescLen    = metaDescText.length;
  const metaDescStatus = !metaDescText ? 'missing' : metaDescLen < 120 ? 'short' : metaDescLen > 160 ? 'long' : 'ok';

  const filteredTech = techStack.filter(t =>
    t.name.toLowerCase().includes(techFilter.toLowerCase()) ||
    t.category.toLowerCase().includes(techFilter.toLowerCase())
  );  // Group tech by category for display
  const techByCategory = filteredTech.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  // Filter alerts relevant to this tab
  const relevantAlerts = activeAlerts.filter(a =>
    ['seo', 'performance'].includes(a.category) ||
    a.message.toLowerCase().includes('meta') ||
    a.message.toLowerCase().includes('alt') ||
    a.message.toLowerCase().includes('broken') ||
    a.message.toLowerCase().includes('image')
  );

  const confInfo = CONFIDENCE_LABELS[pageCount.confidence] || CONFIDENCE_LABELS.low;

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

      {/* ── Deep Crawl Progress / Result Banner ──────────────────────────── */}
      {crawlLoading && (
        <div className="glass-card p-4 border-l-4 border-l-indigo-500 flex items-center gap-3">
          <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin shrink-0" />
          <div>
            <p className="text-xs font-bold text-indigo-400">Deep site crawl in progress...</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Crawling up to 100 pages to count all images across the entire website. Runs in the background — other tabs work normally.
            </p>
          </div>
        </div>
      )}
      {crawlMeta && !crawlLoading && (
        <div className={`glass-card p-4 border-l-4 flex items-center gap-3 ${crawlMeta.crawlLimitReached ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
          {crawlMeta.crawlLimitReached
            ? <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            : <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
          <div>
            <p className={`text-xs font-bold ${crawlMeta.crawlLimitReached ? 'text-amber-400' : 'text-emerald-400'}`}>
              {crawlMeta.crawlLimitReached
                ? `Crawl limit reached — ${crawlMeta.pagesCrawled} of ${crawlMeta.pagesDiscovered}+ pages scanned (limit: ${crawlMeta.maxPagesLimit})`
                : `Full crawl complete — ${crawlMeta.pagesCrawled} pages scanned in ${(crawlMeta.elapsedMs / 1000).toFixed(1)}s`}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Source: {crawlMeta.usedSitemap ? 'sitemap.xml + BFS link crawl' : 'BFS internal link crawl'} · Depth limit: {crawlMeta.maxDepthLimit} levels
            </p>
          </div>
        </div>
      )}

      {/* ── Row 1: KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Total Pages */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Pages</span>
            <FileText className="text-indigo-400 h-4 w-4" />
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-200">{pageCount.estimatedPages}</h2>
            <p className={`text-[10px] mt-1 font-bold ${deepPageCount ? 'text-emerald-400' : confInfo.color}`}>
              {deepPageCount ? 'BFS crawled (accurate)' : crawlLoading ? 'crawling...' : confInfo.label}
            </p>
          </div>
        </div>

        {/* Total Images */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Images</span>
            <Image className="text-violet-400 h-4 w-4" />
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-200">{totalImages}</h2>
            <p className={`text-[10px] mt-1 font-bold ${usingSiteWide ? 'text-indigo-400' : 'text-slate-500'}`}>
              {usingSiteWide ? `across ${pagesScanned} pages` : crawlLoading ? 'crawling...' : 'homepage only'}
            </p>
          </div>
        </div>

        {/* Internal Links */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Internal Links</span>
            <Link className="text-sky-400 h-4 w-4" />
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-200">{internalCount}</h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">Same-domain links</p>
          </div>
        </div>

        {/* External Links */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">External Links</span>
            <ExternalLink className="text-emerald-400 h-4 w-4" />
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-200">{externalCount}</h2>
            <p className="text-[10px] mt-1 font-bold text-slate-500">Outbound links</p>
          </div>
        </div>

      </div>

      {/* ── Row 2: Broken Links + Meta Description ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Broken Links Card */}
        <div className={`glass-card p-6 flex flex-col justify-between ${brokenCount > 0 ? 'border-l-4 border-l-rose-500' : ''}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2">
              <Link2Off className={`h-4 w-4 ${brokenCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
              Broken Link Detection
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
              brokenCount === 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
            }`}>
              {brokenCount === 0 ? 'HEALTHY' : `${brokenCount} BROKEN`}
            </span>
          </div>

          {brokenCount === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400 font-bold">No broken links found — all links are operational.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-rose-400 font-bold flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Warning: {brokenCount} broken link{brokenCount > 1 ? 's' : ''} detected
              </p>
              {(links?.brokenLinks || []).slice(0, 4).map((bl, idx) => (
                <div key={idx} className="p-2.5 bg-rose-500/5 border border-rose-500/15 rounded-lg text-[10px]">
                  <p className="font-mono text-rose-300 truncate">{bl.url}</p>
                  <p className="text-slate-500 mt-0.5">{bl.reason} — <span className="capitalize">{bl.type}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meta Description Card */}
        <div className={`glass-card p-6 flex flex-col justify-between ${metaDescStatus === 'missing' ? 'border-l-4 border-l-rose-500' : metaDescStatus === 'ok' ? '' : 'border-l-4 border-l-amber-500'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-slate-200 font-extrabold text-sm flex items-center gap-2">
              <Hash className="h-4 w-4 text-indigo-400" />
              Meta Description
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
              metaDescStatus === 'ok'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : metaDescStatus === 'missing'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {metaDescStatus === 'ok' ? 'OPTIMAL' : metaDescStatus === 'missing' ? 'MISSING' : metaDescStatus === 'short' ? 'TOO SHORT' : 'TOO LONG'}
            </span>
          </div>

          {metaDescStatus === 'missing' ? (
            <div className="flex items-start gap-3 p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-rose-400 font-bold">No meta description tag found.</p>
                <p className="text-[10px] text-slate-500 mt-1">Add a 120–160 character description to improve search engine click-through rates.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-slate-300 leading-relaxed font-mono break-words">
                {metaDescText}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Length: <span className="font-bold text-slate-300">{metaDescLen} chars</span></span>
                <span className={`font-bold ${metaDescStatus === 'ok' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {metaDescStatus === 'ok' ? '✓ Ideal range (120–160)' : metaDescStatus === 'short' ? '⚠ Too short (min 120)' : '⚠ Too long (max 160)'}
                </span>
              </div>
              {/* Length bar */}
              <div className="w-full bg-slate-900/60 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${metaDescStatus === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (metaDescLen / 160) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Row 3: Image Analysis ─────────────────────────────────────────── */}
      <div
        id="alt-section"
        ref={altSectionRef}
        className={`glass-card p-6 transition-all duration-500 ${altHighlight ? 'sre-alt-highlight' : ''}`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2">
            <Image className="text-indigo-400 h-5 w-5" />
            Site-Wide Image Analysis
            {usingSiteWide && (
              <span className="ml-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black">
                {pagesScanned} pages crawled
              </span>
            )}
            {!usingSiteWide && (
              <span className="ml-1 px-2 py-0.5 bg-slate-700 text-slate-400 border border-slate-600 rounded-full text-[10px] font-bold">
                Homepage only
              </span>
            )}
          </h3>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Images</p>
            <p className="text-2xl font-black text-slate-200">{totalImages}</p>
            {usingSiteWide && <p className="text-[9px] text-slate-500 mt-0.5">{pagesScanned} pages</p>}
          </div>
          <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/15 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">With ALT</p>
            <p className="text-2xl font-black text-emerald-400">{withAltCount}</p>
          </div>
          <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/15 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Missing ALT</p>
            <p className="text-2xl font-black text-rose-400">{missingAltCount}</p>
          </div>
          <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/15 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Compliance</p>
            <p className={`text-2xl font-black ${altCompliancePct >= 90 ? 'text-emerald-400' : altCompliancePct >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>{altCompliancePct}%</p>
          </div>
        </div>

        {/* Compliance bar */}
        <div className="mb-5">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
            <span>ALT Tag Compliance Rate</span>
            <span className="font-bold">{withAltCount} / {totalImages} images</span>
          </div>
          <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${altCompliancePct >= 90 ? 'bg-emerald-500' : altCompliancePct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${altCompliancePct}%` }}
            />
          </div>
        </div>

        {/* Per-page breakdown table */}
        {perPage.length > 1 && (
          <div className="mb-5">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5">Images Per Page</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3">Page URL</th>
                    <th className="py-2 px-3 text-center">Total</th>
                    <th className="py-2 px-3 text-center">With ALT</th>
                    <th className="py-2 px-3 text-center">Missing ALT</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perPage.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-all">
                      <td className="py-2.5 px-3 font-mono text-indigo-400 text-[10px] max-w-xs truncate" title={p.pageUrl}>
                        {p.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-300">{p.totalImages}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{p.withAlt}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-400">{p.missingAlt}</td>
                      <td className="py-2.5 px-3 text-center">
                        {p.missingAlt === 0
                          ? <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold">OK</span>
                          : <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[9px] font-bold animate-pulse">FIX</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Optimization recommendations */}
        <div className="space-y-2 mb-4">
          {missingAltCount > 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-400">Add ALT text to {missingAltCount} image{missingAltCount > 1 ? 's' : ''} across {pagesScanned} page{pagesScanned > 1 ? 's' : ''}</p>
                <p className="text-slate-500 mt-0.5">Missing ALT attributes hurt accessibility (WCAG 2.1) and reduce image SEO indexing.</p>
              </div>
            </div>
          )}
          {totalImages > 20 && (
            <div className="flex items-start gap-3 p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl text-xs">
              <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-indigo-400">Consider lazy loading for {totalImages} images</p>
                <p className="text-slate-500 mt-0.5">Use <code className="font-mono bg-slate-800 px-1 rounded">loading="lazy"</code> on below-fold images to improve LCP and page load speed.</p>
              </div>
            </div>
          )}
          {totalImages === 0 && (
            <div className="flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <p className="text-slate-400">No images detected across scanned pages.</p>
            </div>
          )}
          {missingAltCount === 0 && totalImages > 0 && (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 font-bold">All {totalImages} images across {pagesScanned} page{pagesScanned > 1 ? 's' : ''} have valid ALT text — fully accessible and SEO-optimised.</p>
            </div>
          )}
        </div>

        {/* Missing ALT images list with page filter */}
        {missingAltImages.length > 0 && (
          <div className="pt-4 border-t border-slate-800/60">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                Images Missing ALT Text ({filteredMissingImgs.length}{imgPageFilter !== 'all' ? ` on this page` : ` total`})
              </p>
              {uniquePages.length > 1 && (
                <select
                  value={imgPageFilter}
                  onChange={e => setImgPageFilter(e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 outline-none focus:border-indigo-500/60 cursor-pointer"
                >
                  <option value="all">All pages ({missingAltImages.length})</option>
                  {uniquePages.map(p => (
                    <option key={p} value={p}>
                      {p.replace(/^https?:\/\/[^/]+/, '') || '/'} ({missingAltImages.filter(i => i.foundOnPage === p).length})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredMissingImgs.slice(0, 40).map((img, i) => {
                const src = img.src || (typeof img === 'string' ? img : '');
                const suggested = img.suggestedAlt;
                const page = img.foundOnPage;
                const isImage = src && /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)(\?|$)/i.test(src);
                return (
                  <div key={i} className="p-2.5 bg-rose-950/10 border border-rose-900/15 rounded-lg space-y-1.5">
                    <div className="flex items-start gap-2">
                      {/* Image preview thumbnail */}
                      {isImage && (
                        <a href={src} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img
                            src={src}
                            alt=""
                            className="h-10 w-10 object-cover rounded border border-rose-500/20 hover:border-indigo-500/40 transition-all"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        </a>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Clickable image URL */}
                          <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[9px] text-rose-300 hover:text-indigo-400 underline underline-offset-2 truncate flex-1 transition-colors"
                            title={src}
                          >
                            {src}
                          </a>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold border ${img.altStatus === 'empty' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {img.altStatus === 'empty' ? 'EMPTY ALT' : 'MISSING ALT'}
                          </span>
                        </div>
                        {page && (
                          <p className="text-[9px] text-slate-500 font-mono truncate mt-0.5">
                            📄 {page.replace(/^https?:\/\/[^/]+/, '') || '/'}
                          </p>
                        )}
                        {suggested && (
                          <p className="text-[9px] text-emerald-300 font-semibold mt-0.5">
                            💡 Suggested ALT: <em>"{suggested}"</em>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredMissingImgs.length > 40 && (
                <p className="text-[9px] text-slate-500 italic text-center py-1">
                  + {filteredMissingImgs.length - 40} more images not shown
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Row 4: Page Count Details ─────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-base mb-4 flex items-center gap-2">
          <Globe className="text-indigo-400 h-5 w-5" /> Page Count Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Estimated Total Pages</p>
            <p className="text-3xl font-black text-slate-200">{pageCount.estimatedPages}</p>
            <p className={`text-[10px] mt-1 font-bold ${confInfo.color}`}>Confidence: {confInfo.label}</p>
          </div>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Sitemap.xml URLs</p>
            <p className="text-3xl font-black text-slate-200">{pageCount.sitemapCount || 0}</p>
            <p className="text-[10px] mt-1 font-bold text-slate-500">
              {pageCount.sitemapCount > 0 ? '✓ Sitemap found and parsed' : '— Sitemap not found'}
            </p>
          </div>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Internal Links Found</p>
            <p className="text-3xl font-black text-slate-200">{pageCount.internalLinkCount || 0}</p>
            <p className="text-[10px] mt-1 font-bold text-slate-500">Unique internal paths crawled</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-4 italic">
          Source: <span className="font-bold text-slate-400">{pageCount.source === 'sitemap.xml' ? 'sitemap.xml (high accuracy)' : pageCount.source === 'internal-links' ? 'Internal link crawl (estimated)' : 'Fallback estimate'}</span>.
          {pageCount.sitemapCount === 0 && ' For accurate page counts, add a sitemap.xml to your site.'}
        </p>
      </div>

      {/* ── Row 5: Technology Stack ───────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2">
            <Cpu className="text-indigo-400 h-5 w-5" /> Technology Stack Detection
            {techStack.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black">
                {techStack.length} detected
              </span>
            )}
          </h3>
          {techStack.length > 0 && (
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 text-slate-500 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Filter technologies..."
                value={techFilter}
                onChange={e => setTechFilter(e.target.value)}
                className="bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 transition-all w-48"
              />
            </div>
          )}
        </div>

        {techStack.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Code className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-bold">No recognisable technology signatures detected.</p>
            <p className="text-[10px] text-slate-600 mt-1">The site may use custom or obfuscated code, or the scan did not return enough HTML.</p>
          </div>
        ) : filteredTech.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">No technologies match your filter.</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(techByCategory).map(([category, techs]) => (
              <div key={category}>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <Layers className="h-3 w-3" /> {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {techs.map((t, idx) => (
                    <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${categoryColor(t.category)}`}>
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Row 6: Alerts & Recommendations ─────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-slate-200 font-extrabold text-base mb-4 flex items-center gap-2">
          <AlertCircle className="text-indigo-400 h-5 w-5" /> Alerts & Recommendations
          {relevantAlerts.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-black">
              {relevantAlerts.length}
            </span>
          )}
        </h3>

        {relevantAlerts.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 flex flex-col items-center gap-2">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            <p className="text-xs text-slate-500 font-bold">No active alerts for this site analysis.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {relevantAlerts.map((alert, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs ${
                alert.level === 'critical'
                  ? 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                  : alert.level === 'warning'
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                  : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300'
              }`}>
                {alert.level === 'critical'
                  ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  : alert.level === 'warning'
                  ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                  : <Info className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />}
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-wider block mb-0.5 ${
                    alert.level === 'critical' ? 'text-rose-400' : alert.level === 'warning' ? 'text-amber-400' : 'text-indigo-400'
                  }`}>{alert.level} — {alert.category}</span>
                  <p className="leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
