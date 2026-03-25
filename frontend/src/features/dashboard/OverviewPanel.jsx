import { useMemo } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import Badge from '../../components/common/Badge.jsx';

const blogCards = [
  {
    title: 'Vision 2030: Zero Preventable Blood Delay',
    summary:
      'LifeLedger aims to make urgent blood discovery and responder activation available within minutes across every city cluster.',
    tag: 'Vision'
  },
  {
    title: 'How Transparent Stock Flow Builds Trust',
    summary:
      'Live stock movement visibility helps patients, donors, hospitals, and blood banks align on the same operational picture.',
    tag: 'Insight'
  },
  {
    title: 'From SOS Trigger to Completion: Lifecycle Focus',
    summary:
      'Our workflows optimize matching, acceptance, coordination, and closure so emergency requests are traceable end-to-end.',
    tag: 'Operations'
  }
];

export default function OverviewPanel({ profile, stockItems, sosItems, campItems }) {
  const lowStockGroups = useMemo(() => {
    const byGroup = stockItems.reduce((acc, item) => {
      const key = item.bloodGroup || 'Unknown';
      acc[key] = (acc[key] || 0) + Number(item.units || 0);
      return acc;
    }, {});

    return Object.entries(byGroup)
      .map(([group, units]) => ({ group, units }))
      .sort((a, b) => a.units - b.units)
      .slice(0, 3);
  }, [stockItems]);

  const cityHotspots = useMemo(() => {
    const byCity = sosItems.reduce((acc, item) => {
      const city = item.location?.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(byCity)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [sosItems]);

  const nextCamp = useMemo(() => {
    return campItems
      .filter((camp) => new Date(camp.startAt) > new Date())
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [campItems]);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <SectionCard
        className="xl:col-span-2"
        title="Mission & Vision"
        subtitle="A coordinated and accountable blood support network for emergency and routine care"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 to-red-100/80 p-4 dark:border-rose-900/40 dark:from-rose-950/40 dark:to-red-900/20">
            <h3 className="text-base font-bold text-rose-800 dark:text-rose-200">Our Aim</h3>
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-100/90">
              Reduce avoidable treatment delay by connecting blood demand, donor response, and institutional stock in one live workflow.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 to-blue-100/80 p-4 dark:border-cyan-900/40 dark:from-cyan-950/40 dark:to-blue-900/20">
            <h3 className="text-base font-bold text-cyan-800 dark:text-cyan-200">Role of {profile?.role || 'User'}</h3>
            <p className="mt-2 text-sm text-cyan-700 dark:text-cyan-100/90">
              Your dashboard is tailored to surface only actions and metrics relevant to your role while keeping shared transparency intact.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {blogCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-slate-200/80 bg-white/80 p-4 transition-transform duration-200 hover:-translate-y-0.5 dark:border-slate-700/80 dark:bg-slate-900/80"
            >
              <Badge tone="neutral">{card.tag}</Badge>
              <h4 className="mt-2 text-sm font-bold leading-snug">{card.title}</h4>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{card.summary}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Live Insights" subtitle="Operational highlights from current real-time streams">
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
            <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Lowest stock groups</p>
            {lowStockGroups.length === 0 ? (
              <p className="mt-1 text-sm">No stock data yet.</p>
            ) : (
              lowStockGroups.map((row) => (
                <p key={row.group} className="mt-1 text-sm font-semibold">
                  {row.group}: {row.units} units
                </p>
              ))
            )}
          </div>

          <div className="rounded-xl border border-blue-200/70 bg-blue-50/80 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
            <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">SOS hotspots</p>
            {cityHotspots.length === 0 ? (
              <p className="mt-1 text-sm">No SOS records yet.</p>
            ) : (
              cityHotspots.map((row) => (
                <p key={row.city} className="mt-1 text-sm font-semibold">
                  {row.city}: {row.count} request(s)
                </p>
              ))
            )}
          </div>

          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Next donation camp</p>
            {!nextCamp ? (
              <p className="mt-1 text-sm">No upcoming camp right now.</p>
            ) : (
              <>
                <p className="mt-1 text-sm font-semibold">{nextCamp.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {new Date(nextCamp.startAt).toLocaleString()} • {nextCamp.location?.city}
                </p>
              </>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
