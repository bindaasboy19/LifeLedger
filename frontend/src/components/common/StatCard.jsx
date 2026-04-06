import { memo } from 'react';

const StatCard = memo(function StatCard({ label, value, accent = 'bg-brand-500' }) {
  return (
    <div className="glass-card stat-card rounded-2xl p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-2xl font-extrabold md:text-3xl">{value}</p>
        <span className={`h-3 w-3 rounded-full ${accent}`} />
      </div>
    </div>
  );
});

export default StatCard;
