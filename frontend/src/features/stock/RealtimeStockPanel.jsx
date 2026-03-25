import { useMemo, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useRealtimeStock } from './useRealtimeStock.js';
import { createStockItem, deleteStockItem, updateStockItem } from './stockApi.js';
import { bloodGroups, cityCoordinates } from '../../lib/options.js';
import { useAppSelector } from '../../hooks/useStore.js';

const canManageStock = ['hospital', 'blood_bank', 'admin'];

export default function RealtimeStockPanel() {
  const { items, loading } = useRealtimeStock();
  const profile = useAppSelector((state) => state.auth.profile);
  const [form, setForm] = useState({
    bloodGroup: 'O+',
    units: 5,
    city: 'Delhi',
    expiryDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 16),
    collectionDate: new Date().toISOString().slice(0, 16)
  });

  const totalUnits = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.units || 0), 0),
    [items]
  );

  const onAdd = async (event) => {
    event.preventDefault();
    const coords = cityCoordinates[form.city];

    await createStockItem({
      bloodGroup: form.bloodGroup,
      units: Number(form.units),
      expiryDate: new Date(form.expiryDate).toISOString(),
      collectionDate: new Date(form.collectionDate).toISOString(),
      sourceType: profile.role === 'blood_bank' ? 'blood_bank' : 'hospital',
      location: {
        city: form.city,
        address: `${form.city} Health District`,
        lat: coords.lat,
        lng: coords.lng
      }
    });
  };

  const onUnitsChange = async (id, units) => {
    if (Number.isNaN(Number(units))) return;
    await updateStockItem(id, { units: Number(units) });
  };

  return (
    <SectionCard
      title="Real-Time Blood Stock"
      subtitle={`Live entries from Firestore | Total units: ${totalUnits}`}
    >
      {canManageStock.includes(profile?.role) ? (
        <form onSubmit={onAdd} className="mb-4 grid gap-2 md:grid-cols-6">
          <select
            value={form.bloodGroup}
            onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            {bloodGroups.map((bg) => (
              <option key={bg}>{bg}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            value={form.units}
            onChange={(event) => setForm((prev) => ({ ...prev, units: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Units"
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
          <input
            type="datetime-local"
            value={form.collectionDate}
            onChange={(event) => setForm((prev) => ({ ...prev, collectionDate: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            type="datetime-local"
            value={form.expiryDate}
            onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <button className="rounded-lg bg-brand-600 px-3 py-2 text-white">Add Unit</button>
        </form>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Group</th>
              <th className="py-2">Units</th>
              <th className="py-2">City</th>
              <th className="py-2">Expiry</th>
              <th className="py-2">Status</th>
              {canManageStock.includes(profile?.role) ? <th className="py-2">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-3">
                  Loading...
                </td>
              </tr>
            ) : null}
            {items.map((item) => {
              const days = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000);

              return (
                <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2 font-semibold">{item.bloodGroup}</td>
                  <td className="py-2">
                    {canManageStock.includes(profile?.role) ? (
                      <input
                        defaultValue={item.units}
                        type="number"
                        min="0"
                        className="w-20 rounded border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-700"
                        onBlur={(event) => onUnitsChange(item.id, event.target.value)}
                      />
                    ) : (
                      item.units
                    )}
                  </td>
                  <td className="py-2">{item.location?.city}</td>
                  <td className="py-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td className="py-2">
                    {days <= 5 ? <Badge tone="warning">Expiring Soon</Badge> : <Badge tone="success">Healthy</Badge>}
                  </td>
                  {canManageStock.includes(profile?.role) ? (
                    <td className="py-2">
                      <button
                        onClick={() => deleteStockItem(item.id)}
                        className="rounded bg-rose-600 px-2 py-1 text-xs text-white"
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
