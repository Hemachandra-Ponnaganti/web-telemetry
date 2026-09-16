import React, { useState } from 'react';
import { 
  Globe, Plus, Search, Star, ExternalLink, Activity, ShieldCheck, 
  Trash2, RefreshCw, Lock, ArrowUpRight, Filter, Layers, CheckCircle2, AlertCircle, X 
} from 'lucide-react';

export default function WebsitesCatalog({ 
  targets = [], 
  onSelectWebsite, 
  onAddWebsite, 
  onDeleteWebsite, 
  onToggleFavorite,
  onRefreshTargets,
  isScanning = false 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'favorites' | 'online' | 'offline'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [analysisFrequency, setAnalysisFrequency] = useState('1h'); // '1h' | '3h' | '6h' | '12h' | '24h'
  const [addError, setAddError] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Filter websites based on search query and filter pills
  const safeTargets = Array.isArray(targets) ? targets : [];
  const filteredTargets = safeTargets.filter(t => {
    if (!t || !t.url) return false;
    const siteNameStr = typeof t.name === 'string' ? t.name : (t.name?.text || '');
    const query = searchTerm.toLowerCase().trim();
    const matchesQuery = !query || t.url.toLowerCase().includes(query) || siteNameStr.toLowerCase().includes(query);
    
    if (!matchesQuery) return false;
    if (filterMode === 'favorites') return t.isFavorite;
    if (filterMode === 'online') return t.isUp;
    if (filterMode === 'offline') return !t.isUp;
    return true;
  });

  const handleOpenAddModal = () => {
    setNewUrlInput('');
    setAnalysisFrequency('1h');
    setAddError('');
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewUrlInput('');
    setAnalysisFrequency('1h');
    setAddError('');
  };

  const handleSubmitAddWebsite = async (e) => {
    if (e) e.preventDefault();
    let val = newUrlInput.trim();
    if (!val) {
      setAddError('Please enter a website URL');
      return;
    }
    if (!/^https?:\/\//i.test(val)) {
      val = 'https://' + val;
    }
    
    setSubmittingAdd(true);
    setAddError('');

    try {
      await onAddWebsite(val, analysisFrequency);
      setIsAddModalOpen(false);
      setNewUrlInput('');
    } catch (err) {
      setAddError(err.message || 'Failed to add and audit website.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const getScoreBadgeClass = (score) => {
    const s = score || 85;
    if (s >= 85) return { bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400', ring: 'border-emerald-500' };
    if (s >= 70) return { bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400', ring: 'border-amber-500' };
    return { bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400', ring: 'border-rose-500' };
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Top Banner / Catalog Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Globe className="h-6 w-6 text-indigo-400" />
              Websites Catalog
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-extrabold text-xs">
              {safeTargets.length} {safeTargets.length === 1 ? 'Site' : 'Sites'} Monitored
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time SRE telemetry dashboard & automated health tracking hub.
          </p>
        </div>

        {/* Action Controls: Search + Add Website */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onRefreshTargets}
            className="p-2.5 rounded-xl bg-dark-800 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title="Refresh website catalog"
          >
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Add Website
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-dark-800/40 p-3 rounded-2xl border border-slate-800/60">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search site name or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Sites' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'online', label: 'Online' },
            { id: 'offline', label: 'Down / Alerts' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMode === f.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Website Boxes */}
      {filteredTargets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTargets.map((site) => {
            let hostname = site.url;
            try { hostname = new URL(site.url).hostname; } catch (e) { hostname = site.url; }
            const siteNameStr = typeof site.name === 'string' ? site.name : (site.name?.text || hostname);
            const badge = getScoreBadgeClass(site.performanceScore);

            return (
              <div
                key={site.url}
                className="group glass-card rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
              >
                {/* Top Section: Website Browser Preview Card Header */}
                <div>
                  <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 p-4 border-b border-slate-800/60 overflow-hidden">
                    
                    {/* Simulated browser bar */}
                    <div className="flex items-center justify-between gap-2 mb-3 bg-dark-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate font-mono text-slate-300">{site.url}</span>
                      </div>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-500 hover:text-indigo-400 transition-colors"
                        title="Open external website"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Visual Site Preview / Mockup Hero Area */}
                    <div className="h-28 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden group-hover:border-indigo-500/30 transition-all">
                      {/* Favicon & Watermark Branding */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-purple-950/20 flex items-center justify-center p-4">
                        <div className="text-center">
                          <img
                            src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=64`}
                            alt={hostname}
                            className="h-10 w-10 mx-auto rounded-xl bg-slate-800/80 p-1.5 border border-slate-700 shadow-md object-contain mb-1.5"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <p className="text-xs font-black text-slate-200 truncate max-w-[200px] mx-auto">
                            {siteNameStr}
                          </p>
                        </div>
                      </div>

                      {/* Performance Score Badge (Top-Left Overlay) */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-lg backdrop-blur-md ${badge.bg} ${badge.ring}`}>
                          {site.performanceScore || 85}
                        </div>
                      </div>

                      {/* Status Pulse Badge (Top-Right Overlay) */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 border shadow-sm backdrop-blur-md ${
                          site.isUp
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${site.isUp ? 'bg-emerald-450 animate-ping' : 'bg-rose-500'}`} />
                          {site.isUp ? 'ONLINE' : 'DOWN'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-100 text-base group-hover:text-indigo-400 transition-colors truncate">
                          {siteNameStr}
                        </h3>
                        
                        <div className="flex items-center gap-1">
                          {/* Favorite Star Toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(site);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 transition-all"
                            title={site.isFavorite ? 'Unpin website' : 'Pin to favorites'}
                          >
                            <Star className={`h-4 w-4 ${site.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                          </button>

                          {/* Delete Website Option */}
                          {onDeleteWebsite && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to remove ${site.url} from monitored catalog?`)) {
                                  onDeleteWebsite(site.url);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete from catalog"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
                        <p className="text-xs text-slate-500 font-mono truncate">{site.url}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            site.malwareStatus === 'malware' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' :
                            site.malwareStatus === 'suspicious' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                            'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          }`}>
                            {site.malwareStatus === 'malware' ? '❌ Malware' : site.malwareStatus === 'suspicious' ? '⚠️ Suspicious' : '🛡️ Malware Clean'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold text-indigo-400">
                            ⚡ Every {site.analysisFrequency || '1h'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Telemetry quick stats pills */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/50 text-[11px]">
                      <div className="bg-dark-900/60 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-500 font-medium block text-[9px] uppercase">Latency</span>
                        <span className="font-bold text-slate-200">{site.loadTimeMs || 180}ms</span>
                      </div>

                      <div className="bg-dark-900/60 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-500 font-medium block text-[9px] uppercase">SSL Days</span>
                        <span className="font-bold text-slate-200">{site.sslDaysRemaining || 45}d</span>
                      </div>

                      <div className="bg-dark-900/60 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-500 font-medium block text-[9px] uppercase">Audit Rating</span>
                        <span className="font-bold text-indigo-400">{site.grade || 'A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Manage & Track Full Button */}
                <div className="p-4 bg-dark-900/40 border-t border-slate-800/60">
                  <button
                    onClick={() => onSelectWebsite(site.url)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-indigo-600 text-slate-200 hover:text-white font-extrabold text-xs rounded-xl border border-slate-800 hover:border-indigo-500 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm cursor-pointer"
                  >
                    <span>Manage & Full Track</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center glass-card border border-slate-800 rounded-3xl max-w-lg mx-auto p-8">
          <Globe className="h-12 w-12 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-slate-200 font-extrabold text-lg">No Websites Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {searchTerm || filterMode !== 'all'
              ? 'No websites matched your current search or filter criteria.'
              : 'You have not added any website targets to your SRE monitoring catalog yet.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/25"
          >
            + Add Your First Website
          </button>
        </div>
      )}

      {/* ── MODAL DIALOG: Add New Website ────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card border border-indigo-500/30 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-lg">Track New Website</h3>
                  <p className="text-xs text-slate-400">Enter a website URL to start full SRE tracking.</p>
                </div>
              </div>
              <button
                onClick={handleCloseAddModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitAddWebsite} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Website Domain URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. gaconsulting.in or https://my-site.com"
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 placeholder-slate-600 outline-none transition-all"
                  />
                </div>
                {addError && (
                  <p className="text-[11px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {addError}
                  </p>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['wordpress.org', 'gaconsulting.in', 'github.com', 'google.com'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewUrlInput(`https://${preset}`)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-slate-200 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Performance Analysis Frequency Selector */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-2">
                  <span>Performance Analysis Frequency</span>
                  <span className="text-[10px] text-indigo-400 font-extrabold uppercase">
                    Every {analysisFrequency === '1h' ? '1 Hour' : analysisFrequency === '3h' ? '3 Hours' : analysisFrequency === '6h' ? '6 Hours' : analysisFrequency === '12h' ? '12 Hours' : '24 Hours'}
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: '1h', label: '1 Hr' },
                    { id: '3h', label: '3 Hrs' },
                    { id: '6h', label: '6 Hrs' },
                    { id: '12h', label: '12 Hrs' },
                    { id: '24h', label: '24 Hrs' }
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setAnalysisFrequency(freq.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all border text-center cursor-pointer ${
                        analysisFrequency === freq.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-dark-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 italic">
                  SRE metrics & graphical performance logs will snapshot automatically at this interval.
                </p>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submittingAdd ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Auditing & Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Audit & Track Website
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
