import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import { api } from '../../lib/api.js';
import { bloodGroups, cityCoordinates } from '../../lib/options.js';
import { useAppSelector } from '../../hooks/useStore.js';

const cooldownDays = (date) => {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
};

export default function DonorPanel() {
  const profile = useAppSelector((state) => state.auth.profile);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    bloodGroup: profile?.bloodGroup || 'O+',
    availabilityStatus: profile?.availabilityStatus ?? true,
    city: profile?.location?.city || 'Delhi',
    lastDonationDate: profile?.lastDonationDate
      ? new Date(profile.lastDonationDate).toISOString().slice(0, 16)
      : ''
  });

  const loadHistory = async () => {
    const { data } = await api.get('/donor/history');
    setHistory(data.data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onSave = async (event) => {
    event.preventDefault();
    const coords = cityCoordinates[form.city];

    await api.patch('/donor/profile', {
      bloodGroup: form.bloodGroup,
      availabilityStatus: form.availabilityStatus,
      lastDonationDate: form.lastDonationDate
        ? new Date(form.lastDonationDate).toISOString()
        : undefined,
      location: {
        city: form.city,
        address: `${form.city} Donor Area`,
        lat: coords.lat,
        lng: coords.lng
      }
    });
  };

  const elapsed = cooldownDays(profile?.lastDonationDate);
  const cooldownRemaining = elapsed !== null ? Math.max(0, 90 - elapsed) : 0;

  return (
    <SectionCard title="Donation Readiness" subtitle="Availability, cooldown, and community donation records">
      <form onSubmit={onSave} className="grid gap-2 md:grid-cols-5">
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
          value={String(form.availabilityStatus)}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, availabilityStatus: event.target.value === 'true' }))
          }
          className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
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
          type="datetime-local"
          value={form.lastDonationDate}
          onChange={(event) => setForm((prev) => ({ ...prev, lastDonationDate: event.target.value }))}
          className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <button className="rounded-lg bg-brand-600 px-3 py-2 text-white">Save Donation Profile</button>
      </form>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
        Cooldown remaining: {cooldownRemaining} day(s)
      </p>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Donation history</h3>
        {history.map((record) => (
          <div key={record._id} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
            {record.bloodGroup} | {record.units} unit(s) | {new Date(record.donatedAt).toLocaleDateString()} |{' '}
            {record.location?.city}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
