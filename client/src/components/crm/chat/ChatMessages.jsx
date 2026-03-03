import React, { useEffect, useRef } from 'react';

const getInitials = (u) => u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : '?';

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' });
};

const ChatMessages = ({ messages, currentUserId, onEdit, onDelete, onPin, canPin, onLoadMore, hasMore }) => {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !bottomRef.current) return;
    // Only auto-scroll if user is near the bottom (within 150px)
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (isNearBottom) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const pinned = messages.filter(m => m.isPinned);

  return (
    <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {hasMore && <button onClick={onLoadMore} style={{ alignSelf: 'center', padding: '4px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>Load older messages</button>}
      {pinned.length > 0 && (
        <div style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#D97706', marginBottom: 'var(--space-2)' }}>📌 Pinned Messages</div>
          {pinned.map(m => (
            <div key={m.id} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', paddingBottom: 'var(--space-1)' }}>
              <b>{m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Unknown'}</b>: {m.content}
            </div>
          ))}
        </div>
      )}
      {messages.map(m => {
        const isOwn = m.userId === currentUserId;
        return (
          <div key={m.id} className="chat-message" style={{ flexDirection: isOwn ? 'row-reverse' : 'row' }}>
            {m.user?.profileImage
              ? <img src={m.user.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>{getInitials(m.user)}</div>
            }
            <div style={{ maxWidth: '70%' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '2px', display: 'flex', gap: 'var(--space-2)', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                <b style={{ color: 'var(--color-text-secondary)' }}>{m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Unknown'}</b>
                <span>{formatTime(m.createdAt)}</span>
                {m.isEdited && <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>(edited)</span>}
                {m.isPinned && <span>📌</span>}
              </div>
              <div style={{ background: isOwn ? 'rgba(var(--color-accent-gold-rgb, 202,163,81), 0.15)' : 'var(--color-surface-glass)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', backdropFilter: 'blur(8px)' }}>
                {m.content}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: '4px', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                {isOwn && <button onClick={() => onEdit(m)} style={actBtn}>✏️</button>}
                {(isOwn || canPin) && <button onClick={() => onDelete(m)} style={actBtn}>🗑</button>}
                {canPin && <button onClick={() => onPin(m)} style={actBtn}>{m.isPinned ? '📌' : '📎'}</button>}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

const actBtn = { padding: '2px 6px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '12px' };

export default ChatMessages;
