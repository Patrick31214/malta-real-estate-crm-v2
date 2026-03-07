import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';

const PRIORITY_CONFIG = {
  urgent:    { cls: 'urgent',    label: 'URGENT',    color: '#F87171' },
  important: { cls: 'important', label: 'IMPORTANT', color: '#FBBF24' },
  normal:    { cls: 'normal',    label: 'INFO',      color: '#E8B820' },
  low:       { cls: 'low',       label: 'NOTE',      color: '#9CA3AF' },
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set());

  const fetchUnread = useCallback(async () => {
    try {
      const r = await api.get('/announcements?limit=10');
      setAnnouncements(r.data.announcements || []);
    } catch {
      // silent
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
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)', marginRight: 'var(--space-2)', color: cfg.color }}>
                  [{cfg.label}]
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{a.title}</span>
                <span style={{ fontSize: 'var(--text-sm)', marginLeft: 'var(--space-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {' '} — {a.content.slice(0, 100)}{a.content.length > 100 ? '...' : ''}
                </span>
              </div>
            </div>
            <button onClick={() => dismiss(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, opacity: 0.7 }} aria-label="Dismiss">
              ✕
            </button>
          </div>
        );
      })}
      {extra > 0 && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          ...and {extra} more announcement{extra > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;
