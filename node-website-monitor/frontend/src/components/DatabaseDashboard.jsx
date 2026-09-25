import React from 'react';
import { Database, AlertTriangle, CheckCircle2, Clock, Server } from 'lucide-react';

export default function DatabaseDashboard({ historyLog = [], currentStatus = {} }) {
  const safeHistory = Array.isArray(historyLog) ? historyLog : [];
  
  // Find database errors in history
  const dbOutages = safeHistory.filter(log => 
    log?.errors && log.errors.some(e => e?.toLowerCase().includes('database'))
  );
  
  const hasCurrentDbError = currentStatus?.errors?.some(e => e?.toLowerCase().includes('database'));
  
  const isHealthy = currentStatus?.isUp && !hasCurrentDbError;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-500">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Database className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-200 tracking-tight">Database Availability</h3>
            <p className="text-[11px] text-slate-400 mt-1">Real-time database connection monitoring and outage history.</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 block">Current Status</span>
          {isHealthy ? (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-black flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> ONLINE
            </span>
          ) : (
             <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-black flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> DB CONNECTION ERROR
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Outages List */}
        <div className="glass-card p-6 rounded-2xl">
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-400" /> Recent Database Outages
          </h4>
          
          {dbOutages.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/20 rounded-xl border border-slate-800/50">
               <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mx-auto mb-3" />
               <p className="text-sm font-bold text-slate-400">No database outages detected</p>
               <p className="text-[10px] text-slate-500 mt-1">Your database connection has been stable.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dbOutages.slice(0, 10).map((outage, idx) => (
                <div key={idx} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-rose-300">
                      {outage.errors?.find(e => e.toLowerCase().includes('database')) || 'Database connection error'}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(outage.checkedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center">
             <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center border-4 border-blue-500/30 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                <Database className="h-8 w-8 text-blue-400" />
             </div>
             <h4 className="text-3xl font-black text-slate-200">{safeHistory.length - dbOutages.length} <span className="text-sm text-slate-500">/ {safeHistory.length}</span></h4>
             <p className="text-xs text-slate-400 font-bold mt-2">Successful Database Checks</p>
        </div>
      </div>
    </div>
  );
}
