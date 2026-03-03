import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6"  x2="21" y2="6"  />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

/* Route → page title map */
const PAGE_TITLES = {
  '/crm/dashboard':  'Dashboard',
  '/crm/properties': 'Properties',
  '/crm/contacts':   'Contacts',
  '/crm/agents':     'Agents',
  '/crm/inquiries':  'Inquiries',
  '/crm/reports':    'Reports',
  '/crm/settings':   'Settings',
};

const getInitials = (user) => {
  if (!user) return '??';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
};

const CrmHeader = ({ onMenuClick }) => {
  const location  = useLocation();
  const { user }  = useAuth();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'CRM';

  return (
    <header className="crm-header" role="banner">
      <div className="crm-header-left">
        {/* Mobile hamburger — visible only on small screens via CSS */}
        <button
          className="crm-header-mobile-toggle"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <HamburgerIcon />
        </button>

        <h1 className="crm-header-title">{pageTitle}</h1>
      </div>

      <div className="crm-header-right">
        <ThemeToggle />

        {/* Notification bell */}
        <div className="crm-header-bell" role="button" aria-label="Notifications" tabIndex={0}>
          <BellIcon />
          <span className="crm-header-bell-dot" aria-hidden="true" />
        </div>

        {/* User avatar */}
        <div className="crm-header-avatar" aria-label={`User: ${user?.firstName ?? ''}`}>
          {getInitials(user)}
        </div>

        {/* User name — hidden on mobile via CSS */}
        {user && (
          <span className="crm-header-user-name">
            {user.firstName} {user.lastName}
          </span>
        )}
      </div>
    </header>
  );
};

export default CrmHeader;
