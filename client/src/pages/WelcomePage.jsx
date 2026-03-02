import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Card, { CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const WelcomePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const handleDemoLoad = () => {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* ── Hero ── */}
      <section
        style={{
          position: 'relative',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, #E0D5C5 0%, #D4C4B0 40%, #C8B8A0 100%)',
        }}
      >
        {/* Decorative circles */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: 'rgba(196, 162, 101, 0.18)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'rgba(156, 131, 103, 0.15)',
            pointerEvents: 'none',
          }}
        />

        {/* Hero card */}
        <div
          className="glass"
          style={{
            maxWidth: '640px',
            width: '90%',
            padding: 'var(--space-12) var(--space-8)',
            textAlign: 'center',
          }}
        >
          {/* Logo / brand mark */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <span
              style={{
                display: 'inline-block',
                width: '56px',
                height: '56px',
                lineHeight: '56px',
                fontSize: '28px',
                borderRadius: 'var(--radius-md)',
                background:
                  'linear-gradient(135deg, var(--color-accent-gold-light), var(--color-accent-gold))',
                boxShadow: '0 4px 16px rgba(196,162,101,0.35)',
              }}
            >
              🗝️
            </span>
          </div>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
              color: 'var(--color-accent-gold)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Malta's Premier Real Estate Platform
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Golden Key Realty
          </h1>

          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-8)',
            }}
          >
            A luxury CRM platform crafted for Malta's most discerning property
            professionals. Elegance meets intelligence.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="primary" size="lg">
              Explore Platform
            </Button>
            <Button variant="outline" size="lg" onClick={() => setModalOpen(true)}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* ── Design system showcase ── */}
      <section className="section container">
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            textAlign: 'center',
            marginBottom: 'var(--space-2)',
            color: 'var(--color-text-primary)',
          }}
        >
          Design System Preview
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-12)',
          }}
        >
          Luxury components built on a warm brown + glassmorphism foundation
        </p>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-12)',
          }}
        >
          <Card variant="glass" hover>
            <CardBody>
              <Badge variant="premium" style={{ marginBottom: 'var(--space-3)' }}>
                Premium
              </Badge>
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
              <Badge variant="success" style={{ marginBottom: 'var(--space-3)' }}>
                Available
              </Badge>
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
              <Badge variant="warning" style={{ marginBottom: 'var(--space-3)' }}>
                Under Offer
              </Badge>
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

        {/* Buttons showcase */}
        <Card variant="solid" style={{ marginBottom: 'var(--space-8)' }}>
          <CardBody>
            <h4
              style={{
                fontFamily: 'var(--font-heading)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Button Variants
            </h4>
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

        {/* Input showcase */}
        <Card variant="solid" style={{ marginBottom: 'var(--space-8)' }}>
          <CardBody>
            <h4
              style={{
                fontFamily: 'var(--font-heading)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Form Inputs
            </h4>
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

        {/* Badges showcase */}
        <Card variant="solid" style={{ marginBottom: 'var(--space-8)' }}>
          <CardBody>
            <h4
              style={{
                fontFamily: 'var(--font-heading)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Status Badges
            </h4>
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

        {/* Spinner showcase */}
        <Card variant="solid">
          <CardBody>
            <h4
              style={{
                fontFamily: 'var(--font-heading)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Loading Spinners
            </h4>
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
          padding: 'var(--space-8) 0',
          borderTop: '1px solid var(--color-border-light)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
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
