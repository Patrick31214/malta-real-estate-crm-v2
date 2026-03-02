import React from 'react';

/**
 * Card component
 * @param {string}  variant  - 'glass' | 'solid' | 'outlined'
 * @param {string}  padding  - 'none' | 'sm' | 'md' | 'lg'
 * @param {boolean} hover    - enables lift-on-hover effect
 */
const Card = ({
  variant = 'glass',
  padding = 'md',
  hover = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'card',
    `card-${variant}`,
    `card-pad-${padding}`,
    hover ? 'card-hover' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ className = '', children, ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
