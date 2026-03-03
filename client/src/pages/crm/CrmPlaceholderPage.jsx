import React from 'react';

const CrmPlaceholderPage = ({ icon, title, description }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    {/* Page header */}
    <div>
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--color-text-primary)',
        letterSpacing: 'var(--tracking-tight)',
        marginBottom: 'var(--space-1)',
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
      }}>
        {description}
      </p>
    </div>

    {/* Coming soon card */}
    <div
      className="glass-strong"
      style={{
        padding: 'var(--space-16) var(--space-10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        textAlign: 'center',
        minHeight: '320px',
      }}
    >
      <span style={{ fontSize: '3rem', lineHeight: 1 }} aria-hidden="true">{icon}</span>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--color-text-primary)',
        letterSpacing: 'var(--tracking-tight)',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 'var(--text-base)',
        color: 'var(--color-text-secondary)',
        maxWidth: '400px',
        lineHeight: 'var(--leading-relaxed)',
      }}>
        This section is being crafted with care. Check back soon for a fully featured experience.
      </p>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-5)',
        background: 'rgba(139, 105, 20, 0.10)',
        border: '1px solid rgba(139, 105, 20, 0.20)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--color-accent-gold)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        letterSpacing: 'var(--tracking-wide)',
      }}>
        ✦ Coming Soon
      </div>
    </div>
  </div>
);

export default CrmPlaceholderPage;
