import React from 'react';
import { 
  Eye, CheckCircle2, XCircle, AlertTriangle, Layers, 
  Sparkles, Accessibility, Laptop, Smartphone 
} from 'lucide-react';

export default function AccessibilityAudit({ uiUxData, mobileFriendliness }) {
  if (!uiUxData) {
    return (
      <div className="glass-card p-10 text-center text-slate-500 max-w-2xl mx-auto my-6 animate-fade-in-up">
        <Accessibility className="h-10 w-10 text-slate-600 mx-auto mb-4 animate-bounce" />
        <h4 className="font-extrabold text-slate-400">No Accessibility Telemetry Audited</h4>
        <p className="text-xs text-slate-500 mt-2">Run a scan above to see real-time UI/UX accessibility audits and compliance alerts.</p>
      </div>
    );
  }

  const {
    uiHealthScore = 100,
    lowContrastViolations = [],
    missingLabelsViolations = [],
    emptyButtonsViolations = [],
    passedAudits = []
  } = uiUxData;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getGradientId = (score) => {
    if (score >= 90) return 'url(#accEmeraldGrad)';
    if (score >= 70) return 'url(#accAmberGrad)';
    return 'url(#accRoseGrad)';
  };

  const totalViolations = 
    lowContrastViolations.length + 
    missingLabelsViolations.length + 
    emptyButtonsViolations.length +
    (!mobileFriendliness?.viewportConfigured ? 1 : 0);

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      
      {/* Overview Accessibility Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Accessibility score Circular progress gauge */}
        <div className="col-span-12 md:col-span-4 glass-card p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider w-full text-left mb-4 flex items-center gap-2">
            <Accessibility className="h-4 w-4 text-emerald-400" />
            Accessibility Rating
          </h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="accEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="accAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="accRoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
              <circle cx="72" cy="72" r="62" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8"></circle>
              <circle
                cx="72"
                cy="72"
                r="62"
                fill="transparent"
                stroke={getGradientId(uiHealthScore)}
                strokeWidth="8"
                strokeDasharray={389.5}
                strokeDashoffset={389.5 - (389.5 * uiHealthScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-in-out"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl font-black tracking-tight ${getScoreColor(uiHealthScore)}`}>{uiHealthScore}%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">WCAG Compliance</span>
            </div>
          </div>
        </div>

        {/* Accessibility Probes and checklist */}
        <div className="col-span-12 md:col-span-8 glass-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-indigo-400" />
              WCAG Accessibility Pillars
            </span>
            
            <div className="space-y-3.5 mt-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Total Checked Violations:</span>
                <span className={`font-extrabold text-[11px] px-2 py-0.5 rounded-full ${totalViolations === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400 animate-pulse'}`}>
                  {totalViolations} {totalViolations === 1 ? 'Anomaly' : 'Anomalies'} Detected
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Low Contrast Ratio Elements:</span>
                <span className={`font-bold ${lowContrastViolations.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {lowContrastViolations.length} {lowContrastViolations.length === 1 ? 'anomaly' : 'anomalies'} detected
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Empty Button Elements:</span>
                <span className={`font-bold ${emptyButtonsViolations.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {emptyButtonsViolations.length} {emptyButtonsViolations.length === 1 ? 'anomaly' : 'anomalies'} detected
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Unbound Form Input Labels:</span>
                <span className={`font-bold ${missingLabelsViolations.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {missingLabelsViolations.length} {missingLabelsViolations.length === 1 ? 'anomaly' : 'anomalies'} detected
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic mt-4 border-t border-slate-800/40 pt-3">
            * Scans evaluate element background-color contrasts, active ARIA descriptions, and form tag attributes.
          </p>
        </div>

      </div>

      {/* WCAG Compliance Audits detail boards */}
      <div className="glass-card p-6 space-y-6">
        
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-slate-200 font-extrabold text-lg flex items-center gap-2">
              <Eye className="text-emerald-400 h-5 w-5" />
              UI/UX Visual Accessibility Audits & Detection Details
            </h3>
            <p className="text-xs text-slate-500 mt-1">Verifying exact element location, WCAG contrast ratios, input element bindings, and interactive button nodes.</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Contrast warnings */}
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px] mb-3">Contrast Ratio Violations</span>
            {lowContrastViolations.length === 0 ? (
              <div className="p-5 border border-dashed border-slate-800 text-center text-slate-500 text-xs rounded-xl flex items-center justify-center gap-2 bg-dark-900/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                No low contrast anomalies detected on this website. Contrast ratios satisfy WCAG AAA standards (&gt;4.5:1).
              </div>
            ) : (
              <div className="space-y-3.5">
                {lowContrastViolations.map((v, i) => (
                  <div key={i} className="p-4 bg-dark-850/60 border-l-4 border-l-amber-500 border border-slate-800/80 rounded-xl space-y-2.5 text-xs hover:border-slate-700 transition-all shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="text-amber-500 h-5 w-5 shrink-0" />
                        <code className="text-amber-300 font-mono text-[10px] bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60 inline-block">{v.element}</code>
                      </div>
                      {v.pageRegion && (
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          📍 {v.pageRegion}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 font-semibold">{v.message}</p>
                    
                    {v.cssSelector && (
                      <div className="text-[10px] font-mono text-slate-300 bg-slate-950/90 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 font-sans block text-[9px] mb-0.5 font-bold uppercase tracking-wider">🎯 CSS Selector Path:</span>
                        <code>{v.cssSelector}</code>
                      </div>
                    )}

                    {v.howToLocate && (
                      <div className="text-[10px] text-amber-300/90 bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/40 leading-relaxed flex items-start gap-2">
                        <span className="font-bold shrink-0">💡 How to check:</span>
                        <span>{v.howToLocate}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input ARIA Labels warnings */}
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px] mb-3">Input Label Binding Warnings</span>
            {missingLabelsViolations.length === 0 ? (
              <div className="p-5 border border-dashed border-slate-800 text-center text-slate-500 text-xs rounded-xl flex items-center justify-center gap-2 bg-dark-900/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                All form input elements are successfully bound to corresponding label fields.
              </div>
            ) : (
              <div className="space-y-3.5">
                {missingLabelsViolations.map((v, i) => (
                  <div key={i} className="p-4 bg-dark-850/60 border-l-4 border-l-rose-500 border border-slate-800/80 rounded-xl space-y-2.5 text-xs hover:border-slate-700 transition-all shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="text-rose-400 h-5 w-5 shrink-0" />
                        <code className="text-rose-300 font-mono text-[10px] bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/60 inline-block">{v.element}</code>
                      </div>
                      {v.pageRegion && (
                        <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          📍 {v.pageRegion}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 font-semibold">{v.message}</p>
                    
                    {v.cssSelector && (
                      <div className="text-[10px] font-mono text-slate-300 bg-slate-950/90 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 font-sans block text-[9px] mb-0.5 font-bold uppercase tracking-wider">🎯 CSS Selector Path:</span>
                        <code>{v.cssSelector}</code>
                      </div>
                    )}

                    {v.howToLocate && (
                      <div className="text-[10px] text-rose-300/90 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/40 leading-relaxed flex items-start gap-2">
                        <span className="font-bold shrink-0">💡 How to check:</span>
                        <span>{v.howToLocate}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Empty buttons warnings */}
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px] mb-3">Empty Buttons Warning Log</span>
            {emptyButtonsViolations.length === 0 ? (
              <div className="p-5 border border-dashed border-slate-800 text-center text-slate-500 text-xs rounded-xl flex items-center justify-center gap-2 bg-dark-900/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                No empty interactive button tags found. Screen readers can scan descriptive textual anchors correctly.
              </div>
            ) : (
              <div className="space-y-3.5">
                {emptyButtonsViolations.map((v, i) => (
                  <div key={i} className="p-4 bg-dark-850/60 border-l-4 border-l-rose-500 border border-slate-800/80 rounded-xl space-y-2.5 text-xs hover:border-slate-700 transition-all shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="text-rose-400 h-5 w-5 shrink-0" />
                        <code className="text-rose-300 font-mono text-[10px] bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/60 inline-block">{v.element}</code>
                      </div>
                      {v.pageRegion && (
                        <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          📍 {v.pageRegion}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 font-semibold">{v.message}</p>
                    
                    {v.cssSelector && (
                      <div className="text-[10px] font-mono text-slate-300 bg-slate-950/90 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 font-sans block text-[9px] mb-0.5 font-bold uppercase tracking-wider">🎯 CSS Selector Path:</span>
                        <code>{v.cssSelector}</code>
                      </div>
                    )}

                    {v.howToLocate && (
                      <div className="text-[10px] text-rose-300/90 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/40 leading-relaxed flex items-start gap-2">
                        <span className="font-bold shrink-0">💡 How to check:</span>
                        <span>{v.howToLocate}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WHAT WENT RIGHT: Passed Accessibility Audits */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-emerald-400 font-extrabold uppercase tracking-wider text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                Passed Accessibility Audits (What Went Right)
              </span>
              {passedAudits && passedAudits.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  ✓ {passedAudits.length} Elements Passed Verification
                </span>
              )}
            </div>
            
            {passedAudits && passedAudits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {passedAudits.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex gap-3 text-xs hover:border-emerald-700/60 transition-all shadow-sm">
                    <CheckCircle2 className="text-emerald-400 h-5 w-5 shrink-0 mt-0.5" />
                    <div className="space-y-1 w-full">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-slate-200">{item.title}</span>
                        {item.wcag && (
                          <span className="text-[9px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            {item.wcag}
                          </span>
                        )}
                      </div>
                      
                      {item.location && (
                        <div className="text-[10px] text-emerald-400/90 font-semibold flex items-center gap-1">
                          <span>📍 Location:</span>
                          <span>{item.location}</span>
                        </div>
                      )}

                      {item.cssSelector && (
                        <div className="text-[9px] font-mono text-slate-400 bg-slate-950/80 p-1.5 rounded border border-slate-800/70 truncate max-w-xs">
                          <code className="text-slate-300">{item.cssSelector}</code>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 leading-snug pt-0.5">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400 h-4 w-4" />
                All standard WCAG 2.1 structural and labeling audits satisfied without critical compliance failures.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
