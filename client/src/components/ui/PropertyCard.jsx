import React, { useState } from 'react';

const GRADIENTS = [
  'linear-gradient(135deg, #1a3a2a 0%, #2d5a40 40%, #4a7a5a 70%, #8B6914 100%)',
  'linear-gradient(135deg, #1a1a3a 0%, #2a2a5a 40%, #4a4a8a 70%, #8B6914 100%)',
  'linear-gradient(135deg, #3a1a1a 0%, #5a2a2a 40%, #8a4a4a 70%, #8B6914 100%)',
  'linear-gradient(135deg, #1a2a3a 0%, #2a4a5a 40%, #4a6a8a 70%, #8B6914 100%)',
  'linear-gradient(135deg, #2a3a1a 0%, #4a5a2a 40%, #6a8a4a 70%, #8B6914 100%)',
  'linear-gradient(135deg, #3a2a1a 0%, #5a4a2a 40%, #8a6a4a 70%, #8B6914 100%)',
];

const PropertyCard = ({
  index = 0,
  name = 'Luxury Property',
  location = 'Valletta, Malta',
  price = '€850,000',
  bedrooms = 3,
  bathrooms = 2,
  area = 180,
  featured = true,
  type = 'Penthouse',
  onView,
}) => {
  const [hovered, setHovered] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: '300px',
        maxWidth: '320px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'var(--glass-surface-medium, rgba(255,255,255,0.05))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: hovered ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(166, 125, 26, 0.18)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.3), 0 0 30px rgba(212, 175, 55, 0.15)'
          : '0 8px 32px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        flexShrink: 0,
        cursor: 'pointer',
      }}
      onClick={onView}
    >
      {/* Image Placeholder */}
      <div style={{
        height: '200px',
        background: gradient,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }} />
        {/* Featured Badge */}
        {featured && (
          <div style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            background: 'linear-gradient(90deg, #8B6914, #D4AF37)',
            color: '#1C140C',
            fontSize: '0.6rem',
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '20px',
          }}>
            ✦ Featured
          </div>
        )}
        {/* Type Badge */}
        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '0.7rem',
          fontWeight: '500',
          padding: '4px 10px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {type}
        </div>
        {/* Decorative icon */}
        <div style={{
          position: 'absolute',
          bottom: '50%',
          left: '50%',
          transform: 'translate(-50%, 50%)',
          fontSize: '3rem',
          opacity: 0.15,
          filter: 'blur(2px)',
        }}>
          🏛️
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-accent-gold, #A67D1A)',
          fontWeight: '500',
          letterSpacing: '0.05em',
          marginBottom: '0.35rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          📍 {location}
        </div>
        <div style={{
          fontSize: '1.05rem',
          fontFamily: 'var(--font-heading, "Playfair Display", serif)',
          fontWeight: '600',
          color: 'var(--color-text-primary, #F5F0E8)',
          marginBottom: '0.75rem',
          lineHeight: 1.3,
        }}>
          {name}
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: 'var(--color-text-secondary, rgba(245,240,232,0.7))',
        }}>
          <span>🛏️ {bedrooms}</span>
          <span>🚿 {bathrooms}</span>
          <span>📐 {area}m²</span>
        </div>

        {/* Price + CTA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: '1.2rem',
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
            fontWeight: '700',
            color: '#D4AF37',
          }}>
            {price}
          </div>
          <button
            style={{
              background: hovered ? 'linear-gradient(135deg, #8B6914, #D4AF37)' : 'rgba(212, 175, 55, 0.12)',
              color: hovered ? '#1C140C' : '#D4AF37',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '20px',
              padding: '0.4rem 1rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.04em',
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
