import React from 'react';
import clsx from 'clsx';

export default function SectionCard({ title, subtitle, action, children, className }) {
  return (
    <section className={clsx('glass-card section-card rounded-2xl p-5 md:p-6 border border-slate-800/60 bg-slate-900/60 shadow-2xl backdrop-blur-xl', className)}>
      {(title || action) && (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-bold text-slate-100 md:text-xl tracking-tight">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
