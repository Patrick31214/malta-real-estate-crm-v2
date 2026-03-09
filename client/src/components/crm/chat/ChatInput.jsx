import React, { useState, useRef, useEffect } from 'react';

const ChatInput = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const MAX = 2000;

  // Re-focus when sending completes (disabled transitions true → false).
  // This is a safety net; the primary focus call is synchronous in handleSend.
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    // Synchronous focus — stays within the user-gesture call stack so iOS
    // Safari honours it even though the textarea is never disabled.
    textareaRef.current?.focus();
  };

  return (
    <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', backdropFilter: 'blur(8px)' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          style={{ width: '100%', minHeight: '44px', maxHeight: '120px', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: '16px', outline: 'none', resize: 'none', lineHeight: 'var(--leading-relaxed)', boxSizing: 'border-box' }}
        />
        <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: '10px', color: text.length > MAX * 0.9 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>{text.length}/{MAX}</div>
      </div>
      <button onClick={handleSend} disabled={!text.trim() || disabled} style={{ padding: 'var(--space-3) var(--space-5)', minHeight: '44px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-accent-gold)', background: text.trim() && !disabled ? 'var(--color-accent-gold)' : 'transparent', color: text.trim() && !disabled ? '#fff' : 'var(--color-text-muted)', cursor: !text.trim() || disabled ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', transition: 'all var(--transition-fast)', flexShrink: 0 }}>Send</button>
    </div>
  );
};

export default ChatInput;
