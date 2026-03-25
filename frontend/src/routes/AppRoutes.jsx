import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import OnboardingPage from '../pages/auth/OnboardingPage.jsx';
import DashboardPage from '../pages/dashboards/DashboardPage.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { useAppSelector } from '../hooks/useStore.js';

export const AppRoutes = () => {
  const token = useAppSelector((state) => state.auth.token);

  return (
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
  );
};
