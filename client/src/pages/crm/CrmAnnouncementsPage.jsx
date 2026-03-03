import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AnnouncementList from '../../components/crm/announcements/AnnouncementList';
import AnnouncementForm from '../../components/crm/announcements/AnnouncementForm';
import GlassModal from '../../components/ui/GlassModal';
import '../../styles/chat.css';

const CrmAnnouncementsPage = () => {
  const { user } = useAuth();
  const canCreate = ['admin', 'manager'].includes(user?.role);
  const [mode, setMode] = useState('list');
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSave = () => {
    setMode('list');
    setSelected(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>Announcements</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Team announcements and important notices</p>
        </div>
        {canCreate && (
          <button onClick={() => { setSelected(null); setMode('form'); }} style={{ padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'var(--color-accent-gold)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', boxShadow: 'var(--shadow-gold-sm)' }}>+ New Announcement</button>
        )}
      </div>
      <AnnouncementList key={refreshKey} />
      <GlassModal isOpen={mode === 'form'} onClose={() => { setMode('list'); setSelected(null); }} maxWidth="700px">
        <AnnouncementForm initial={selected} onSave={handleSave} onCancel={() => { setMode('list'); setSelected(null); }} />
      </GlassModal>
    </div>
  );
};

export default CrmAnnouncementsPage;
