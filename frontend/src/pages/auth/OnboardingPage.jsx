import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveProfile } from '../../features/auth/authService.js';
import { useAppDispatch } from '../../hooks/useStore.js';
import { setProfile } from '../../features/auth/authSlice.js';
import { bloodGroups, cityCoordinates, roles } from '../../lib/options.js';
import { getAuthErrorMessage } from '../../features/auth/authErrorMessage.js';

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    role: 'user',
    bloodGroup: 'O+',
    city: 'Delhi',
    address: ''
  });
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const coords = cityCoordinates[form.city];
      const profile = await saveProfile({
        displayName: form.displayName,
        phone: form.phone,
        role: form.role,
        bloodGroup: form.bloodGroup,
        ...(form.role === 'user' || form.role === 'donor' || form.role === 'hospital'
          ? { availabilityStatus: true }
          : {}),
        location: {
          city: form.city,
          address: form.address.trim(),
          lat: coords.lat,
          lng: coords.lng
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

      <form onSubmit={onSubmit} className="glass-card relative mx-auto w-full max-w-lg rounded-3xl p-6 space-y-4 md:p-8">
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-700 dark:text-brand-300">
          LifeLedger
        </Link>
        <h1 className="text-3xl font-extrabold">Complete Your Profile</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Finalize role details to unlock your dashboard modules. Admin access is not available from public onboarding.
        </p>
        <input
          required
          value={form.displayName}
          onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Full name"
        />
        <input
          required
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Phone number"
        />
        <select
          value={form.role}
          onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <select
          value={form.city}
          onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {Object.keys(cityCoordinates).map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
        <select
          value={form.bloodGroup}
          onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {bloodGroups.map((bg) => (
            <option key={bg}>{bg}</option>
          ))}
        </select>
        <input
          required
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Address"
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="w-full rounded-lg bg-brand-600 px-4 py-2 text-white font-semibold">Save Profile</button>
      </form>
    </div>
  );
}
