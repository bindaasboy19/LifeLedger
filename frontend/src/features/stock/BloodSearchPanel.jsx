import { useMemo, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import LocationMap from '../../components/maps/LocationMap.jsx';
import { bloodGroups, cityCoordinates } from '../../lib/options.js';
import { searchStock } from './stockApi.js';

export default function BloodSearchPanel() {
  const [form, setForm] = useState({ bloodGroup: 'O+', city: 'Delhi', radiusKm: 100, sortBy: 'distance' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const markers = useMemo(
    () =>
      results
        .filter((item) => item.location?.lat && item.location?.lng)
        .map((item) => ({
          id: item.id,
          lat: item.location.lat,
          lng: item.location.lng,
          title: `${item.bloodGroup} (${item.units} units) | ${item.sourceName || item.sourceLabel || 'Source'}`
        })),
    [results]
  );

  const onSearch = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const coords = cityCoordinates[form.city];
      const rows = await searchStock({
        bloodGroup: form.bloodGroup,
        city: form.city,
        lat: coords.lat,
        lng: coords.lng,
        radiusKm: Number(form.radiusKm),
        sortBy: form.sortBy
      });
      setResults(rows);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Blood Search" subtitle="Search by blood group and radius with nearest match sorting">
      <form onSubmit={onSearch} className="grid gap-2 md:grid-cols-5">
        <select
          value={form.bloodGroup}
          onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
          className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {bloodGroups.map((bg) => (
            <option key={bg}>{bg}</option>
          ))}
        </select>
        <select
          value={form.city}
          onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {Object.keys(cityCoordinates).map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
        <input
          type="number"
          value={form.radiusKm}
          onChange={(event) => setForm((prev) => ({ ...prev, radiusKm: event.target.value }))}
          className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Radius km"
        />
        <select
          value={form.sortBy}
          onChange={(event) => setForm((prev) => ({ ...prev, sortBy: event.target.value }))}
          className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="distance">Sort by distance</option>
          <option value="availability">Sort by units</option>
        </select>
        <button className="rounded-lg bg-brand-600 px-3 py-2 text-white">Search</button>
      </form>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {loading ? <p className="text-sm">Searching...</p> : null}
          {results.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-semibold">
                {item.bloodGroup} | {item.units} units
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Source: {item.sourceName || item.sourceLabel || 'Unknown'}
              </p>
              <p className="text-slate-500 dark:text-slate-300">
                {item.location?.city} | {item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : 'distance n/a'}
              </p>
              {item.mergedEntries > 1 ? (
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Merged from {item.mergedEntries} stock entries
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <LocationMap markers={markers} center={cityCoordinates[form.city]} zoom={8} />
      </div>
    </SectionCard>
  );
}
