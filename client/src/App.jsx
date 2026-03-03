import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
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
import './styles/index.css';

// Pages where the public header should be hidden
const HIDE_HEADER_PATHS = ['/login', '/register'];

const AppLayout = () => {
  const location = useLocation();
  const isCrm        = location.pathname.startsWith('/crm');
  const hideHeader   = HIDE_HEADER_PATHS.includes(location.pathname) || isCrm;

  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        {/* Public site */}
        <Route path="/" element={<WelcomePage />} />

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
          <Route path="owners"     element={<CrmOwnersPage />} />
          <Route path="branches"   element={<CrmBranchesPage />} />
          <Route path="contacts"   element={<CrmContactsPage />} />
          <Route path="agents"     element={<CrmAgentsPage />} />
          <Route path="inquiries"  element={<CrmInquiriesPage />} />
          <Route path="reports"    element={<CrmReportsPage />} />
          <Route path="settings"   element={
            <ProtectedRoute roles={['admin']}>
              <CrmSettingsPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
