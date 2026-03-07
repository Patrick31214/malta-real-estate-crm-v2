import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

const PRIORITY_CONFIG = {
  urgent:    { color: '#F87171', bg: 'rgba(220,38,38,0.14)',   border: 'rgba(220,38,38,0.45)',   label: 'Urgent' },
  important: { color: '#FBBF24', bg: 'rgba(217,119,6,0.14)',   border: 'rgba(217,119,6,0.45)',   label: 'Important' },
  normal:    { color: '#E8B820', bg: 'rgba(212,175,55,0.14)',  border: 'rgba(212,175,55,0.45)',  label: 'Normal' },
  low:       { color: '#9CA3AF', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.3)',  label: 'Low' },
};

const TYPE_CONFIG = {
  general:         { icon: '\u{1F4E2}', label: 'General' },
  policy:          { icon: '\u{1F4CB}', label: 'Policy' },
  maintenance:     { icon: '\u{1F527}', label: 'Maintenance' },
  property_update: { icon: '\u{1F3E0}', label: 'Property Update' },
  achievement:     { icon: '\u{1F3C6}', label: 'Achievement' },
  event:           { icon: '\u{1F4C5}', label: 'Event' },
};

const AnnouncementList = ({ onCreateNew }) => {
  const { user } = useAuth();
  const isAdmin    = user?.role === 'admin';
  const isManager  = ['admin', 'manager'].includes(user?.role);
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [expanded,      setExpanded]      = useState(new Set());

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isManager ? '/announcements/admin?limit=50' : '/announcements?limit=50';
      const res = await api.get(endpoint);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally { setLoading(false); }
  }, [isManager]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleDelete = async (a) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${a.id}`);
      setAnnouncements(prev => prev.filter(x => x.id !== a.id));
    } catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  const handleToggle = async (a) => {
    try {
      const res = await api.patch(`/announcements/${a.id}/toggle-active`);
      setAnnouncements(prev => prev.map(x => x.id === a.id ? res.data : x));
    } catch (err) { alert(err.response?.data?.error || 'Toggle failed'); }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading announcements...</div>;
  if (announcements.length === 0) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>No announcements found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {announcements.map(a => {
        const cfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
        const tc  = TYPE_CONFIG[a.type]         || TYPE_CONFIG.general;
        const isExpanded = expanded.has(a.id);
        return (
          <div key={a.id} className="announcement-card" style={{ borderLeft: `4px solid ${cfg.color}`, opacity: a.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '1.5rem' }}>{tc.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                    {a.isPinned && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>\u{1F4CC} Pinned</span>}
                    {!a.isActive && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>(Inactive)</span>}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', margin: 'var(--space-1) 0 0' }}>{a.title}</h3>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                {isManager && (
                  <button onClick={() => handleToggle(a)} style={actBtn}>{a.isActive ? 'Deactivate' : 'Activate'}</button>
                )}
                {isAdmin && (
                  <button onClick={() => handleDelete(a)} style={{ ...actBtn, color: '#F87171', borderColor: 'rgba(248,113,113,0.4)' }}>Delete</button>
                )}
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              {isExpanded ? a.content : a.content.slice(0, 200) + (a.content.length > 200 ? '...' : '')}
              {a.content.length > 200 && (
                <button onClick={() => setExpanded(s => { const ns = new Set(s); isExpanded ? ns.delete(a.id) : ns.add(a.id); return ns; })} style={{ marginLeft: 'var(--space-2)', background: 'none', border: 'none', color: 'var(--color-accent-gold)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              {a.createdBy && <span>By {a.createdBy.firstName} {a.createdBy.lastName}</span>}
              {a.startsAt && <span>Published: {new Date(a.startsAt).toLocaleDateString()}</span>}
              {a.expiresAt && <span>Expires: {new Date(a.expiresAt).toLocaleDateString()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const actBtn = { padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212,175,55,0.25)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)' };

export default AnnouncementList;
