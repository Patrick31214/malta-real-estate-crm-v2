import React from 'react';

const TestimonialCard = ({
  quote,
  author,
  property,
  rating = 5,
  delay = 0,
  visible = true,
}) => {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.7s ease ${delay}s`,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(166, 125, 26, 0.2)',
        borderRadius: '20px',
        padding: '2rem',
        position: 'relative',
      }}
    >
      {/* Gold Quote Mark */}
      <div style={{
        fontSize: '5rem',
        lineHeight: 0.7,
        color: 'rgba(212, 175, 55, 0.25)',
        fontFamily: 'Georgia, serif',
        fontWeight: '900',
        marginBottom: '1rem',
        userSelect: 'none',
      }}>
        "
      </div>

      {/* Stars */}
      <div style={{
        display: 'flex',
        gap: '3px',
        marginBottom: '1rem',
      }}>
        {Array.from({ length: rating }).map((_, i) => (
          <span
            key={i}
            style={{
              color: '#D4AF37',
              fontSize: '0.9rem',
              filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.5))',
            }}
          >
            ★
          </span>
        ))}
      </div>

      {/* Quote Text */}
      <p style={{
        fontSize: '0.95rem',
        lineHeight: 1.7,
        color: 'var(--color-text-secondary, rgba(245,240,232,0.8))',
        marginBottom: '1.5rem',
        fontStyle: 'italic',
      }}>
        {quote}
      </p>

      {/* Gold Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent)',
        marginBottom: '1.25rem',
      }} />

      {/* Author Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          fontWeight: '700',
          color: '#1C140C',
          flexShrink: 0,
        }}>
          {author.charAt(0)}
        </div>
        <div>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'var(--color-text-primary, #F5F0E8)',
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
          }}>
            {author}
          </div>
          {property && (
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(212, 175, 55, 0.7)',
              marginTop: '2px',
            }}>
              Purchased: {property}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
