import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import UserAvatar from '../ui/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

// Public pages that should NOT show any auth UI in the header
const PUBLIC_PATHS = ['/', '/properties', '/about', '/contact'];

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPage = PUBLIC_PATHS.includes(location.pathname);

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
          {/* Only show auth UI on CRM pages, never on the public website */}
          {!isPublicPage && isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <UserAvatar user={user} size="md" />
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
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
