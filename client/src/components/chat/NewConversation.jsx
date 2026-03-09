import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../ui/Toast';

function getInitials(user) {
  if (!user) return '?';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', agent: 'Agent' };

const NewConversation = ({ onBack, onSelectChannel, currentUser }) => {
  const [tab, setTab] = useState('direct'); // 'direct' | 'group'
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);
  const { showError } = useToast();

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const canCreateGroup = ['admin', 'manager'].includes(currentUser?.role);

  useEffect(() => {
    api.get('/chat/users')
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset search and selections when switching tabs
  useEffect(() => {
    setSearch('');
    setSelectedUserIds([]);
  }, [tab]);

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

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length < 2 || creatingGroup) return;
    setCreatingGroup(true);
    try {
      const res = await api.post('/chat/channels/group', {
        name: groupName.trim(),
        participantIds: selectedUserIds,
      });
      onSelectChannel(res.data.channel);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create group. Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <div className="cw-new-conv">
      <div className="cw-chat-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <button className="cw-back-btn" onClick={onBack} title="Back">‹</button>
        <span className="cw-chat-title">New Message</span>
      </div>

      {/* Tabs — group tab only for admin/manager */}
      {canCreateGroup && (
        <div className="cw-tabs">
          <button
            className={`cw-tab-btn${tab === 'direct' ? ' active' : ''}`}
            onClick={() => setTab('direct')}
          >
            Direct
          </button>
          <button
            className={`cw-tab-btn${tab === 'group' ? ' active' : ''}`}
            onClick={() => setTab('group')}
          >
            New Group
          </button>
        </div>
      )}

      {/* Direct message tab */}
      {tab === 'direct' && (
        <>
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
        </>
      )}

      {/* Group creation tab */}
      {tab === 'group' && (
        <div className="cw-group-create">
          <div className="cw-group-name-wrap">
            <input
              className="cw-search-input"
              style={{ width: '100%', fontSize: 16 }}
              placeholder="Group name…"
              value={groupName}
              onChange={e => setGroupName(e.target.value.slice(0, 100))}
              autoFocus
              maxLength={100}
            />
          </div>

          <div className="cw-group-member-search">
            <input
              className="cw-search-input"
              style={{ width: '100%' }}
              placeholder="Search members…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {selectedUserIds.length > 0 && (
              <span className="cw-group-selected-badge">{selectedUserIds.length}</span>
            )}
          </div>

          <div className="cw-user-list cw-user-list--group">
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

            {filtered.map(user => {
              const selected = selectedUserIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  className={`cw-user-item cw-user-item--selectable${selected ? ' selected' : ''}`}
                  onClick={() => toggleUserSelection(user.id)}
                  type="button"
                >
                  <span className={`cw-checkbox${selected ? ' checked' : ''}`} aria-hidden="true">
                    {selected ? '✓' : ''}
                  </span>
                  {user.profileImage
                    ? <img className="cw-avatar" src={user.profileImage} alt="" />
                    : <div className="cw-avatar-placeholder">{getInitials(user)}</div>
                  }
                  <div>
                    <div className="cw-user-name">{user.firstName} {user.lastName}</div>
                    <div className="cw-user-role">{ROLE_LABELS[user.role] || user.role}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="cw-group-create-footer">
            <button
              className="cw-group-create-btn"
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUserIds.length < 2 || creatingGroup}
            >
              {creatingGroup
                ? 'Creating…'
                : `Create Group${selectedUserIds.length > 0 ? ` (${selectedUserIds.length + 1})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewConversation;
