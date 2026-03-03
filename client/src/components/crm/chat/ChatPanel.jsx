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
      await api.patch(`/chat/messages/${message.id}/pin`);
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, isPinned: !m.isPinned } : m));
    } catch (err) { alert(err.response?.data?.error || 'Pin failed'); }
  };

  return (
    <div className="chat-layout">
      <div className="chat-sidebar glass">
        <ChatSidebar channels={channels} activeChannelId={activeChannel?.id} onSelectChannel={setActiveChannel} userRole={user?.role} />
      </div>
      <div className="chat-main">
        {activeChannel ? (
          <>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-glass)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>{activeChannel.name}</h3>
              {activeChannel.description && <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{activeChannel.description}</p>}
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
    </div>
  );
};

export default ChatPanel;
