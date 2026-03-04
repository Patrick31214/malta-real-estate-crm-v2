import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showError = useCallback((message) => addToast(message, 'error'), [addToast]);
  const showSuccess = useCallback((message) => addToast(message, 'success'), [addToast]);
  const showInfo = useCallback((message) => addToast(message, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess, showInfo, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

const TOAST_COLORS = {
  error:   { bg: '#3d1515', border: '#c0392b', icon: '✕', accent: '#e74c3c' },
  success: { bg: '#152b1e', border: '#27ae60', icon: '✓', accent: '#2ecc71' },
  info:    { bg: '#152535', border: '#2980b9', icon: 'ℹ', accent: '#3498db' },
};

const ToastItem = ({ toast, onRemove }) => {
  const colors = TOAST_COLORS[toast.type] || TOAST_COLORS.error;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '12px 14px',
      borderRadius: '8px',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      minWidth: '280px',
      maxWidth: '380px',
      animation: 'toast-in 0.25s ease',
    }}>
      <span style={{ color: colors.accent, fontWeight: 700, fontSize: '16px', lineHeight: '20px', flexShrink: 0 }}>
        {colors.icon}
      </span>
      <span style={{ flex: 1, fontSize: '13px', color: '#e8e8e8', lineHeight: '1.4', wordBreak: 'break-word' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#888', fontSize: '16px', lineHeight: '20px',
          padding: '0 2px', flexShrink: 0,
        }}
        aria-label="Dismiss"
      >✕</button>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;
  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end',
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </>
  );
};

export default ToastProvider;
