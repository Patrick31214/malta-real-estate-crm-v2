import React, { useEffect } from 'react';
import '../../styles/glass-modal.css';

const GlassModal = ({ isOpen, onClose, title, maxWidth = '700px', children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="glass-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-modal-content glass-strong" style={{ maxWidth }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1, padding: '4px' }} aria-label="Close">✕</button>
          </div>
        )}
        {!title && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-3) var(--space-4) 0' }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1, padding: '4px' }} aria-label="Close">✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default GlassModal;
