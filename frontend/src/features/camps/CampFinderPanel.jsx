import { useMemo, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import LocationMap from '../../components/maps/LocationMap.jsx';
import { bloodGroups, cityCoordinates } from '../../lib/options.js';
import { createCamp } from './campApi.js';
import { useRealtimeCamps } from './useRealtimeCamps.js';
import { useAppSelector } from '../../hooks/useStore.js';

const campCreators = ['hospital', 'admin', 'blood_bank'];

const campStatus = (camp) => {
  const now = new Date();
  const start = new Date(camp.startAt);
  const end = new Date(camp.endAt);
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
};

export default function CampFinderPanel() {
  const profile = useAppSelector((state) => state.auth.profile);
  const { items, loading } = useRealtimeCamps();
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    name: '',
    organizer: '',
    city: 'Delhi',
    startAt: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 2.5 * 86400000).toISOString().slice(0, 16),
    requiredBloodGroups: ['O+'],
    email: '',
    phone: ''
  });

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => campStatus(item) === filter);
  }, [filter, items]);

  const markers = filtered
    .filter((item) => item.location?.lat && item.location?.lng)
    .map((item) => ({
      id: item.id,
      lat: item.location.lat,
      lng: item.location.lng,
      title: item.name
    }));

  const submitCamp = async (event) => {
    event.preventDefault();

    const coords = cityCoordinates[form.city];
    await createCamp({
      name: form.name,
      organizer: form.organizer,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      location: {
        city: form.city,
        address: `${form.city} Camp Ground`,
        lat: coords.lat,
        lng: coords.lng
      },
      requiredBloodGroups: form.requiredBloodGroups,
      contactDetails: {
        email: form.email,
        phone: form.phone
      },
      description: `${form.organizer} organized camp`
    });

    setForm((prev) => ({ ...prev, name: '', organizer: '', email: '', phone: '' }));
  };

  return (
    <SectionCard title="Donation Camp Finder" subtitle="Live camp discovery with scheduled reminder notifications">
      <div className="mb-3 flex gap-2">
        {['all', 'upcoming', 'ongoing', 'completed'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === item
                ? 'bg-brand-600 text-white'
                : 'border border-slate-300 dark:border-slate-700'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {campCreators.includes(profile?.role) ? (
        <form onSubmit={submitCamp} className="mb-4 grid gap-2 md:grid-cols-4">
          <input
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Camp name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Organizer"
            value={form.organizer}
            onChange={(event) => setForm((prev) => ({ ...prev, organizer: event.target.value }))}
            required
          />
          <select
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            {Object.keys(cityCoordinates).map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
          <select
            multiple
            value={form.requiredBloodGroups}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                requiredBloodGroups: Array.from(event.target.selectedOptions, (option) => option.value)
              }))
            }
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            {bloodGroups.map((bg) => (
              <option key={bg}>{bg}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            type="email"
            placeholder="Contact email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
            required
          />
          <input
            placeholder="Contact phone"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
            required
          />
          <button className="rounded-lg bg-brand-600 px-3 py-2 text-white">Create Camp</button>
        </form>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {loading ? <p className="text-sm">Loading camps...</p> : null}
          {filtered.map((camp) => (
            <div key={camp.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-semibold">{camp.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {camp.location?.city} | {new Date(camp.startAt).toLocaleString()}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone={campStatus(camp) === 'upcoming' ? 'warning' : campStatus(camp) === 'ongoing' ? 'success' : 'neutral'}>
                  {campStatus(camp)}
                </Badge>
                <p className="text-xs">Need: {(camp.requiredBloodGroups || []).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>

        <LocationMap markers={markers} center={cityCoordinates.Delhi} zoom={5} />
      </div>
    </SectionCard>
  );
}
