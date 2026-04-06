import { useEffect, useMemo, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import LocationMap from '../../components/maps/LocationMap.jsx';
import { bloodGroups, cityCoordinates } from '../../lib/options.js';
import {
  applyForCamp,
  createCamp,
  listCampApplications,
  listDonationCertificates,
  listDonorRegistry,
  listMyCampApplications,
  updateCampApplication
} from './campApi.js';
import { useRealtimeCamps } from './useRealtimeCamps.js';
import { useAppSelector } from '../../hooks/useStore.js';

const organizerRoles = ['ngo', 'hospital', 'admin', 'blood_bank'];
const communityRoles = ['user', 'donor'];

const campStatus = (camp) => {
  const now = new Date();
  const start = new Date(camp.startAt);
  const end = new Date(camp.endAt);
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
};

const toneForStatus = (status) => {
  if (status === 'upcoming') return 'warning';
  if (status === 'ongoing') return 'success';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'completed') return 'neutral';
  return 'neutral';
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
  const [myApplications, setMyApplications] = useState([]);
  const [managedApplications, setManagedApplications] = useState({});
  const [donorRegistry, setDonorRegistry] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [completionUnits, setCompletionUnits] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isOrganizer = organizerRoles.includes(profile?.role);
  const isCommunity = communityRoles.includes(profile?.role);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => campStatus(item) === filter);
  }, [filter, items]);

  const managedCamps = useMemo(() => {
    if (!profile) return [];
    return items.filter((camp) => profile.role === 'admin' || camp.createdBy === profile.uid);
  }, [items, profile]);

  const markers = filtered
    .filter((item) => item.location?.lat && item.location?.lng)
    .map((item) => ({
      id: item.id,
      lat: item.location.lat,
      lng: item.location.lng,
      title: item.name
    }));

  useEffect(() => {
    const loadExtras = async () => {
      if (!profile) return;

      try {
        if (isCommunity) {
          const [applications, certificateRows] = await Promise.all([
            listMyCampApplications(),
            listDonationCertificates()
          ]);
          setMyApplications(applications);
          setCertificates(certificateRows);
        }

        if (isOrganizer) {
          const registry = await listDonorRegistry({ availableOnly: true });
          setDonorRegistry(registry);

          const applicationLists = await Promise.all(
            managedCamps.map(async (camp) => {
              const applications = await listCampApplications(camp.id);
              return [camp.id, applications];
            })
          );

          setManagedApplications(Object.fromEntries(applicationLists));
        }
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load camp details.');
      }
    };

    loadExtras();
  }, [profile, isCommunity, isOrganizer, managedCamps]);

  const submitCamp = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
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

      setForm((prev) => ({
        ...prev,
        name: '',
        organizer: profile?.displayName || '',
        email: '',
        phone: ''
      }));
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || 'Unable to create camp.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async (campId) => {
    setError('');
    try {
      await applyForCamp(campId);
      setMyApplications(await listMyCampApplications());
    } catch (applyError) {
      setError(applyError?.response?.data?.message || applyError?.message || 'Unable to apply for camp.');
    }
  };

  const handleApplicationUpdate = async (campId, applicationId, payload) => {
    setError('');
    try {
      await updateCampApplication(campId, applicationId, payload);
      setManagedApplications((prev) => ({
        ...prev,
        [campId]: (prev[campId] || []).map((application) =>
          application.id === applicationId ? { ...application, ...payload } : application
        )
      }));
      const refreshed = await listCampApplications(campId);
      setManagedApplications((prev) => ({ ...prev, [campId]: refreshed }));
    } catch (updateError) {
      setError(
        updateError?.response?.data?.message || updateError?.message || 'Unable to update camp application.'
      );
    }
  };

  return (
    <SectionCard title="Donation Camp Finder" subtitle="Create, discover, approve, and complete real camp donations">
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

      {isOrganizer ? (
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
          <button disabled={submitting} className="rounded-lg bg-brand-600 px-3 py-2 text-white">
            {submitting ? 'Creating...' : 'Create Camp'}
          </button>
        </form>
      ) : null}

      {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {loading ? <p className="text-sm">Loading camps...</p> : null}
          {filtered.map((camp) => {
            const existingApplication = myApplications.find((application) => application.campId === camp.id);
            const applications = managedApplications[camp.id] || [];
            const canManageCamp = isOrganizer && (profile?.role === 'admin' || camp.createdBy === profile?.uid);

            return (
              <div key={camp.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="font-semibold">{camp.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {camp.location?.city} | {new Date(camp.startAt).toLocaleString()}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge tone={toneForStatus(campStatus(camp))}>{campStatus(camp)}</Badge>
                  <p className="text-xs">Need: {(camp.requiredBloodGroups || []).join(', ')}</p>
                </div>

                {isCommunity ? (
                  <div className="mt-3">
                    {existingApplication ? (
                      <div className="flex items-center gap-2">
                        <Badge tone={toneForStatus(existingApplication.status)}>{existingApplication.status}</Badge>
                        {existingApplication.certificateNumber ? (
                          <p className="text-xs text-slate-500 dark:text-slate-300">
                            Certificate: {existingApplication.certificateNumber}
                          </p>
                        ) : null}
                      </div>
                    ) : campStatus(camp) !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => handleApply(camp.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white"
                      >
                        Apply for Donation
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {canManageCamp ? (
                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applications</p>
                    {applications.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-300">No applications yet.</p>
                    ) : (
                      applications.map((application) => (
                        <div key={application.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              {application.applicantName} | {application.bloodGroup || 'N/A'}
                            </p>
                            <Badge tone={toneForStatus(application.status)}>{application.status}</Badge>
                          </div>
                          {application.reviewNotes ? (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                              Notes: {application.reviewNotes}
                            </p>
                          ) : null}
                          {application.certificateNumber ? (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                              Certificate: {application.certificateNumber}
                            </p>
                          ) : null}

                          {application.status === 'pending' ? (
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleApplicationUpdate(camp.id, application.id, { status: 'approved' })}
                                className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplicationUpdate(camp.id, application.id, { status: 'rejected' })}
                                className="rounded bg-rose-600 px-2 py-1 text-xs text-white"
                              >
                                Reject
                              </button>
                            </div>
                          ) : null}

                          {application.status === 'approved' ? (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={completionUnits[application.id] || 1}
                                onChange={(event) =>
                                  setCompletionUnits((prev) => ({
                                    ...prev,
                                    [application.id]: Number(event.target.value)
                                  }))
                                }
                                className="w-20 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleApplicationUpdate(camp.id, application.id, {
                                    status: 'completed',
                                    units: completionUnits[application.id] || 1
                                  })
                                }
                                className="rounded bg-brand-600 px-2 py-1 text-xs text-white"
                              >
                                Complete Donation
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <LocationMap markers={markers} center={cityCoordinates.Delhi} zoom={5} />

          {isOrganizer ? (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-sm font-semibold">Available Donor Registry</p>
              <div className="mt-2 max-h-56 space-y-2 overflow-auto">
                {donorRegistry.map((member) => (
                  <div key={member.uid} className="rounded-lg bg-slate-50 p-2 text-sm dark:bg-slate-900/60">
                    <p className="font-medium">{member.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {member.bloodGroup} | {member.location?.city} | {member.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {isCommunity ? (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-sm font-semibold">My Donation Certificates</p>
              <div className="mt-2 max-h-56 space-y-2 overflow-auto">
                {certificates.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No certificates yet.</p>
                ) : (
                  certificates.map((certificate) => (
                    <div key={certificate._id} className="rounded-lg bg-slate-50 p-2 text-sm dark:bg-slate-900/60">
                      <p className="font-medium">{certificate.campName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        {certificate.certificateNumber} | {certificate.units} unit(s) |{' '}
                        {new Date(certificate.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
