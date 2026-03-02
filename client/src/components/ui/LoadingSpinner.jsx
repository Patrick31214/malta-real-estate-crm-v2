import React from 'react';

/**
 * LoadingSpinner component
 * @param {string} size    - 'sm' | 'md' | 'lg'
 * @param {string} color   - 'primary' | 'gold' | 'white'
 */
const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => (
  <span className={`spinner-wrapper ${className}`} {...props}>
    <span
      className={`spinner spinner-${size} spinner-${color}`}
      role="status"
      aria-label="Loading"
    />
  </span>
);

export default LoadingSpinner;
