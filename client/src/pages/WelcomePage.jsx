import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '../components/ui/GoldButton';
import GlassCard from '../components/ui/GlassCard';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import PropertyCard from '../components/ui/PropertyCard';
import TestimonialCard from '../components/ui/TestimonialCard';
import AISearchBar from '../components/ui/AISearchBar';
import SectionDivider from '../components/ui/SectionDivider';
import useScrollReveal from '../hooks/useScrollReveal';
import useTypingEffect from '../hooks/useTypingEffect';

/* ── Static data ── */
const PROPERTIES = [
  { name: 'Valletta Grand Penthouse', location: 'Valletta, Malta', price: '€1,250,000', bedrooms: 3, bathrooms: 2, area: 210, type: 'Penthouse' },
  { name: 'Sliema Sea-View Apartment', location: 'Sliema, Malta', price: '€650,000', bedrooms: 2, bathrooms: 2, area: 140, type: 'Apartment' },
  { name: 'Mdina Historic Palazzo', location: 'Mdina, Malta', price: '€2,100,000', bedrooms: 5, bathrooms: 4, area: 480, type: 'Palazzo' },
  { name: "St Julian's Luxury Villa", location: "St Julian's, Malta", price: '€1,850,000', bedrooms: 4, bathrooms: 3, area: 320, type: 'Villa' },
  { name: 'Gozo Farmhouse Estate', location: 'Gozo, Malta', price: '€780,000', bedrooms: 3, bathrooms: 3, area: 260, type: 'Farmhouse' },
  { name: 'Portomaso Marina Suite', location: "St Julian's, Malta", price: '€920,000', bedrooms: 2, bathrooms: 2, area: 175, type: 'Suite' },
];

const VALUE_PROPS = [
  { icon: '🏆', title: 'AI-Powered Matching', desc: 'Our proprietary algorithm analyzes 50+ criteria to match you with your perfect property instantly.' },
  { icon: '🔐', title: 'Exclusive Portfolio', desc: 'Access off-market listings and pre-launch opportunities available nowhere else in Malta.' },
  { icon: '🌍', title: 'Global Concierge', desc: 'From residency permits to interior design, our white-glove service covers everything.' },
  { icon: '📊', title: 'Market Intelligence', desc: 'Real-time analytics and predictive pricing powered by machine learning and local expertise.' },
  { icon: '💎', title: 'VIP Experience', desc: 'Dedicated relationship managers who understand luxury and discretion for our premium clients.' },
  { icon: '🏛️', title: 'Heritage Expertise', desc: "Specialists in Malta's unique architectural gems, palazzo conversions and historic properties." },
];

const TESTIMONIALS = [
  {
    quote: 'Golden Key found us our dream palazzo in Mdina within weeks. The AI search was uncanny — it understood exactly what we wanted before we even knew ourselves.',
    author: 'Alexandra C.',
    property: 'Mdina Historic Palazzo — €2.1M',
    rating: 5,
  },
  {
    quote: 'The concierge team handled everything — from the property search to residency application. World-class service that justified every euro of their fee.',
    author: 'Marcus R.',
    property: 'Portomaso Marina Suite — €920K',
    rating: 5,
  },
  {
    quote: "I've bought properties in London, Paris and Dubai. Golden Key Realty's process was smoother than all of them. Malta's best kept secret.",
    author: 'Sophie L.',
    property: "St Julian's Luxury Villa — €1.85M",
    rating: 5,
  },
];

const LIFESTYLE = [
  { label: 'Mediterranean Living', desc: 'Azure waters, golden sun, and year-round warmth', gradient: 'linear-gradient(135deg, #0a2040 0%, #1a4060 50%, #2a6080 100%)', icon: '🌊' },
  { label: 'Historic Charm', desc: 'Ancient temples, baroque architecture, and rich culture', gradient: 'linear-gradient(135deg, #3a2a0a 0%, #5a4a1a 50%, #7a6a3a 100%)', icon: '🏛️' },
  { label: 'Vibrant Nightlife', desc: 'World-class dining, entertainment and social scene', gradient: 'linear-gradient(135deg, #1a0a2a 0%, #3a1a4a 50%, #5a3a6a 100%)', icon: '✨' },
  { label: 'Investment Haven', desc: 'Stable returns, EU residency, and tax advantages', gradient: 'linear-gradient(135deg, #0a3a1a 0%, #1a5a2a 50%, #3a8a4a 100%)', icon: '📈' },
];

/* ── Hooks ── */
function useSectionRef() {
  return useScrollReveal({ threshold: 0.1 });
}

/* ── Main Component ── */
const WelcomePage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const carouselRef = useRef(null);
  const autoScrollRef = useRef(null);

  const { displayText } = useTypingEffect(
    ["Curated luxury living on the Mediterranean's finest island", "Discover Malta's most exclusive addresses", 'Where heritage meets modern sophistication'],
    { typingSpeed: 55, deletingSpeed: 25, pauseDuration: 2800 }
  );

  const [searchRef, searchVisible] = useSectionRef();
  const [valueRef, valueVisible] = useSectionRef();
  const [testimonialsRef, testimonialsVisible] = useSectionRef();
  const [lifestyleRef, lifestyleVisible] = useSectionRef();
  const [chatRef, chatVisible] = useSectionRef();
  const [newsletterRef, newsletterVisible] = useSectionRef();

  // Scroll parallax
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Stats counter trigger
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVisible(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Carousel auto-scroll
  useEffect(() => {
    autoScrollRef.current = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % PROPERTIES.length);
    }, 4000);
    return () => clearInterval(autoScrollRef.current);
  }, []);

  const pauseCarousel = () => clearInterval(autoScrollRef.current);
  const resumeCarousel = () => {
    autoScrollRef.current = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % PROPERTIES.length);
    }, 4000);
  };

  // ── Render ──
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      overflowX: 'hidden',
      background: 'var(--color-bg-primary, #1C140C)',
      color: 'var(--color-text-primary, #F5F0E8)',
    }}>

      {/* ══════════════════════════════════════
          1A. CINEMATIC HERO SECTION
      ══════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Parallax Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0d0a06 0%, #1C140C 30%, #2A1F14 60%, #1C140C 100%)',
          transform: `translateY(${scrollY * 0.3}px)`,
          willChange: 'transform',
        }} />

        {/* Animated gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 20% 30%, rgba(166, 125, 26, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(60, 50, 36, 0.6) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Floating Icons */}
        {[
          { icon: '🔑', top: '15%', left: '8%', delay: '0s', size: '2.5rem' },
          { icon: '💎', top: '20%', right: '10%', delay: '0.8s', size: '2rem' },
          { icon: '🏛️', top: '65%', left: '5%', delay: '1.5s', size: '2rem' },
          { icon: '⚓', top: '70%', right: '8%', delay: '0.5s', size: '1.8rem' },
          { icon: '🌊', top: '40%', left: '3%', delay: '1.2s', size: '1.5rem' },
          { icon: '✨', top: '35%', right: '5%', delay: '0.3s', size: '1.4rem' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              right: item.right,
              fontSize: item.size,
              opacity: 0.3,
              animation: `floatSlow 6s ease-in-out infinite`,
              animationDelay: item.delay,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))',
            }}
          >
            {item.icon}
          </div>
        ))}

        {/* Hero Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '2rem 1.5rem',
          maxWidth: '900px',
          width: '100%',
        }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '30px',
            padding: '0.4rem 1.25rem',
            fontSize: '0.78rem',
            fontWeight: '600',
            letterSpacing: '0.12em',
            color: 'rgba(212, 175, 55, 0.9)',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(8px)',
          }}>
            🏆 Malta's Premier Luxury Real Estate
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            fontWeight: '700',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
          }}>
            Malta's Most{' '}
            <span className="text-shimmer" style={{ display: 'inline-block' }}>
              Exclusive
            </span>
            <br />
            Properties
          </h1>

          {/* Typing Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'rgba(245,240,232,0.75)',
            marginBottom: '2.5rem',
            minHeight: '2rem',
            lineHeight: 1.6,
          }}>
            <span className="typing-cursor">{displayText}</span>
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
          }}>
            <GoldButton
              size="lg"
              className="pulse-glow"
              onClick={() => document.getElementById('properties-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              ✦ Explore Properties
            </GoldButton>
            <GoldButton
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Schedule Consultation
            </GoldButton>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          ref={statsRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            background: 'rgba(12, 9, 5, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(166, 125, 26, 0.2)',
            padding: '1.25rem 2rem',
          }}
        >
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            textAlign: 'center',
          }}>
            {[
              { value: 2.4, suffix: 'B Portfolio', prefix: '€', format: 'number' },
              { value: 500, suffix: '+ Listings', prefix: '', format: 'number' },
              { value: 120, suffix: '+ Elite Agents', prefix: '', format: 'number' },
              { value: 98, suffix: '% Satisfaction', prefix: '', format: 'number' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: 'var(--font-heading, "Playfair Display", serif)',
                  fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                  fontWeight: '700',
                  color: '#D4AF37',
                  lineHeight: 1,
                }}>
                  {stat.prefix}
                  <AnimatedCounter value={stat.value} duration={2000} format={stat.format} />
                  {stat.suffix}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: scrollY > 50 ? 0 : 0.6,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(212,175,55,0.7)' }}>SCROLL</span>
          <div style={{
            width: '24px',
            height: '38px',
            border: '2px solid rgba(212,175,55,0.4)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px',
          }}>
            <div style={{
              width: '4px',
              height: '8px',
              borderRadius: '2px',
              background: '#D4AF37',
              animation: 'float 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          1B. AI SEARCH SECTION
      ══════════════════════════════════════ */}
      <section
        ref={searchRef}
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) 1.5rem',
          background: 'linear-gradient(180deg, #1C140C 0%, #241a10 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Neural BG Pattern */}
        <div className="neural-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              opacity: searchVisible ? 1 : 0,
              transform: searchVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s ease',
            }}
          >
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '0.15em',
              color: 'rgba(212,175,55,0.7)',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}>
              ✦ Powered by AI
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading, "Playfair Display", serif)',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}>
              Find Your Dream Property<br />
              <span className="text-shimmer">with AI</span>
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(245,240,232,0.65)',
              marginBottom: '2.5rem',
              lineHeight: 1.7,
            }}>
              Our AI analyzes 500+ properties to find your perfect match.<br />
              Just describe what you want in plain language.
            </p>

            <AISearchBar onSearch={(q) => console.log('Search:', q)} />
          </div>
        </div>
      </section>

      <SectionDivider icon="✦" style={{ margin: '0 auto' }} />

      {/* ══════════════════════════════════════
          1C. FEATURED PROPERTIES CAROUSEL
      ══════════════════════════════════════ */}
      <section
        id="properties-section"
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) 0',
          overflow: 'hidden',
          background: '#1C140C',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              ✦ Handpicked Properties
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '700', marginBottom: '1rem' }}>
              Featured Listings
            </h2>
            <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
              Curated from our exclusive portfolio — each property handpicked for exceptional quality
            </p>
          </div>

          {/* Carousel */}
          <div
            onMouseEnter={pauseCarousel}
            onMouseLeave={resumeCarousel}
            style={{ position: 'relative' }}
          >
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: '1rem',
              scrollSnapType: 'x mandatory',
            }}>
              {PROPERTIES.map((p, i) => (
                <div key={i} style={{ scrollSnapAlign: 'start' }}>
                  <PropertyCard {...p} index={i} onView={() => navigate('/login')} />
                </div>
              ))}
            </div>

            {/* Navigation Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              {PROPERTIES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  style={{
                    width: i === carouselIdx ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === carouselIdx ? '#D4AF37' : 'rgba(212,175,55,0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider icon="🔑" style={{ margin: '0 auto' }} />

      {/* ══════════════════════════════════════
          1D. WHY GOLDEN KEY VALUE PROPS
      ══════════════════════════════════════ */}
      <section
        ref={valueRef}
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) 1.5rem',
          background: 'linear-gradient(180deg, #241a10 0%, #1C140C 100%)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              ✦ The Golden Key Advantage
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '700' }}>
              Why Choose <span className="text-shimmer">Golden Key</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {VALUE_PROPS.map((v, i) => (
              <div
                key={i}
                style={{
                  opacity: valueVisible ? 1 : 0,
                  transform: valueVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s ease ${i * 0.08}s`,
                }}
              >
                <GlassCard tilt padding="1.75rem" style={{ height: '100%' }}>
                  <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    animation: 'floatSlow 5s ease-in-out infinite',
                    animationDelay: `${i * 0.3}s`,
                    display: 'inline-block',
                  }}>
                    {v.icon}
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", serif)',
                    fontSize: '1.15rem',
                    fontWeight: '700',
                    marginBottom: '0.75rem',
                    color: 'var(--color-text-primary, #F5F0E8)',
                  }}>
                    {v.title}
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'rgba(245,240,232,0.65)',
                    lineHeight: 1.7,
                  }}>
                    {v.desc}
                  </p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          1E. TESTIMONIALS
      ══════════════════════════════════════ */}
      <section
        ref={testimonialsRef}
        className="section-dark-luxury"
        style={{ padding: 'clamp(4rem, 8vw, 7rem) 1.5rem' }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              ✦ Client Stories
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '700' }}>
              What Our Clients Say
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard
                key={i}
                {...t}
                delay={i * 0.15}
                visible={testimonialsVisible}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          1F. MALTA LIFESTYLE
      ══════════════════════════════════════ */}
      <section
        ref={lifestyleRef}
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) 1.5rem',
          background: '#1C140C',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              ✦ Island Living
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '700' }}>
              The Malta Lifestyle
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
          }}>
            {LIFESTYLE.map((item, i) => (
              <div
                key={i}
                style={{
                  opacity: lifestyleVisible ? 1 : 0,
                  transform: lifestyleVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s ease ${i * 0.1}s`,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  height: '280px',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                className="glass-gold-hover"
              >
                {/* Gradient Image Placeholder */}
                <div style={{ position: 'absolute', inset: 0, background: item.gradient }} />

                {/* Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                }} />

                {/* Icon */}
                <div style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  fontSize: '2rem',
                  filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.4))',
                  animation: 'floatSlow 5s ease-in-out infinite',
                  animationDelay: `${i * 0.4}s`,
                }}>
                  {item.icon}
                </div>

                {/* Text */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1.5rem',
                  background: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  borderTop: '1px solid rgba(212,175,55,0.15)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-heading, "Playfair Display", serif)',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    marginBottom: '0.35rem',
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.7)', lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          1G. AI VIRTUAL ASSISTANT PREVIEW
      ══════════════════════════════════════ */}
      <section
        ref={chatRef}
        style={{
          padding: 'clamp(4rem, 8vw, 7rem) 1.5rem',
          background: 'linear-gradient(180deg, #1C140C 0%, #241a10 100%)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}>
            {/* Text Side */}
            <div style={{
              opacity: chatVisible ? 1 : 0,
              transform: chatVisible ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'all 0.7s ease',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                ✦ AI Assistant
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: '700', marginBottom: '1rem', lineHeight: 1.2 }}>
                Meet Your Personal<br /><span className="text-shimmer">Property Advisor</span>
              </h2>
              <p style={{ color: 'rgba(245,240,232,0.65)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Our AI advisor learns your preferences and curates personalized property recommendations. Available 24/7, fluent in 8 languages.
              </p>
              <GoldButton onClick={() => navigate('/register')}>
                Start Your AI-Powered Search →
              </GoldButton>
            </div>

            {/* Chat Preview */}
            <div style={{
              opacity: chatVisible ? 1 : 0,
              transform: chatVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'all 0.7s ease 0.2s',
            }}>
              <GlassCard padding="1.5rem" style={{ maxWidth: '380px', margin: '0 auto' }}>
                {/* Chat Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                    boxShadow: '0 0 15px rgba(212,175,55,0.3)',
                  }}>
                    🤖
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Golden Key AI</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#4CAF50' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 4px #4CAF50' }} />
                      Online now
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="chat-bubble-bot">
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                      Hello! I'm your AI property advisor. 👋 How can I help you find your perfect property today?
                    </p>
                  </div>
                  <div className="chat-bubble-user">
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                      I'm looking for a sea-view apartment in Valletta 🌊
                    </p>
                  </div>
                  <div className="chat-bubble-bot">
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                      ✨ I found <strong>12 matching properties</strong> in Valletta with sea views. Here are my top 3 recommendations based on your profile...
                    </p>
                  </div>
                  {/* Typing Indicator */}
                  <div className="thinking-dots" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.75rem 1rem', background: 'rgba(166,125,26,0.08)', borderRadius: '0 12px 12px 12px', width: 'fit-content' }}>
                    <span /><span /><span />
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          1H. NEWSLETTER / CONTACT
      ══════════════════════════════════════ */}
      <section
        id="contact-section"
        ref={newsletterRef}
        className="section-dark-luxury"
        style={{ padding: 'clamp(4rem, 8vw, 7rem) 1.5rem' }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}>
            {/* Left: Text */}
            <div style={{
              opacity: newsletterVisible ? 1 : 0,
              transform: newsletterVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s ease',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                ✦ Exclusive Access
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: '700', marginBottom: '1rem' }}>
                Stay Ahead of<br />the Market
              </h2>
              <p style={{ color: 'rgba(245,240,232,0.65)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Get early access to exclusive listings, off-market opportunities, and our monthly Malta property market report.
              </p>
              {/* Trust Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {['🔒 GDPR Compliant', '✓ Licensed MFSA', '🛡️ ISO 27001'].map((badge, i) => (
                  <span key={i} style={{
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '20px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.72rem',
                    color: 'rgba(212,175,55,0.8)',
                    fontWeight: '500',
                    letterSpacing: '0.03em',
                  }}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div style={{
              opacity: newsletterVisible ? 1 : 0,
              transform: newsletterVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s ease 0.2s',
            }}>
              <GlassCard padding="2rem">
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(212,175,55,0.8)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    Your Email Address
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      style={{
                        flex: 1,
                        minWidth: '180px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(212,175,55,0.25)',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-primary, #F5F0E8)',
                        outline: 'none',
                        fontFamily: 'var(--font-body, Inter, sans-serif)',
                      }}
                    />
                    <GoldButton size="md">Subscribe</GoldButton>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)', margin: 0, lineHeight: 1.5 }}>
                  No spam. Unsubscribe anytime. By subscribing you agree to our Privacy Policy.
                </p>

                {/* Social Links */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(212,175,55,0.12)',
                }}>
                  {['LinkedIn', 'Instagram', 'Facebook', 'X'].map((social, i) => (
                    <button key={i} style={{
                      background: 'rgba(212,175,55,0.08)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      color: 'rgba(212,175,55,0.7)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'var(--font-body, Inter, sans-serif)',
                    }}>
                      {social}
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          1I. LUXURY FOOTER
      ══════════════════════════════════════ */}
      <footer style={{
        background: 'rgba(8, 5, 2, 0.95)',
        borderTop: '1px solid rgba(166,125,26,0.25)',
        padding: 'clamp(3rem, 6vw, 5rem) 1.5rem 0',
      }}>
        {/* Gold top line */}
        <div className="gold-divider-thick" style={{ marginBottom: '3rem', width: '100%' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}>
            {/* Column 1: Brand */}
            <div>
              <div style={{
                fontFamily: 'var(--font-heading, "Playfair Display", serif)',
                fontSize: '1.4rem',
                fontWeight: '700',
                marginBottom: '0.75rem',
              }}>
                <span className="text-shimmer">🔑 Golden Key</span> Realty
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.7, marginBottom: '1.25rem', maxWidth: '220px' }}>
                Malta's most exclusive property portal. Luxury real estate for discerning buyers.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.12em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Quick Links
              </div>
              {['Properties', 'Services', 'About Us', 'Contact', 'Sign In'].map((link, i) => (
                <div key={i} style={{ marginBottom: '0.6rem' }}>
                  <a href="#" style={{ color: 'rgba(245,240,232,0.55)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s', lineHeight: 1.8 }}
                    onMouseEnter={e => e.target.style.color = '#D4AF37'}
                    onMouseLeave={e => e.target.style.color = 'rgba(245,240,232,0.55)'}>
                    {link}
                  </a>
                </div>
              ))}
            </div>

            {/* Column 3: Localities */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.12em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Localities
              </div>
              {['Sliema', "St Julian's", 'Valletta', 'Mdina', 'Gozo', 'Portomaso'].map((loc, i) => (
                <div key={i} style={{ marginBottom: '0.6rem' }}>
                  <a href="#" style={{ color: 'rgba(245,240,232,0.55)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#D4AF37'}
                    onMouseLeave={e => e.target.style.color = 'rgba(245,240,232,0.55)'}>
                    {loc}
                  </a>
                </div>
              ))}
            </div>

            {/* Column 4: Contact */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.12em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Contact
              </div>
              {[
                { icon: '📞', text: '+356 2123 4567' },
                { icon: '✉️', text: 'hello@goldenkey.mt' },
                { icon: '📍', text: "Portomaso Business Tower, St Julian's, Malta" },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, fontSize: '0.9rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem 0',
            borderTop: '1px solid rgba(166,125,26,0.15)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.35)' }}>
              © 2025 Golden Key Realty Ltd. All rights reserved. Registered in Malta.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link, i) => (
                <a key={i} href="#" style={{
                  fontSize: '0.8rem',
                  color: 'rgba(245,240,232,0.35)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.target.style.color = '#D4AF37'}
                  onMouseLeave={e => e.target.style.color = 'rgba(245,240,232,0.35)'}>
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default WelcomePage;
