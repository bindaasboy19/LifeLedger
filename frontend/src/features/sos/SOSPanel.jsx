import { useEffect, useMemo, useRef, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import LocationMap from '../../components/maps/LocationMap.jsx';
import { bloodGroups, cityCoordinates } from '../../lib/options.js';
import { createSOSRequest, updateSOSStatus } from './sosApi.js';
import { useRealtimeSOS } from './useRealtimeSOS.js';
import { useAppSelector } from '../../hooks/useStore.js';

const urgencyOptions = ['low', 'medium', 'high', 'critical'];
const activeStatuses = ['open', 'accepted', 'in_progress', 'pending_review'];
const finalStatuses = ['completed', 'cancelled', 'expired', 'unmatched'];

const statusTone = {
  open: 'warning',
  accepted: 'success',
  in_progress: 'neutral',
  completed: 'success',
  cancelled: 'danger',
  unmatched: 'danger',
  pending_review: 'warning',
  expired: 'danger',
  rejected: 'danger'
};

const formatStatus = (status) => String(status || 'unknown').replace(/_/g, ' ');

const getDefaultCity = (profile) => {
  const city = profile?.location?.city;
  return city && cityCoordinates[city] ? city : 'Delhi';
};

const buildFallbackLocation = (city) => {
  const coords = cityCoordinates[city] || cityCoordinates.Delhi;
  return {
    city,
    district: city,
    state: 'Unknown',
    country: 'India',
    address: `${city} Emergency Zone`,
    lat: coords.lat,
    lng: coords.lng
  };
};

const useCounts = (items) =>
  useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const key = item.status || 'open';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        {
          open: 0,
          accepted: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          unmatched: 0,
          pending_review: 0,
          expired: 0
        }
      ),
    [items]
  );

const canCreateSOSForRole = (role) => ['user', 'hospital', 'blood_bank', 'admin'].includes(role);

export default function SOSPanel() {
  const profile = useAppSelector((state) => state.auth.profile);
  const { items, offersBySosId, trackingBySosId, loading } = useRealtimeSOS(profile);

  const [form, setForm] = useState(() => ({
    bloodGroup: profile?.bloodGroup || 'O+',
    urgency: 'critical',
    city: getDefaultCity(profile),
    notes: '',
    useLiveLocation: false
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [geoStatus, setGeoStatus] = useState('');
  const [actionPendingId, setActionPendingId] = useState('');
  const [focusedSosId, setFocusedSosId] = useState('');

  const lastTrackingSendRef = useRef({});
  const watchIdRef = useRef(null);

  const counts = useCounts(items);

  const sortedItems = useMemo(() => {
    const weight = {
      accepted: 0,
      in_progress: 1,
      open: 2,
      pending_review: 3,
      unmatched: 4,
      completed: 5,
      cancelled: 6,
      expired: 7
    };

    return [...items].sort((a, b) => {
      const aWeight = weight[a.status] ?? 99;
      const bWeight = weight[b.status] ?? 99;
      if (aWeight !== bWeight) return aWeight - bWeight;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [items]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      bloodGroup: profile?.bloodGroup || prev.bloodGroup,
      city: prev.city || getDefaultCity(profile)
    }));
  }, [profile?.bloodGroup, profile?.location?.city]);

  useEffect(() => {
    if (!sortedItems.length) {
      setFocusedSosId('');
      return;
    }

    if (focusedSosId && sortedItems.some((item) => item.id === focusedSosId)) {
      return;
    }

    const preferred =
      sortedItems.find((item) => item.id === focusedSosId) ||
      sortedItems.find((item) => item.acceptedDonorId === profile?.uid) ||
      sortedItems.find((item) => item.requesterUid === profile?.uid && activeStatuses.includes(item.status)) ||
      sortedItems[0];

    setFocusedSosId(preferred?.id || '');
  }, [focusedSosId, profile?.uid, sortedItems]);

  const focusedItem = useMemo(
    () => sortedItems.find((item) => item.id === focusedSosId) || sortedItems[0] || null,
    [focusedSosId, sortedItems]
  );

  useEffect(() => {
    const activeTrackedSos = sortedItems.find(
      (item) => item.acceptedDonorId === profile?.uid && ['accepted', 'in_progress'].includes(item.status)
    );

    if (!activeTrackedSos || !navigator.geolocation) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return undefined;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lastSentAt = lastTrackingSendRef.current[activeTrackedSos.id] || 0;
        if (Date.now() - lastSentAt < 12000) return;

        lastTrackingSendRef.current[activeTrackedSos.id] = Date.now();
        setGeoStatus('Live location sharing is active for the accepted SOS.');

        try {
          await updateSOSStatus(activeTrackedSos.id, {
            status: activeTrackedSos.status,
            liveLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              heading: position.coords.heading ?? null,
              speed: position.coords.speed ?? null
            }
          });
        } catch {
          setGeoStatus('Unable to update live location right now.');
        }
      },
      () => {
        setGeoStatus('Location permission is unavailable. Route tracking will stay in fallback mode.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [profile?.uid, sortedItems]);

  const onCreateSOS = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const fallbackLocation = buildFallbackLocation(form.city);
      const payload = {
        bloodGroup: form.bloodGroup,
        urgency: form.urgency,
        notes: form.notes,
        location: fallbackLocation
      };

      if (form.useLiveLocation && navigator.geolocation) {
        const livePosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          });
        });

        payload.location = {
          ...fallbackLocation,
          lat: livePosition.coords.latitude,
          lng: livePosition.coords.longitude,
          address: profile?.location?.address || fallbackLocation.address,
          district: profile?.location?.district || fallbackLocation.district,
          state: profile?.location?.state || fallbackLocation.state,
          country: profile?.location?.country || fallbackLocation.country
        };
      }

      const created = await createSOSRequest(payload);
      setSuccessMessage(
        created?.status === 'pending_review'
          ? 'SOS created and queued for review.'
          : 'SOS created and dispatched to eligible nearby users.'
      );
      setForm((prev) => ({ ...prev, notes: '' }));
      if (created?.id) {
        setFocusedSosId(created.id);
      }
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          'Unable to create SOS right now. Please check your profile and network, then try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const performAction = async (id, payload, successText) => {
    setActionPendingId(id);
    setError('');
    setSuccessMessage('');

    try {
      await updateSOSStatus(id, payload);
      setSuccessMessage(successText);
    } catch (actionError) {
      setError(actionError?.response?.data?.message || 'Unable to update this SOS right now.');
    } finally {
      setActionPendingId('');
    }
  };

  const renderActions = (item) => {
    const isCoordinator = ['hospital', 'blood_bank', 'admin'].includes(profile?.role);
    const isRequester = item.requesterUid === profile?.uid;
    const isAcceptedDonor = item.acceptedDonorId === profile?.uid;
    const activeOffer = offersBySosId[item.id];
    const legacyEligible = (item.candidateResponderUids || item.candidateDonorUids || []).includes(profile?.uid);
    const responderEligible = Boolean(activeOffer) || legacyEligible;
    const actionBusy = actionPendingId === item.id;

    if (activeOffer && item.status === 'open') {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionBusy}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() => performAction(item.id, { status: 'accepted' }, 'SOS accepted. Live tracking has started.')}
          >
            {actionBusy ? 'Working...' : 'Accept SOS'}
          </button>
          <button
            type="button"
            disabled={actionBusy}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() => performAction(item.id, { status: 'rejected', reason: 'donor_unavailable' }, 'SOS offer declined.')}
          >
            Reject
          </button>
        </div>
      );
    }

    if (isAcceptedDonor && item.status === 'accepted') {
      return (
        <button
          type="button"
          disabled={actionBusy}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          onClick={() => performAction(item.id, { status: 'cancelled', reason: 'accepted_donor_cancelled' }, 'SOS reopened and redispatched.')}
        >
          {actionBusy ? 'Working...' : 'Cancel And Reopen'}
        </button>
      );
    }

    if (isCoordinator && ['open', 'accepted', 'in_progress', 'unmatched', 'pending_review'].includes(item.status)) {
      return (
        <div className="flex flex-wrap gap-2">
          {['accepted', 'in_progress'].includes(item.status) ? (
            <button
              type="button"
              disabled={actionBusy}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => performAction(item.id, { status: 'in_progress' }, 'SOS moved to in progress.')}
            >
              Mark In Progress
            </button>
          ) : null}
          {['accepted', 'in_progress'].includes(item.status) ? (
            <button
              type="button"
              disabled={actionBusy}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => performAction(item.id, { status: 'completed' }, 'SOS marked as completed.')}
            >
              Complete
            </button>
          ) : null}
          {['unmatched', 'pending_review'].includes(item.status) ? (
            <button
              type="button"
              disabled={actionBusy}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => performAction(item.id, { status: 'open', reason: 'manual_redispatch' }, 'SOS reopened for dispatch.')}
            >
              Reopen Dispatch
            </button>
          ) : null}
          {!finalStatuses.includes(item.status) ? (
            <button
              type="button"
              disabled={actionBusy}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => performAction(item.id, { status: 'cancelled', reason: 'coordinator_cancelled' }, 'SOS cancelled.')}
            >
              Cancel
            </button>
          ) : null}
        </div>
      );
    }

    if (isRequester && !finalStatuses.includes(item.status)) {
      return (
        <button
          type="button"
          disabled={actionBusy}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          onClick={() => performAction(item.id, { status: 'cancelled', reason: 'requester_cancelled' }, 'SOS cancelled.')}
        >
          {actionBusy ? 'Working...' : 'Cancel SOS'}
        </button>
      );
    }

    if (profile?.role === 'user') {
      return (
        <span className="text-xs text-slate-500 dark:text-slate-300">
          {responderEligible
            ? 'You are eligible for this SOS. Action will unlock if an offer reaches you.'
            : 'View only. Only matched users with a live offer can respond.'}
        </span>
      );
    }

    return <span className="text-xs text-slate-500 dark:text-slate-300">No actions available.</span>;
  };

  const focusedTracking = focusedItem ? trackingBySosId[focusedItem.id] : null;
  const canCreateSOS = canCreateSOSForRole(profile?.role);
  const focusedMarkers = useMemo(() => {
    if (!focusedItem) return [];

    const markers = [];
    if (focusedItem.location?.lat && focusedItem.location?.lng) {
      markers.push({
        id: `${focusedItem.id}-requester`,
        lat: focusedItem.location.lat,
        lng: focusedItem.location.lng,
        title: `${focusedItem.bloodGroup} requester`
      });
    }

    if (focusedTracking?.lastLocation?.lat && focusedTracking?.lastLocation?.lng) {
      markers.push({
        id: `${focusedItem.id}-donor`,
        lat: focusedTracking.lastLocation.lat,
        lng: focusedTracking.lastLocation.lng,
        title: 'Accepted donor live location'
      });
    }

    return markers;
  }, [focusedItem, focusedTracking]);

  return (
    <SectionCard title="SOS Emergency Dispatch" subtitle="Create, dispatch, lock, track, and resolve blood emergencies in real time">
      <div className="mb-4 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="rounded-2xl border border-white/50 bg-white/70 p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{formatStatus(status)}</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{count}</p>
          </div>
        ))}
      </div>

      {canCreateSOS ? (
        <form onSubmit={onCreateSOS} className="mb-4 rounded-2xl border border-rose-200/60 bg-rose-50/70 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="grid gap-2 md:grid-cols-5">
            <select
              value={form.bloodGroup}
              onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              {bloodGroups.map((bg) => (
                <option key={bg}>{bg}</option>
              ))}
            </select>
            <select
              value={form.urgency}
              onChange={(event) => setForm((prev) => ({ ...prev, urgency: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              {urgencyOptions.map((urgency) => (
                <option key={urgency}>{urgency}</option>
              ))}
            </select>
            <select
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              {Object.keys(cityCoordinates).map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              <input
                type="checkbox"
                checked={form.useLiveLocation}
                onChange={(event) => setForm((prev) => ({ ...prev, useLiveLocation: event.target.checked }))}
              />
              Use device location
            </label>
            <button disabled={submitting} className="rounded-xl bg-rose-600 px-3 py-2 font-semibold text-white disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Trigger SOS'}
            </button>
          </div>
          <input
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Emergency notes for donors or coordinators"
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </form>
      ) : null}

      {error ? (
        <div className="mb-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mb-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
          {successMessage}
        </div>
      ) : null}
      {geoStatus ? (
        <div className="mb-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:border-brand-700 dark:bg-brand-950/20 dark:text-brand-200">
          {geoStatus}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="space-y-3">
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-300">Loading SOS feed...</p> : null}
          {!loading && sortedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
              No SOS requests yet. New emergencies will appear here in real time.
            </div>
          ) : null}

          {sortedItems.map((item) => {
            const offer = offersBySosId[item.id];
            const isFocused = focusedItem?.id === item.id;
            const eligibleCount = item.candidateResponderUids?.length || item.candidateDonorUids?.length || 0;
            const itemTracking = trackingBySosId[item.id];
            const isRequester = item.requesterUid === profile?.uid;
            const isAcceptedDonor = item.acceptedDonorId === profile?.uid;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFocusedSosId(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isFocused
                    ? 'border-brand-500 bg-brand-50/70 shadow-lg shadow-brand-500/10 dark:border-brand-400 dark:bg-brand-950/20'
                    : 'border-slate-200 bg-white/70 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {item.bloodGroup} | {item.location?.district || item.location?.city || 'Unknown area'}
                  </p>
                  <Badge tone={statusTone[item.status] || 'neutral'}>{formatStatus(item.status)}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  {new Date(item.createdAt).toLocaleString()} | Urgency: {item.urgency} | Radius: {item.currentRadiusKm || 0} km
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  Eligible matches: {eligibleCount} {offer ? '| You have a live offer.' : ''}
                </p>
                {item.requesterSnapshot?.displayName ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Requester: {item.requesterSnapshot.displayName}
                    {isAcceptedDonor && item.requesterSnapshot.phone ? ` | ${item.requesterSnapshot.phone}` : ''}
                  </p>
                ) : null}
                {item.acceptedDonorId ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Accepted donor: {isAcceptedDonor ? 'You' : item.acceptedDonorId}
                  </p>
                ) : null}
                {itemTracking?.lastHeartbeatAt ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Live tracking updated at {new Date(itemTracking.lastHeartbeatAt).toLocaleTimeString()}
                  </p>
                ) : null}
                {isRequester && item.verifiedStatus ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Verification: {formatStatus(item.verifiedStatus)}
                  </p>
                ) : null}
                <div className="mt-3">{renderActions(item)}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Dispatch Viewer</p>
            {focusedItem ? (
              <>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {focusedItem.location?.address || focusedItem.location?.district || focusedItem.location?.city}
                </p>
                <div className="mt-3">
                  <LocationMap
                    markers={focusedMarkers}
                    center={focusedItem.location || buildFallbackLocation(form.city)}
                    zoom={focusedTracking?.lastLocation ? 11 : 9}
                    origin={focusedTracking?.lastLocation || null}
                    destination={focusedItem.location || null}
                    showDirections={Boolean(focusedTracking?.lastLocation && focusedItem.location?.lat && focusedItem.location?.lng)}
                  />
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <p>Dispatch phase: {focusedItem.dispatchPhase || 0}</p>
                  <p>Current radius: {focusedItem.currentRadiusKm || 0} km</p>
                  <p>Verified status: {formatStatus(focusedItem.verifiedStatus || 'unverified')}</p>
                  <p>
                    Next dispatch: {focusedItem.nextDispatchAt ? new Date(focusedItem.nextDispatchAt).toLocaleString() : 'Not scheduled'}
                  </p>
                  {focusedTracking?.trackingStatus ? <p>Tracking: {formatStatus(focusedTracking.trackingStatus)}</p> : null}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Select an SOS card to inspect dispatch details.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Dispatch Rules In Effect</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-300">
              <li>Only compatible, available, policy-eligible users receive actionable SOS offers.</li>
              <li>Radius expands automatically from 5 km to 10 km to 20 km if no donor accepts.</li>
              <li>The first valid accept locks the SOS. Others immediately become view-only.</li>
              <li>If the accepted donor cancels before handoff, the SOS reopens and redispatches.</li>
            </ul>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
