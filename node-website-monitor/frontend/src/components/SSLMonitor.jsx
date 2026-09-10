import React from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, 
  XCircle, Clock, Globe, Lock, Shield 
} from 'lucide-react';

export default function SSLMonitor({ sslData, securityData }) {
  if (!sslData && !securityData) {
    return (
      <div className="glass-card p-10 text-center text-slate-500 max-w-2xl mx-auto my-6 animate-fade-in-up">
        <Shield className="h-10 w-10 text-slate-600 mx-auto mb-4 animate-bounce" />
        <h4 className="font-extrabold text-slate-400">No Security Telemetry Audited</h4>
        <p className="text-xs text-slate-500 mt-2">Run a scan above to see real-time SSL certificate validity and secure HTTP response headers.</p>
      </div>
    );
  }

  const {
    valid = false,
    daysRemaining = 0,
    issuer = 'unknown',
    expiryDate = null,
    message = 'No certificate returned from host socket.'
  } = sslData || {};

  const {
    securityScore = 100,
    headers = { missing: [], csp: 'disabled', hsts: 'disabled', xfo: 'disabled' },
    alerts = []
  } = securityData || {};

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-sky-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getGradientId = (score) => {
    if (score >= 90) return 'url(#sslSkyGrad)';
    if (score >= 70) return 'url(#sslAmberGrad)';
    return 'url(#sslRoseGrad)';
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      
      {/* SSL expiry urgent alerts */}
      {valid && daysRemaining <= 7 && (
        <div className={`glass-card p-4 border-l-4 flex items-center gap-3 ${daysRemaining <= 1 ? 'border-l-rose-600' : 'border-l-amber-500'}`}>
          <ShieldAlert className={`h-5 w-5 shrink-0 ${daysRemaining <= 1 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
          <div>
            <p className={`text-xs font-bold ${daysRemaining <= 1 ? 'text-rose-400' : 'text-amber-400'}`}>
              {daysRemaining <= 1
                ? `CRITICAL: SSL Certificate expires in ${daysRemaining} day${daysRemaining === 0 ? 's (TODAY)' : ''}! Renew immediately.`
                : `WARNING: SSL Certificate expires in ${daysRemaining} days. Schedule renewal now.`}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Issuer: {issuer} · Expires: {expiryDate ? new Date(expiryDate).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      )}

      {/* SSL Active status banner */}
      <div className={`glass-card p-4 flex items-center justify-between border ${valid ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${valid ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs font-bold text-slate-200">
            SSL {valid ? 'Active' : 'Inactive / Invalid'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expires In</p>
            <p className={`font-black mt-0.5 ${daysRemaining > 30 ? 'text-emerald-400' : daysRemaining > 7 ? 'text-amber-400' : 'text-rose-400'}`}>
              {valid ? `${daysRemaining} Days` : 'Expired'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Valid Until</p>
            <p className="text-slate-300 font-bold mt-0.5">{expiryDate ? new Date(expiryDate).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Security circular rating gauge */}
        <div className="col-span-12 md:col-span-4 glass-card p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider w-full text-left mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-400" />
            Security Shield Rating
          </h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="sslSkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="sslAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="sslRoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                stroke={getGradientId(securityScore)}
                strokeWidth="8"
                strokeDasharray={389.5}
                strokeDashoffset={389.5 - (389.5 * securityScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-in-out"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl font-black tracking-tight ${getScoreColor(securityScore)}`}>{securityScore}%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Shield Score</span>
            </div>
          </div>
        </div>

        {/* SSL Certificate Details card */}
        <div className="col-span-12 md:col-span-8 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                Active SSL Certificate
              </span>
              {valid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  <CheckCircle2 className="h-3 w-3" /> Secure
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold animate-pulse">
                  <XCircle className="h-3 w-3" /> Insecure
                </span>
              )}
            </div>

            <div className="space-y-3.5 mt-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500">Certificate Issuer:</span>
                <span className="font-semibold text-slate-300">{issuer}</span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500">Expiration countdown:</span>
                <span className={`font-bold ${valid && daysRemaining > 30 ? 'text-emerald-400' : 'text-amber-400 font-black animate-pulse'}`}>
                  {valid ? `${daysRemaining} Days remaining` : '0 Days (Expired)'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Expiry Date:</span>
                <span className="font-mono text-slate-300">
                  {expiryDate ? new Date(expiryDate).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-slate-800/40 pt-3 mt-4">
            {message}
          </p>
        </div>

      </div>

      {/* HTTP Secure Response Headers Status */}
      <div className="glass-card p-6 space-y-6">
        
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-slate-200 font-extrabold text-lg flex items-center gap-2">
              <ShieldCheck className="text-sky-400 h-5 w-5" />
              Security Protocol & Headers Shield
            </h3>
            <p className="text-xs text-slate-500 mt-1">Analyzing web server response headers and Content Security Policy directives.</p>
          </div>
        </div>

        {/* Secure Headers status checks list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 bg-dark-800/40 rounded-xl border border-slate-800/60 flex justify-between items-center hover:border-sky-500/25 transition-all">
            <span className="text-slate-400 font-semibold">HSTS Enforced:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${headers?.hsts === 'enabled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
              {headers?.hsts?.toUpperCase() || 'DISABLED'}
            </span>
          </div>
          <div className="p-4 bg-dark-800/40 rounded-xl border border-slate-800/60 flex justify-between items-center hover:border-sky-500/25 transition-all">
            <span className="text-slate-400 font-semibold">CSP Directives:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${headers?.csp === 'enabled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
              {headers?.csp?.toUpperCase() || 'DISABLED'}
            </span>
          </div>
          <div className="p-4 bg-dark-800/40 rounded-xl border border-slate-800/60 flex justify-between items-center hover:border-sky-500/25 transition-all">
            <span className="text-slate-400 font-semibold">X-Frame-Options:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${headers?.xfo === 'enabled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
              {headers?.xfo?.toUpperCase() || 'DISABLED'}
            </span>
          </div>
        </div>

        {/* Missing security headers alert lists */}
        <div className="space-y-3 pt-2">
          <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Security Header Integrity Warnings</span>
          {headers?.missing?.length === 0 ? (
            <div className="p-5 border border-dashed border-slate-800 text-center text-slate-500 text-xs rounded-xl flex flex-col items-center justify-center gap-2 bg-dark-900/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              Website has enabled all modern secure response headers! Complete vulnerability shielding.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {headers.missing.map((header, index) => (
                <div key={index} className="p-4 bg-dark-855/30 border-l-4 border-l-rose-500 border border-slate-800/60 rounded-xl flex gap-3.5 items-start text-xs hover:border-slate-700 transition-all shadow-md">
                  <ShieldAlert className="text-rose-455 h-5 w-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-200 font-mono tracking-wide">{header}</span>
                    <p className="text-slate-500 text-[10px] leading-relaxed">
                      Missing header exposes users to clickjacking, MITM spoofing, or cross-site scripting risks. Enable in server configuration.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
