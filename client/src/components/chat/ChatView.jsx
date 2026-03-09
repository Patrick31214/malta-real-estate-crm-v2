import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../ui/Toast';
import PropertyUpdateCard from './PropertyUpdateCard';

const POLL_INTERVAL_MS = 5000;
const OPTIMISTIC_PREFIX = 'optimistic-';

function getInitials(user) {
  if (!user) return '?';
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' });
}

const MAX_MESSAGE_LENGTH = 2000;

const ChatView = ({ channel, currentUser, onBack, autoFocus }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const latestIdRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-resize textarea whenever the text content changes
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      const params = isInitial
        ? { limit: 50 }
        : latestIdRef.current
          ? { after: latestIdRef.current }
          : { limit: 50 };

      const res = await api.get(`/chat/channels/${channel.id}/messages`, { params });
      const msgs = res.data.messages || [];

      if (isInitial) {
        setMessages(msgs);
        if (msgs.length > 0) latestIdRef.current = msgs[msgs.length - 1].id;
        setLoading(false);
      } else if (msgs.length > 0) {
        // Append only genuinely new messages; skip IDs we already have
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = msgs.filter(m => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
        latestIdRef.current = msgs[msgs.length - 1].id;
      }
    } catch {
      if (isInitial) setLoading(false);
    }
  }, [channel.id]);

  // Initial load + polling
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setText('');
    latestIdRef.current = null;
    fetchMessages(true);

    pollRef.current = setInterval(() => fetchMessages(false), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus when the view opens (e.g. channel switch)
  useEffect(() => {
    if (!loading && (autoFocus !== false)) {
      inputRef.current?.focus();
    }
  }, [loading, autoFocus]);

  // Re-focus the input whenever sending completes so the user can type the
  // next message immediately without tapping the field again.
  // The textarea is never disabled (we guard double-sends in handleSend),
  // so this focus call always succeeds — including on iOS Safari.
  useEffect(() => {
    if (!sending) {
      inputRef.current?.focus();
    }
  }, [sending]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);

    // Optimistic message — shown immediately while the request is in-flight
    const optimisticId = `${OPTIMISTIC_PREFIX}${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      channelId: channel.id,
      senderId: currentUser?.id,
      sender: currentUser,
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setText('');

    try {
      const res = await api.post(`/chat/channels/${channel.id}/messages`, { content });
      const confirmed = res.data;
      // Replace optimistic entry with confirmed server message
      setMessages(prev => prev.map(m => m.id === optimisticId ? confirmed : m));
      latestIdRef.current = confirmed.id;
      inputRef.current?.focus();
    } catch (err) {
      // Remove the optimistic message on failure and show an error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      showError(err.response?.data?.error || 'Failed to send message. Please try again.');
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
          const isOptimistic = !!msg._optimistic;

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
            <div key={msg.id} className={`cw-msg-row${isOwn ? ' own' : ''}${isOptimistic ? ' optimistic' : ''}`}>
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
                    {isOptimistic && <span style={{ fontSize: 10, opacity: 0.6 }}>Sending…</span>}
                  </div>
                )}

                <div className={`cw-msg-bubble ${isOwn ? 'own' : 'other'}${isOptimistic ? ' sending' : ''}`}>
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
          ref={inputRef}
          className="cw-textarea"
          value={text}
          onChange={e => { setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH)); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
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
