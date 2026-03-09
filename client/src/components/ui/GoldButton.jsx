import React from 'react';

const GoldButton = ({
  children,
  onClick,
  variant = 'filled', // 'filled' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  href,
  ...props
}) => {
  const sizes = {
    sm: { padding: '0.5rem 1.25rem', fontSize: '0.8rem' },
    md: { padding: '0.75rem 1.75rem', fontSize: '0.9rem' },
    lg: { padding: '1rem 2.25rem', fontSize: '1rem' },
    xl: { padding: '1.125rem 2.75rem', fontSize: '1.05rem' },
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '50px',
    fontFamily: 'var(--font-body, Inter, sans-serif)',
    fontWeight: '600',
    letterSpacing: '0.04em',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    textDecoration: 'none',
    border: 'none',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    ...sizes[size],
  };

  const variantStyles = {
    filled: {
      background: 'linear-gradient(135deg, #8B6914, #D4AF37, #8B6914)',
      backgroundSize: '200% auto',
      color: '#1C140C',
      boxShadow: '0 4px 20px rgba(212, 175, 55, 0.35)',
    },
    outline: {
      background: 'rgba(212, 175, 55, 0.08)',
      color: '#D4AF37',
      border: '1.5px solid rgba(212, 175, 55, 0.6)',
      boxShadow: '0 0 0 0 rgba(212, 175, 55, 0)',
    },
    ghost: {
      background: 'transparent',
      color: '#D4AF37',
      boxShadow: 'none',
    },
  };

  const combinedStyle = { ...baseStyle, ...variantStyles[variant] };

  const handleMouseEnter = (e) => {
    if (disabled || loading) return;
    if (variant === 'filled') {
      e.currentTarget.style.backgroundPosition = 'right center';
      e.currentTarget.style.boxShadow = '0 6px 30px rgba(212, 175, 55, 0.55)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    } else if (variant === 'outline') {
      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
      e.currentTarget.style.borderColor = '#D4AF37';
      e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.25)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }
  };

  const handleMouseLeave = (e) => {
    if (disabled || loading) return;
    if (variant === 'filled') {
      e.currentTarget.style.backgroundPosition = 'left center';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(212, 175, 55, 0.35)';
      e.currentTarget.style.transform = 'translateY(0)';
    } else if (variant === 'outline') {
      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  const content = loading ? (
    <>
      <span style={{
        width: '14px',
        height: '14px',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite',
      }} />
      Loading...
    </>
  ) : children;

  if (href) {
    return (
      <a
        href={href}
        style={combinedStyle}
        className={`gold-btn ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={!disabled && !loading ? onClick : undefined}
      style={combinedStyle}
      className={`gold-btn ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
};

export default GoldButton;
