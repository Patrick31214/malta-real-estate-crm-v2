import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { trackPageView } from './services/trackMetric';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/layout/Header';
import CrmLayout from './components/layout/CrmLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PermissionGate from './components/auth/PermissionGate';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CrmDashboardPage  from './pages/crm/CrmDashboardPage';
import CrmPropertiesPage from './pages/crm/CrmPropertiesPage';
import CrmContactsPage   from './pages/crm/CrmContactsPage';
import CrmAgentsPage     from './pages/crm/CrmAgentsPage';
import CrmInquiriesPage  from './pages/crm/CrmInquiriesPage';
import CrmReportsPage    from './pages/crm/CrmReportsPage';
import CrmSettingsPage   from './pages/crm/CrmSettingsPage';
import CrmOwnersPage     from './pages/crm/CrmOwnersPage';
import CrmBranchesPage   from './pages/crm/CrmBranchesPage';
import CrmClientsPage    from './pages/crm/CrmClientsPage';
import CrmChatPage        from './pages/crm/CrmChatPage';
import CrmAnnouncementsPage from './pages/crm/CrmAnnouncementsPage';
import CrmServicesPage          from './pages/crm/CrmServicesPage';
import CrmMortgageCalculatorPage from './pages/crm/CrmMortgageCalculatorPage';
import CrmCompliancePage        from './pages/crm/CrmCompliancePage';
import CrmDocumentsPage         from './pages/crm/CrmDocumentsPage';
import CrmFileManagerPage       from './pages/crm/CrmFileManagerPage';
import CrmTeamPage              from './pages/crm/CrmTeamPage';
import CrmTrainingPage          from './pages/crm/CrmTrainingPage';
import CrmEventsPage            from './pages/crm/CrmEventsPage';
import CrmActivityPage          from './pages/crm/CrmActivityPage';
import CrmNotificationsPage     from './pages/crm/CrmNotificationsPage';
import SharedPropertyPage       from './pages/public/SharedPropertyPage';
import './styles/index.css';
import './styles/properties-enhanced.css';
import './styles/clients.css';
import './styles/responsive.css';

// Pages where the public header should be hidden
const HIDE_HEADER_PATHS = ['/login', '/register'];

const AppLayout = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  const isCrm        = location.pathname.startsWith('/crm');
  const isShared     = location.pathname.startsWith('/shared');
  const hideHeader   = HIDE_HEADER_PATHS.includes(location.pathname) || isCrm || isShared;

  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        {/* Public site */}
        <Route path="/" element={<WelcomePage />} />

        {/* Shareable property links — no auth required */}
        <Route path="/shared/property/:id" element={<SharedPropertyPage />} />

        {/* Auth pages — standalone, no header */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* CRM — sidebar + header layout, all protected */}
        <Route path="/crm" element={
          <ProtectedRoute>
            <CrmLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/crm/dashboard" replace />} />
          <Route path="dashboard"  element={<PermissionGate permissionKey="dashboard_view"><CrmDashboardPage /></PermissionGate>} />
          <Route path="properties" element={<PermissionGate permissionKey="properties_view"><CrmPropertiesPage /></PermissionGate>} />
          <Route path="properties/:entityId" element={<PermissionGate permissionKey="properties_view"><CrmPropertiesPage /></PermissionGate>} />
          <Route path="clients"    element={<PermissionGate permissionKey="clients_view"><CrmClientsPage /></PermissionGate>} />
          <Route path="owners"     element={<PermissionGate permissionKey="owners_view"><CrmOwnersPage /></PermissionGate>} />
          <Route path="owners/:entityId" element={<PermissionGate permissionKey="owners_view"><CrmOwnersPage /></PermissionGate>} />
          <Route path="branches"   element={<PermissionGate permissionKey="branches_view"><CrmBranchesPage /></PermissionGate>} />
          <Route path="contacts"   element={<PermissionGate permissionKey="contacts_view"><CrmContactsPage /></PermissionGate>} />
          <Route path="agents"     element={<PermissionGate permissionKey="agents_view"><CrmAgentsPage /></PermissionGate>} />
          <Route path="inquiries"  element={<PermissionGate permissionKey="inquiries_view_all"><CrmInquiriesPage /></PermissionGate>} />
          <Route path="reports"    element={<PermissionGate permissionKey="reports_view"><CrmReportsPage /></PermissionGate>} />
          <Route path="chat"        element={<PermissionGate permissionKey="chat_internal"><CrmChatPage /></PermissionGate>} />
          <Route path="announcements" element={<PermissionGate permissionKey="announcements_view"><CrmAnnouncementsPage /></PermissionGate>} />
          <Route path="services"           element={<PermissionGate permissionKey="services_view"><CrmServicesPage /></PermissionGate>} />
          <Route path="mortgage-calculator" element={<PermissionGate permissionKey="mortgage_calculator_view"><CrmMortgageCalculatorPage /></PermissionGate>} />
          <Route path="compliance"         element={<PermissionGate permissionKey="admin_compliance"><CrmCompliancePage /></PermissionGate>} />
          <Route path="documents"          element={<PermissionGate permissionKey="documents_view"><CrmDocumentsPage /></PermissionGate>} />
          <Route path="files"              element={<PermissionGate permissionKey="files_view"><CrmFileManagerPage /></PermissionGate>} />
          <Route path="team"               element={<PermissionGate permissionKey="team_view"><CrmTeamPage /></PermissionGate>} />
          <Route path="training"           element={<PermissionGate permissionKey="training_view"><CrmTrainingPage /></PermissionGate>} />
          <Route path="events"             element={<PermissionGate permissionKey="events_view"><CrmEventsPage /></PermissionGate>} />
          <Route path="activity"           element={<PermissionGate permissionKey="activity_view"><CrmActivityPage /></PermissionGate>} />
          <Route path="notifications"      element={<PermissionGate permissionKey="notifications_view"><CrmNotificationsPage /></PermissionGate>} />
          <Route path="settings"           element={<CrmSettingsPage />} />
        </Route>
      </Routes>
    </>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
