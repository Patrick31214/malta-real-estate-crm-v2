import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { trackPageView } from './services/trackMetric';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/layout/Header';
import CrmLayout from './components/layout/CrmLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
          <Route path="dashboard"  element={<CrmDashboardPage />} />
          <Route path="properties" element={<CrmPropertiesPage />} />
          <Route path="properties/:entityId" element={<CrmPropertiesPage />} />
          <Route path="clients"    element={<CrmClientsPage />} />
          <Route path="owners"     element={<CrmOwnersPage />} />
          <Route path="owners/:entityId" element={<CrmOwnersPage />} />
          <Route path="branches"   element={<CrmBranchesPage />} />
          <Route path="contacts"   element={<CrmContactsPage />} />
          <Route path="agents"     element={<CrmAgentsPage />} />
          <Route path="inquiries"  element={<CrmInquiriesPage />} />
          <Route path="reports"    element={<CrmReportsPage />} />
          <Route path="chat"        element={<CrmChatPage />} />
          <Route path="announcements" element={<CrmAnnouncementsPage />} />
          <Route path="services"           element={<CrmServicesPage />} />
          <Route path="mortgage-calculator" element={<CrmMortgageCalculatorPage />} />
          <Route path="compliance"         element={<CrmCompliancePage />} />
          <Route path="documents"          element={<CrmDocumentsPage />} />
          <Route path="files"              element={<CrmFileManagerPage />} />
          <Route path="team"               element={<CrmTeamPage />} />
          <Route path="training"           element={<CrmTrainingPage />} />
          <Route path="events"             element={<CrmEventsPage />} />
          <Route path="activity"           element={<CrmActivityPage />} />
          <Route path="notifications"      element={<CrmNotificationsPage />} />
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
