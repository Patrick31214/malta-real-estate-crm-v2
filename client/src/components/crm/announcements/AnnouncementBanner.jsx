import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const PRIORITY_CONFIG = {
  urgent:    { icon: '⚠️', cls: 'urgent',    label: 'URGENT' },
  important: { icon: '⭐', cls: 'important', label: 'IMPORTANT' },
  normal:    { icon: 'ℹ️', cls: 'normal',    label: 'INFO' },
  low:       { icon: '📝', cls: 'low',       label: 'NOTE' },
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    api.get('/announcements?limit=5').then(r => {
      const urgent = (r.data.announcements || []).filter(a => ['urgent','important'].includes(a.priority));
      setAnnouncements(urgent);
    }).catch((err) => { console.error('Failed to load announcements:', err); });
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
      {visible.slice(0, 3).map(a => {
        const cfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
        return (
          <div key={a.id} className={`announcement-banner ${cfg.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
              <span>{cfg.icon}</span>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)', marginRight: 'var(--space-2)' }}>[{cfg.label}]</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{a.title}</span>
                <span style={{ fontSize: 'var(--text-sm)', marginLeft: 'var(--space-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> — {a.content.slice(0, 100)}{a.content.length > 100 ? '…' : ''}</span>
              </div>
            </div>
            <button onClick={() => setDismissed(s => new Set([...s, a.id]))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, opacity: 0.7 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
