import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const roleBadgeVariant = {
  admin:   'error',
  manager: 'warning',
  agent:   'info',
  client:  'success',
};

const roleLabel = {
  admin:   'Administrator',
  manager: 'Manager',
  agent:   'Agent',
  client:  'Client',
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div
        className="glass-strong"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: 'var(--space-12) var(--space-10)',
          textAlign: 'center',
          animation: 'dashFadeIn 0.4s ease both',
        }}
      >
        {/* Avatar circle */}
        <div style={{
          width: '72px', height: '72px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-gold))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-6)',
          fontSize: 'var(--text-2xl)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          color: '#fff',
          boxShadow: 'var(--shadow-gold-md)',
        }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-3)',
        }}>
          Welcome back, {user?.firstName}!
        </h1>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <Badge variant={roleBadgeVariant[user?.role] || 'default'}>
            {roleLabel[user?.role] || user?.role}
          </Badge>
        </div>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-8)',
          lineHeight: 'var(--leading-relaxed)',
        }}>
          You're logged in as{' '}
          <strong style={{ color: 'var(--color-accent-gold)' }}>
            {roleLabel[user?.role] || user?.role}
          </strong>
          . The full dashboard is coming soon.
        </p>

        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-8)',
        }}>
          {user?.email}
        </p>

        <Button variant="outline" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      <style>{`
        @keyframes dashFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
