import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { useAppSelector } from '../hooks/useStore.js';

const LandingPage = lazy(() => import('../pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage.jsx'));
const OnboardingPage = lazy(() => import('../pages/auth/OnboardingPage.jsx'));
const DashboardPage = lazy(() => import('../pages/dashboards/DashboardPage.jsx'));

export const AppRoutes = () => {
  const token = useAppSelector((state) => state.auth.token);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4 text-sm text-slate-500 dark:text-slate-300">
          Loading LifeLedger...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/'} replace />} />
      </Routes>
    </Suspense>
  );
};
