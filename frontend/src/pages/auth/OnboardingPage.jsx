import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveProfile } from '../../features/auth/authService.js';
import { useAppDispatch } from '../../hooks/useStore.js';
import { setProfile } from '../../features/auth/authSlice.js';
import {
  bloodGroups,
  countries,
  getDistrictsForState,
  getLocationMeta,
  getStatesForCountry,
  roles
} from '../../lib/options.js';
import { getAuthErrorMessage } from '../../features/auth/authErrorMessage.js';

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    role: '',
    bloodGroup: '',
    country: '',
    state: '',
    district: '',
    addressLine: ''
  });
  const [error, setError] = useState('');

  const isIndividual = form.role === 'user';
  const stateOptions = useMemo(() => getStatesForCountry(form.country), [form.country]);
  const districtOptions = useMemo(
    () => getDistrictsForState(form.country, form.state),
    [form.country, form.state]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const locationMeta = getLocationMeta(form.country, form.state, form.district);
      if (!locationMeta) {
        throw new Error('Please complete your address selection.');
      }

      const profile = await saveProfile({
        displayName: form.displayName,
        phone: form.phone,
        role: form.role,
        ...(isIndividual ? { bloodGroup: form.bloodGroup, availabilityStatus: true } : {}),
        location: {
          country: form.country,
          state: form.state,
          district: form.district,
          city: form.district,
          address: form.addressLine.trim(),
          lat: locationMeta.lat,
          lng: locationMeta.lng
        }
      });
      dispatch(setProfile(profile));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Unable to save profile.'));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-brand-300/35 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl" />

      <form onSubmit={onSubmit} className="glass-card relative mx-auto w-full max-w-2xl rounded-3xl p-6 space-y-4 md:p-8">
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-700 dark:text-brand-300">
          LifeLedger
        </Link>
        <h1 className="text-3xl font-extrabold">Complete Your Profile</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Finalize your role and location details to unlock your dashboard modules.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            required
            value={form.displayName}
            onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Full name or organization name"
          />
          <input
            required
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Phone number"
          />
          <select
            value={form.role}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                role: event.target.value,
                bloodGroup: event.target.value === 'user' ? prev.bloodGroup : ''
              }))
            }
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            required
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value} disabled={role.disabled}>
                {role.label}
              </option>
            ))}
          </select>
          {isIndividual ? (
            <select
              value={form.bloodGroup}
              onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              required
            >
              <option value="">Please select blood group</option>
              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Blood group is only required for individual users.
            </div>
          )}
          <select
            value={form.country}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                country: event.target.value,
                state: '',
                district: ''
              }))
            }
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            required
          >
            <option value="">Please select country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <select
            value={form.state}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                state: event.target.value,
                district: ''
              }))
            }
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            disabled={!form.country}
            required
          >
            <option value="">Please select state</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select
            value={form.district}
            onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            disabled={!form.state}
            required
          >
            <option value="">Please select district</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          <input
            required
            value={form.addressLine}
            onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Address line"
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="w-full rounded-lg bg-brand-600 px-4 py-2 text-white font-semibold">Save Profile</button>
      </form>
    </div>
  );
}
