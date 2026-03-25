import { api } from '../../lib/api.js';
import { useAppSelector } from '../../hooks/useStore.js';
import SectionCard from '../../components/common/SectionCard.jsx';

export default function NotificationPanel() {
  const items = useAppSelector((state) => state.notifications.items);

  const markAsRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
  };

  return (
    <SectionCard title="Notifications" subtitle="Real-time in-app alerts for SOS and camps">
      <div className="space-y-2 max-h-72 overflow-auto">
        {items.length === 0 ? <p className="text-sm text-slate-500">No notifications yet.</p> : null}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => !item.read && markAsRead(item.id)}
            className={`w-full rounded-xl border p-3 text-left ${
              item.read
                ? 'border-slate-200/70 opacity-70 dark:border-slate-700'
                : 'border-brand-300 bg-brand-50/80 dark:border-brand-700 dark:bg-brand-950/40'
            }`}
          >
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
            <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
