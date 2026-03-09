import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import '../../../styles/chat.css';

const ChatPanel = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

  // Group creation state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const canPin = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    api.get('/chat/channels').then(r => {
      setChannels(r.data.channels || []);
      if (r.data.channels?.length > 0) setActiveChannel(r.data.channels[0]);
    }).catch((err) => { console.error('Failed to load channels:', err); });
  }, []);

  useEffect(() => {
    if (!activeChannel) return;
    setLoading(true);
    api.get(`/chat/channels/${activeChannel.id}/messages`).then(r => {
      setMessages(r.data.messages || []);
    }).catch((err) => { console.error('Failed to load messages:', err); }).finally(() => setLoading(false));
  }, [activeChannel]);

  const handleSelectChannel = useCallback((channel) => {
    setActiveChannel(channel);
    setMobileSidebarOpen(false);
  }, []);

  const handleSend = async (content) => {
    if (!activeChannel || !content.trim()) return;
    if (editingMessage) {
      try {
        const res = await api.put(`/chat/messages/${editingMessage.id}`, { content });
        setMessages(prev => prev.map(m => m.id === res.data.id ? res.data : m));
        setEditingMessage(null);
      } catch (err) { alert(err.response?.data?.error || 'Edit failed'); }
      return;
    }
    setSending(true);
    try {
      const res = await api.post(`/chat/channels/${activeChannel.id}/messages`, { content });
      setMessages(prev => [...prev, res.data]);
    } catch (err) { alert(err.response?.data?.error || 'Send failed'); }
    finally { setSending(false); }
  };

  const handleDelete = async (message) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/chat/messages/${message.id}`);
      setMessages(prev => prev.filter(m => m.id !== message.id));
    } catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  const handlePin = async (message) => {
    try {
      const res = await api.patch(`/chat/messages/${message.id}/pin`);
      setMessages(prev => prev.map(m => m.id === message.id ? res.data : m));
    } catch (err) { alert(err.response?.data?.error || 'Pin failed'); }
  };

  const handleOpenGroupModal = async () => {
    setShowGroupModal(true);
    setGroupName('');
    setSelectedUserIds([]);
    setUserSearch('');
    try {
      const res = await api.get('/chat/users');
      setAvailableUsers(res.data.users || []);
    } catch { /* silently ignore */ }
  };

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length < 1 || creatingGroup) return;
    setCreatingGroup(true);
    try {
      const res = await api.post('/chat/channels/group', {
        name: groupName.trim(),
        participantIds: selectedUserIds,
      });
      const newChannel = res.data.channel;
      setChannels(prev => [newChannel, ...prev]);
      setActiveChannel(newChannel);
      setMobileSidebarOpen(false);
      setShowGroupModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const filteredUsers = availableUsers.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="chat-layout">
      <div className={`chat-sidebar glass${mobileSidebarOpen ? '' : ' chat-sidebar--mobile-hidden'}`}>
        <ChatSidebar channels={channels} activeChannelId={activeChannel?.id} onSelectChannel={handleSelectChannel} userRole={user?.role} onNewGroup={handleOpenGroupModal} />
      </div>
      <div className={`chat-main${mobileSidebarOpen ? ' chat-main--mobile-hidden' : ''}`}>
        {activeChannel ? (
          <>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button className="chat-back-btn" onClick={() => setMobileSidebarOpen(true)} aria-label="Back to channels">‹</button>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>{activeChannel.name}</h3>
                {activeChannel.description && <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{activeChannel.description}</p>}
              </div>
            </div>
            {loading
              ? <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading messages…</div>
              : <ChatMessages messages={messages} currentUserId={user?.id} onEdit={setEditingMessage} onDelete={handleDelete} onPin={handlePin} canPin={canPin} onLoadMore={() => {}} hasMore={false} />
            }
            <ChatInput onSend={handleSend} disabled={sending} />
            {editingMessage && (
              <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'rgba(202,163,81,0.1)', borderTop: '1px solid var(--color-accent-gold)', fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>✏️ Editing message</span>
                <button onClick={() => setEditingMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1rem' }}>✕</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>💬</div>
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Group creation modal */}
      {showGroupModal && (
        <div className="chat-group-modal-overlay" onClick={handleCloseGroupModal}>
          <div className="chat-group-modal" onClick={e => e.stopPropagation()}>
            <div className="chat-group-modal-header">
              <h3 className="chat-group-modal-title">New Group Chat</h3>
              <button className="chat-group-modal-close" onClick={handleCloseGroupModal} aria-label="Close">✕</button>
            </div>

            <div className="chat-group-modal-body">
              <div className="chat-group-field">
                <label className="chat-group-label">Group Name</label>
                <input
                  type="text"
                  className="chat-group-name-input"
                  placeholder="e.g. Sales Team, Branch Alpha…"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value.slice(0, 100))}
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="chat-group-field">
                <label className="chat-group-label">
                  Add Members
                  {selectedUserIds.length > 0 && (
                    <span className="chat-group-count">{selectedUserIds.length} selected</span>
                  )}
                </label>
                <input
                  type="text"
                  className="chat-group-name-input"
                  placeholder="Search people…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>

              <div className="chat-group-user-list">
                {filteredUsers.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    No users found
                  </div>
                )}
                {filteredUsers.map(u => {
                  const selected = selectedUserIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      className={`chat-group-user-item${selected ? ' selected' : ''}`}
                      onClick={() => toggleUserSelection(u.id)}
                      type="button"
                    >
                      <span className={`chat-group-checkbox${selected ? ' checked' : ''}`} aria-hidden="true">
                        {selected ? '✓' : ''}
                      </span>
                      <span className="chat-group-user-name">{u.firstName} {u.lastName}</span>
                      <span className="chat-group-user-role">{u.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="chat-group-modal-footer">
              <button
                className="chat-group-create-btn"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUserIds.length < 1 || creatingGroup}
              >
                {creatingGroup ? 'Creating…' : `Create Group${selectedUserIds.length > 0 ? ` (${selectedUserIds.length + 1})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
