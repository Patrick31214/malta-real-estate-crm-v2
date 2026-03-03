import React from 'react';

const SIZES = {
  sm: { width: 24, height: 24, fontSize: '0.6rem' },
  md: { width: 32, height: 32, fontSize: '0.7rem' },
  lg: { width: 48, height: 48, fontSize: '1rem' },
};

const getInitials = (user) => {
  if (!user) return '?';
  const first = user.firstName?.[0] ?? '';
  const last  = user.lastName?.[0]  ?? '';
  return (first + last).toUpperCase() || '?';
};

const UserAvatar = ({ user, size = 'md', className = '', style = {} }) => {
  const dim = SIZES[size] || SIZES.md;

  const baseStyle = {
    width:           dim.width,
    height:          dim.height,
    borderRadius:    'var(--radius-full)',
    flexShrink:      0,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    ...style,
  };

  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user.firstName ? `${user.firstName} ${user.lastName}` : 'User avatar'}
        style={{ ...baseStyle, objectFit: 'cover' }}
        className={className}
      />
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-gold))',
        fontSize: dim.fontSize,
        fontWeight: 'var(--font-bold)',
        color: '#fff',
        boxShadow: 'var(--shadow-gold-sm)',
      }}
      className={className}
      aria-label={user ? `${user.firstName} ${user.lastName}` : 'User'}
    >
      {getInitials(user)}
    </div>
  );
};

export default UserAvatar;
