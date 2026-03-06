import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../ui/UserAvatar';

/* ── Inline SVG Icons ── */
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const PropertiesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const ContactsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    <path d="M16 3.13a4 4 0 010 7.75" />
    <path d="M21 21v-2a4 4 0 00-3-3.87" />
  </svg>
);

const AgentsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

const InquiriesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="14" x2="12.01" y2="14" />
  </svg>
);

const ReportsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const OwnersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ClientsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const BranchesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-4 0v2" />
    <path d="M8 7V5a2 2 0 00-4 0v2" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ServicesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 17h18" />
    <path d="M5 17V9a1 1 0 011-1h12a1 1 0 011 1v8" />
    <path d="M9 8V6a3 3 0 016 0v2" />
    <circle cx="12" cy="13" r="1" />
  </svg>
);

const MortgageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="12" y2="15" />
  </svg>
);

const ComplianceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const DocumentsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const FilesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

const TeamIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const TrainingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const EventsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/* ── Menu item definitions (with section grouping) ── */
const ALL_NAV_ITEMS = [
  // MAIN
  { section: 'MAIN', icon: <DashboardIcon />,  label: 'Dashboard',           path: '/crm/dashboard',            roles: ['admin', 'manager', 'agent'], permissionKey: 'dashboard_view' },
  { section: 'MAIN', icon: <PropertiesIcon />, label: 'Properties',          path: '/crm/properties',           roles: ['admin', 'manager', 'agent'], agentLabel: 'My Properties', permissionKey: 'properties_view' },
  // PEOPLE
  { section: 'PEOPLE', icon: <OwnersIcon />,   label: 'Owners',              path: '/crm/owners',               roles: ['admin', 'manager', 'agent'], permissionKey: 'owners_view' },
  { section: 'PEOPLE', icon: <ClientsIcon />,  label: 'Clients',             path: '/crm/clients',              roles: ['admin', 'manager', 'agent'], permissionKey: 'clients_view' },
  { section: 'PEOPLE', icon: <AgentsIcon />,   label: 'Agents',              path: '/crm/agents',               roles: ['admin', 'manager'], permissionKey: 'agents_view' },
  { section: 'PEOPLE', icon: <ContactsIcon />, label: 'Contacts',            path: '/crm/contacts',             roles: ['admin', 'manager'], permissionKey: 'contacts_view' },
  // BUSINESS
  { section: 'BUSINESS', icon: <InquiriesIcon />, label: 'Inquiries',        path: '/crm/inquiries',            roles: ['admin', 'manager', 'agent'], agentLabel: 'My Inquiries', badge: 3, permissionKey: 'inquiries_view_all' },
  { section: 'BUSINESS', icon: <ServicesIcon />,  label: 'Services',         path: '/crm/services',             roles: ['admin', 'manager', 'agent'], permissionKey: 'services_view' },
  { section: 'BUSINESS', icon: <MortgageIcon />,  label: 'Mortgage Calculator', path: '/crm/mortgage-calculator', roles: ['admin', 'manager', 'agent'], permissionKey: 'financial_mortgage_calc' },
  { section: 'BUSINESS', icon: <ComplianceIcon />, label: 'Malta Compliance', path: '/crm/compliance',          roles: ['admin', 'manager'], permissionKey: 'admin_compliance' },
  // DOCUMENTS & FILES
  { section: 'DOCUMENTS & FILES', icon: <DocumentsIcon />, label: 'Documents', path: '/crm/documents',          roles: ['admin', 'manager', 'agent'], permissionKey: 'documents_view' },
  { section: 'DOCUMENTS & FILES', icon: <FilesIcon />,     label: 'File Manager', path: '/crm/files',           roles: ['admin', 'manager', 'agent'], permissionKey: 'documents_file_manager' },
  // COMPANY
  { section: 'COMPANY', icon: <BranchesIcon />, label: 'Branches',           path: '/crm/branches',             roles: ['admin', 'manager'], permissionKey: 'branches_view' },
  { section: 'COMPANY', icon: <TeamIcon />,     label: 'Team',               path: '/crm/team',                 roles: ['admin', 'manager'], permissionKey: 'agents_view' },
  { section: 'COMPANY', icon: <TrainingIcon />, label: 'Training',           path: '/crm/training',             roles: ['admin', 'manager', 'agent'], permissionKey: 'agents_schedule' },
  { section: 'COMPANY', icon: <EventsIcon />,   label: 'Events',             path: '/crm/events',               roles: ['admin', 'manager', 'agent'], permissionKey: 'calendar_view' },
  // COMMUNICATION
  { section: 'COMMUNICATION', icon: '💬', label: 'Chat',          path: '/crm/chat',          roles: ['admin', 'manager', 'agent'], permissionKey: 'chat_internal' },
  { section: 'COMMUNICATION', icon: '📢', label: 'Announcements', path: '/crm/announcements', roles: ['admin', 'manager', 'agent'], permissionKey: 'announcements_view' },
  // ANALYTICS
  { section: 'ANALYTICS', icon: <ReportsIcon />,  label: 'Reports',          path: '/crm/reports',              roles: ['admin', 'manager'], permissionKey: 'reports_generate' },
  { section: 'ANALYTICS', icon: <ActivityIcon />, label: 'Activity Log',     path: '/crm/activity',             roles: ['admin', 'manager'], permissionKey: 'admin_activity_logs' },
  // SYSTEM
  { section: 'SYSTEM', icon: <SettingsIcon />, label: 'Settings',            path: '/crm/settings',             roles: ['admin'] },
];

const getInitials = (user) => {
  if (!user) return '??';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
};

const roleLabel = {
  admin:   'Administrator',
  manager: 'Manager',
  agent:   'Agent',
  client:  'Client',
};

const CrmSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role ?? 'agent';

  // Build permission map for agents
  const userPermissions = user?.UserPermissions || [];
  const permMap = {};
  userPermissions.forEach(p => { permMap[p.feature] = p.isEnabled; });

  // Group filtered items by section, preserving order
  const sectionOrder = [];
  const sectionMap = {};
  ALL_NAV_ITEMS
    .filter(item => {
      if (!item.roles.includes(userRole)) return false;
      if (userRole === 'admin') return true;
      if (item.permissionKey) return permMap[item.permissionKey] === true;
      return true;
    })
    .map(item => ({
      ...item,
      label: userRole === 'agent' && item.agentLabel ? item.agentLabel : item.label,
    }))
    .forEach(item => {
      const sectionKey = item.section ?? '';
      if (!sectionMap[sectionKey]) {
        sectionMap[sectionKey] = [];
        sectionOrder.push(sectionKey);
      }
      sectionMap[sectionKey].push(item);
    });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarClass = [
    'crm-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="crm-sidebar-overlay visible"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClass} aria-label="CRM Navigation">
        {/* Brand / Logo */}
        <div className="crm-sidebar-brand">
          <span className="crm-sidebar-brand-icon" aria-hidden="true">🔑</span>
          <span className="crm-sidebar-brand-text">Golden Key Realty</span>

          {/* Toggle button — desktop only */}
          <button
            className="crm-sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="crm-sidebar-nav" aria-label="Main navigation">
          {sectionOrder.map((section) => (
            <React.Fragment key={section}>
              {section && (
                <div className="crm-nav-label" aria-hidden="true">{section}</div>
              )}
              {sectionMap[section].map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `crm-nav-item${isActive ? ' active' : ''}`
                  }
                  onClick={() => {
                    if (mobileOpen) onMobileClose();
                  }}
                  aria-label={item.label}
                >
                  <span className="crm-nav-icon">{item.icon}</span>
                  <span className="crm-nav-text">{item.label}</span>
                  {item.badge && (
                    <span className="crm-nav-badge" aria-label={`${item.badge} unread`}>
                      {item.badge}
                    </span>
                  )}
                  <span className="crm-nav-tooltip" aria-hidden="true">{item.label}</span>
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer — User info + Logout */}
        <div className="crm-sidebar-footer">
          <div className="crm-sidebar-user">
            <UserAvatar user={user} size="md" className="crm-sidebar-avatar" />
            <div className="crm-sidebar-user-info">
              <div className="crm-sidebar-user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </div>
              <div className="crm-sidebar-user-role">
                {roleLabel[userRole] ?? userRole}
              </div>
            </div>
          </div>

          <button
            className="crm-sidebar-logout"
            onClick={handleLogout}
            aria-label="Sign out"
          >
            <span className="crm-nav-icon"><LogoutIcon /></span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default CrmSidebar;
