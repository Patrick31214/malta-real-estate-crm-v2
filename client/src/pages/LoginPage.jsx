import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/* ── Reusable crown SVG ── */
const CrownIcon = () => (
  <svg
    viewBox="0 0 64 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: '100%' }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="loginCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#E8D09A" />
        <stop offset="50%"  stopColor="#C4A265" />
        <stop offset="100%" stopColor="#A8864E" />
      </linearGradient>
    </defs>
    <rect x="6" y="36" width="52" height="7" rx="3.5" fill="url(#loginCrownGrad)" />
    <path d="M6 36 L14 14 L24 26 L32 6 L40 26 L50 14 L58 36 Z" fill="url(#loginCrownGrad)" />
    <circle cx="32" cy="8" r="4" fill="#FCEEA0" opacity="0.9" />
    <circle cx="14" cy="15" r="2.5" fill="#FCEEA0" opacity="0.8" />
    <circle cx="50" cy="15" r="2.5" fill="#FCEEA0" opacity="0.8" />
  </svg>
);

/* ── Eye icons for password toggle ── */
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/crm/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Sign in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="hero-gradient"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient orbs */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,162,101,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(156,131,103,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Login card */}
      <div
        className="glass-strong"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: 'var(--space-10) var(--space-8)',
          animation: 'loginFadeIn 0.5s ease both',
        }}
      >
        {/* Crown logo */}
        <div style={{
          width: '64px', height: '48px',
          margin: '0 auto var(--space-6)',
          filter: 'drop-shadow(0 6px 20px rgba(196,162,101,0.55))',
        }}
          className="animate-float"
        >
          <CrownIcon />
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          textAlign: 'center',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-2)',
        }}>
          Welcome Back
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-8)',
          letterSpacing: '0.02em',
        }}>
          Sign in to Golden Key Realty
        </p>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'var(--color-error-light)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-5)',
            color: 'var(--color-error)',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-relaxed)',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Input
              label="Email address"
              type="email"
              id="login-email"
              placeholder="you@goldenkey.mt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 'var(--space-2)', position: 'relative' }}>
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              id="login-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 'var(--space-3)',
                bottom: 'calc(var(--space-2) + 2px)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-1)',
                transition: 'color var(--transition-fast)',
              }}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: 'var(--space-6)' }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-accent-gold)',
                fontFamily: 'var(--font-body)',
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={loading}
            style={{ width: '100%', marginBottom: 'var(--space-6)' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        {/* Register link */}
        <p style={{
          textAlign: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{
            color: 'var(--color-accent-gold)',
            fontWeight: 'var(--font-semibold)',
          }}>
            Register
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p style={{
        marginTop: 'var(--space-8)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.05em',
        textAlign: 'center',
      }}>
        © {new Date().getFullYear()} Golden Key Realty · Malta's Luxury Real Estate CRM
      </p>

      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
