import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, saveProfile } from '../../features/auth/authService.js';
import { useAppDispatch } from '../../hooks/useStore.js';
import { setProfile, setSession } from '../../features/auth/authSlice.js';
import { bloodGroups, cityCoordinates, roles } from '../../lib/options.js';
import { getAuthErrorMessage } from '../../features/auth/authErrorMessage.js';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    bloodGroup: 'O+',
    city: 'Delhi',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await registerUser({ email: form.email, password: form.password });
      const token = await user.getIdToken();
      dispatch(setSession({ user, token }));

      const coords = cityCoordinates[form.city];
      const payload = {
        displayName: form.displayName,
        phone: form.phone,
        role: form.role,
        bloodGroup: form.bloodGroup,
        ...(form.role === 'donor' || form.role === 'user' || form.role === 'hospital'
          ? { availabilityStatus: true }
          : {}),
        location: {
          city: form.city,
          address: form.address.trim(),
          lat: coords.lat,
          lng: coords.lng
        }
      };

      const profile = await saveProfile(payload);
      dispatch(setProfile(profile));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Unable to register.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-12 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />

      <form onSubmit={onSubmit} className="glass-card relative mx-auto w-full max-w-xl rounded-3xl p-6 space-y-4 md:p-8">
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-700 dark:text-brand-300">
          LifeLedger
        </Link>
        <h1 className="text-3xl font-extrabold">Create Your Account</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Join as a donor, user, hospital, blood bank, or admin.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Full name"
            value={form.displayName}
            onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            minLength={8}
            required
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            required
          />
          <select
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
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
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            {Object.keys(cityCoordinates).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            value={form.bloodGroup}
            onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            {bloodGroups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Address"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 md:col-span-2 dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">
          {loading ? 'Creating account...' : 'Register'}
        </button>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
