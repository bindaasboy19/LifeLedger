import { Link, useNavigate } from 'react-router-dom';
import { firebaseAuth } from '../../lib/firebase.js';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore.js';
import { clearSession } from '../../features/auth/authSlice.js';
import ThemeToggle from './ThemeToggle.jsx';
import NotificationBell from './NotificationBell.jsx';

const roleLabels = {
  user: 'User',
  donor: 'Donor',
  hospital: 'Hospital',
  blood_bank: 'Blood Bank',
  admin: 'Admin'
};

export default function AppLayout({ children, tabs = [], activeTab = 'overview' }) {
  const profile = useAppSelector((state) => state.auth.profile);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onLogout = async () => {
    await firebaseAuth.signOut();
    dispatch(clearSession());
    navigate('/login');
  };

  return (
    <div className="dashboard-shell min-h-screen px-4 py-5 md:px-8">
      <header className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 md:p-5">
        <div className="pointer-events-none absolute -left-20 top-0 h-36 w-36 rounded-full bg-brand-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-36 w-36 rounded-full bg-rose-300/25 blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">LifeLedger</p>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Emergency Blood Intelligence Hub</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {profile?.displayName || 'User'} | {roleLabels[profile?.role] || 'Role not set'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={onLogout}
              type="button"
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const href = tab.id === 'overview' ? '/dashboard' : `/dashboard?tab=${tab.id}`;

          return (
            <Link
              key={tab.id}
              to={href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-lg shadow-brand-600/30'
                  : 'border border-slate-300 bg-white/75 text-slate-700 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <main>{children}</main>
    </div>
  );
}
