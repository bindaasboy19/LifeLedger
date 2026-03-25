import clsx from 'clsx';

const palette = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  neutral: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
};

export default function Badge({ children, tone = 'neutral' }) {
  return (
    <span className={clsx('inline-flex rounded-full px-2 py-1 text-xs font-semibold', palette[tone])}>
      {children}
    </span>
  );
}
