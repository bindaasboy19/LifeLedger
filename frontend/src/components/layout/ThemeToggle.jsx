import { useAppDispatch, useAppSelector } from '../../hooks/useStore.js';
import { toggleTheme } from '../../features/dashboard/uiSlice.js';

export default function ThemeToggle() {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.ui.darkMode);

  return (
    <button
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
      onClick={() => dispatch(toggleTheme())}
      type="button"
    >
      {darkMode ? 'Light' : 'Dark'} mode
    </button>
  );
}
