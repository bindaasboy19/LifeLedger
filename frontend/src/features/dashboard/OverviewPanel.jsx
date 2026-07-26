import React, { useMemo } from 'react';
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
      'Live stock movement visibility helps community members, NGOs, hospitals, and blood banks align on the same operational picture.',
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
    <div className="grid gap-5 xl:grid-cols-3">
      <SectionCard
        className="xl:col-span-2"
        title="Mission & Vision"
        subtitle="A coordinated and accountable blood support network for emergency and routine care"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-red-900/50 bg-gradient-to-br from-red-950/60 to-rose-900/30 p-4 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-400">Our Aim</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Reduce avoidable treatment delay by connecting blood demand, community response, NGO-led camps, and institutional stock in one live workflow.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-900/50 bg-gradient-to-br from-cyan-950/60 to-blue-900/30 p-4 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Role of {profile?.role?.replace('_', ' ') || 'User'}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Your dashboard is tailored to surface only actions and metrics relevant to your role while keeping shared transparency intact.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {blogCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <Badge tone="neutral">{card.tag}</Badge>
              <h4 className="mt-2 text-xs font-bold leading-snug text-slate-100">{card.title}</h4>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{card.summary}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Live Insights" subtitle="Operational highlights from current real-time streams">
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/30 p-3.5">
            <p className="text-[11px] uppercase font-bold tracking-wider text-amber-400">Lowest stock groups</p>
            {lowStockGroups.length === 0 ? (
              <p className="mt-1.5 text-xs text-slate-400">No stock data available yet.</p>
            ) : (
              lowStockGroups.map((row) => (
                <p key={row.group} className="mt-1.5 text-xs font-bold text-slate-200">
                  {row.group}: <span className="text-amber-400">{row.units} units</span>
                </p>
              ))
            )}
          </div>

          <div className="rounded-xl border border-blue-900/40 bg-blue-950/30 p-3.5">
            <p className="text-[11px] uppercase font-bold tracking-wider text-blue-400">SOS hotspots</p>
            {cityHotspots.length === 0 ? (
              <p className="mt-1.5 text-xs text-slate-400">No active SOS requests right now.</p>
            ) : (
              cityHotspots.map((row) => (
                <p key={row.city} className="mt-1.5 text-xs font-bold text-slate-200">
                  {row.city}: <span className="text-blue-400">{row.count} request(s)</span>
                </p>
              ))
            )}
          </div>

          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-3.5">
            <p className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">Next donation camp</p>
            {!nextCamp ? (
              <p className="mt-1.5 text-xs text-slate-400">No upcoming camp right now.</p>
            ) : (
              <>
                <p className="mt-1.5 text-xs font-bold text-slate-200">{nextCamp.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
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
