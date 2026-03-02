import React from 'react';

/**
 * Badge component
 * @param {string} variant - 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium'
 * @param {string} size    - 'sm' | 'md'
 */
const Badge = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'badge',
    `badge-${size}`,
    `badge-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;
