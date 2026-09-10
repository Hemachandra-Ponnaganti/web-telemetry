import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  Image as ImageIcon, 
  Zap, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ExternalLink, 
  X, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Search, 
  Check,
  TrendingDown,
  Gauge
} from 'lucide-react';

/**
 * Format bytes to readable string
 */
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  const kb = bytes / 1024;
  if (kb < 1) {
    const rounded = parseFloat(kb.toFixed(2));
    return (rounded > 0 ? rounded : 0.01) + ' KB';
  }
  if (kb < 1024) {
    return parseFloat(kb.toFixed(1)) + ' KB';
  } else {
    const mb = kb / 1024;
    return parseFloat(mb.toFixed(1)) + ' MB';
  }
};

/**
 * Clean up filename for display
 */
const getFileName = (url) => {
  if (!url) return 'unknown-image';
  try {
    const parts = url.split('/');
    const file = parts[parts.length - 1];
    return file.split('?')[0] || 'image';
  } catch (e) {
    return 'image';
  }
};

/**
 * Calculate compression estimate (TinyPNG-style) based on format and actual file size.
 * Returns reduction percentage (0–100).
 */
const getCompressionEstimate = (formatName, sizeBytes) => {
  const fmt = (formatName || '').toLowerCase();
  // PNG: 40–80% reduction via WebP conversion
  if (fmt === 'png') {
    return Math.min(80, 40 + Math.round((sizeBytes / (1024 * 1024)) * 40));
  }
  // JPEG/JPG: 20–70% reduction via compression
  if (fmt === 'jpg' || fmt === 'jpeg') {
    return Math.min(70, 20 + Math.round((sizeBytes / (1024 * 1024)) * 50));
  }
  // GIF: 50–90% reduction via WebP/MP4 conversion
  if (fmt === 'gif') {
    return Math.min(90, 50 + Math.round((sizeBytes / (2 * 1024 * 1024)) * 40));
  }
  // WebP: already modern, minimal savings ~5%
  if (fmt === 'webp') return 5;
  // AVIF: already optimized
  if (fmt === 'avif') return 0;
  // SVG: minification only, 5–30%
  if (fmt === 'svg') {
    return Math.min(30, 5 + Math.round((sizeBytes / (100 * 1024)) * 25));
  }
  // Default: 10%
  return 10;
};

export default function ImageOptimizationAnalyzer({ stats, crawlData, url, isDark }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewDimensions, setPreviewDimensions] = useState(null);
  const [previewError, setPreviewError] = useState(false);

  // Real image size states
  const [imageSizesMap, setImageSizesMap] = useState({});
  const [loadingSizes, setLoadingSizes] = useState(false);

  useEffect(() => {
    setPreviewDimensions(null);
    setPreviewError(false);
  }, [selectedImage]);

  // 1. Resolve Target URL — only use a fully-resolved URL from stats or a valid absolute URL prop.
  // Never derive from a partial search-box input (e.g. "google" typed mid-edit).
  const targetUrl = useMemo(() => {
    // Prefer URL embedded in scan results (authoritative)
    const raw = stats?.url || stats?.latestStatus?.url || url || '';
    if (!raw) return 'https://example.com';
    let resolved = raw.trim();
    if (!/^https?:\/\//i.test(resolved)) {
      resolved = 'https://' + resolved;
    }
    // Validate the resolved URL is actually parseable before using it as a base
    try {
      new URL(resolved);
      return resolved;
    } catch (e) {
      return 'https://example.com';
    }
  }, [stats?.url, stats?.latestStatus?.url, url]);

  // Extract unique image URLs to retrieve real sizes for
  const rawImageUrls = useMemo(() => {
    const urls = [];
    const seen = new Set();
    const addUrl = (src) => {
      if (!src || src.startsWith('data:') || seen.has(src)) return;
      let absoluteSrc = src;
      if (!/^https?:\/\//i.test(src)) {
        try {
          absoluteSrc = new URL(src, targetUrl).href;
        } catch (e) {
          absoluteSrc = `${targetUrl.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
        }
      }
      if (seen.has(absoluteSrc)) return;
      seen.add(absoluteSrc);
      urls.push(absoluteSrc);
    };

    // Gather from crawlData if available
    if (crawlData?.siteWideImages?.missingAltImages) {
      crawlData.siteWideImages.missingAltImages.forEach(img => addUrl(img.src));
    }

    // Gather from seoData imageAnalysis
    if (stats?.seoData?.imageAnalysis?.missingAltSrcs) {
      stats.seoData.imageAnalysis.missingAltSrcs.forEach(img => {
        const srcUrl = typeof img === 'string' ? img : img?.src;
        addUrl(srcUrl);
      });
    }

    // Also gather from seoData all image srcs (not just missing-alt)
    if (stats?.seoData?.imageAnalysis?.allImageSrcs) {
      stats.seoData.imageAnalysis.allImageSrcs.forEach(src => {
        const srcUrl = typeof src === 'string' ? src : src?.src;
        addUrl(srcUrl);
      });
    }

    return urls;
  }, [crawlData, stats, targetUrl]);

  // Fetch actual metadata from backend proxy
  useEffect(() => {
    if (rawImageUrls.length === 0) {
      setImageSizesMap({});
      setLoadingSizes(false);
      return;
    }

    let isMounted = true;

    const fetchSizes = async () => {
      setLoadingSizes(true);

      // Mark all URLs as pending
      const initialMap = {};
      rawImageUrls.forEach(u => {
        initialMap[u] = { isValid: false, status: 'pending' };
      });
      if (isMounted) setImageSizesMap(initialMap);

      // ── Send in batches of 5 to avoid overwhelming the server ──
      const BATCH = 5;
      for (let i = 0; i < rawImageUrls.length; i += BATCH) {
        if (!isMounted) break;
        const batch = rawImageUrls.slice(i, i + BATCH);

        await Promise.allSettled(
          batch.map(async (imgUrl) => {
            let lastError = null;
            for (let attempt = 1; attempt <= 2; attempt++) {
              try {
                console.log(`[IMG FRONTEND] Attempt ${attempt} — POST /api/image-metadata for: ${imgUrl}`);
                const t0 = Date.now();

                const response = await axios.post(
                  '/api/image-metadata',
                  { urls: [imgUrl], baseUrl: targetUrl },
                  { timeout: 25000 }
                );

                const elapsed = Date.now() - t0;
                console.log(`[IMG FRONTEND] Response in ${elapsed}ms — HTTP ${response.status} for: ${imgUrl}`);

                if (!isMounted) return;

                const httpStatus = response.status;

                if ((httpStatus === 502 || httpStatus === 503 || httpStatus === 504) && attempt < 2) {
                  console.log(`[IMG FRONTEND] Proxy error ${httpStatus} — retrying in 3s...`);
                  await new Promise(r => setTimeout(r, 3000));
                  continue;
                }

                const res = response.data?.results?.[0];
                if (response.data?.success && res) {
                  const valid = res.isValid || (res.actualFileSize > 0 && !res.errorReason);
                  console.log(`[IMG FRONTEND] Result — valid:${valid} size:${res.actualFileSize} format:${res.format} err:${res.errorReason} for: ${imgUrl}`);
                  setImageSizesMap(prev => ({
                    ...prev,
                    [imgUrl]: {
                      contentLength:  res.contentLength,
                      actualFileSize: res.actualFileSize,
                      format:         res.format,
                      success:        valid,
                      isValid:        valid,
                      httpStatus:     res.httpStatus,
                      errorReason:    valid ? null : res.errorReason,
                      status:         valid ? 'success' : 'failed'
                    }
                  }));
                } else {
                  const reason =
                    httpStatus === 502 || httpStatus === 504 ? 'Server Unavailable (cold start)' :
                    httpStatus === 503                       ? 'Service Unavailable' :
                    response.data?.error                    ? response.data.error :
                    'No data returned';
                  console.warn(`[IMG FRONTEND] No result data — reason: ${reason} for: ${imgUrl}`);
                  setImageSizesMap(prev => ({
                    ...prev,
                    [imgUrl]: { isValid: false, status: 'failed', errorReason: reason }
                  }));
                }
                return;
              } catch (err) {
                lastError = err;
                console.error(`[IMG FRONTEND] Catch attempt ${attempt} — ${err.code || err.message} status:${err.response?.status} for: ${imgUrl}`);

                const isGatewayErr =
                  err.response?.status === 502 ||
                  err.response?.status === 503 ||
                  err.response?.status === 504 ||
                  err.code === 'ECONNABORTED';

                if (isGatewayErr && attempt < 2) {
                  console.log(`[IMG FRONTEND] Gateway error — retrying in 3s...`);
                  await new Promise(r => setTimeout(r, 3000));
                  continue;
                }
                break;
              }
            }

            if (!isMounted) return;
            const status = lastError?.response?.status;
            const reason =
              status === 404                                               ? '404 Not Found' :
              status === 403 || status === 401                            ? 'Access Denied' :
              status === 502 || status === 504                            ? 'Server Unavailable' :
              status === 503                                              ? 'Service Unavailable' :
              lastError?.code === 'ECONNABORTED'                          ? 'Request Timeout' :
              lastError?.message?.includes('Network Error')               ? 'Network Error' :
              lastError                                                   ? 'Access Denied' :
              'Unknown Error';

            console.error(`[IMG FRONTEND] All attempts failed — final reason: ${reason} for: ${imgUrl}`);
            setImageSizesMap(prev => ({
              ...prev,
              [imgUrl]: { isValid: false, status: 'failed', errorReason: reason }
            }));
          })
        );
      }

      if (isMounted) setLoadingSizes(false);
    };

    fetchSizes();
    return () => { isMounted = false; };
  }, [rawImageUrls, targetUrl]);

  // 2. Build and Enrich Image List
  const images = useMemo(() => {
    const rawImages = [];
    const seenSrcs = new Set();

    // Helper to add image safely
    const addImage = (src, pageUrl, altStatus, isLazy) => {
      if (!src || src.startsWith('data:') || seenSrcs.has(src)) return;
      let absoluteSrc = src;
      if (!/^https?:\/\//i.test(src)) {
        try {
          absoluteSrc = new URL(src, targetUrl).href;
        } catch (e) {
          absoluteSrc = `${targetUrl.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
        }
      }
      if (seenSrcs.has(absoluteSrc)) return;
      seenSrcs.add(absoluteSrc);
      rawImages.push({
        src: absoluteSrc,
        pageUrl: pageUrl || targetUrl,
        altStatus: altStatus || 'ok',
        isLazy: !!isLazy
      });
    };

    // Gather from crawlData if available
    if (crawlData?.siteWideImages?.missingAltImages) {
      crawlData.siteWideImages.missingAltImages.forEach(img => {
        addImage(img.src, img.foundOnPage || img.appearsOnPages?.[0], img.altStatus, img.isLazyLoaded);
      });
    }

    // Gather from seoData imageAnalysis
    if (stats?.seoData?.imageAnalysis?.missingAltSrcs) {
      stats.seoData.imageAnalysis.missingAltSrcs.forEach(img => {
        const srcUrl = typeof img === 'string' ? img : img?.src;
        addImage(srcUrl, targetUrl, 'missing', false);
      });
    }

    // Also gather from seoData all image srcs (not just missing-alt)
    if (stats?.seoData?.imageAnalysis?.allImageSrcs) {
      stats.seoData.imageAnalysis.allImageSrcs.forEach(src => {
        const srcUrl = typeof src === 'string' ? src : src?.src;
        addImage(srcUrl, targetUrl, 'ok', false);
      });
    }

    // Enrich with sizes and metadata
    return rawImages.map(img => {
      const name = getFileName(img.src);
      const ext = name.split('.').pop()?.toLowerCase() || 'png';

      // Look up real sizes and backend-detected format
      const sizeInfo = imageSizesMap[img.src];
      const isPending = sizeInfo ? sizeInfo.status === 'pending' : true;
      const isBroken = sizeInfo ? (!sizeInfo.isValid && sizeInfo.status !== 'pending') : false;
      const brokenReason = sizeInfo ? sizeInfo.errorReason : null;

      const originalSize = (sizeInfo && sizeInfo.isValid) ? sizeInfo.actualFileSize : 0;
      const detectedFormat = (sizeInfo && sizeInfo.isValid) ? (sizeInfo.format || ext) : ext;

      let compressionEstimateVal = 0;
      let optimizedSize = 0;
      let potentialSaving = 0;
      let savingsPct = 0;

      if (!isBroken && !isPending) {
        // Format and size dependent compression estimate (TinyPNG simulation)
        compressionEstimateVal = getCompressionEstimate(detectedFormat, originalSize);

        // Determine optimized size and savings percentage based on actual size
        optimizedSize = Math.round(originalSize * (1 - compressionEstimateVal / 100));

        // Validation Rules
        if (optimizedSize > originalSize) {
          optimizedSize = originalSize;
        }
        if (optimizedSize < 0) {
          optimizedSize = 0;
        }

        potentialSaving = originalSize - optimizedSize;
        if (potentialSaving > originalSize) {
          potentialSaving = originalSize;
        }
        if (potentialSaving < 0) {
          potentialSaving = 0;
        }

        savingsPct = originalSize > 0 
          ? Math.round((potentialSaving / originalSize) * 100) 
          : 0;

        if (savingsPct < 0) savingsPct = 0;
        if (savingsPct > 100) savingsPct = 100;
      }

      // Temporary Console Logs for Debugging
      if (sizeInfo && sizeInfo.status !== 'pending') {
        console.log(`[FRONTEND DEBUG] Image URL: ${img.src}`);
        console.log(`[FRONTEND DEBUG] HTTP Status: ${sizeInfo.httpStatus || 'N/A'}`);
        console.log(`[FRONTEND DEBUG] Content-Type: ${sizeInfo.format || 'N/A'}`);
        console.log(`[FRONTEND DEBUG] Content-Length: ${sizeInfo.contentLength || 'N/A'}`);
        console.log(`[FRONTEND DEBUG] Downloaded Bytes: ${sizeInfo.actualFileSize || 'N/A'}`);
        console.log(`[FRONTEND DEBUG] Calculated Original Size: ${originalSize}`);
        console.log(`[FRONTEND DEBUG] Calculated Recommended Size: ${isBroken ? 'N/A' : optimizedSize}`);
        console.log(`[FRONTEND DEBUG] Calculated Savings: ${isBroken ? 'N/A' : `${potentialSaving} (${savingsPct}%)`}`);
      }

      // Determine severity
      let severity = 'green';
      if (!isBroken && !isPending) {
        if (potentialSaving > 400 * 1024 || (originalSize > 500 * 1024 && savingsPct > 50)) {
          severity = 'red';
        } else if (potentialSaving > 80 * 1024 || savingsPct > 15) {
          severity = 'yellow';
        }
      }

      // Generate recommendation checklists
      const recs = [];
      if (!isBroken && !isPending) {
        if (detectedFormat === 'png') recs.push('Convert PNG to WebP');
        if (detectedFormat === 'jpg' || detectedFormat === 'jpeg') recs.push('Compress JPEG');
        if (detectedFormat === 'gif') recs.push('Replace animated GIF with WebP/video');
        if (originalSize > 800 * 1024) recs.push('Resize oversized images');
        if (!img.isLazy) recs.push('Enable Lazy Loading');
        recs.push('Add Width and Height attributes');
        if (originalSize > 300 * 1024) recs.push('Serve responsive images');
      }

      return {
        ...img,
        name,
        ext: detectedFormat.toUpperCase(),
        originalSize,
        optimizedSize,
        potentialSaving,
        savingsPct,
        severity,
        recs,
        isBroken,
        isPending,
        brokenReason,
        // Debug information
        imageUrl: img.src,
        contentLength: sizeInfo ? sizeInfo.contentLength : null,
        actualFileSize: originalSize,
        compressionEstimate: `${compressionEstimateVal}%`,
        finalRecommendedSize: optimizedSize
      };
    });
  }, [crawlData, stats, targetUrl, imageSizesMap]);

  // 3. Compute Summary Statistics
  const summary = useMemo(() => {
    let totalOriginal = 0;
    let totalOptimized = 0;
    let pendingCount = 0;
    
    images.forEach(img => {
      if (img.isPending) {
        pendingCount++;
      } else if (!img.isBroken) {
        totalOriginal += img.originalSize;
        totalOptimized += img.optimizedSize;
      }
    });

    const totalSavings = totalOriginal - totalOptimized;
    const savingsPercentage = totalOriginal > 0 ? Math.round((totalSavings / totalOriginal) * 100) : 0;

    // Simulated Page Load Speeds
    // Baseline speed derived from stats loading speed, or defaulting to 2.6s
    const actualLoadTimeMs = stats?.latestStatus?.loadTimeMs || 0;
    const originalSpeed = actualLoadTimeMs > 0 ? parseFloat((actualLoadTimeMs / 1000).toFixed(2)) : 2.6;
    
    // Improvement factor depends on savings percentage (capping improvement at 60% of original speed)
    const speedImprovement = parseFloat((originalSpeed * (savingsPercentage / 100) * 0.55).toFixed(2));
    const optimizedSpeed = parseFloat(Math.max(0.6, originalSpeed - speedImprovement).toFixed(2));
    const speedImprovementPct = Math.round(((originalSpeed - optimizedSpeed) / originalSpeed) * 100);

    return {
      totalImages: images.length,
      pendingCount,
      totalOriginal,
      totalOptimized,
      totalSavings,
      savingsPercentage,
      originalSpeed,
      optimizedSpeed,
      speedImprovement,
      speedImprovementPct
    };
  }, [images, stats]);

  // 4. Compute Filtered Images
  const filteredImages = useMemo(() => {
    return images.filter(img => {
      const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase()) || img.src.toLowerCase().includes(searchTerm.toLowerCase());
      
      const format = img.ext.toLowerCase();
      let matchesFormat = true;
      if (formatFilter !== 'all') {
        if (formatFilter === 'jpg') {
          matchesFormat = format === 'jpg' || format === 'jpeg';
        } else {
          matchesFormat = format === formatFilter;
        }
      }

      let matchesSeverity = true;
      if (severityFilter !== 'all') {
        matchesSeverity = img.severity === severityFilter;
      }

      return matchesSearch && matchesFormat && matchesSeverity;
    });
  }, [images, searchTerm, formatFilter, severityFilter]);

  // 5. Chart Data Prep
  const sizeDistributionData = useMemo(() => {
    let under100 = 0;
    let between100And500 = 0;
    let between500And1M = 0;
    let over1M = 0;

    images.forEach(img => {
      if (!img.isBroken) {
        const sizeKB = img.originalSize / 1024;
        if (sizeKB < 100) under100++;
        else if (sizeKB < 500) between100And500++;
        else if (sizeKB < 1024) between500And1M++;
        else over1M++;
      }
    });

    return [
      { range: '< 100KB', count: under100 },
      { range: '100-500KB', count: between100And500 },
      { range: '500KB-1MB', count: between500And1M },
      { range: '> 1MB', count: over1M },
    ];
  }, [images]);

  const savingsPieData = useMemo(() => {
    return [
      { name: 'Optimized Size', value: Math.round(summary.totalOptimized / 1024) },
      { name: 'Potential Savings', value: Math.round(summary.totalSavings / 1024) }
    ];
  }, [summary]);

  const formatDistributionData = useMemo(() => {
    const counts = {};
    images.forEach(img => {
      if (!img.isBroken) {
        let format = img.ext;
        if (format === 'JPEG') format = 'JPG';
        counts[format] = (counts[format] || 0) + 1;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [images]);

  const pageSpeedImpactData = useMemo(() => {
    return [
      { name: 'Original Load', Speed: summary.originalSpeed, fill: '#f87171' },
      { name: 'Optimized Load', Speed: summary.optimizedSpeed, fill: '#10b981' }
    ];
  }, [summary]);

  // Theme support colors
  const chartsTheme = {
    gridColor: isDark ? '#1f2937' : '#e2e8f0',
    textColor: isDark ? '#94a3b8' : '#475569',
    primaryColor: '#6366f1', // Indigo 500
    savingsColor: '#10b981', // Emerald 500
    unoptimizedColor: '#ef4444', // Red 500
    warningColor: '#f59e0b', // Amber 500
    pieColors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
  };

  // 6. Global Optimization Count Summary
  const globalRecCounts = useMemo(() => {
    let pngToWebp = 0;
    let jpegCompress = 0;
    let resize = 0;
    let lazy = 0;
    let responsive = 0;
    let dimensions = 0;

    images.forEach(img => {
      if (img.isBroken) return;
      dimensions++;
      if (img.ext === 'PNG') pngToWebp++;
      if (img.ext === 'JPG' || img.ext === 'JPEG') jpegCompress++;
      if (img.originalSize > 800 * 1024) resize++;
      if (!img.isLazy) lazy++;
      if (img.originalSize > 300 * 1024) responsive++;
    });

    return [
      { label: 'Convert PNG to WebP', count: pngToWebp, status: pngToWebp > 3 ? 'critical' : pngToWebp > 0 ? 'warning' : 'ok' },
      { label: 'Compress JPEG', count: jpegCompress, status: jpegCompress > 3 ? 'critical' : jpegCompress > 0 ? 'warning' : 'ok' },
      { label: 'Resize oversized images', count: resize, status: resize > 1 ? 'critical' : resize > 0 ? 'warning' : 'ok' },
      { label: 'Enable Lazy Loading', count: lazy, status: lazy > 5 ? 'critical' : lazy > 0 ? 'warning' : 'ok' },
      { label: 'Add Width and Height attributes', count: dimensions, status: dimensions > 5 ? 'warning' : 'ok' },
      { label: 'Serve responsive images', count: responsive, status: responsive > 2 ? 'warning' : 'ok' },
    ];
  }, [images]);

  if (loadingSizes && Object.keys(imageSizesMap).length === 0) {
    return (
      <div className="py-24 text-center glass-card p-6 rounded-2xl">
        <RefreshCw className="h-8 w-8 text-indigo-500 rotate-infinite mx-auto mb-4" />
        <h4 className="font-extrabold text-slate-300">Analyzing real image file sizes...</h4>
        <p className="text-xs text-slate-500 mt-1">Fetching real-time metadata and Content-Length headers via SRE proxy</p>
      </div>
    );
  }

  // Show empty state if no real images were discovered from crawl/SEO data
  if (images.length === 0) {
    return (
      <div className="py-24 text-center glass-card p-6 rounded-2xl">
        <ImageIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h4 className="font-extrabold text-slate-400">No Images Discovered</h4>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          No image URLs were found in the scan results for <span className="font-mono text-indigo-400">{targetUrl}</span>.
          Run a full site crawl or SEO scan to discover images on this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* ── TOP SUMMARY SECTION ────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ImageIcon className="w-40 h-40 text-indigo-500" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5 mb-6">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">IMAGE OPTIMIZATION INTELLIGENCE</span>
            <h2 className="text-xl font-extrabold text-slate-200 tracking-tight flex items-center gap-2">
              <span>Image Optimization Report</span>
              {summary.pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black tracking-widest animate-pulse">
                  <RefreshCw className="h-3 w-3 rotate-infinite" />
                  REAL-TIME MONITORING ({summary.totalImages - summary.pendingCount}/{summary.totalImages})
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  {targetUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/10">
            <Gauge className="h-5 w-5 text-indigo-400" />
            <div className="text-left">
              <span className="text-[9px] text-slate-450 block font-bold uppercase">Report Grade</span>
              <span className={`text-sm font-black ${summary.savingsPercentage > 50 ? 'text-rose-400' : summary.savingsPercentage > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {summary.savingsPercentage > 50 ? 'Grade F (Needs Compression)' : summary.savingsPercentage > 25 ? 'Grade C (Moderate Savings)' : 'Grade A (Highly Optimized)'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Grid Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-dark-900/10 border border-slate-800/40 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Images Discovered</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-250">{summary.totalImages}</span>
              <span className="text-[10px] text-slate-500 font-medium">assets</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-2 font-mono truncate">{targetUrl}</p>
          </div>

          <div className="bg-dark-900/10 border border-slate-800/40 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Original Weight</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-rose-400">
                {summary.pendingCount === summary.totalImages ? 'Calculating...' : `${formatBytes(summary.totalOriginal)}${summary.pendingCount > 0 ? ' (Probing...)' : ''}`}
              </span>
            </div>
            <p className="text-[9px] text-slate-550 mt-2">Combined raw payload size</p>
          </div>

          <div className="bg-dark-900/10 border border-slate-800/40 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Optimized Weight</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-400">
                {summary.pendingCount === summary.totalImages ? 'Calculating...' : `${formatBytes(summary.totalOptimized)}${summary.pendingCount > 0 ? ' (Probing...)' : ''}`}
              </span>
            </div>
            <p className="text-[9px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              <span>
                {summary.pendingCount === summary.totalImages 
                  ? 'Calculating...' 
                  : summary.totalSavings > 0 
                    ? `Save ${formatBytes(summary.totalSavings)}${summary.pendingCount > 0 ? '...' : ''}` 
                    : 'Optimized'}
              </span>
            </p>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Total Savings</span>
            <div className="mt-2">
              <span className="text-3xl font-black text-indigo-400 font-mono">
                {summary.pendingCount === summary.totalImages ? 'Calculating...' : `${summary.savingsPercentage}%${summary.pendingCount > 0 ? '...' : ''}`}
              </span>
            </div>
            <p className="text-[9px] text-indigo-400/80 font-bold mt-2">TinyPNG-style savings</p>
          </div>

        </div>

        {/* Page Speed Performance Comparison */}
        <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center font-bold text-emerald-400 shrink-0">
              ⚡
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-200">Page Load Speed Comparison</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Estimated timeline acceleration through image weight compression.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8 shrink-0">
            <div className="text-right">
              <span className="text-[9px] text-slate-500 font-bold block uppercase">Original Load Time</span>
              <span className="text-lg font-black text-rose-455 font-mono">{summary.originalSpeed}s</span>
            </div>
            <div className="text-center font-bold text-slate-600 text-xs">➔</div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 font-bold block uppercase">Optimized Load Time</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{summary.optimizedSpeed}s</span>
            </div>
            <div className="border-l border-slate-800/80 pl-6 text-right">
              <span className="text-[9px] text-indigo-400 font-bold block uppercase">Speed Improvement</span>
              <span className="text-sm font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-mono">
                {summary.speedImprovement}s ({summary.speedImprovementPct}% faster)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── CHARTS SECTION ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Image Size Distribution */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-slate-250 font-bold text-sm mb-4 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
            <ImageIcon className="h-4 w-4 text-indigo-400" />
            Image Size Distribution
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartsTheme.gridColor} opacity={0.3} />
                <XAxis dataKey="range" stroke={chartsTheme.textColor} fontSize={10} tickLine={false} />
                <YAxis stroke={chartsTheme.textColor} fontSize={10} tickLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: isDark ? '#090d16' : '#ffffff', borderColor: chartsTheme.gridColor, borderRadius: '8px', color: isDark ? '#cbd5e1' : '#1e293b' }}
                />
                <Bar dataKey="count" fill={chartsTheme.primaryColor} radius={[4, 4, 0, 0]}>
                  {sizeDistributionData.map((entry, index) => {
                    const colors = [chartsTheme.primaryColor, '#0ea5e9', chartsTheme.warningColor, chartsTheme.unoptimizedColor];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Optimization Savings Distribution */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <h3 className="text-slate-250 font-bold text-sm mb-4 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            Weight Savings Potential
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-7 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={savingsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={chartsTheme.primaryColor} />
                    <Cell fill={chartsTheme.savingsColor} />
                  </Pie>
                  <RechartsTooltip formatter={(value) => `${value} KB`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="sm:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full shrink-0 bg-indigo-500" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Optimized Payload</p>
                  <p className="text-base font-black text-slate-250">{formatBytes(summary.totalOptimized)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full shrink-0 bg-emerald-500" />
                <div>
                  <p className="text-[10px] text-slate-550 font-bold uppercase">Compressible Savings</p>
                  <p className="text-base font-black text-emerald-400">{formatBytes(summary.totalSavings)} ({summary.savingsPercentage}%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Image Format Distribution */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-slate-250 font-bold text-sm mb-4 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
            <ImageIcon className="h-4 w-4 text-cyan-400" />
            Image Format Distribution
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-7 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {formatDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartsTheme.pieColors[index % chartsTheme.pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="sm:col-span-5 grid grid-cols-2 gap-2 text-xs">
              {formatDistributionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: chartsTheme.pieColors[idx % chartsTheme.pieColors.length] }} />
                  <span className="font-bold text-slate-400">{item.name}:</span>
                  <span className="font-bold text-slate-200">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Page Speed Impact Chart */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-slate-250 font-bold text-sm mb-4 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
            <Gauge className="h-4 w-4 text-rose-400" />
            Page Speed Impact Timeline (seconds)
          </h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pageSpeedImpactData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartsTheme.gridColor} opacity={0.3} />
                <XAxis type="number" stroke={chartsTheme.textColor} fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke={chartsTheme.textColor} fontSize={10} tickLine={false} width={100} />
                <RechartsTooltip formatter={(value) => `${value} seconds`} />
                <Bar dataKey="Speed" radius={[0, 4, 4, 0]}>
                  {pageSpeedImpactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── OPTIMIZATION RECOMMENDATIONS ──────────────────────────────── */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-slate-200 font-extrabold text-base mb-4 flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <Zap className="text-indigo-400 h-5 w-5" /> Global Optimization Checklist Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {globalRecCounts.map((r, idx) => (
            <div key={idx} className={`flex items-start gap-3 p-3.5 bg-dark-800/20 border rounded-xl transition-all ${
              r.status === 'critical' ? 'border-rose-500/20 bg-rose-500/5' : 
              r.status === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
            }`}>
              <div className="mt-0.5 shrink-0">
                {r.status === 'critical' && <AlertCircle className="h-4 w-4 text-rose-400" />}
                {r.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                {r.status === 'ok' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{r.label}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {r.status === 'ok' ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-0.5">✓ Fully Applied</span>
                  ) : (
                    <span>Affects <strong className="text-indigo-400">{r.count}</strong> images</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── IMAGE ANALYSIS TABLE ──────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-2xl">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/60 pb-4 mb-6">
          <div>
            <h3 className="text-slate-200 font-extrabold text-base flex items-center gap-2">
              <ImageIcon className="text-indigo-400 h-5 w-5" /> Detailed Image Audit Report
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-750 font-bold">
                {filteredImages.length} images shown
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Click on any image row to see detailed recommendations and file previews.</p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-900/40 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Format Filter */}
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="bg-dark-900/40 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-pointer focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Formats</option>
              <option value="jpg">JPG / JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
              <option value="svg">SVG</option>
              <option value="gif">GIF</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-dark-900/40 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-pointer focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Severities</option>
              <option value="red">🔴 Unoptimized (Critical)</option>
              <option value="yellow">🟡 Needs Improvement</option>
              <option value="green">🟢 Optimized (OK)</option>
            </select>
          </div>
        </div>

        {/* Responsive Table wrapper */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur">
              <tr className="border-b border-slate-800 text-slate-450 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Image Name</th>
                <th className="py-3 px-4">Original Size</th>
                <th className="py-3 px-4">Optimized Size</th>
                <th className="py-3 px-4">Potential Saving</th>
                <th className="py-3 px-4 text-right">Saving %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredImages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-bold">
                    No images match the current filters.
                  </td>
                </tr>
              ) : (
                filteredImages.map((img, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedImage(img)}
                    className="group border-b border-slate-800/30 hover:bg-indigo-500/[0.02] cursor-pointer transition-all duration-150"
                  >
                    {/* Severity Dot */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          img.isPending ? 'bg-indigo-550 animate-pulse' :
                          img.isBroken ? 'bg-slate-500' :
                          img.severity === 'red' ? 'bg-rose-500' : 
                          img.severity === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                      </span>
                    </td>

                    {/* Image Name / Info */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">
                        {img.name}
                      </div>
                      {!img.isPending && img.isBroken && (
                        <div className="text-[10px] text-rose-400 font-bold mt-0.5 flex items-center gap-1">
                          <span>⚠️ Broken Image: {img.brokenReason || 'Invalid URL'}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                        {img.src}
                      </div>
                      <div className="text-[9px] text-slate-600 font-mono truncate mt-0.5 flex items-center gap-1">
                        <span>📄 On:</span>
                        <span className="underline">{img.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                      </div>
                    </td>

                    {/* Original Size */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-350 whitespace-nowrap">
                      {img.isPending ? (
                        <span className="text-[10px] text-indigo-400/80 font-bold flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 rotate-infinite shrink-0" />
                          Monitoring...
                        </span>
                      ) : img.isBroken ? '—' : formatBytes(img.originalSize)}
                    </td>

                    {/* Optimized Size */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400/90 whitespace-nowrap">
                      {img.isPending ? (
                        <span className="text-[10px] text-slate-550 italic">Pending</span>
                      ) : img.isBroken ? '—' : formatBytes(img.optimizedSize)}
                    </td>

                    {/* Potential Savings */}
                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      {img.isPending ? (
                        <span className="text-[10px] text-slate-550 italic">Pending</span>
                      ) : img.isBroken ? (
                        <span className="text-slate-500">—</span>
                      ) : img.potentialSaving > 0 ? (
                        <span className={img.severity === 'red' ? 'text-rose-400' : img.severity === 'yellow' ? 'text-amber-400' : 'text-slate-500'}>
                          {formatBytes(img.potentialSaving)}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Savings Percentage */}
                    <td className="py-3.5 px-4 text-right font-mono font-black whitespace-nowrap">
                      {img.isPending ? (
                        <span className="text-[10px] text-slate-550 italic">Pending</span>
                      ) : img.isBroken ? (
                        <span className="text-slate-500">—</span>
                      ) : img.savingsPct > 0 ? (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          img.severity === 'red' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          img.severity === 'yellow' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-800 text-slate-500 border border-slate-750'
                        }`}>
                          -{img.savingsPct}%
                        </span>
                      ) : (
                        <span className="text-slate-500">0%</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
      </div>

      {/* ── IMAGE DETAILS MODAL ──────────────────────────────────────── */}
      {selectedImage && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade">
          <div className="glass-card rounded-2xl w-full max-w-3xl mx-4 flex flex-col md:flex-row overflow-hidden relative border border-slate-850 shadow-2xl animate-scale-up">
            {/* Left: Preview Panel */}
            <div className="md:w-1/2 bg-slate-950/30 p-8 border-b md:border-b-0 md:border-r border-slate-800/60 flex flex-col justify-center items-center relative">
              <div className="absolute top-4 left-4">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                  selectedImage.isPending ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' :
                  selectedImage.isBroken ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                  selectedImage.severity === 'red' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                  selectedImage.severity === 'yellow' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {selectedImage.isPending ? 'Checking Metrics...' : selectedImage.isBroken ? `Broken Image: ${selectedImage.brokenReason || 'Invalid URL'}` : selectedImage.severity === 'red' ? 'Highly Unoptimized' : selectedImage.severity === 'yellow' ? 'Needs Improvement' : 'Optimized'}
                </span>
              </div>

              {/* Actual Image preview */}
              <div className="w-full max-h-60 flex items-center justify-center overflow-hidden rounded-xl border border-slate-800/40 p-4 bg-slate-900/40 shadow-inner mt-4">
                {!selectedImage.isPending && !selectedImage.isBroken && !previewError && (
                  <img 
                    src={selectedImage.src} 
                    alt={selectedImage.name} 
                    className="max-w-full max-h-48 object-contain rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
                    onLoad={(e) => {
                      setPreviewDimensions({
                        width: e.target.naturalWidth,
                        height: e.target.naturalHeight
                      });
                    }}
                    onError={() => {
                      setPreviewError(true);
                    }}
                  />
                )}
                
                {/* Fallback Display */}
                {(selectedImage.isPending || selectedImage.isBroken || previewError) && (
                  <div 
                    id="preview-fallback-box" 
                    className="flex flex-col items-center justify-center py-12 text-slate-600 gap-3"
                  >
                    {selectedImage.isPending ? (
                      <RefreshCw className="h-12 w-12 text-indigo-400/80 rotate-infinite" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-slate-750 animate-pulse" />
                    )}
                    <span className="text-[10px] text-slate-500 font-mono text-center truncate max-w-[200px]" title={selectedImage.src}>
                      {selectedImage.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {selectedImage.isPending ? 'Fetching headers...' : selectedImage.isBroken ? `Broken (${selectedImage.brokenReason})` : 'Preview unavailable'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 w-full flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono">Format: <strong className="text-slate-350">{selectedImage.isPending ? '—' : selectedImage.ext}</strong></span>
                {!selectedImage.isPending && !selectedImage.isBroken && previewDimensions && (
                  <span className="font-mono">Dimensions: <strong className="text-indigo-400">{previewDimensions.width} × {previewDimensions.height} px</strong></span>
                )}
                <span className="font-mono">Savings: <strong className="text-emerald-400">{selectedImage.isPending || selectedImage.isBroken ? '—' : `-${selectedImage.savingsPct}%`}</strong></span>
              </div>
            </div>

            {/* Right: Info & Recommendations Checklist */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* File Details */}
                <div>
                  <h4 className="text-base font-black text-slate-200 pr-8 truncate" title={selectedImage.name}>
                    {selectedImage.name}
                  </h4>
                  {selectedImage.isPending ? (
                    <div className="text-[10px] text-indigo-400 font-bold mt-1 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="h-3 w-3 rotate-infinite" />
                      <span>Request enqueued on SRE proxy...</span>
                    </div>
                  ) : selectedImage.isBroken ? (
                    <div className="space-y-1.5 mt-2">
                      <div className="text-xs font-bold text-rose-400">
                        Status: <span className="font-extrabold uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 ml-1">Failed</span>
                      </div>
                      <div className="text-xs font-bold text-slate-400">
                        Reason: <span className="font-mono text-rose-350 ml-1">{selectedImage.brokenReason || 'Access Denied'}</span>
                      </div>
                    </div>
                  ) : (
                    <a 
                      href={selectedImage.src} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline mt-1 inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <span>Open Image URL</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  )}
                </div>

                {/* Savings Metrics Info */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-dark-900/10 border border-slate-800/40 rounded-xl text-center">
                  <div className="text-left border-r border-slate-800/80 pr-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Original Size</span>
                    <span className="text-xs font-black text-rose-455 font-mono">
                      {selectedImage.isPending ? 'Checking...' : selectedImage.isBroken ? '—' : formatBytes(selectedImage.originalSize)}
                    </span>
                  </div>
                  <div className="text-left border-r border-slate-800/80 px-2">
                    <span className="text-[9px] text-slate-550 font-bold uppercase block">Recommended</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      {selectedImage.isPending ? 'Pending...' : selectedImage.isBroken ? '—' : formatBytes(selectedImage.optimizedSize)}
                    </span>
                  </div>
                  <div className="text-left pl-2">
                    <span className="text-[9px] text-indigo-450 font-bold uppercase block">Potential Saving</span>
                    <span className="text-xs font-black text-indigo-400 font-mono">
                      {selectedImage.isPending ? 'Pending...' : selectedImage.isBroken ? '—' : selectedImage.potentialSaving > 0 ? formatBytes(selectedImage.potentialSaving) : '—'}
                    </span>
                  </div>
                </div>

                {/* Checklist Recommendations details */}
                {selectedImage.isPending ? (
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0 rotate-infinite" />
                    <div>
                      <h5 className="text-xs font-bold text-indigo-400 font-mono">Audit Pending</h5>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Currently performing live file header probes and SSL verification. Real-time recommendation checklist will populate shortly.
                      </p>
                    </div>
                  </div>
                ) : !selectedImage.isBroken ? (
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Optimization Checklist</span>
                    
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {[
                        { 
                          title: 'Convert PNG to WebP', 
                          applies: selectedImage.ext === 'PNG', 
                          desc: 'Converts uncompressed PNG channels to highly efficient lossy WebP' 
                        },
                        { 
                          title: 'Compress JPEG', 
                          applies: selectedImage.ext === 'JPG' || selectedImage.ext === 'JPEG', 
                          desc: 'Reduces visual noise and metadata fields for smaller payloads' 
                        },
                        { 
                          title: 'Replace animated GIF with WebP/video', 
                          applies: selectedImage.ext === 'GIF', 
                          desc: 'Converts legacy GIF animation loops to modern WebP frames or HTML5 loops' 
                        },
                        { 
                          title: 'Resize oversized images', 
                          applies: selectedImage.originalSize > 800 * 1024, 
                          desc: 'Downscales resolution to fit exact CSS boundaries' 
                        },
                        { 
                          title: 'Enable Lazy Loading', 
                          applies: !selectedImage.isLazy, 
                          desc: 'Defers download of off-screen/below-fold images' 
                        },
                        { 
                          title: 'Add Width and Height attributes', 
                          applies: true, // recommendations for all by default
                          desc: 'Prevents Cumulative Layout Shift (CLS) on content render' 
                        },
                        { 
                          title: 'Serve responsive images', 
                          applies: selectedImage.originalSize > 300 * 1024, 
                          desc: 'Uses srcset/sizes queries to scale resolution down on mobile devices' 
                        }
                      ].map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2 bg-dark-800/10 border border-slate-800/30 rounded-lg">
                          <div className="mt-0.5 shrink-0">
                            {rec.applies ? (
                              <span className="flex h-3.5 w-3.5 bg-rose-500/10 rounded-full items-center justify-center text-[9px] text-rose-455 font-bold font-mono">
                                !
                              </span>
                            ) : (
                              <span className="flex h-3.5 w-3.5 bg-emerald-500/10 rounded-full items-center justify-center text-[9px] text-emerald-450 font-mono">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[10px] font-bold ${rec.applies ? 'text-rose-400' : 'text-slate-400'}`}>
                              {rec.title}
                            </p>
                            <p className="text-[9px] text-slate-550 leading-tight mt-0.5">{rec.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-rose-400">Broken Image Detected</h5>
                      <p className="text-[10px] text-slate-550 mt-1 leading-relaxed">
                        This image could not be loaded or retrieved. No optimization checklist or metrics are available. Please verify the URL structure or check if the image has been deleted from the origin server.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
                <div className="text-[9px] text-slate-550 font-mono truncate max-w-[150px]">
                  Page: {selectedImage.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  {!selectedImage.isBroken && (
                    <a 
                      href={selectedImage.src}
                      download
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Raw</span>
                    </a>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
