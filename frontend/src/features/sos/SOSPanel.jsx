import { useMemo, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { bloodGroups, cityCoordinates } from '../../lib/options.js';
import { createSOSRequest, updateSOSStatus } from './sosApi.js';
import { useRealtimeSOS } from './useRealtimeSOS.js';
import { useAppSelector } from '../../hooks/useStore.js';

const urgencyOptions = ['low', 'medium', 'high', 'critical'];

const statusTone = {
  created: 'warning',
  accepted: 'success',
  in_progress: 'neutral',
  completed: 'success',
  cancelled: 'danger',
  rejected: 'danger'
};

export default function SOSPanel() {
  const profile = useAppSelector((state) => state.auth.profile);
  const { items, loading } = useRealtimeSOS(profile);

  const [form, setForm] = useState({ bloodGroup: 'O+', urgency: 'critical', city: 'Delhi', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const byStatus = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {
        created: 0,
        accepted: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0
      }
    );
  }, [items]);

  const onCreateSOS = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const coords = cityCoordinates[form.city];
      await createSOSRequest({
        bloodGroup: form.bloodGroup,
        urgency: form.urgency,
        notes: form.notes,
        location: {
          city: form.city,
          address: `${form.city} Emergency Zone`,
          lat: coords.lat,
          lng: coords.lng
        }
      });
      setForm((prev) => ({ ...prev, notes: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  const actionButtons = (item) => {
    const isCoordinator = ['hospital', 'blood_bank', 'admin'].includes(profile?.role);
    const candidates = item.candidateResponderUids || item.candidateDonorUids || [];
    const isResponder = candidates.includes(profile?.uid);
    const isRequester = item.requesterUid === profile?.uid;
    const isActive = !['completed', 'cancelled'].includes(item.status);

    if (isResponder && item.status === 'created' && !item.acceptedResponderUid) {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
            onClick={() => updateSOSStatus(item.id, { status: 'accepted' })}
          >
            Accept
          </button>
          <button
            type="button"
            className="rounded bg-rose-600 px-2 py-1 text-xs text-white"
            onClick={() => updateSOSStatus(item.id, { status: 'rejected' })}
          >
            Reject
          </button>
        </div>
      );
    }

    if (isCoordinator && ['accepted', 'in_progress', 'created'].includes(item.status)) {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-brand-600 px-2 py-1 text-xs text-white"
            onClick={() => updateSOSStatus(item.id, { status: 'in_progress' })}
          >
            In Progress
          </button>
          <button
            type="button"
            className="rounded bg-emerald-700 px-2 py-1 text-xs text-white"
            onClick={() => updateSOSStatus(item.id, { status: 'completed' })}
          >
            Complete
          </button>
          {isActive ? (
            <button
              type="button"
              className="rounded bg-slate-600 px-2 py-1 text-xs text-white"
              onClick={() => updateSOSStatus(item.id, { status: 'cancelled' })}
            >
              Cancel
            </button>
          ) : null}
        </div>
      );
    }

    if (isRequester && isActive) {
      return (
        <button
          type="button"
          className="rounded bg-slate-600 px-2 py-1 text-xs text-white"
          onClick={() => updateSOSStatus(item.id, { status: 'cancelled' })}
        >
          Cancel
        </button>
      );
    }

    return <span className="text-xs text-slate-500 dark:text-slate-300">No actions available</span>;
  };

  const canCreateSOS = ['user', 'donor', 'hospital', 'blood_bank', 'admin'].includes(profile?.role);

  return (
    <SectionCard title="SOS Emergency" subtitle="One-click emergency creation and live lifecycle tracking">
      <div className="mb-4 grid gap-3 md:grid-cols-6">
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} className="rounded-lg bg-white/70 p-3 text-center dark:bg-slate-900/70">
            <p className="text-xs uppercase text-slate-500">{status.replace('_', ' ')}</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {canCreateSOS ? (
        <form onSubmit={onCreateSOS} className="mb-4 grid gap-2 md:grid-cols-5">
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
            value={form.urgency}
            onChange={(event) => setForm((prev) => ({ ...prev, urgency: event.target.value }))}
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            {urgencyOptions.map((urgency) => (
              <option key={urgency}>{urgency}</option>
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
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Emergency notes"
            className="rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <button disabled={submitting} className="rounded-lg bg-rose-600 px-3 py-2 text-white">
            {submitting ? 'Submitting...' : 'Trigger SOS'}
          </button>
        </form>
      ) : null}

      <div className="space-y-2">
        {loading ? <p className="text-sm">Loading SOS feed...</p> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {item.bloodGroup} | {item.location?.city} | {item.urgency}
              </p>
              <Badge tone={statusTone[item.status] || 'neutral'}>{item.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {new Date(item.createdAt).toLocaleString()} | Candidates:{' '}
              {item.candidateResponderUids?.length || item.candidateDonorUids?.length || 0}
            </p>
            {item.acceptedResponderUid ? (
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Accepted by: {item.acceptedResponderUid}
              </p>
            ) : null}
            <div className="mt-2">{actionButtons(item)}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
