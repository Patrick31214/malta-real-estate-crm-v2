import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';

const PRIORITY_CONFIG = {
  urgent:    { icon: '⚠️', cls: 'urgent',    label: 'URGENT',    color: '#DC2626', bg: 'rgba(220,38,38,0.15)' },
  important: { icon: '⭐', cls: 'important', label: 'IMPORTANT', color: '#D97706', bg: 'rgba(217,119,6,0.15)' },
  normal:    { icon: 'ℹ️', cls: 'normal',    label: 'INFO',      color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  low:       { icon: '📝', cls: 'low',       label: 'NOTE',      color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set());

  const fetchUnread = useCallback(async () => {
    try {
      const r = await api.get('/announcements?limit=10');
      const items = (r.data.announcements || []).filter(a => {
        const reads = Array.isArray(a.readByUserIds) ? a.readByUserIds : [];
        // We can't check userId here easily, show all and track dismissal locally
        return true;
      });
      setAnnouncements(items);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }, []);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  const dismiss = async (a) => {
    setHiddenIds(s => new Set([...s, a.id]));
    try { await api.patch(`/announcements/${a.id}/read`); } catch { /* silent */ }
  };

  const visible = announcements.filter(a => !hiddenIds.has(a.id));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, 3);
  const extra = visible.length - shown.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
      {shown.map(a => {
        const cfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
        return (
          <div key={a.id} className={`announcement-banner ${cfg.cls}`}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between', animation: 'slideIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
              <span style={{ flexShrink: 0 }}>{cfg.icon}</span>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)', marginRight: 'var(--space-2)', color: cfg.color }}>[{cfg.label}]</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{a.title}</span>
                <span style={{ fontSize: 'var(--text-sm)', marginLeft: 'var(--space-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> — {a.content.slice(0, 100)}{a.content.length > 100 ? '…' : ''}</span>
              </div>
            </div>
            <button onClick={() => dismiss(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, opacity: 0.7 }} aria-label="Dismiss">✕</button>
          </div>
        );
      })}
      {extra > 0 && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          …and {extra} more announcement{extra > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;

