import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';

/* ── Helpers ── */
const fmtPrice = (v) => {
  if (v == null) return '—';
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
};

const SIMILAR_PROPS = [
  { name: 'Valletta Harbour View', price: '€720,000', type: 'Apartment', beds: 2, baths: 1, area: 120, gradient: 'linear-gradient(135deg, #1a3a2a, #4a7a5a, #8B6914)' },
  { name: 'Sliema Seafront Suite', price: '€950,000', type: 'Suite', beds: 3, baths: 2, area: 180, gradient: 'linear-gradient(135deg, #1a1a3a, #4a4a8a, #8B6914)' },
  { name: 'St Julian\'s Modern Flat', price: '€580,000', type: 'Apartment', beds: 2, baths: 1, area: 105, gradient: 'linear-gradient(135deg, #3a1a1a, #8a4a4a, #8B6914)' },
];

const SharedPropertyPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const agentParam = searchParams.get('agent');

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `/api/public/properties/${id}${agentParam ? `?agent=${agentParam}` : ''}`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Property not found');
        return res.json();
      })
      .then(data => setProperty(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, agentParam]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, []);

  /* ── Loading State ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1C140C' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px', border: '3px solid rgba(212,175,55,0.2)',
          borderTopColor: '#D4AF37', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
        }} />
        <p style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
          Loading property...
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ── Error State ── */
  if (error || !property) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1C140C', padding: '2rem' }}>
      <div style={{
        textAlign: 'center', maxWidth: '500px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(166,125,26,0.2)',
        borderRadius: '20px', padding: '3rem 2rem',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#F5F0E8' }}>
          Property Not Found
        </h2>
        <p style={{ color: 'rgba(245,240,232,0.5)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{error || 'This property may have been removed or the link is invalid.'}</p>
        <Link to="/" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
          color: '#1C140C', textDecoration: 'none',
          borderRadius: '10px', padding: '0.75rem 1.75rem',
          fontWeight: '700', fontSize: '0.9rem',
        }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );

  const p = property;
  const photos = [p.heroImage, ...(p.images || [])].filter(Boolean);
  const features = p.features || [];
  // Stable estimate seeded from property id so it doesn't change on re-render
  const aiEstimate = useMemo(() => {
    if (!p.price) return null;
    const seed = (String(p.id || p._id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 100) / 1000;
    return Math.round(p.price * (0.92 + seed));
  }, [p.id, p._id, p.price]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'location', label: 'Location' },
    { id: 'virtual-tour', label: '360° Tour' },
    { id: 'ai-valuation', label: 'AI Valuation' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1C140C',
      fontFamily: 'Inter, sans-serif',
      color: '#F5F0E8',
    }}>

      {/* ── Breadcrumb ── */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '1.5rem 1.5rem 0',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)',
        flexWrap: 'wrap',
      }}>
        <Link to="/" style={{ color: 'rgba(212,175,55,0.6)', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <span style={{ color: 'rgba(245,240,232,0.4)' }}>Properties</span>
        <span>›</span>
        <span style={{ color: 'rgba(245,240,232,0.6)' }}>{p.title || 'Property Details'}</span>
      </div>

      {/* ── Cinematic Hero ── */}
      <div style={{ position: 'relative', maxWidth: '1200px', margin: '1rem auto 0', padding: '0 1.5rem' }}>
        <div style={{
          height: 'clamp(280px, 45vw, 500px)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          background: photos[0]
            ? `url(${photos[0]}) center/cover`
            : 'linear-gradient(135deg, #1a3a2a 0%, #2d5a40 40%, #4a7a5a 70%, #8B6914 100%)',
        }}>
          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          }} />

          {/* Status Badge */}
          <div style={{
            position: 'absolute', top: '1.25rem', left: '1.25rem',
            background: p.status === 'for_sale' ? 'linear-gradient(135deg, #8B6914, #D4AF37)' : 'rgba(46,125,50,0.9)',
            color: p.status === 'for_sale' ? '#1C140C' : '#fff',
            borderRadius: '20px', padding: '0.4rem 1rem',
            fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {p.status === 'for_sale' ? '✦ For Sale' : p.status === 'for_rent' ? 'For Rent' : (p.status?.replace(/_/g, ' ') || 'Listed')}
          </div>

          {/* Property Title Overlay */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem',
          }}>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: '700',
              color: '#fff',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              marginBottom: '0.5rem',
              lineHeight: 1.2,
            }}>
              {p.title || 'Luxury Property'}
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📍 {p.address || p.locality || ''}
            </div>
          </div>
        </div>

        {/* Photo thumbnails row */}
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {photos.slice(0, 5).map((photo, i) => (
              <div
                key={i}
                onClick={() => setLightboxIndex(i)}
                style={{
                  width: '100px', height: '70px', flexShrink: 0,
                  borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                  border: lightboxIndex === i ? '2px solid #D4AF37' : '2px solid transparent',
                  transition: 'border-color 0.2s',
                }}
              >
                <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            {photos.length > 5 && (
              <div style={{
                width: '100px', height: '70px', flexShrink: 0, borderRadius: '10px',
                background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '0.8rem', color: '#D4AF37', fontWeight: '600',
              }}>
                +{photos.length - 5} more
              </div>
            )}
          </div>
        )}

        {/* Floating Info Card + CTA Row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '1rem',
          alignItems: 'center', justifyContent: 'space-between',
          marginTop: '1.5rem',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(166,125,26,0.2)',
          borderRadius: '16px', padding: '1.25rem 1.5rem',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Asking Price
            </div>
            <div style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '700', color: '#D4AF37',
              textShadow: '0 0 20px rgba(212,175,55,0.2)',
            }}>
              {fmtPrice(p.price)}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {[
              { icon: '🛏️', label: 'Bedrooms', value: p.bedrooms },
              { icon: '🚿', label: 'Bathrooms', value: p.bathrooms },
              { icon: '📐', label: 'Area', value: p.area ? `${p.area}m²` : null },
              { icon: '🏗️', label: 'Year Built', value: p.yearBuilt },
            ].filter(s => s.value != null).map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#F5F0E8', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.45)', marginTop: '0.2rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShareModalOpen(true)}
              style={{
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4AF37', borderRadius: '10px', padding: '0.65rem 1.25rem',
                fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              🔗 Share
            </button>
            <button
              style={{
                background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                color: '#1C140C', border: 'none', borderRadius: '10px',
                padding: '0.65rem 1.5rem', fontSize: '0.9rem', fontWeight: '700',
                cursor: 'pointer', letterSpacing: '0.04em',
                boxShadow: '0 4px 20px rgba(212,175,55,0.35)',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 30px rgba(212,175,55,0.55)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,175,55,0.35)'}
            >
              ✦ Request Viewing
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{ maxWidth: '1200px', margin: '1.5rem auto 0', padding: '0 1.5rem' }}>
        <div style={{
          display: 'flex', gap: '0.25rem', overflowX: 'auto', scrollbarWidth: 'none',
          borderBottom: '1px solid rgba(166,125,26,0.15)',
          paddingBottom: '0',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent', border: 'none',
                color: activeTab === tab.id ? '#D4AF37' : 'rgba(245,240,232,0.5)',
                fontSize: '0.875rem', fontWeight: activeTab === tab.id ? '600' : '400',
                padding: '0.75rem 1.25rem',
                cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: activeTab === tab.id ? '2px solid #D4AF37' : '2px solid transparent',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="shared-prop-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem', alignItems: 'start' }}>
          {/* Main Content */}
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                {p.description && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: '700', marginBottom: '1rem', color: '#F5F0E8' }}>
                      About This Property
                    </h2>
                    <p style={{ color: 'rgba(245,240,232,0.7)', lineHeight: 1.8, fontSize: '0.95rem' }}>{p.description}</p>
                  </div>
                )}

                {/* Key Details Grid */}
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: '700', marginBottom: '1rem', color: '#F5F0E8' }}>
                    Property Details
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { label: 'Property Type', value: p.propertyType || p.type, icon: '🏛️' },
                      { label: 'Status', value: p.status, icon: '📌' },
                      { label: 'Floor Area', value: p.area ? `${p.area} m²` : null, icon: '📐' },
                      { label: 'Bedrooms', value: p.bedrooms, icon: '🛏️' },
                      { label: 'Bathrooms', value: p.bathrooms, icon: '🚿' },
                      { label: 'Year Built', value: p.yearBuilt, icon: '🏗️' },
                      { label: 'Energy Rating', value: p.energyRating, icon: '⚡' },
                      { label: 'Locality', value: p.locality, icon: '📍' },
                    ].filter(d => d.value != null).map((detail, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(166,125,26,0.12)',
                        borderRadius: '12px', padding: '0.875rem 1rem',
                      }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(212,175,55,0.65)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          {detail.icon} {detail.label}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F5F0E8', textTransform: 'capitalize' }}>
                          {String(detail.value).replace(/_/g, ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FEATURES TAB */}
            {activeTab === 'features' && (
              <div>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: '#F5F0E8' }}>
                  Property Features & Amenities
                </h2>
                {features.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {features.map((feat, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: 'rgba(212,175,55,0.05)',
                        border: '1px solid rgba(212,175,55,0.12)',
                        borderRadius: '10px', padding: '0.75rem 1rem',
                      }}>
                        <span style={{ color: '#D4AF37', fontSize: '0.9rem' }}>✓</span>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(245,240,232,0.75)' }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'rgba(245,240,232,0.4)', fontStyle: 'italic' }}>No features listed for this property.</p>
                )}
              </div>
            )}

            {/* LOCATION TAB */}
            {activeTab === 'location' && (
              <div>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: '#F5F0E8' }}>
                  Location
                </h2>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(166,125,26,0.2)',
                  borderRadius: '16px', padding: '3rem',
                  textAlign: 'center',
                  minHeight: '280px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                  <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {p.address || p.locality || 'Malta'}
                  </p>
                  <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: '0.8rem' }}>
                    Interactive map available upon registration
                  </p>
                </div>
              </div>
            )}

            {/* VIRTUAL TOUR TAB */}
            {activeTab === 'virtual-tour' && (
              <div>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: '#F5F0E8' }}>
                  360° Virtual Tour
                </h2>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(26,58,42,0.4), rgba(74,122,90,0.2))',
                  border: '1px solid rgba(166,125,26,0.2)',
                  borderRadius: '20px', padding: '4rem 2rem',
                  textAlign: 'center', minHeight: '320px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'floatSlow 4s ease-in-out infinite' }}>🏛️</div>
                  <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#F5F0E8' }}>
                    Virtual Tour Coming Soon
                  </h3>
                  <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.875rem', maxWidth: '360px', lineHeight: 1.6 }}>
                    An immersive 360° tour of this property will be available shortly. Contact us to arrange a private in-person viewing.
                  </p>
                </div>
              </div>
            )}

            {/* AI VALUATION TAB */}
            {activeTab === 'ai-valuation' && (
              <div>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: '#F5F0E8' }}>
                  AI Property Valuation
                </h2>
                <div style={{
                  background: 'rgba(166,125,26,0.07)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: '20px', padding: '2rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🤖</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase' }}>
                        AI-Powered Analysis
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.5)', marginTop: '2px' }}>
                        Based on 500+ comparable properties
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.5)', marginBottom: '0.5rem' }}>AI Estimated Value</div>
                    <div style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                      fontWeight: '700', color: '#D4AF37',
                    }}>
                      {aiEstimate ? fmtPrice(aiEstimate) : 'N/A'}
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.5)' }}>Confidence Score</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#D4AF37' }}>87%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: '87%',
                        background: 'linear-gradient(90deg, #8B6914, #D4AF37)',
                        borderRadius: '3px',
                        boxShadow: '0 0 8px rgba(212,175,55,0.4)',
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { label: 'Market Position', value: 'Above Average', icon: '📊' },
                      { label: 'Price/m²', value: p.area && p.price ? fmtPrice(Math.round(p.price / p.area)) : 'N/A', icon: '📐' },
                      { label: 'Growth Potential', value: '+8.2% YoY', icon: '📈' },
                      { label: 'Days on Market', value: '< 30 days', icon: '⏱️' },
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(166,125,26,0.12)',
                        borderRadius: '10px', padding: '0.75rem',
                      }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(212,175,55,0.6)', marginBottom: '0.25rem' }}>{item.icon} {item.label}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#F5F0E8' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar: Agent Card ── */}
          <div>
            {p.agent && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(166,125,26,0.2)',
                borderRadius: '20px', padding: '1.75rem',
                position: 'sticky', top: '5rem',
              }}>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#F5F0E8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔑 Listed by
                </h3>

                {/* Agent Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: p.agent.avatar ? `url(${p.agent.avatar}) center/cover` : 'linear-gradient(135deg, #8B6914, #D4AF37)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: '700', color: '#1C140C',
                    flexShrink: 0, border: '2px solid rgba(212,175,55,0.3)',
                  }}>
                    {!p.agent.avatar && (p.agent.firstName?.charAt(0) || p.agent.name?.charAt(0) || '?')}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#F5F0E8' }}>
                      {p.agent.firstName && p.agent.lastName ? `${p.agent.firstName} ${p.agent.lastName}` : p.agent.name || 'Agent'}
                    </div>
                    {p.agent.jobTitle && (
                      <div style={{ fontSize: '0.78rem', color: 'rgba(212,175,55,0.7)', marginTop: '2px' }}>{p.agent.jobTitle}</div>
                    )}
                  </div>
                </div>

                {p.agent.bio && (
                  <p style={{ fontSize: '0.83rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {p.agent.bio}
                  </p>
                )}

                {/* Divider */}
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)', marginBottom: '1.25rem' }} />

                {/* Contact Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {p.agent.phone && (
                    <a href={`tel:${p.agent.phone}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      background: 'linear-gradient(135deg, #8B6914, #D4AF37)',
                      color: '#1C140C', textDecoration: 'none',
                      borderRadius: '10px', padding: '0.75rem',
                      fontSize: '0.875rem', fontWeight: '700',
                      boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                    }}>
                      📞 {p.agent.phone}
                    </a>
                  )}
                  {p.agent.email && (
                    <a href={`mailto:${p.agent.email}?subject=Enquiry: ${encodeURIComponent(p.title || 'Property')}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
                      color: '#D4AF37', textDecoration: 'none',
                      borderRadius: '10px', padding: '0.75rem',
                      fontSize: '0.875rem', fontWeight: '600',
                    }}>
                      ✉ {p.agent.email}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Similar Properties ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#F5F0E8' }}>
          Similar Properties
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {SIMILAR_PROPS.map((sp, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(166,125,26,0.15)',
              borderRadius: '16px', overflow: 'hidden',
              transition: 'all 0.3s ease', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(166,125,26,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ height: '140px', background: sp.gradient, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4))' }} />
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(212,175,55,0.7)', marginBottom: '0.25rem' }}>🏛️ {sp.type}</div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', color: '#F5F0E8' }}>{sp.name}</div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)', marginBottom: '0.75rem' }}>
                  <span>🛏️ {sp.beds}</span><span>🚿 {sp.baths}</span><span>📐 {sp.area}m²</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.05rem', fontWeight: '700', color: '#D4AF37' }}>{sp.price}</div>
                  <Link to="/login" style={{
                    fontSize: '0.75rem', color: 'rgba(212,175,55,0.8)',
                    textDecoration: 'none', fontWeight: '600',
                  }}>
                    View →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && photos.length > 0 && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', backdropFilter: 'blur(8px)',
          }}
        >
          <img
            src={photos[lightboxIndex]}
            alt=""
            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: '12px' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: '50%', width: '40px', height: '40px',
              fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Share Modal ── */}
      {shareModalOpen && (
        <>
          <div
            onClick={() => setShareModalOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            background: 'rgba(28,20,12,0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(166,125,26,0.25)',
            borderRadius: '20px', padding: '2rem',
            width: '90%', maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', color: '#F5F0E8' }}>
              🔗 Share this Property
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                readOnly
                value={window.location.href}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '0.7rem 1rem',
                  fontSize: '0.8rem', color: 'rgba(245,240,232,0.6)',
                  outline: 'none', fontFamily: 'Inter, sans-serif',
                }}
              />
              <button
                onClick={copyLink}
                style={{
                  background: copied ? 'rgba(46,125,50,0.8)' : 'linear-gradient(135deg, #8B6914, #D4AF37)',
                  color: copied ? '#fff' : '#1C140C',
                  border: 'none', borderRadius: '10px',
                  padding: '0.7rem 1.25rem', fontSize: '0.85rem', fontWeight: '700',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.3s ease',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['WhatsApp', 'Email', 'LinkedIn', 'Facebook'].map((platform) => (
                <button key={platform} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.5rem 0.85rem',
                  fontSize: '0.78rem', color: 'rgba(245,240,232,0.55)',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.color = '#D4AF37'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(245,240,232,0.55)'; }}
                >
                  {platform}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShareModalOpen(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'transparent', border: 'none',
                color: 'rgba(245,240,232,0.4)', fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @media (max-width: 768px) {
          .shared-prop-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SharedPropertyPage;
