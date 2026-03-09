import React from 'react';

const CHANNEL_ICONS = { general: '💬', rentals: '🏠', sales: '💰', managers: '👔', staff: '👥', custom: '#️⃣' };

const ChatSidebar = ({ channels, activeChannelId, onSelectChannel, userRole, onNewGroup }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', margin: 0 }}>Channels</h3>
      {['admin', 'manager'].includes(userRole) && (
        <button
          onClick={onNewGroup}
          title="New group chat"
          aria-label="Create new group chat"
          style={{ minWidth: 44, minHeight: 44, border: 'none', background: 'transparent', color: 'var(--color-accent-gold)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', transition: 'background var(--transition-fast)' }}
        >
          +
        </button>
      )}
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
      {channels.map(ch => (
        <button key={ch.id} onClick={() => onSelectChannel(ch)} style={{
          width: '100%', textAlign: 'left', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          background: activeChannelId === ch.id ? 'rgba(var(--color-accent-gold-rgb, 202,163,81), 0.15)' : 'transparent',
          color: activeChannelId === ch.id ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
          fontWeight: activeChannelId === ch.id ? 'var(--font-semibold)' : 'var(--font-normal)',
          transition: 'all var(--transition-fast)',
          marginBottom: 'var(--space-1)',
          minHeight: '44px',
        }}>
          <span>{CHANNEL_ICONS[ch.type] || '💬'}</span>
          <span style={{ fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
        </button>
      ))}
    </div>
  </div>
);

export default ChatSidebar;
