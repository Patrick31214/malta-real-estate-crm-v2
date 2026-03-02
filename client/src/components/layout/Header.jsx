import React from 'react';
import ThemeToggle from '../ui/ThemeToggle';

const Header = () => {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-header-brand">
          <span className="site-header-logo">🗝️</span>
          <span className="site-header-title">Golden Key Realty</span>
        </div>
        <div className="site-header-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
