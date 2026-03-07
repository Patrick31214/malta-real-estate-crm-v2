import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';

// ── Constants ─────────────────────────────────────────────────────────────────

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
  property_created:        'Properties',
  property_updated:        'Properties',
  property_sold:           'Properties',
  property_rented:         'Properties',
  property_status_changed: 'Properties',
  property_price_changed:  'Properties',
  property_approved:       'Properties',
  property_rejected:       'Properties',
  client_created:          'Clients',
  client_updated:          'Clients',
  client_assigned:         'Clients',
  inquiry_created:         'Clients',
  inquiry_assigned:        'Clients',
  inquiry_status_changed:  'Clients',
  agent_created:           'Agents',
  agent_approved:          'Agents',
  agent_rejected:          'Agents',
  agent_blocked:           'Agents',
  branch_created:          'Agents',
  branch_updated:          'Agents',
  announcement_created:    'System',
  chat_message:            'System',
  chat_mention:            'System',
  document_uploaded:       'System',
  document_shared:         'System',
  system_alert:            'System',
  system_maintenance:      'System',
  commission_update:       'System',
  performance_milestone:   'System',
};

const PRIORITY_CONFIG = {
  urgent: { color: '#A85C5C', label: 'Urgent' },
  high:   { color: '#8B6914', label: 'High' },
  normal: { color: 'var(--color-text-muted)', label: 'Normal' },
  low:    { color: 'rgba(156,131,103,0.5)', label: 'Low' },
};

const FILTER_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'unread',     label: 'Unread' },
  { key: 'Properties', label: 'Properties' },
  { key: 'Clients',    label: 'Clients' },
  { key: 'Agents',     label: 'Agents' },
  { key: 'System',     label: 'System' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const card = {
  background: 'var(--color-surface-glass)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '20px 24px',
  marginBottom: '16px',
};

const btnBase = {
  padding: '7px 16px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  transition: 'background 0.15s, color 0.15s',
};

const btnGold = {
  ...btnBase,
  background: 'var(--color-accent-gold)',
  color: '#fff',
  border: 'none',
};

const btnGhost = {
  ...btnBase,
  background: 'rgba(255,255,255,0.12)',
  color: 'var(--color-text-secondary)',
};

const btnDanger = {
  ...btnBase,
  background: 'rgba(168,92,92,0.15)',
  color: '#A85C5C',
  border: '1px solid rgba(168,92,92,0.3)',
};

// ── Page component ────────────────────────────────────────────────────────────

const CrmNotificationsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [activeFilter,  setActiveFilter]  = useState('all');
  const [selected,      setSelected]      = useState(new Set());

  const LIMIT = 25;

  const fetchNotifications = useCallback(async (pg, filter) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: LIMIT };
      if (filter === 'unread') params.unread = 'true';
      const { data } = await api.get('/notifications', { params });
      let list = data.notifications || [];

      if (filter !== 'all' && filter !== 'unread') {
        list = list.filter(n => TYPE_CATEGORY[n.type] === filter);
      }

      setNotifications(list);
      setTotal(data.total ?? list.length);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchNotifications(page, activeFilter);
    setSelected(new Set());
  }, [page, activeFilter, fetchNotifications]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === notifications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map(n => n.id)));
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showSuccess('All notifications marked as read');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to mark all as read');
    }
  };

  const markSelectedRead = async () => {
    try {
      await Promise.all([...selected].map(id => api.patch(`/notifications/${id}/read`)));
      setNotifications(prev => prev.map(n => selected.has(n.id) ? { ...n, isRead: true } : n));
      setSelected(new Set());
      showSuccess(`${selected.size} notification(s) marked as read`);
    } catch (err) {
      showError('Failed to mark selected as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(t => t - 1);
    } catch { /* silent */ }
  };

  const deleteSelected = async () => {
    try {
      await Promise.all([...selected].map(id => api.delete(`/notifications/${id}`)));
      setNotifications(prev => prev.filter(n => !selected.has(n.id)));
      setTotal(t => t - selected.size);
      setSelected(new Set());
      showSuccess(`${selected.size} notification(s) deleted`);
    } catch (err) {
      showError('Failed to delete selected notifications');
    }
  };

  const clearRead = async () => {
    const readIds = notifications.filter(n => n.isRead).map(n => n.id);
    if (!readIds.length) return;
    try {
      await Promise.all(readIds.map(id => api.delete(`/notifications/${id}`)));
      setNotifications(prev => prev.filter(n => !n.isRead));
      setTotal(t => t - readIds.length);
      showSuccess(`Cleared ${readIds.length} read notification(s)`);
    } catch (err) {
      showError('Failed to clear read notifications');
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) markRead(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '4px 0 32px' }}>

      {/* Page title row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px', flexWrap: 'wrap', gap: '10px',
      }}>
        <div>
          <h2 style={{
            fontSize: '22px', fontWeight: '700',
            color: 'var(--color-text-primary)', margin: 0,
          }}>
            🔔 Notifications
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {total} total • {unreadCount} unread
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button style={btnGold} onClick={markAllRead}>
              Mark All Read
            </button>
          )}
          <button style={btnGhost} onClick={clearRead}>
            Clear Read
          </button>
          <button style={btnGhost} onClick={() => fetchNotifications(page, activeFilter)}>
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ ...card, padding: '12px 16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FILTER_TABS.map(f => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); setPage(1); }}
              style={{
                ...btnBase,
                padding: '5px 14px',
                background: activeFilter === f.key
                  ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.12)',
                color: activeFilter === f.key ? '#fff' : 'var(--color-text-secondary)',
                border: activeFilter === f.key
                  ? 'none' : '1px solid var(--color-border)',
                fontWeight: activeFilter === f.key ? '600' : '400',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div style={{
          ...card,
          padding: '10px 16px',
          marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(139,105,20,0.12)',
          border: '1px solid rgba(139,105,20,0.3)',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '600' }}>
            {selected.size} selected
          </span>
          <button style={btnGold} onClick={markSelectedRead}>Mark Read</button>
          <button style={btnDanger} onClick={deleteSelected}>Delete</button>
          <button style={btnGhost} onClick={() => setSelected(new Set())}>Clear Selection</button>
        </div>
      )}

      {/* Notifications list */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border-light)',
          background: 'rgba(255,255,255,0.05)',
        }}>
          <input
            type="checkbox"
            checked={selected.size === notifications.length && notifications.length > 0}
            onChange={toggleSelectAll}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Select All
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
              No notifications to show
            </p>
          </div>
        ) : (
          notifications.map(n => {
            const icon       = TYPE_ICON[n.type] || '🔔';
            const category   = TYPE_CATEGORY[n.type] || '';
            const priority   = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.normal;
            const isUnread   = !n.isRead;
            const isSelected = selected.has(n.id);

            return (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--color-border-light)',
                  background: isSelected
                    ? 'rgba(139,105,20,0.08)'
                    : isUnread
                      ? 'rgba(255,255,255,0.08)'
                      : 'transparent',
                  borderLeft: `3px solid ${isUnread ? priority.color : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isSelected
                    ? 'rgba(139,105,20,0.08)'
                    : isUnread ? 'rgba(255,255,255,0.08)' : 'transparent';
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(n.id)}
                  onClick={e => e.stopPropagation()}
                  style={{ cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                />

                {/* Icon */}
                <div
                  style={{
                    width: 36, height: 36, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.15)', borderRadius: '10px',
                    fontSize: '16px',
                  }}
                  onClick={() => handleNotificationClick(n)}
                >
                  {icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => handleNotificationClick(n)}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '4px', flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isUnread ? '700' : '500',
                      color: 'var(--color-text-primary)',
                    }}>
                      {n.title}
                    </span>
                    {isUnread && (
                      <span style={{
                        fontSize: '10px', background: 'var(--color-accent-gold)',
                        color: '#fff', borderRadius: '8px', padding: '1px 6px',
                        fontWeight: '700',
                      }}>New</span>
                    )}
                    {category && (
                      <span style={{
                        fontSize: '10px', background: 'rgba(255,255,255,0.15)',
                        color: 'var(--color-text-muted)', borderRadius: '8px',
                        padding: '1px 6px',
                      }}>{category}</span>
                    )}
                  </div>
                  <p style={{
                    fontSize: '12px', color: 'var(--color-text-secondary)',
                    margin: 0, lineHeight: '1.5',
                  }}>
                    {n.message}
                  </p>
                  <div style={{
                    fontSize: '11px', color: 'var(--color-text-muted)',
                    marginTop: '4px', display: 'flex', gap: '10px',
                  }}>
                    <span>{relativeTime(n.createdAt)}</span>
                    <span style={{ color: priority.color }}>{priority.label}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {isUnread && (
                    <button
                      onClick={e => { e.stopPropagation(); markRead(n.id); }}
                      title="Mark as read"
                      style={{
                        padding: '4px 8px', border: '1px solid var(--color-border)',
                        borderRadius: '6px', background: 'rgba(255,255,255,0.12)',
                        cursor: 'pointer', fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                    title="Delete"
                    style={{
                      padding: '4px 8px', border: '1px solid rgba(168,92,92,0.3)',
                      borderRadius: '6px', background: 'rgba(168,92,92,0.08)',
                      cursor: 'pointer', fontSize: '11px', color: '#A85C5C',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', gap: '8px', marginTop: '16px',
        }}>
          <button
            style={{ ...btnGhost, padding: '6px 14px' }}
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            style={{ ...btnGhost, padding: '6px 14px' }}
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default CrmNotificationsPage;
