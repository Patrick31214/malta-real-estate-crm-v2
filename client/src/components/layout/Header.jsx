import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import UserAvatar from '../ui/UserAvatar';

const NAV_LINKS = [
  { label: 'Properties', href: '#properties-section' },
  { label: 'Services', href: '#contact-section' },
  { label: 'About', href: '#contact-section' },
  { label: 'Contact', href: '#contact-section' },
];

const PUBLIC_PATHS = ['/', '/properties', '/about', '/contact'];

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isPublic = PUBLIC_PATHS.includes(location.pathname);
  const isCrm = location.pathname.startsWith('/crm');
  const isShared = location.pathname.startsWith('/shared');
  const isAuth = ['/login', '/register'].includes(location.pathname);

  if (isCrm || isAuth || isShared) return null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const scrollTo = (href) => {
    setMenuOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  };

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        background: scrolled
          ? 'rgba(12, 9, 5, 0.88)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(166, 125, 26, 0.2)' : '1px solid transparent',
        padding: scrolled ? '0.75rem 0' : '1.25rem 0',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🔑</span>
            <span style={{
              fontFamily: 'var(--font-heading, "Playfair Display", serif)',
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              fontWeight: '700',
              color: '#D4AF37',
              letterSpacing: '-0.01em',
            }}>
              Golden Key <span style={{ color: 'rgba(245,240,232,0.8)', fontWeight: '400' }}>Realty</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
            className="desktop-nav"
          >
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(245,240,232,0.75)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-body, Inter, sans-serif)',
                  letterSpacing: '0.02em',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#D4AF37';
                  e.currentTarget.style.background = 'rgba(212,175,55,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(245,240,232,0.75)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexShrink: 0,
          }}>
            <ThemeToggle />

            {user ? (
              <>
                <UserAvatar user={user} size={32} />
                <button
                  onClick={handleSignOut}
                  style={{
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.25)',
                    color: 'rgba(212,175,55,0.8)',
                    borderRadius: '8px',
                    padding: '0.45rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                    display: 'none',
                  }}
                  className="desktop-only"
                >
                  Sign Out
                </button>
                <Link
                  to="/crm/dashboard"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                    color: '#1C140C',
                    borderRadius: '8px',
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    letterSpacing: '0.03em',
                    transition: 'all 0.3s ease',
                    display: 'none',
                  }}
                  className="desktop-only"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    textDecoration: 'none',
                    color: 'rgba(245,240,232,0.75)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    transition: 'all 0.2s ease',
                    display: 'none',
                  }}
                  className="desktop-only"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)';
                    e.currentTarget.style.color = '#D4AF37';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = 'rgba(245,240,232,0.75)';
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                    color: '#1C140C',
                    borderRadius: '8px',
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    letterSpacing: '0.03em',
                    boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                    transition: 'all 0.3s ease',
                    display: 'none',
                  }}
                  className="desktop-only"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                alignItems: 'center',
              }}
              aria-label="Toggle menu"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: 'block',
                    width: '22px',
                    height: '2px',
                    background: '#D4AF37',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease',
                    transformOrigin: 'center',
                    transform: menuOpen
                      ? i === 0 ? 'rotate(45deg) translate(5px, 5px)'
                        : i === 1 ? 'scaleX(0)'
                          : 'rotate(-45deg) translate(5px, -5px)'
                      : 'none',
                  }}
                />
              ))}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          background: 'rgba(0,0,0,0.5)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(4px)',
        }}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Slide-in Menu */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '280px',
        maxWidth: '85vw',
        zIndex: 1001,
        background: 'rgba(12, 9, 5, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(166,125,26,0.2)',
        padding: '5rem 1.75rem 2rem',
        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        {/* Gold line at top */}
        <div className="gold-divider" style={{ position: 'absolute', top: '4.5rem', left: '1.75rem', right: '1.75rem', width: 'auto' }} />

        {NAV_LINKS.map((link) => (
          <button
            key={link.label}
            onClick={() => scrollTo(link.href)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(245,240,232,0.8)',
              fontSize: '1.1rem',
              fontWeight: '500',
              fontFamily: 'var(--font-heading, "Playfair Display", serif)',
              cursor: 'pointer',
              padding: '0.85rem 0',
              textAlign: 'left',
              borderBottom: '1px solid rgba(166,125,26,0.1)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(245,240,232,0.8)'}
          >
            {link.label}
          </button>
        ))}

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {user ? (
            <>
              <Link
                to="/crm/dashboard"
                style={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                  color: '#1C140C',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: '0.04em',
                }}
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'rgba(212,175,55,0.8)',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body, Inter, sans-serif)',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  textDecoration: 'none',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#D4AF37',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  background: 'rgba(212,175,55,0.06)',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                  color: '#1C140C',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* CSS for desktop-only elements */}
      <style>{`
        @media (min-width: 769px) {
          .desktop-only { display: inline-flex !important; }
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Header;
