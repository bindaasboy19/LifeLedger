import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useStore.js';

export default function NotificationBell() {
  const unread = useAppSelector((state) => state.notifications.unreadCount);

  return (
    <Link to="/dashboard" className="relative rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
      Notifications
      {unread > 0 ? (
        <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 text-xs text-white">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
