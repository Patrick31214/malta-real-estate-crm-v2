import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const CrownIcon = () => (
  <svg
    viewBox="0 0 64 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: '100%' }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="regCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#E8D09A" />
        <stop offset="50%"  stopColor="#C4A265" />
        <stop offset="100%" stopColor="#A8864E" />
      </linearGradient>
    </defs>
    <rect x="6" y="36" width="52" height="7" rx="3.5" fill="url(#regCrownGrad)" />
    <path d="M6 36 L14 14 L24 26 L32 6 L40 26 L50 14 L58 36 Z" fill="url(#regCrownGrad)" />
    <circle cx="32" cy="8" r="4" fill="#FCEEA0" opacity="0.9" />
    <circle cx="14" cy="15" r="2.5" fill="#FCEEA0" opacity="0.8" />
    <circle cx="50" cy="15" r="2.5" fill="#FCEEA0" opacity="0.8" />
  </svg>
);

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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!form.email.trim())     errs.email     = 'Email is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
      });
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please try again.';
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

      {/* Card */}
      <div
        className="glass-strong"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'var(--space-10) var(--space-8)',
          animation: 'regFadeIn 0.5s ease both',
        }}
      >
        {/* Crown */}
        <div
          style={{ width: '64px', height: '48px', margin: '0 auto var(--space-6)',
            filter: 'drop-shadow(0 6px 20px rgba(196,162,101,0.55))' }}
          className="animate-float"
        >
          <CrownIcon />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)',
          fontWeight: 700, textAlign: 'center',
          color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)',
        }}>
          Create Account
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
          textAlign: 'center', color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-7)', letterSpacing: '0.02em',
        }}>
          Join Golden Key Realty
        </p>

        {/* Global error */}
        {error && (
          <div style={{
            background: 'var(--color-error-light)', border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-5)', color: 'var(--color-error)', fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-relaxed)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <Input
              label="First name"
              id="reg-first"
              placeholder="Patrick"
              value={form.firstName}
              onChange={set('firstName')}
              error={fieldErrors.firstName}
              required
            />
            <Input
              label="Last name"
              id="reg-last"
              placeholder="Smith"
              value={form.lastName}
              onChange={set('lastName')}
              error={fieldErrors.lastName}
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Input
              label="Email address"
              type="email"
              id="reg-email"
              placeholder="you@goldenkey.mt"
              value={form.email}
              onChange={set('email')}
              error={fieldErrors.email}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 'var(--space-4)', position: 'relative' }}>
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              id="reg-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              error={fieldErrors.password}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 'var(--space-3)',
                bottom: fieldErrors.password ? 'calc(var(--space-2) + 20px)' : 'calc(var(--space-2) + 2px)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', display: 'flex',
                alignItems: 'center', padding: 'var(--space-1)',
                transition: 'color var(--transition-fast)',
              }}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div style={{ marginBottom: 'var(--space-7)' }}>
            <Input
              label="Confirm password"
              type="password"
              id="reg-confirm"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={fieldErrors.confirmPassword}
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={loading}
            style={{ width: '100%', marginBottom: 'var(--space-6)' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent-gold)', fontWeight: 'var(--font-semibold)' }}>
            Sign in
          </Link>
        </p>
      </div>

      <p style={{
        marginTop: 'var(--space-8)', fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)', letterSpacing: '0.05em', textAlign: 'center',
      }}>
        © {new Date().getFullYear()} Golden Key Realty · Malta's Luxury Real Estate CRM
      </p>

      <style>{`
        @keyframes regFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
