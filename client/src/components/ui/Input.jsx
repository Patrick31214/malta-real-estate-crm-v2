import React from 'react';

/**
 * Input component
 * @param {string}   label       - Field label text
 * @param {string}   hint        - Helper text below the input
 * @param {string}   error       - Error message (also sets error styling)
 * @param {ReactNode} leftIcon   - Icon element to show on the left
 * @param {boolean}  disabled
 */
const Input = ({
  label,
  hint,
  error,
  leftIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className={`input-field-wrapper ${leftIcon ? 'input-has-icon' : ''}`}>
        {leftIcon && <span className="input-icon">{leftIcon}</span>}
        <input
          id={inputId}
          className={`input-field ${error ? 'input-field-error' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
};

export default Input;
