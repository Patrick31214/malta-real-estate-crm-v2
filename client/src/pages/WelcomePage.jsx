import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Card, { CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/* ── Inline SVG crown / brand mark ── */
const CrownIcon = () => (
  <svg
    viewBox="0 0 64 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: '100%' }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#E8D09A" />
        <stop offset="50%"  stopColor="#C4A265" />
        <stop offset="100%" stopColor="#A8864E" />
      </linearGradient>
    </defs>
    {/* Base bar */}
    <rect x="6" y="36" width="52" height="7" rx="3.5" fill="url(#crownGrad)" />
    {/* Crown body */}
    <path
      d="M6 36 L14 14 L24 26 L32 6 L40 26 L50 14 L58 36 Z"
      fill="url(#crownGrad)"
    />
    {/* Centre gem */}
    <circle cx="32" cy="8" r="4" fill="#FCEEA0" opacity="0.9" />
    {/* Side gems */}
    <circle cx="14" cy="15" r="2.5" fill="#FCEEA0" opacity="0.8" />
    <circle cx="50" cy="15" r="2.5" fill="#FCEEA0" opacity="0.8" />
  </svg>
);

/* ── Floating luxury emoji decorator ── */
const FloatEmoji = ({ emoji, style = {}, speed = 'animate-float' }) => (
  <span
    className={speed}
    aria-hidden="true"
    style={{
      display: 'inline-block',
      fontSize: '1.6rem',
      filter: 'drop-shadow(0 4px 12px rgba(196,162,101,0.55))',
      userSelect: 'none',
      ...style,
    }}
  >
    {emoji}
  </span>
);

const WelcomePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const handleDemoLoad = () => {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* ── Full-Screen Hero ── */}
      <section
        className="hero-gradient"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 'var(--space-16) var(--space-6)',
        }}
      >
        {/* Subtle gold orb — top-right */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,162,101,0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle warm orb — bottom-left */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(156,131,103,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Fine horizontal rule — top accent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(196,162,101,0.50), transparent)',
          }}
        />

        {/* ── Top-left floating gold icon ── */}
        <FloatEmoji
          emoji="⚜️"
          speed="animate-float-slow"
          style={{
            position: 'absolute',
            top: 'var(--space-8)',
            left: 'var(--space-8)',
            fontSize: '2rem',
            opacity: 0.75,
          }}
        />

        {/* ── Top-right floating accent ── */}
        <FloatEmoji
          emoji="🌟"
          speed="animate-float-gentle"
          style={{
            position: 'absolute',
            top: 'var(--space-8)',
            right: 'var(--space-8)',
            fontSize: '1.8rem',
            opacity: 0.65,
            animationDelay: '1.5s',
          }}
        />

        {/* ── Brand mark — floating ── */}
        <div
          className="animate-float"
          style={{
            width: '80px',
            height: '60px',
            marginBottom: 'var(--space-6)',
            filter: 'drop-shadow(0 8px 24px rgba(196,162,101,0.55))',
          }}
        >
          <CrownIcon />
        </div>

        {/* Eyebrow label */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-semibold)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-gold)',
            marginBottom: 'var(--space-5)',
          }}
        >
          Malta's Premier Real Estate Platform
        </p>

        {/* Brand headline */}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.6rem, 7vw, 5rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            textAlign: 'center',
            color: 'var(--color-text-primary)',
            background: 'linear-gradient(135deg, var(--color-text-primary) 30%, var(--color-accent-gold) 70%, var(--color-accent-gold-dark) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 'var(--space-6)',
            maxWidth: '820px',
          }}
        >
          Golden Key Realty
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            fontWeight: 'var(--font-light)',
            letterSpacing: '0.04em',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            textAlign: 'center',
            marginBottom: 'var(--space-10)',
            maxWidth: '560px',
          }}
        >
          A luxury CRM platform crafted for Malta's most discerning property
          professionals. Elegance meets intelligence.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-16)',
          }}
        >
          <Button variant="gold" size="lg">
            Explore Platform
          </Button>
          <Button variant="outline" size="lg" onClick={() => setModalOpen(true)}>
            Learn More
          </Button>
        </div>

        {/* Stats strip */}
        <div
          className="glass"
          style={{
            display: 'flex',
            gap: 'var(--space-10)',
            padding: 'var(--space-5) var(--space-10)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            { value: '500+', label: 'Active Listings' },
            { value: '€2.4B', label: 'Portfolio Value' },
            { value: '120+', label: 'Elite Agents' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-accent-gold)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {value}
              </p>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginTop: 'var(--space-1)',
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Design system showcase ── */}
      <section
        style={{
          width: '100%',
          maxWidth: '1600px',
          marginInline: 'auto',
          paddingBlock: 'var(--space-16)',
          paddingInline: 'var(--space-10)',
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)', position: 'relative' }}>
          <FloatEmoji
            emoji="🏛️"
            speed="animate-float-slow"
            style={{ fontSize: '2.4rem', marginBottom: 'var(--space-3)', display: 'block' }}
          />
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              marginBottom: 'var(--space-2)',
              color: 'var(--color-text-primary)',
            }}
          >
            Design System Preview
          </h2>
          <p
            style={{
              letterSpacing: '0.03em',
              color: 'var(--color-text-muted)',
            }}
          >
            Luxury components built on a warm brown + glassmorphism foundation
          </p>
        </div>

        {/* ── Property Cards ── */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              justifyContent: 'center',
              marginBottom: 'var(--space-6)',
            }}
          >
            <FloatEmoji emoji="💎" speed="animate-float-gentle" style={{ animationDelay: '0.5s' }} />
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xl)',
                color: 'var(--color-text-primary)',
              }}
            >
              Premium Properties
            </h3>
            <FloatEmoji emoji="💎" speed="animate-float-gentle" style={{ animationDelay: '1s' }} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            <Card variant="glass" hover>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <Badge variant="premium">
                    Premium
                  </Badge>
                  <FloatEmoji emoji="🏆" speed="animate-float-gentle" style={{ fontSize: '1.2rem', animationDelay: '0.3s' }} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-xl)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Valletta Penthouse
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  Grand Harbour views, 3 bed, 2 bath. Exquisitely restored.
                </p>
                <p
                  style={{
                    marginTop: 'var(--space-3)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--color-primary-dark)',
                  }}
                >
                  €1,250,000
                </p>
              </CardBody>
            </Card>

            <Card variant="glass" hover>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <Badge variant="success">
                    Available
                  </Badge>
                  <FloatEmoji emoji="🔑" speed="animate-float-gentle" style={{ fontSize: '1.2rem', animationDelay: '0.8s' }} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-xl)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Mdina Townhouse
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  Historic Silent City. Original features, modern comforts.
                </p>
                <p
                  style={{
                    marginTop: 'var(--space-3)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--color-primary-dark)',
                  }}
                >
                  €875,000
                </p>
              </CardBody>
            </Card>

            <Card variant="glass" hover>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <Badge variant="warning">
                    Under Offer
                  </Badge>
                  <FloatEmoji emoji="🌟" speed="animate-float-gentle" style={{ fontSize: '1.2rem', animationDelay: '1.2s' }} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-xl)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  St Julian's Apartment
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  Seafront boulevard, 2 bed. Bright, airy and fully finished.
                </p>
                <p
                  style={{
                    marginTop: 'var(--space-3)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--color-primary-dark)',
                  }}
                >
                  €520,000
                </p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* ── Buttons showcase ── */}
        <Card variant="solid" style={{ marginBottom: 'var(--space-8)' }}>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <FloatEmoji emoji="✨" speed="animate-float-gentle" style={{ animationDelay: '0.2s' }} />
              <h4 style={{ fontFamily: 'var(--font-heading)' }}>
                Button Variants
              </h4>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="gold">Gold</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" loading={loadingBtn} onClick={handleDemoLoad}>
                {loadingBtn ? 'Loading…' : 'Demo Load'}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* ── Input showcase ── */}
        <Card variant="solid" style={{ marginBottom: 'var(--space-8)' }}>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <FloatEmoji emoji="🔑" speed="animate-float-gentle" style={{ animationDelay: '0.6s' }} />
              <h4 style={{ fontFamily: 'var(--font-heading)' }}>
                Form Inputs
              </h4>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <Input label="Property Name" placeholder="e.g. Grand Harbour Villa" />
              <Input label="Asking Price" placeholder="€0" hint="Enter value in Euros" />
              <Input
                label="Contact Email"
                type="email"
                placeholder="agent@goldenkey.mt"
                error="Please enter a valid email"
              />
            </div>
          </CardBody>
        </Card>

        {/* ── Badges showcase ── */}
        <Card variant="solid" style={{ marginBottom: 'var(--space-8)' }}>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <FloatEmoji emoji="👑" speed="animate-float-gentle" style={{ animationDelay: '0.4s' }} />
              <h4 style={{ fontFamily: 'var(--font-heading)' }}>
                Status Badges
              </h4>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge variant="default">Default</Badge>
              <Badge variant="premium">Premium</Badge>
              <Badge variant="success">Available</Badge>
              <Badge variant="warning">Under Offer</Badge>
              <Badge variant="error">Sold</Badge>
              <Badge variant="info">New Listing</Badge>
              <Badge variant="default" size="sm">Small</Badge>
            </div>
          </CardBody>
        </Card>

        {/* ── Spinner showcase ── */}
        <Card variant="solid">
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <FloatEmoji emoji="⚡" speed="animate-float-gentle" style={{ animationDelay: '0.9s' }} />
              <h4 style={{ fontFamily: 'var(--font-heading)' }}>
                Loading Spinners
              </h4>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
              <LoadingSpinner size="sm" color="primary" />
              <LoadingSpinner size="md" color="gold" />
              <LoadingSpinner size="lg" color="primary" />
            </div>
          </CardBody>
        </Card>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: 'var(--space-10) var(--space-6)',
          borderTop: '1px solid var(--color-border-light)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
          letterSpacing: '0.04em',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <FloatEmoji emoji="⚜️" speed="animate-float-gentle" style={{ fontSize: '1.1rem', animationDelay: '0s' }} />
          <FloatEmoji emoji="🏛️" speed="animate-float-gentle" style={{ fontSize: '1.1rem', animationDelay: '0.7s' }} />
          <FloatEmoji emoji="💎" speed="animate-float-gentle" style={{ fontSize: '1.1rem', animationDelay: '1.4s' }} />
        </div>
        <p>
          © {new Date().getFullYear()} Golden Key Realty · Malta's Luxury Real
          Estate CRM
        </p>
      </footer>

      {/* ── Demo Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="About Golden Key Realty"
        footer={
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Got it
          </Button>
        }
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <FloatEmoji emoji="🏆" speed="animate-float" style={{ fontSize: '2.5rem' }} />
        </div>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
          Golden Key Realty is Malta's next-generation luxury property CRM.
          Built for elite agents who demand a platform as refined as the
          properties they represent — combining intelligent workflows,
          stunning design, and seamless client management.
        </p>
      </Modal>
    </div>
  );
};

export default WelcomePage;

