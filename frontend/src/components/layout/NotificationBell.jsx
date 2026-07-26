import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useStore.js';

export default function NotificationBell() {
  const unread = useAppSelector((state) => state.notifications.unreadCount);

  return (
    <Link
      to="/dashboard?tab=notifications"
      className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
      title="View Notifications"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span>Notifications</span>
      {unread > 0 ? (
        <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm shadow-red-950">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
