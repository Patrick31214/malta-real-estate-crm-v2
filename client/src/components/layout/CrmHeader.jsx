import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import api from '../../services/api';

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Notification type → icon/category ────────────────────────────────────────

const TYPE_ICON = {
  property_created:        '🏠',
  property_updated:        '🏠',
  property_sold:           '🏠',
  property_rented:         '🏠',
  property_status_changed: '🏠',
  property_price_changed:  '💰',
  property_approved:       '✅',
  property_rejected:       '❌',
  client_created:          '👤',
  client_updated:          '👤',
  client_assigned:         '👤',
  inquiry_created:         '📩',
  inquiry_assigned:        '📩',
  inquiry_status_changed:  '📩',
  agent_created:           '🧑‍💼',
  agent_approved:          '✅',
  agent_rejected:          '❌',
  agent_blocked:           '🚫',
  branch_created:          '🏢',
  branch_updated:          '🏢',
  announcement_created:    '📢',
  chat_message:            '💬',
  chat_mention:            '💬',
  document_uploaded:       '📄',
  document_shared:         '📄',
  system_alert:            '⚙️',
  system_maintenance:      '⚙️',
  commission_update:       '💰',
  performance_milestone:   '🏆',
};

const TYPE_CATEGORY = {
  property_created:        'properties',
  property_updated:        'properties',
  property_sold:           'properties',
  property_rented:         'properties',
  property_status_changed: 'properties',
  property_price_changed:  'properties',
  property_approved:       'properties',
  property_rejected:       'properties',
  client_created:          'clients',
  client_updated:          'clients',
  client_assigned:         'clients',
  inquiry_created:         'clients',
  inquiry_assigned:        'clients',
  inquiry_status_changed:  'clients',
  agent_created:           'agents',
  agent_approved:          'agents',
  agent_rejected:          'agents',
  agent_blocked:           'agents',
  branch_created:          'agents',
  branch_updated:          'agents',
  announcement_created:    'system',
  chat_message:            'system',
  chat_mention:            'system',
  document_uploaded:       'system',
  document_shared:         'system',
  system_alert:            'system',
  system_maintenance:      'system',
  commission_update:       'system',
  performance_milestone:   'system',
};

const PRIORITY_BORDER = {
  urgent: '#A85C5C',
  high:   '#8B6914',
  normal: 'transparent',
  low:    'rgba(156,131,103,0.3)',
};

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/* Route → page title map */
const PAGE_TITLES = {
  '/crm/dashboard':     'Dashboard',
  '/crm/properties':    'Properties',
  '/crm/contacts':      'Contacts',
  '/crm/agents':        'Agents',
  '/crm/inquiries':     'Inquiries',
  '/crm/reports':       'Reports',
  '/crm/settings':      'Settings',
  '/crm/notifications': 'Notifications',
};

const getInitials = (user) => {
  if (!user) return '??';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
};

const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'unread',     label: 'Unread' },
  { key: 'properties', label: 'Properties' },
  { key: 'clients',    label: 'Clients' },
  { key: 'agents',     label: 'Agents' },
  { key: 'system',     label: 'System' },
];

// ── Notification item ─────────────────────────────────────────────────────────

const NotificationItem = ({ notification, onRead, onNavigate }) => {
  const [hovered, setHovered] = useState(false);
  const icon     = TYPE_ICON[notification.type] || '🔔';
  const border   = PRIORITY_BORDER[notification.priority] || 'transparent';
  const isUnread = !notification.isRead;

  const handleClick = () => {
    onRead(notification.id);
    if (notification.actionUrl) onNavigate(notification.actionUrl);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '10px',
        padding: '10px 14px',
        cursor: 'pointer',
        background: hovered
          ? 'rgba(255,255,255,0.20)'
          : isUnread
            ? 'rgba(255,255,255,0.10)'
            : 'transparent',
        borderLeft: `3px solid ${border}`,
        transition: 'background 0.15s',
        borderBottom: '1px solid rgba(156,131,103,0.1)',
      }}
    >
      <div style={{
        width: 32, height: 32, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
        fontSize: '14px',
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: isUnread ? '600' : '400',
          color: 'var(--color-text-primary)',
          lineHeight: '1.3',
          marginBottom: '2px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {notification.title}
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {notification.message}
        </div>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: '4px', flexShrink: 0,
      }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {relativeTime(notification.createdAt)}
        </span>
        {isUnread && (
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--color-accent-gold)',
          }} />
        )}
      </div>
    </div>
  );
};

// ── CrmHeader ─────────────────────────────────────────────────────────────────

const CrmHeader = ({ onMenuClick }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'CRM';

  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [activeFilter,  setActiveFilter]  = useState('all');
  const [loading,       setLoading]       = useState(false);
  const [pulse,         setPulse]         = useState(false);

  const dropdownRef = useRef(null);
  const prevCount   = useRef(0);

  // Fetch unread count (also called on poll)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      const newCount = data.count ?? 0;
      if (newCount > prevCount.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
      }
      prevCount.current = newCount;
      setUnreadCount(newCount);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async (filter) => {
    setLoading(true);
    try {
      const params = { limit: 30 };
      if (filter === 'unread') params.unread = 'true';
      const { data } = await api.get('/notifications', { params });
      let list = data.notifications || [];
      if (filter === 'properties') list = list.filter(n => TYPE_CATEGORY[n.type] === 'properties');
      else if (filter === 'clients') list = list.filter(n => TYPE_CATEGORY[n.type] === 'clients');
      else if (filter === 'agents')  list = list.filter(n => TYPE_CATEGORY[n.type] === 'agents');
      else if (filter === 'system')  list = list.filter(n => TYPE_CATEGORY[n.type] === 'system');
      setNotifications(list);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 15 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh when dropdown opens or filter changes
  useEffect(() => {
    if (dropdownOpen) fetchNotifications(activeFilter);
  }, [dropdownOpen, activeFilter, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      prevCount.current = Math.max(0, prevCount.current - 1);
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      prevCount.current = 0;
    } catch { /* silent */ }
  };

  const handleNavigate = (url) => {
    setDropdownOpen(false);
    navigate(url);
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <header className="crm-header" role="banner">
      <div className="crm-header-left">
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

        {/* ── Bell + dropdown ── */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            className={`crm-header-bell${pulse ? ' crm-header-bell--pulse' : ''}`}
            role="button"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            tabIndex={0}
            onClick={() => setDropdownOpen(v => !v)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setDropdownOpen(v => !v)}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="crm-header-bell-badge" aria-hidden="true">
                {displayCount}
              </span>
            )}
          </div>

          {dropdownOpen && (
            <div
              role="dialog"
              aria-label="Notifications panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 380,
                maxHeight: 500,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--color-surface)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              {/* Header row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid var(--color-border-light)',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: '14px', fontWeight: '600',
                  color: 'var(--color-text-primary)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  🔔 Notifications
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: '11px', background: 'var(--color-accent-gold)',
                      color: '#fff', borderRadius: '10px',
                      padding: '1px 6px', fontWeight: '700',
                    }}>{displayCount}</span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      fontSize: '12px', color: 'var(--color-accent-gold)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div style={{
                display: 'flex', gap: '4px', padding: '8px 10px',
                borderBottom: '1px solid var(--color-border-light)',
                flexShrink: 0, overflowX: 'auto',
              }}>
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    style={{
                      fontSize: '11px', padding: '3px 9px',
                      borderRadius: '20px', border: 'none',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      background: activeFilter === f.key
                        ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.15)',
                      color: activeFilter === f.key ? '#fff' : 'var(--color-text-secondary)',
                      fontWeight: activeFilter === f.key ? '600' : '400',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Notification list */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {loading ? (
                  <div style={{
                    padding: '24px', textAlign: 'center',
                    color: 'var(--color-text-muted)', fontSize: '13px',
                  }}>Loading…</div>
                ) : notifications.length === 0 ? (
                  <div style={{
                    padding: '32px 16px', textAlign: 'center',
                    color: 'var(--color-text-muted)', fontSize: '13px',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onRead={handleRead}
                      onNavigate={handleNavigate}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                borderTop: '1px solid var(--color-border-light)',
                padding: '10px 14px',
                flexShrink: 0,
              }}>
                <button
                  onClick={() => handleNavigate('/crm/notifications')}
                  style={{
                    width: '100%', padding: '7px',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '12px', color: 'var(--color-text-secondary)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="crm-header-avatar" aria-label={`User: ${user?.firstName ?? ''}`}>
          {getInitials(user)}
        </div>

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
