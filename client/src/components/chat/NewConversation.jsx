import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function getInitials(user) {
  if (!user) return '?';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', agent: 'Agent' };

const NewConversation = ({ onBack, onSelectChannel }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    api.get('/chat/users')
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (user) => {
    if (creating) return;
    setCreating(user.id);
    try {
      const res = await api.post('/chat/channels/direct', { recipientId: user.id });
      onSelectChannel(res.data.channel);
    } catch {
      // silently fail
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="cw-new-conv">
      <div className="cw-chat-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <button className="cw-back-btn" onClick={onBack} title="Back">‹</button>
        <span className="cw-chat-title">New Message</span>
      </div>

      <div className="cw-new-conv-search">
        <input
          className="cw-search-input"
          style={{ width: '100%' }}
          placeholder="Search people…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="cw-user-list">
        {loading && (
          <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
            Loading…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
            No users found
          </div>
        )}

        {filtered.map(user => (
          <button
            key={user.id}
            className="cw-user-item"
            onClick={() => handleSelect(user)}
            disabled={creating === user.id}
          >
            {user.profileImage
              ? <img className="cw-avatar" src={user.profileImage} alt="" />
              : <div className="cw-avatar-placeholder">{getInitials(user)}</div>
            }
            <div>
              <div className="cw-user-name">{user.firstName} {user.lastName}</div>
              <div className="cw-user-role">{ROLE_LABELS[user.role] || user.role}</div>
            </div>
            {creating === user.id && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-muted)' }}>…</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NewConversation;
