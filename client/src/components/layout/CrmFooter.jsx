import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { label: 'Dashboard',  to: '/crm' },
  { label: 'Properties', to: '/crm/properties' },
  { label: 'Clients',    to: '/crm/clients' },
  { label: 'Owners',     to: '/crm/owners' },
];

const FooterLink = ({ label, to }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={to}
      style={{
        color: hovered ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        textDecoration: 'none',
        transition: 'color var(--transition-fast)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </Link>
  );
};

const CrmFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'var(--color-surface-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--color-border-light)',
        padding: 'var(--space-4) var(--space-6)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          maxWidth: '100%',
        }}
      >
        {/* Copyright */}
        <span
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-xs)',
          }}
        >
          © {currentYear} Golden Key Realty · Malta's Luxury Real Estate CRM
        </span>

        {/* Quick links */}
        <nav
          aria-label="Footer navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          {QUICK_LINKS.map(({ label, to }) => (
            <FooterLink key={to} label={label} to={to} />
          ))}
        </nav>

        {/* Version */}
        <span
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-xs)',
          }}
        >
          v2.0.0
        </span>
      </div>
    </footer>
  );
};

export default CrmFooter;
