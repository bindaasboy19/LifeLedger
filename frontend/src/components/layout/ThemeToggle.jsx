import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore.js';
import { toggleTheme } from '../../features/dashboard/uiSlice.js';

export default function ThemeToggle({ className = '' }) {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.ui.darkMode);

  return (
    <button
      className={clsx(
        'rounded-full border border-slate-300/80 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-300/20 backdrop-blur-xl transition hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900',
        className
      )}
      onClick={() => dispatch(toggleTheme())}
      type="button"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
        <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
      </span>
    </button>
  );
}
