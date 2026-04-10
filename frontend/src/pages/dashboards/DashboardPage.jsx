import { useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout.jsx';
import RealtimeStockPanel from '../../features/stock/RealtimeStockPanel.jsx';
import BloodSearchPanel from '../../features/stock/BloodSearchPanel.jsx';
import StockFlowPanel from '../../features/stock/StockFlowPanel.jsx';
import SOSPanel from '../../features/sos/SOSPanel.jsx';
import CampFinderPanel from '../../features/camps/CampFinderPanel.jsx';
import NotificationPanel from '../../features/notifications/NotificationPanel.jsx';
import DonorPanel from '../../features/dashboard/DonorPanel.jsx';
import PredictionPanel from '../../features/dashboard/PredictionPanel.jsx';
import AdminPanel from '../../features/dashboard/AdminPanel.jsx';
import ProfilePanel from '../../features/dashboard/ProfilePanel.jsx';
import OverviewPanel from '../../features/dashboard/OverviewPanel.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useAppSelector } from '../../hooks/useStore.js';
import { useRealtimeStock } from '../../features/stock/useRealtimeStock.js';
import { useRealtimeSOS } from '../../features/sos/useRealtimeSOS.js';
import { useRealtimeCamps } from '../../features/camps/useRealtimeCamps.js';
import { useRealtimeNotifications } from '../../features/notifications/useRealtimeNotifications.js';

const tabsByRole = {
  user: [
    { id: 'overview', label: 'Overview', module: 'overview' },
    { id: 'profile', label: 'Profile', module: 'profile' },
    { id: 'donor', label: 'Donation', module: 'donor' },
    { id: 'stock', label: 'Stock', module: 'stock' },
    { id: 'search', label: 'Find Blood', module: 'search' },
    { id: 'sos', label: 'SOS', module: 'sos' },
    { id: 'camps', label: 'Camps', module: 'camps' },
    { id: 'notifications', label: 'Notifications', module: 'notifications' }
  ],
  ngo: [
    { id: 'overview', label: 'Overview', module: 'overview' },
    { id: 'profile', label: 'Profile', module: 'profile' },
    { id: 'camps', label: 'Camps', module: 'camps' },
    { id: 'prediction', label: 'AI Prediction', module: 'prediction' },
    { id: 'notifications', label: 'Notifications', module: 'notifications' }
  ],
  donor: [
    { id: 'overview', label: 'Overview', module: 'overview' },
    { id: 'profile', label: 'Profile', module: 'profile' },
    { id: 'donor', label: 'Donation', module: 'donor' },
    { id: 'stock', label: 'Stock', module: 'stock' },
    { id: 'search', label: 'Find Blood', module: 'search' },
    { id: 'sos', label: 'SOS', module: 'sos' },
    { id: 'camps', label: 'Camps', module: 'camps' },
    { id: 'notifications', label: 'Notifications', module: 'notifications' }
  ],
  hospital: [
    { id: 'overview', label: 'Overview', module: 'overview' },
    { id: 'profile', label: 'Profile', module: 'profile' },
    { id: 'stock', label: 'Stock', module: 'stock' },
    { id: 'search', label: 'Find Blood', module: 'search' },
    { id: 'flow', label: 'Stock Flow', module: 'flow' },
    { id: 'sos', label: 'SOS', module: 'sos' },
    { id: 'camps', label: 'Camps', module: 'camps' },
    { id: 'prediction', label: 'AI Prediction', module: 'prediction' },
    { id: 'notifications', label: 'Notifications', module: 'notifications' }
  ],
  blood_bank: [
    { id: 'overview', label: 'Overview', module: 'overview' },
    { id: 'profile', label: 'Profile', module: 'profile' },
    { id: 'stock', label: 'Stock', module: 'stock' },
    { id: 'search', label: 'Find Blood', module: 'search' },
    { id: 'flow', label: 'Stock Flow', module: 'flow' },
    { id: 'sos', label: 'SOS', module: 'sos' },
    { id: 'camps', label: 'Camps', module: 'camps' },
    { id: 'prediction', label: 'AI Prediction', module: 'prediction' },
    { id: 'notifications', label: 'Notifications', module: 'notifications' }
  ],
  admin: [
    { id: 'overview', label: 'Overview', module: 'overview' },
    { id: 'profile', label: 'Profile', module: 'profile' },
    { id: 'stock', label: 'Stock', module: 'stock' },
    { id: 'search', label: 'Find Blood', module: 'search' },
    { id: 'flow', label: 'Stock Flow', module: 'flow' },
    { id: 'sos', label: 'SOS', module: 'sos' },
    { id: 'camps', label: 'Camps', module: 'camps' },
    { id: 'prediction', label: 'AI Prediction', module: 'prediction' },
    { id: 'admin', label: 'Admin', module: 'admin' },
    { id: 'notifications', label: 'Notifications', module: 'notifications' }
  ]
};

export default function DashboardPage() {
  const { profile, error: authError } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const roleKey = profile?.role || 'user';
  const tabs = useMemo(() => tabsByRole[roleKey] || tabsByRole.user, [roleKey]);
  const requestedTab = searchParams.get('tab') || 'overview';
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'overview';
  const activeModule = tabs.find((tab) => tab.id === activeTab)?.module || 'overview';
  const loadOverviewStreams = activeModule === 'overview';

  useRealtimeNotifications(profile?.uid);

  const stock = useRealtimeStock({ enabled: loadOverviewStreams });
  const sos = useRealtimeSOS(profile, { enabled: loadOverviewStreams });
  const camps = useRealtimeCamps({ enabled: loadOverviewStreams });

  if (!profile && authError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card max-w-xl rounded-2xl p-6">
          <h2 className="text-2xl font-extrabold">Profile Service Unavailable</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{authError}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  const statsSection = (
    <section className="mb-4 grid gap-3 md:grid-cols-4">
      <StatCard label="Live stock rows" value={stock.items.length} accent="bg-brand-500" />
      <StatCard
        label="SOS active"
        value={sos.items.filter((item) => !['completed', 'cancelled'].includes(item.status)).length}
        accent="bg-rose-500"
      />
      <StatCard
        label="Upcoming camps"
        value={camps.items.filter((camp) => new Date(camp.startAt) > new Date()).length}
        accent="bg-amber-500"
      />
      <StatCard label="Your role" value={profile.role.replace('_', ' ')} accent="bg-emerald-500" />
    </section>
  );

  const renderActiveTab = () => {
    if (activeModule === 'overview') {
      return (
        <>
          {statsSection}
          <OverviewPanel profile={profile} stockItems={stock.items} sosItems={sos.items} campItems={camps.items} />
        </>
      );
    }

    if (activeModule === 'profile') return <ProfilePanel />;
    if (activeModule === 'stock') return <RealtimeStockPanel />;
    if (activeModule === 'search') return <BloodSearchPanel />;
    if (activeModule === 'flow') return <StockFlowPanel />;
    if (activeModule === 'sos') return <SOSPanel />;
    if (activeModule === 'camps') return <CampFinderPanel />;
    if (activeModule === 'notifications') return <NotificationPanel />;
    if (activeModule === 'donor') return <DonorPanel />;
    if (activeModule === 'prediction') return <PredictionPanel />;
    if (activeModule === 'admin') return <AdminPanel />;

    return null;
  };

  return (
    <AppLayout tabs={tabs} activeTab={activeTab}>
      {renderActiveTab()}
    </AppLayout>
  );
}
