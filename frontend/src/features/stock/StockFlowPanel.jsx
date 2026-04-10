import SectionCard from '../../components/common/SectionCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useRealtimeStockFlow } from './useRealtimeStockFlow.js';
import { useAppSelector } from '../../hooks/useStore.js';

const actionTone = {
  created: 'success',
  updated: 'neutral',
  deleted: 'danger',
  seeded: 'warning'
};

export default function StockFlowPanel() {
  const profile = useAppSelector((state) => state.auth.profile);
  const { items, loading } = useRealtimeStockFlow(profile);

  return (
    <SectionCard
      title="Blood Stock Flow"
      subtitle="Organisation-specific stock movement log"
    >
      <div className="space-y-2">
        {loading ? <p className="text-sm">Loading stock flow...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">No stock flow events found.</p>
        ) : null}
        {items.slice(0, 60).map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {item.bloodGroup || 'N/A'} | {item.location?.city || 'Unknown location'}
              </p>
              <Badge tone={actionTone[item.action] || 'neutral'}>{item.action}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {new Date(item.at).toLocaleString()} | by {item.actorUid || 'system'}
            </p>
            <p className="mt-1 text-xs">
              Units: {item.unitsBefore ?? 0} → {item.unitsAfter ?? 0} (Δ {item.deltaUnits ?? 0})
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
