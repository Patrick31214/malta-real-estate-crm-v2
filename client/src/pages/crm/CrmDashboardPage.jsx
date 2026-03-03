import React from 'react';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ label, value, icon }) => (
  <div
    className="glass"
    style={{
      padding: 'var(--space-6)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
    }}
  >
    <span style={{ fontSize: '2rem' }} aria-hidden="true">{icon}</span>
    <div>
      <div style={{
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--font-bold)',
        fontFamily: 'var(--font-heading)',
        color: 'var(--color-text-primary)',
      }}>{value}</div>
      <div style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        marginTop: 'var(--space-1)',
      }}>{label}</div>
    </div>
  </div>
);

const CrmDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Welcome heading */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          marginBottom: 'var(--space-1)',
        }}>
          Welcome back{user ? `, ${user.firstName}` : ''}
        </h2>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
        }}>
          Here's what's happening at Golden Key Realty today.
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        <StatCard icon="🏠" label="Active Properties"  value="—" />
        <StatCard icon="👥" label="Total Contacts"     value="—" />
        <StatCard icon="📩" label="Open Inquiries"     value="—" />
        <StatCard icon="🏢" label="Agents"             value="—" />
      </div>

      {/* Overview card */}
      <div
        className="glass-strong"
        style={{
          padding: 'var(--space-10)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          textAlign: 'center',
          minHeight: '280px',
        }}
      >
        <span style={{ fontSize: '3rem' }} aria-hidden="true">📊</span>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-tight)',
        }}>
          Analytics &amp; Insights
        </h3>
        <p style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-secondary)',
          maxWidth: '400px',
          lineHeight: 'var(--leading-relaxed)',
        }}>
          Detailed analytics and performance dashboards are coming soon.
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
};

export default CrmDashboardPage;
