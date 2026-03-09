import React from 'react';

const SectionDivider = ({
  icon = null,
  color = 'rgba(166, 125, 26, 0.4)',
  thickness = 1,
  width = '80%',
  style = {},
}) => {
  if (icon) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        width,
        margin: '0 auto',
        ...style,
      }}>
        <div style={{
          flex: 1,
          height: `${thickness}px`,
          background: `linear-gradient(90deg, transparent, ${color})`,
        }} />
        <span style={{
          fontSize: '1.2rem',
          filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))',
        }}>
          {icon}
        </span>
        <div style={{
          flex: 1,
          height: `${thickness}px`,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }} />
      </div>
    );
  }

  return (
    <div style={{
      width,
      height: `${thickness}px`,
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      margin: '0 auto',
      ...style,
    }} />
  );
};

export default SectionDivider;
