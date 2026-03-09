import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EyeIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/crm/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    background: focusedField === field ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${focusedField === field ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '12px',
    padding: '0.875rem 1.125rem',
    fontSize: '0.925rem',
    color: 'var(--color-text-primary, #F5F0E8)',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'var(--font-body, Inter, sans-serif)',
    boxSizing: 'border-box',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(212,175,55,0.1)' : 'none',
  });

  return (
    <div
      className="login-page-grid"
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        background: '#1C140C',
        fontFamily: 'var(--font-body, Inter, sans-serif)',
      }}
    >
      {/* ── Left Decorative Panel ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0d0a06 0%, #1C140C 35%, #2A1F14 65%, #3C3224 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2.5rem',
        minHeight: '100vh',
      }}
        className="login-left-panel"
      >
        {/* Animated gradient orbs */}
        {[
          { w: 350, h: 350, top: '-10%', left: '-10%', opacity: 0.12, color: '#8B6914' },
          { w: 250, h: 250, bottom: '10%', right: '-5%', opacity: 0.1, color: '#D4AF37' },
          { w: 200, h: 200, top: '40%', left: '5%', opacity: 0.07, color: '#A67D1A' },
        ].map((orb, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: orb.w,
              height: orb.h,
              top: orb.top,
              left: orb.left,
              bottom: orb.bottom,
              right: orb.right,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
              opacity: orb.opacity,
              filter: 'blur(40px)',
              pointerEvents: 'none',
              animation: `floatSlow ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}

        {/* Floating icons */}
        {[
          { icon: '🔑', top: '12%', right: '15%', size: '2.2rem', delay: '0s' },
          { icon: '💎', bottom: '20%', left: '12%', size: '1.8rem', delay: '1s' },
          { icon: '🏛️', top: '50%', right: '8%', size: '1.6rem', delay: '0.5s' },
          { icon: '🌊', bottom: '35%', right: '20%', size: '1.4rem', delay: '1.5s' },
        ].map((f, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: f.top, bottom: f.bottom, left: f.left, right: f.right,
            fontSize: f.size,
            opacity: 0.35,
            animation: `floatSlow 5s ease-in-out infinite`,
            animationDelay: f.delay,
            filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.4))',
            pointerEvents: 'none',
          }}>
            {f.icon}
          </div>
        ))}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '380px' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.15em',
            color: 'rgba(212,175,55,0.65)',
            textTransform: 'uppercase',
            marginBottom: '1.25rem',
          }}>
            ✦ Malta's Premier Property Portal
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
            fontSize: 'clamp(2.2rem, 5vw, 3rem)',
            fontWeight: '700',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            color: '#F5F0E8',
          }}>
            Welcome<br />
            <span style={{
              background: 'linear-gradient(90deg, #8B6914, #D4AF37, #8B6914)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 3s linear infinite',
            }}>
              Back
            </span>
          </h1>

          <p style={{
            fontSize: '1rem',
            color: 'rgba(245,240,232,0.55)',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}>
            Your exclusive access to Malta's most prestigious property portfolio awaits.
          </p>

          {/* Feature badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'flex-start' }}>
            {[
              { icon: '🤖', text: 'AI-Powered Property Matching' },
              { icon: '🔐', text: 'Exclusive Off-Market Listings' },
              { icon: '📊', text: 'Real-Time Market Intelligence' },
            ].map((feat, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(212,175,55,0.07)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: '10px',
                padding: '0.6rem 1rem',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                <span style={{ fontSize: '1rem' }}>{feat.icon}</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.7)', fontWeight: '500' }}>{feat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        background: 'linear-gradient(180deg, #1C140C 0%, #241a10 100%)',
        position: 'relative',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '20%', right: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(166,125,26,0.06) 0%, transparent 70%)',
          filter: 'blur(30px)', pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '0.5rem',
            }}>
              <span style={{ fontSize: '1.5rem' }}>🔑</span>
              <span style={{
                fontFamily: 'var(--font-heading, "Playfair Display", serif)',
                fontSize: '1.3rem',
                fontWeight: '700',
                color: '#D4AF37',
              }}>
                Golden Key Realty
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.45)', marginTop: '0.25rem' }}>
              Sign in to your account
            </p>
          </div>

          {/* Form Card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(166,125,26,0.2)',
            borderRadius: '20px',
            padding: 'clamp(1.75rem, 4vw, 2.5rem)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Social Login Placeholders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { name: 'Google', icon: 'G' },
                { name: 'Apple', icon: '⌘' },
              ].map((provider) => (
                <button
                  key={provider.name}
                  disabled
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.7rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: 'rgba(245,240,232,0.5)',
                    fontSize: '0.85rem',
                    cursor: 'not-allowed',
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                  }}
                >
                  <span style={{ fontWeight: '700' }}>{provider.icon}</span>
                  {provider.name}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.35)', whiteSpace: 'nowrap' }}>or sign in with email</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.875rem',
                color: '#FCA5A5',
              }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: '1.125rem' }}>
                <label style={{
                  display: 'block', fontSize: '0.8rem', fontWeight: '600',
                  color: 'rgba(212,175,55,0.75)', marginBottom: '0.45rem', letterSpacing: '0.04em',
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your@email.com"
                  required
                  style={inputStyle('email')}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block', fontSize: '0.8rem', fontWeight: '600',
                  color: 'rgba(212,175,55,0.75)', marginBottom: '0.45rem', letterSpacing: '0.04em',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    style={{ ...inputStyle('password'), paddingRight: '3rem' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'rgba(212,175,55,0.6)', display: 'flex', padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#D4AF37', width: '15px', height: '15px' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.55)' }}>Remember me</span>
                </label>
                <a href="#" style={{
                  fontSize: '0.82rem',
                  color: 'rgba(212,175,55,0.7)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.target.style.color = '#D4AF37'}
                  onMouseLeave={e => e.target.style.color = 'rgba(212,175,55,0.7)'}>
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? 'rgba(139,105,20,0.5)' : 'linear-gradient(135deg, #8B6914, #D4AF37)',
                  color: '#1C140C',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.925rem',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.04em',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(212,175,55,0.35)',
                  fontFamily: 'var(--font-body, Inter, sans-serif)',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '16px', height: '16px', border: '2px solid #1C140C',
                      borderTopColor: 'transparent', borderRadius: '50%',
                      display: 'inline-block', animation: 'spin 0.8s linear infinite',
                    }} />
                    Signing in...
                  </span>
                ) : '✦ Sign In to Dashboard'}
              </button>
            </form>
          </div>

          {/* Register Link */}
          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'rgba(245,240,232,0.45)',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#D4AF37',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'opacity 0.2s',
            }}>
              Create account →
            </Link>
          </p>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-page-grid { display: grid; }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-page-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
