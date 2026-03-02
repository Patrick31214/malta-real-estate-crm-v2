import React from 'react';

/**
 * Button component
 * @param {string}   variant  - 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold'
 * @param {string}   size     - 'sm' | 'md' | 'lg'
 * @param {boolean}  loading  - shows spinner and disables interaction
 * @param {boolean}  disabled
 * @param {ReactNode} children
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'btn',
    `btn-${size}`,
    `btn-${variant}`,
    loading ? 'btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
