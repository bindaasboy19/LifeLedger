import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle.jsx';

const getThemeFromRoute = (pathname, searchParams) => {
  if (pathname === '/') return 'landing';
  if (pathname === '/login') return 'auth-login';
  if (pathname === '/register') return 'auth-register';
  if (pathname === '/onboarding') return 'auth-onboarding';
  if (pathname === '/dashboard') {
    const tab = searchParams.get('tab') || 'overview';
    if (['sos'].includes(tab)) return 'dashboard-sos';
    if (['stock', 'search', 'flow'].includes(tab)) return 'dashboard-stock';
    if (['camps'].includes(tab)) return 'dashboard-camps';
    if (['prediction'].includes(tab)) return 'dashboard-ai';
    if (['admin'].includes(tab)) return 'dashboard-admin';
    if (['notifications'].includes(tab)) return 'dashboard-notifications';
    if (['profile', 'donor'].includes(tab)) return 'dashboard-profile';
    return 'dashboard-overview';
  }
  return 'default';
};

const DecorativeShape = ({ className }) => <div className={clsx('page-art-shape', className)} />;

const SvgMotif = ({ theme }) => {
  if (theme === 'landing') {
    return (
      <svg viewBox="0 0 420 420" className="page-art-svg text-rose-500/10" aria-hidden="true">
        <defs>
          <linearGradient id="landingPulse" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <circle cx="210" cy="210" r="158" fill="none" stroke="url(#landingPulse)" strokeWidth="5" strokeDasharray="9 18" />
        <circle cx="210" cy="210" r="112" fill="none" stroke="url(#landingPulse)" strokeWidth="3" strokeDasharray="6 12" />
        <circle cx="210" cy="210" r="58" fill="none" stroke="url(#landingPulse)" strokeWidth="8" />
        <path d="M208 104c-16 0-29 12-29 28 0 16 10 30 24 46 6 7 12 14 17 22 6-8 12-15 18-22 14-16 24-30 24-46 0-16-13-28-29-28-7 0-16 3-22 11-7-8-15-11-23-11z" fill="url(#landingPulse)" />
      </svg>
    );
  }

  if (theme === 'auth-login' || theme === 'auth-register' || theme === 'auth-onboarding') {
    return (
      <svg viewBox="0 0 420 420" className="page-art-svg text-sky-500/10" aria-hidden="true">
        <defs>
          <linearGradient id="authShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path d="M210 66 114 104v88c0 78 47 125 96 160 49-35 96-82 96-160v-88L210 66z" fill="none" stroke="url(#authShield)" strokeWidth="10" />
        <path d="M167 204l25 25 60-70" fill="none" stroke="url(#authShield)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="210" cy="210" r="170" fill="none" stroke="url(#authShield)" strokeWidth="2" strokeDasharray="8 16" />
      </svg>
    );
  }

  if (theme === 'dashboard-sos') {
    return (
      <svg viewBox="0 0 420 420" className="page-art-svg text-rose-500/10" aria-hidden="true">
        <defs>
          <linearGradient id="sosWave" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <circle cx="210" cy="210" r="150" fill="none" stroke="url(#sosWave)" strokeWidth="4" strokeDasharray="10 16" />
        <circle cx="210" cy="210" r="105" fill="none" stroke="url(#sosWave)" strokeWidth="4" strokeDasharray="6 12" />
        <path d="M120 210h52l24-48 34 98 28-58h46" fill="none" stroke="url(#sosWave)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (theme === 'dashboard-stock') {
    return (
      <svg viewBox="0 0 420 420" className="page-art-svg text-cyan-500/10" aria-hidden="true">
        <defs>
          <linearGradient id="stockDrop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path d="M210 74c-58 84-88 122-88 173 0 51 39 93 88 93s88-42 88-93c0-51-30-89-88-173z" fill="none" stroke="url(#stockDrop)" strokeWidth="12" />
        <path d="M134 266c22-14 49-22 76-22s54 8 76 22" fill="none" stroke="url(#stockDrop)" strokeWidth="10" strokeLinecap="round" />
        <path d="M150 220h120" fill="none" stroke="url(#stockDrop)" strokeWidth="8" strokeDasharray="8 14" strokeLinecap="round" />
      </svg>
    );
  }

  if (theme === 'dashboard-camps') {
    return (
      <svg viewBox="0 0 420 420" className="page-art-svg text-emerald-500/10" aria-hidden="true">
        <defs>
          <linearGradient id="campGrid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <rect x="90" y="108" width="240" height="178" rx="26" fill="none" stroke="url(#campGrid)" strokeWidth="10" />
        <path d="M90 164h240" stroke="url(#campGrid)" strokeWidth="10" />
        <path d="M142 82v54M278 82v54" stroke="url(#campGrid)" strokeWidth="14" strokeLinecap="round" />
        <circle cx="165" cy="215" r="16" fill="url(#campGrid)" />
        <circle cx="212" cy="215" r="16" fill="url(#campGrid)" />
        <circle cx="259" cy="215" r="16" fill="url(#campGrid)" />
      </svg>
    );
  }

  if (theme === 'dashboard-ai') {
    return (
      <svg viewBox="0 0 420 420" className="page-art-svg text-sky-500/10" aria-hidden="true">
        <defs>
          <linearGradient id="aiTrace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <circle cx="118" cy="126" r="22" fill="url(#aiTrace)" />
        <circle cx="298" cy="112" r="18" fill="url(#aiTrace)" />
        <circle cx="212" cy="210" r="24" fill="url(#aiTrace)" />
        <circle cx="310" cy="286" r="20" fill="url(#aiTrace)" />
        <circle cx="128" cy="298" r="18" fill="url(#aiTrace)" />
        <path d="M118 126 212 210 298 112M212 210 128 298M212 210 310 286" fill="none" stroke="url(#aiTrace)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (theme === 'dashboard-admin') {
    return (
      <svg viewBox="0 0 420 420" className="page-art-svg text-amber-500/10" aria-hidden="true">
        <defs>
          <linearGradient id="adminGrid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.88" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <rect x="112" y="108" width="196" height="204" rx="24" fill="none" stroke="url(#adminGrid)" strokeWidth="10" />
        <path d="M152 162h116M152 212h116M152 262h80" fill="none" stroke="url(#adminGrid)" strokeWidth="12" strokeLinecap="round" />
        <circle cx="282" cy="258" r="32" fill="none" stroke="url(#adminGrid)" strokeWidth="10" />
        <path d="m282 238 0 20 14 10" fill="none" stroke="url(#adminGrid)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (theme === 'dashboard-notifications') {
    return (
      <svg viewBox="0 0 420 420" className="page-art-svg text-orange-500/10" aria-hidden="true">
        <defs>
          <linearGradient id="notifyBell" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.88" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <path d="M210 92c-47 0-76 35-76 88v44l-20 32h192l-20-32v-44c0-53-29-88-76-88z" fill="none" stroke="url(#notifyBell)" strokeWidth="12" strokeLinejoin="round" />
        <path d="M180 292c5 19 17 28 30 28s25-9 30-28" fill="none" stroke="url(#notifyBell)" strokeWidth="12" strokeLinecap="round" />
        <circle cx="314" cy="126" r="28" fill="url(#notifyBell)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 420 420" className="page-art-svg text-brand-500/10" aria-hidden="true">
      <defs>
        <linearGradient id="defaultLoop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle cx="210" cy="210" r="150" fill="none" stroke="url(#defaultLoop)" strokeWidth="10" strokeDasharray="12 18" />
      <circle cx="210" cy="210" r="82" fill="none" stroke="url(#defaultLoop)" strokeWidth="8" />
    </svg>
  );
};

export default function PageFrame({ children }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const theme = useMemo(
    () => getThemeFromRoute(location.pathname, searchParams),
    [location.pathname, searchParams]
  );

  return (
    <div className={clsx('page-frame', `page-theme-${theme}`)}>
      <div className="page-frame__wash" aria-hidden="true" />
      <div className="page-frame__grid" aria-hidden="true" />
      <div className="page-frame__art page-frame__art--primary" aria-hidden="true">
        <SvgMotif theme={theme} />
      </div>
      <div className="page-frame__art page-frame__art--secondary" aria-hidden="true">
        <DecorativeShape className="page-art-shape--one" />
        <DecorativeShape className="page-art-shape--two" />
        <DecorativeShape className="page-art-shape--three" />
      </div>

      <div className="page-frame__toolbar">
        <ThemeToggle className="page-theme-toggle" />
      </div>

      <div className="page-frame__content">{children}</div>

      <div className="page-watermark" aria-hidden="true">
        made with <span className="page-watermark__heart">❤</span> by Sanjeev Chaurasia
      </div>
    </div>
  );
}
