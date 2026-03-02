import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-header-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="site-header-logo animate-float-slow">🔑</span>
          <span className="site-header-title">Golden Key Realty</span>
        </Link>
        <div className="site-header-actions">
          <ThemeToggle />
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '32px', height: '32px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-gold))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)',
                color: '#fff', flexShrink: 0,
                boxShadow: 'var(--shadow-gold-sm)',
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <span style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                fontWeight: 'var(--font-medium)',
              }}>
                {user?.firstName}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
