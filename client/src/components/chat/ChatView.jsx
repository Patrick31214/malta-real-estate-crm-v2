import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import PropertyUpdateCard from './PropertyUpdateCard';

const POLL_INTERVAL_MS = 5000;

function getInitials(user) {
  if (!user) return '?';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' });
}

const ChatView = ({ channel, currentUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const latestIdRef = useRef(null);

  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      const res = await api.get(`/chat/channels/${channel.id}/messages`, {
        params: { limit: 50 },
      });
      const msgs = res.data.messages || [];
      setMessages(msgs);
      if (msgs.length > 0) latestIdRef.current = msgs[msgs.length - 1].id;
      if (isInitial) setLoading(false);
    } catch {
      if (isInitial) setLoading(false);
    }
  }, [channel.id]);

  // Initial load + polling
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setText('');
    fetchMessages(true);

    pollRef.current = setInterval(() => fetchMessages(false), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/chat/channels/${channel.id}/messages`, { content });
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch {
      // fail silently; could add toast here
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isGroupChannel = channel.type !== 'direct';

  return (
    <div className="cw-chat-view">
      {/* Header */}
      <div className="cw-chat-header">
        <button className="cw-back-btn" onClick={onBack} title="Back">‹</button>
        <span className="cw-chat-title">{channel.name}</span>
      </div>

      {/* Messages */}
      <div className="cw-messages">
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, padding: 20 }}>
            Loading…
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, padding: 20 }}>
            No messages yet. Say hello! 👋
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUser?.id;
          const isSystem = msg.type === 'system' || msg.type === 'property_update';

          if (isSystem && msg.type === 'property_update') {
            return (
              <div key={msg.id} className="cw-msg-row system">
                <PropertyUpdateCard message={msg} />
              </div>
            );
          }

          if (isSystem) {
            return (
              <div key={msg.id} className="cw-msg-row system">
                <div className="cw-msg-system">{msg.content}</div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`cw-msg-row${isOwn ? ' own' : ''}`}>
              {/* Avatar */}
              {!isOwn && (
                msg.sender?.profileImage
                  ? <img className="cw-avatar" src={msg.sender.profileImage} alt="" />
                  : <div className="cw-avatar-placeholder">{getInitials(msg.sender)}</div>
              )}

              <div className="cw-msg-body">
                {/* Sender name (group chats only, non-own messages) */}
                {isGroupChannel && !isOwn && (
                  <div className="cw-msg-meta">
                    <span>{msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown'}</span>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                {(!isGroupChannel || isOwn) && (
                  <div className="cw-msg-meta">
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                )}

                <div className={`cw-msg-bubble ${isOwn ? 'own' : 'other'}`}>
                  {msg.content}
                </div>
              </div>

              {/* Own avatar */}
              {isOwn && (
                currentUser?.profileImage
                  ? <img className="cw-avatar" src={currentUser.profileImage} alt="" />
                  : <div className="cw-avatar-placeholder">{getInitials(currentUser)}</div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="cw-input-area">
        <textarea
          className="cw-textarea"
          value={text}
          onChange={e => setText(e.target.value.slice(0, 2000))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          disabled={sending}
          rows={1}
        />
        <button
          className="cw-send-btn"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          title="Send"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatView;
