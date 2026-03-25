import { useEffect, useMemo, useState } from 'react';
import SectionCard from '../../components/common/SectionCard.jsx';
import { bloodGroups, cityCoordinates } from '../../lib/options.js';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore.js';
import { setProfile } from '../auth/authSlice.js';
import { changeUserPassword, updateProfile } from '../auth/authService.js';

const availabilityRoles = ['donor', 'user', 'hospital'];

export default function ProfilePanel() {
  const profile = useAppSelector((state) => state.auth.profile);
  const dispatch = useAppDispatch();

  const cityOptions = useMemo(() => {
    const cities = Object.keys(cityCoordinates);
    if (profile?.location?.city && !cities.includes(profile.location.city)) {
      return [...cities, profile.location.city];
    }
    return cities;
  }, [profile?.location?.city]);

  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    bloodGroup: 'O+',
    city: 'Delhi',
    address: '',
    availabilityStatus: true
  });
  const [saveState, setSaveState] = useState({ loading: false, error: '', success: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordState, setPasswordState] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    if (!profile) return;
    setForm({
      displayName: profile.displayName || '',
      phone: profile.phone || '',
      bloodGroup: profile.bloodGroup || 'O+',
      city: profile.location?.city || 'Delhi',
      address: profile.location?.address || '',
      availabilityStatus: profile.availabilityStatus !== false
    });
  }, [profile]);

  const onSaveProfile = async (event) => {
    event.preventDefault();
    if (!profile) return;

    setSaveState({ loading: true, error: '', success: '' });

    try {
      const cityMeta = cityCoordinates[form.city] || {
        lat: profile.location?.lat,
        lng: profile.location?.lng
      };

      const next = await updateProfile({
        displayName: form.displayName,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        ...(availabilityRoles.includes(profile.role)
          ? { availabilityStatus: Boolean(form.availabilityStatus) }
          : {}),
        location: {
          city: form.city,
          address: form.address,
          lat: cityMeta.lat,
          lng: cityMeta.lng
        }
      });

      dispatch(setProfile(next));
      setSaveState({ loading: false, error: '', success: 'Profile updated successfully.' });
    } catch (error) {
      setSaveState({
        loading: false,
        error: error?.response?.data?.message || error?.message || 'Failed to update profile.',
        success: ''
      });
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    setPasswordState({ loading: true, error: '', success: '' });

    if (passwordForm.newPassword.length < 8) {
      setPasswordState({ loading: false, error: 'New password must be at least 8 characters.', success: '' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordState({ loading: false, error: 'New password and confirmation do not match.', success: '' });
      return;
    }

    try {
      await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordState({ loading: false, error: '', success: 'Password updated successfully.' });
    } catch (error) {
      setPasswordState({
        loading: false,
        error: error?.message || 'Unable to update password. Re-login and try again.',
        success: ''
      });
    }
  };

  return (
    <SectionCard title="Profile" subtitle="Edit your personal details and account security settings">
      <form onSubmit={onSaveProfile} className="grid gap-2 md:grid-cols-3">
        <input
          type="text"
          value={form.displayName}
          onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Full name"
          required
        />
        <input
          type="tel"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Phone"
          required
        />
        <select
          value={form.bloodGroup}
          onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {bloodGroups.map((bg) => (
            <option key={bg}>{bg}</option>
          ))}
        </select>
        <select
          value={form.city}
          onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {cityOptions.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
        <input
          type="text"
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Address"
          required
        />
        {availabilityRoles.includes(profile?.role) ? (
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700">
            <input
              type="checkbox"
              checked={form.availabilityStatus}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, availabilityStatus: event.target.checked }))
              }
            />
            <span className="text-sm">Available for SOS matching</span>
          </label>
        ) : null}
        <button
          type="submit"
          disabled={saveState.loading}
          className="rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white"
        >
          {saveState.loading ? 'Saving...' : 'Update Profile'}
        </button>
      </form>

      {saveState.error ? <p className="mt-2 text-sm text-rose-600">{saveState.error}</p> : null}
      {saveState.success ? <p className="mt-2 text-sm text-emerald-600">{saveState.success}</p> : null}

      <div className="my-4 h-px bg-slate-200 dark:bg-slate-700" />

      <form onSubmit={onChangePassword} className="grid gap-2 md:grid-cols-3">
        <input
          type="password"
          value={passwordForm.currentPassword}
          onChange={(event) =>
            setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Current password"
          required
        />
        <input
          type="password"
          value={passwordForm.newPassword}
          onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="New password"
          minLength={8}
          required
        />
        <input
          type="password"
          value={passwordForm.confirmPassword}
          onChange={(event) =>
            setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Confirm new password"
          minLength={8}
          required
        />
        <button
          type="submit"
          disabled={passwordState.loading}
          className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
        >
          {passwordState.loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>

      {passwordState.error ? <p className="mt-2 text-sm text-rose-600">{passwordState.error}</p> : null}
      {passwordState.success ? <p className="mt-2 text-sm text-emerald-600">{passwordState.success}</p> : null}
    </SectionCard>
  );
}
