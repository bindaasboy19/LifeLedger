import React, { memo } from 'react';

const StatCard = memo(function StatCard({ label, value, accent = 'bg-red-500' }) {
  return (
    <div className="glass-card stat-card rounded-2xl p-4 border border-slate-800/60 bg-slate-900/60 shadow-xl backdrop-blur-xl">
      <div className="text-xs uppercase tracking-wider font-bold text-slate-400">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-2xl font-extrabold md:text-3xl text-slate-100 tracking-tight">{value}</p>
        <span className={`h-3 w-3 rounded-full ${accent} shadow-md shadow-black/40`} />
      </div>
    </div>
  );
});

export default StatCard;
