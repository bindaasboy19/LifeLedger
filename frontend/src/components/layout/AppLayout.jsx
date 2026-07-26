import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firebaseAuth } from '../../lib/firebase.js';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore.js';
import { clearSession } from '../../features/auth/authSlice.js';
import NotificationBell from './NotificationBell.jsx';
import Footer from './Footer.jsx';

const roleLabels = {
  user: 'Community Member',
  donor: 'Community Member',
  ngo: 'NGO Organizer',
  hospital: 'Hospital',
  blood_bank: 'Blood Bank',
  admin: 'Admin'
};

const roleBadgeColor = {
  admin: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  hospital: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  blood_bank: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  ngo: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  user: 'bg-red-500/10 text-red-400 border-red-500/30'
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

  const userRole = profile?.role || 'user';
  const roleBadgeStyle = roleBadgeColor[userRole] || roleBadgeColor.user;

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-100 antialiased selection:bg-red-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl transition duration-200">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-8 flex items-center justify-between gap-4">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-950/40 group-hover:scale-105 transition duration-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  LifeLedger
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                  Blood Ecosystem
                </span>
              </div>
            </Link>
          </div>

          {/* User Status & Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* User Role Badge */}
            <Link
              to="/dashboard?tab=profile"
              className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadgeStyle} hover:opacity-80 transition`}
              title="Click to view Profile"
            >
              {roleLabels[userRole] || 'Member'}
            </Link>

            {/* Notification Bell (Redirects to Notifications Tab) */}
            <Link
              to="/dashboard?tab=notifications"
              className="flex items-center justify-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/60 transition"
              title="Notifications"
            >
              <NotificationBell />
            </Link>

            {/* User Profile & Logout */}
            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              {/* Clicking User Name redirects to Profile tab */}
              <Link
                to="/dashboard?tab=profile"
                className="hidden md:flex flex-col text-right group hover:opacity-90 transition"
                title="View Profile"
              >
                <span className="text-xs font-bold text-slate-200 group-hover:text-red-400 max-w-[140px] truncate transition">
                  {profile?.displayName || 'User Profile'}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">Online • View Profile</span>
              </Link>

              <button
                onClick={onLogout}
                type="button"
                className="py-1.5 px-3 rounded-lg bg-red-600/90 hover:bg-red-500 text-xs font-semibold text-white shadow-md shadow-red-950 transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        {tabs.length > 0 && (
          <div className="border-t border-slate-800/60 bg-slate-950/60 px-4 md:px-8">
            <div className="mx-auto max-w-7xl flex gap-1 overflow-x-auto py-2 no-scrollbar">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const href = tab.id === 'overview' ? '/dashboard' : `/dashboard?tab=${tab.id}`;

                return (
                  <Link
                    key={tab.id}
                    to={href}
                    className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-red-600 text-white shadow-sm shadow-red-950'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 md:px-8">
        {children}
      </main>

      {/* Static Footer */}
      <Footer />
    </div>
  );
}
