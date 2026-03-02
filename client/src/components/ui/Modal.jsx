import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal component
 * @param {boolean}  open      - controls visibility
 * @param {function} onClose   - called when overlay or X is clicked
 * @param {string}   title     - modal header title
 * @param {string}   size      - '' | 'sm' | 'lg' | 'xl'
 * @param {ReactNode} children - modal body content
 * @param {ReactNode} footer   - optional footer content
 */
const Modal = ({
  open,
  onClose,
  title,
  size = '',
  children,
  footer,
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const sizeClass = size ? `modal-${size}` : '';

  return createPortal(
    <div
      className={`modal-overlay ${sizeClass}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h3 className="modal-title" id="modal-title">
            {title}
          </h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
