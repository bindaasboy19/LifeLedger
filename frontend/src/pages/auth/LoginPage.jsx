import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser, fetchMyProfile } from '../../features/auth/authService.js';
import { useAppDispatch } from '../../hooks/useStore.js';
import { setProfile, setSession } from '../../features/auth/authSlice.js';
import { getAuthErrorMessage } from '../../features/auth/authErrorMessage.js';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await loginUser(form);
      const token = await user.getIdToken();
      dispatch(setSession({ user, token }));

      try {
        const profile = await fetchMyProfile();
        dispatch(setProfile(profile));
        navigate(location.state?.from || '/dashboard', { replace: true });
      } catch (profileError) {
        if (profileError?.response?.status === 404) {
          navigate('/onboarding', { replace: true });
          return;
        }

        setError(
          getAuthErrorMessage(
            profileError,
            'Logged in, but profile could not be loaded. Ensure backend is running and reachable.'
          )
        );
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Unable to login.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-0 h-60 w-60 rounded-full bg-rose-300/30 blur-3xl" />

      <form onSubmit={onSubmit} className="glass-card relative mx-auto w-full max-w-md rounded-3xl p-6 space-y-4 md:p-8">
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-700 dark:text-brand-300">
          LifeLedger
        </Link>
        <h1 className="text-3xl font-extrabold">Welcome Back</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Sign in to continue emergency coordination.</p>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">
          {loading ? 'Signing in...' : 'Login'}
        </button>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          New user?{' '}
          <Link to="/register" className="font-semibold text-brand-600">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
