import React, { useRef, useState } from 'react';

const GlassCard = ({
  children,
  className = '',
  onClick,
  goldBorder = true,
  tilt = false,
  padding = '1.75rem',
  style = {},
  ...props
}) => {
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = (e) => {
    if (!tilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
    });
  };

  const baseStyle = {
    background: 'var(--glass-surface-medium, rgba(255,255,255,0.06))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: goldBorder ? '1px solid rgba(166, 125, 26, 0.18)' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding,
    transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    cursor: onClick ? 'pointer' : 'default',
    ...tiltStyle,
    ...style,
  };

  return (
    <div
      ref={cardRef}
      className={`glass-gold-hover ${className}`}
      style={baseStyle}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
