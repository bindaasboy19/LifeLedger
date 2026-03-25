import clsx from 'clsx';

export default function SectionCard({ title, subtitle, action, children, className }) {
  return (
    <section className={clsx('glass-card section-card rounded-2xl p-5 md:p-6', className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-bold md:text-xl">{title}</h2> : null}
            {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-300">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
