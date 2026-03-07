import React, { useState } from 'react';

const CHANNEL_ICONS = {
  property_updates: '🏠',
  role_group: '👥',
  branch: '🏢',
  general: '💬',
  direct: '💬',
};

const GROUP_LABELS = {
  property_updates: '📌 Pinned',
  role_group: '👥 Groups',
  branch: '🏢 Branch',
  direct: '💬 Direct Messages',
  general: '💬 General',
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-MT', { weekday: 'short' });
  return d.toLocaleDateString('en-MT', { day: 'numeric', month: 'short' });
}

const TYPE_ORDER = ['property_updates', 'general', 'role_group', 'branch', 'direct'];

const ChannelList = ({ channels, activeChannelId, onSelectChannel, onNewMessage }) => {
  const [search, setSearch] = useState('');

  const filtered = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group channels by type, respecting TYPE_ORDER
  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const items = filtered.filter(c => c.type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

  return (
    <div className="cw-channel-list">
      <div className="cw-channel-search">
        <input
          className="cw-search-input"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="cw-new-msg-btn" onClick={onNewMessage} title="New direct message">
          + New
        </button>
      </div>

      <div className="cw-channels-scroll">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <div className="cw-channel-group-label">{GROUP_LABELS[type] || type}</div>
            {items.map(channel => (
              <button
                key={channel.id}
                className={`cw-channel-item${activeChannelId === channel.id ? ' active' : ''}`}
                onClick={() => onSelectChannel(channel)}
              >
                <span className="cw-channel-icon">
                  {CHANNEL_ICONS[channel.type] || '💬'}
                </span>
                <span className="cw-channel-info">
                  <span className="cw-channel-name">{channel.name}</span>
                  {channel.lastMessage && (
                    <span className="cw-channel-preview">
                      {channel.lastMessage.sender
                        ? `${channel.lastMessage.sender.firstName}: `
                        : ''}
                      {channel.lastMessage.content}
                    </span>
                  )}
                </span>
                <span className="cw-channel-meta">
                  {channel.lastMessage && (
                    <span className="cw-channel-time">
                      {formatTime(channel.lastMessage.createdAt)}
                    </span>
                  )}
                  {channel.unreadCount > 0 && (
                    <span className="cw-unread-badge">
                      {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
            No channels found
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelList;
