import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { api } from '../../lib/api.js';
import Badge from '../../components/common/Badge.jsx';

export default function AdminPanel() {
  const [queue, setQueue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [sosLogs, setSosLogs] = useState([]);
  const [prototypeResult, setPrototypeResult] = useState(null);
  const [actionError, setActionError] = useState('');
  const [loadingError, setLoadingError] = useState('');
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setLoadingError('');
    try {
      const [queueRes, analyticsRes, logsRes] = await Promise.all([
        api.get('/admin/verification-queue'),
        api.get('/admin/analytics'),
        api.get('/admin/sos-logs')
      ]);

      setQueue(queueRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setSosLogs(logsRes.data.data);
    } catch (error) {
      setLoadingError(error.response?.data?.message || error.message || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const verify = async (uid, isVerified) => {
    setActionError('');
    await api.patch(`/admin/verify/${uid}`, { isVerified });
    await load();
  };

  const block = async (uid, isBlocked) => {
    setActionError('');
    await api.patch(`/admin/block/${uid}`, { isBlocked, reason: isBlocked ? 'Demo moderation action' : '' });
    await load();
  };

  const seedPrototype = async () => {
    setSeeding(true);
    setActionError('');

    try {
      const { data } = await api.post('/admin/prototype-seed');
      setPrototypeResult(data.data);
      await load();
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || 'Prototype generation failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Admin Governance"
        subtitle="Account verification, moderation, SOS logs"
        action={
          <button
            type="button"
            onClick={seedPrototype}
            disabled={seeding}
            className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {seeding ? 'Generating...' : 'Generate Prototype Activity'}
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-5">
          <StatCard label="Users" value={analytics?.totals?.users || 0} />
          <StatCard label="Stock entries" value={analytics?.totals?.stockEntries || 0} />
          <StatCard label="Camps" value={analytics?.totals?.camps || 0} />
          <StatCard label="SOS" value={analytics?.totals?.sosCount || 0} />
          <StatCard label="Donations" value={analytics?.totals?.donationsCount || 0} />
        </div>
        {prototypeResult ? (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
            Prototype data generated: {prototypeResult.stocksCreated} stocks, {prototypeResult.sosCreated} SOS,
            {` ${prototypeResult.campsCreated}`} camp, {` ${prototypeResult.notificationsCreated}`} notifications.
          </div>
        ) : null}
        {actionError ? (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
            {actionError}
          </div>
        ) : null}
        {loadingError ? (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
            {loadingError}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Verification Queue" subtitle="Approve hospitals and blood banks">
        <div className="space-y-2">
          {queue.length === 0 ? <p className="text-sm text-slate-500">No pending verifications.</p> : null}
          {queue.map((item) => (
            <div key={item.uid} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {item.displayName} ({item.role})
                </p>
                <button
                  type="button"
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                  onClick={() => verify(item.uid, true)}
                >
                  Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="SOS Logs" subtitle="Recent SOS lifecycle events">
        <div className="space-y-2 max-h-72 overflow-auto">
          {sosLogs.slice(0, 20).map((log) => (
            <div key={log._id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {log.bloodGroup} | {log.location?.city}
                </p>
                <Badge tone={log.status === 'completed' ? 'success' : log.status === 'cancelled' ? 'danger' : 'warning'}>
                  {log.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Requester: {log.requesterUid}</p>
              <button
                type="button"
                className="mt-2 rounded bg-rose-700 px-2 py-1 text-xs text-white"
                onClick={() => block(log.requesterUid, true)}
              >
                Block requester
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
