import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

const PRIORITY_CONFIG = {
  urgent:    { icon: '⚠️', color: '#DC2626', bg: 'rgba(220,38,38,0.15)' },
  important: { icon: '⭐', color: '#D97706', bg: 'rgba(217,119,6,0.15)' },
  normal:    { icon: 'ℹ️', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  low:       { icon: '📝', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
};

const AnnouncementList = ({ onCreateNew }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements?limit=50');
      setAnnouncements(res.data.announcements || []);
    } catch {} finally { setLoading(false); }
  }, []);

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

  if (loading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading announcements…</div>;
  if (announcements.length === 0) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>No announcements found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {announcements.map(a => {
        const cfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
        const isExpanded = expanded.has(a.id);
        return (
          <div key={a.id} className="glass announcement-card" style={{ borderLeft: `4px solid ${cfg.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '1.5rem' }}>{cfg.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg }}>{a.priority.toUpperCase()}</span>
                    {!a.isActive && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>(Inactive)</span>}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', margin: 'var(--space-1) 0 0' }}>{a.title}</h3>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                {['admin','manager'].includes(user?.role) && <button onClick={() => handleToggle(a)} style={actBtn}>{a.isActive ? 'Deactivate' : 'Activate'}</button>}
                {user?.role === 'admin' && <button onClick={() => handleDelete(a)} style={{ ...actBtn, color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>Delete</button>}
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              {isExpanded ? a.content : a.content.slice(0, 200) + (a.content.length > 200 ? '…' : '')}
              {a.content.length > 200 && (
                <button onClick={() => setExpanded(s => { const ns = new Set(s); isExpanded ? ns.delete(a.id) : ns.add(a.id); return ns; })} style={{ marginLeft: 'var(--space-2)', background: 'none', border: 'none', color: 'var(--color-accent-gold)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>{isExpanded ? 'Show less' : 'Read more'}</button>
              )}
            </div>
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              {a.createdBy && <span>By {a.createdBy.firstName} {a.createdBy.lastName}</span>}
              <span>Published: {new Date(a.publishedAt).toLocaleDateString()}</span>
              {a.expiresAt && <span>Expires: {new Date(a.expiresAt).toLocaleDateString()}</span>}
              {a.targetRoles?.length > 0 && <span>For: {a.targetRoles.join(', ')}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const actBtn = { padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)' };

export default AnnouncementList;
