import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={`theme-toggle-icon ${isDark ? 'theme-toggle-icon-hidden' : ''}`} aria-hidden="true">
        ☀️
      </span>
      <span className={`theme-toggle-icon ${!isDark ? 'theme-toggle-icon-hidden' : ''}`} aria-hidden="true">
        🌙
      </span>
    </button>
  );
};

export default ThemeToggle;
