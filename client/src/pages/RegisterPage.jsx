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

const STEPS = [
  { label: 'Account', desc: 'Your login details' },
  { label: 'Profile', desc: 'Your information' },
  { label: 'Ready', desc: 'All set!' },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(false);

  const inputStyle = (field, hasError) => ({
    width: '100%',
    background: focusedField === field ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${hasError ? 'rgba(239,68,68,0.5)' : focusedField === field ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
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

  const validateStep1 = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    return e;
  };

  const handleNext = () => {
    if (step === 1) {
      const e = validateStep1();
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(2);
    } else if (step === 2) {
      const e = validateStep2();
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setGlobalError('Please accept the terms and conditions to continue.');
      return;
    }
    setGlobalError('');
    setLoading(true);
    try {
      const result = await register({ firstName, lastName, email, password });
      if (result && result.pending) {
        setPendingApproval(true);
      } else {
        navigate('/crm/dashboard');
      }
    } catch (err) {
      setGlobalError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = STEPS.length > 1 ? ((step - 1) / (STEPS.length - 1)) * 100 : 100;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      background: '#1C140C',
      fontFamily: 'var(--font-body, Inter, sans-serif)',
    }}>
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
        className="register-left-panel"
      >
        {/* Orbs */}
        {[
          { w: 400, h: 400, top: '-15%', right: '-10%', opacity: 0.1, color: '#D4AF37' },
          { w: 280, h: 280, bottom: '5%', left: '-5%', opacity: 0.08, color: '#8B6914' },
        ].map((orb, i) => (
          <div key={i} style={{
            position: 'absolute', width: orb.w, height: orb.h,
            top: orb.top, right: orb.right, bottom: orb.bottom, left: orb.left,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            opacity: orb.opacity, filter: 'blur(50px)', pointerEvents: 'none',
            animation: `floatSlow ${7 + i}s ease-in-out infinite`, animationDelay: `${i * 0.8}s`,
          }} />
        ))}

        {/* Floating Icons */}
        {[
          { icon: '🏛️', top: '10%', left: '15%', size: '2rem', delay: '0s' },
          { icon: '💎', top: '20%', right: '10%', size: '1.8rem', delay: '0.6s' },
          { icon: '🔑', bottom: '25%', right: '15%', size: '2.2rem', delay: '1.2s' },
          { icon: '🌊', bottom: '15%', left: '10%', size: '1.5rem', delay: '0.4s' },
        ].map((f, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: f.top, bottom: f.bottom, left: f.left, right: f.right,
            fontSize: f.size, opacity: 0.3,
            animation: `floatSlow 5s ease-in-out infinite`, animationDelay: f.delay,
            filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.4))', pointerEvents: 'none',
          }}>
            {f.icon}
          </div>
        ))}

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '380px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.65)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            ✦ Join Malta's Premier Platform
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
            fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
            fontWeight: '700', lineHeight: 1.15, marginBottom: '1.25rem', color: '#F5F0E8',
          }}>
            Malta's Premier<br />
            <span style={{
              background: 'linear-gradient(90deg, #8B6914, #D4AF37, #8B6914)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', animation: 'shimmer 3s linear infinite',
            }}>
              Property Platform
            </span>
          </h1>

          <p style={{ fontSize: '0.95rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Join thousands of buyers and investors who've found their perfect property with our AI-powered platform.
          </p>

          {/* Feature list */}
          {[
            { icon: '✓', text: 'Access 500+ exclusive listings' },
            { icon: '✓', text: 'AI-powered property matching' },
            { icon: '✓', text: 'Direct agent communication' },
            { icon: '✓', text: 'Market insights & reports' },
          ].map((feat, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '0.75rem',
              opacity: 0,
              animation: `slideUpFade 0.5s ease forwards`,
              animationDelay: `${0.1 + i * 0.1}s`,
            }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: '#1C140C', fontWeight: '700', flexShrink: 0,
              }}>
                {feat.icon}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(245,240,232,0.7)' }}>{feat.text}</span>
            </div>
          ))}
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
        <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
          {/* ── Pending Approval Screen ── */}
          {pendingApproval ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>✅</div>
              <h2 style={{
                fontFamily: 'var(--font-heading, "Playfair Display", serif)',
                fontSize: '1.6rem', fontWeight: '700', color: '#F5F0E8', marginBottom: '1rem',
              }}>
                Account Submitted!
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'rgba(245,240,232,0.65)', lineHeight: 1.7, marginBottom: '1.75rem' }}>
                Your account is <strong style={{ color: '#D4AF37' }}>pending admin approval</strong>. You will be able to log in once an administrator reviews and activates your account.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                  color: '#1C140C',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  letterSpacing: '0.05em',
                }}
              >
                Back to Login
              </Link>
            </div>
          ) : (
          <>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔑</span>
              <span style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: '1.3rem', fontWeight: '700', color: '#D4AF37' }}>
                Golden Key Realty
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.45)', marginTop: '0.25rem' }}>
              Create your account
            </p>
          </div>

          {/* Step Progress */}
          <div style={{ marginBottom: '1.75rem' }}>
            {/* Step labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: i + 1 <= step ? 'linear-gradient(135deg, #8B6914, #D4AF37)' : 'rgba(255,255,255,0.07)',
                    border: i + 1 === step ? '2px solid #D4AF37' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 0.35rem',
                    fontSize: '0.8rem', fontWeight: '700',
                    color: i + 1 <= step ? '#1C140C' : 'rgba(245,240,232,0.3)',
                    transition: 'all 0.4s ease',
                    boxShadow: i + 1 === step ? '0 0 15px rgba(212,175,55,0.4)' : 'none',
                  }}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '600', color: i + 1 === step ? '#D4AF37' : 'rgba(245,240,232,0.35)', letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #8B6914, #D4AF37)',
                borderRadius: '2px',
                transition: 'width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                boxShadow: '0 0 8px rgba(212,175,55,0.5)',
              }} />
            </div>
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
            {globalError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
                fontSize: '0.875rem', color: '#FCA5A5',
              }}>
                ⚠ {globalError}
              </div>
            )}

            {/* Step 1: Account */}
            {step === 1 && (
              <div style={{ animation: 'slideUpFade 0.4s ease' }}>
                <h3 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.35rem', color: '#F5F0E8' }}>
                  Create your account
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.45)', marginBottom: '1.5rem' }}>
                  Set up your secure login credentials
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(212,175,55,0.75)', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="your@email.com"
                    style={inputStyle('email', !!errors.email)}
                    autoComplete="email"
                  />
                  {errors.email && <div style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.35rem' }}>⚠ {errors.email}</div>}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(212,175,55,0.75)', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Min. 8 characters"
                      style={{ ...inputStyle('password', !!errors.password), paddingRight: '3rem' }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(212,175,55,0.6)', display: 'flex', padding: 0 }}>
                      {showPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                    </button>
                  </div>
                  {errors.password && <div style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.35rem' }}>⚠ {errors.password}</div>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(212,175,55,0.75)', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Repeat your password"
                      style={{ ...inputStyle('confirm', !!errors.confirmPassword), paddingRight: '3rem' }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(212,175,55,0.6)', display: 'flex', padding: 0 }}>
                      {showConfirmPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.35rem' }}>⚠ {errors.confirmPassword}</div>}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    width: '100%', background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                    color: '#1C140C', border: 'none', borderRadius: '12px',
                    padding: '0.925rem', fontSize: '1rem', fontWeight: '700',
                    cursor: 'pointer', letterSpacing: '0.04em',
                    boxShadow: '0 4px 20px rgba(212,175,55,0.35)',
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2: Profile */}
            {step === 2 && (
              <div style={{ animation: 'slideUpFade 0.4s ease' }}>
                <h3 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.35rem', color: '#F5F0E8' }}>
                  Your profile
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.45)', marginBottom: '1.5rem' }}>
                  Tell us a little about yourself
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(212,175,55,0.75)', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="John"
                      style={inputStyle('firstName', !!errors.firstName)}
                      autoComplete="given-name"
                    />
                    {errors.firstName && <div style={{ fontSize: '0.72rem', color: '#FCA5A5', marginTop: '0.3rem' }}>⚠ {errors.firstName}</div>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(212,175,55,0.75)', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Smith"
                      style={inputStyle('lastName', !!errors.lastName)}
                      autoComplete="family-name"
                    />
                    {errors.lastName && <div style={{ fontSize: '0.72rem', color: '#FCA5A5', marginTop: '0.3rem' }}>⚠ {errors.lastName}</div>}
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Your name will appear on your profile and in communications with agents.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(245,240,232,0.6)', borderRadius: '12px',
                      padding: '0.875rem', fontSize: '0.9rem', fontWeight: '500',
                      cursor: 'pointer', fontFamily: 'var(--font-body, Inter, sans-serif)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      flex: 2, background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                      color: '#1C140C', border: 'none', borderRadius: '12px',
                      padding: '0.875rem', fontSize: '0.95rem', fontWeight: '700',
                      cursor: 'pointer', letterSpacing: '0.04em',
                      boxShadow: '0 4px 20px rgba(212,175,55,0.35)',
                      fontFamily: 'var(--font-body, Inter, sans-serif)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <form onSubmit={handleSubmit} style={{ animation: 'slideUpFade 0.4s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem', fontSize: '1.5rem',
                    boxShadow: '0 0 25px rgba(212,175,55,0.4)',
                  }}>
                    🔑
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.35rem', color: '#F5F0E8' }}>
                    Almost there!
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.45)', marginBottom: '1.25rem' }}>
                    Review your details and create your account
                  </p>
                </div>

                {/* Summary */}
                <div style={{
                  background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)',
                  borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.45)' }}>Name</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#F5F0E8' }}>{firstName} {lastName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.45)' }}>Email</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#F5F0E8' }}>{email}</span>
                  </div>
                </div>

                {/* Terms */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ accentColor: '#D4AF37', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.5 }}>
                    I agree to the{' '}
                    <a href="#" style={{ color: '#D4AF37', textDecoration: 'none' }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" style={{ color: '#D4AF37', textDecoration: 'none' }}>Privacy Policy</a>
                  </span>
                </label>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(245,240,232,0.6)', borderRadius: '12px',
                      padding: '0.875rem', fontSize: '0.9rem', fontWeight: '500',
                      cursor: 'pointer', fontFamily: 'var(--font-body, Inter, sans-serif)',
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2, background: loading ? 'rgba(139,105,20,0.5)' : 'linear-gradient(135deg, #8B6914, #D4AF37)',
                      color: '#1C140C', border: 'none', borderRadius: '12px',
                      padding: '0.875rem', fontSize: '0.95rem', fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : '0 4px 20px rgba(212,175,55,0.35)',
                      fontFamily: 'var(--font-body, Inter, sans-serif)',
                      letterSpacing: '0.04em', transition: 'all 0.3s ease',
                    }}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '16px', height: '16px', border: '2px solid #1C140C',
                          borderTopColor: 'transparent', borderRadius: '50%',
                          display: 'inline-block', animation: 'spin 0.8s linear infinite',
                        }} />
                        Creating...
                      </span>
                    ) : '✦ Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Login link */}
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'rgba(245,240,232,0.45)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: '600' }}>
              Sign in →
            </Link>
          </p>
          </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .register-left-panel { display: flex; }
        @media (max-width: 768px) {
          .register-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
