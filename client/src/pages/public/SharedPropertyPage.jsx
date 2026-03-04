import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import UserAvatar from '../../components/ui/UserAvatar';

const formatPrice = (price, listingType) => {
  const num = parseFloat(price);
  if (isNaN(num)) return '—';
  const formatted = '€ ' + num.toLocaleString('en-MT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (listingType === 'long_let' || listingType === 'short_let') return formatted + '/mo';
  return formatted;
};

const SharedPropertyPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const agentParam = searchParams.get('agent');

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(null);

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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔑</div>
          <p>Loading property…</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
          <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>Property Not Found</h2>
          <p>{error || 'This property may have been removed or the link is invalid.'}</p>
        </div>
      </div>
    );
  }

  const allImages = [property.heroImage, ...(property.images || [])].filter(Boolean);
  const agent = property.agent;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header bar */}
      <div style={{ background: '#1a1a2e', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🔑</span>
        <span style={{ color: '#c9a227', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>Golden Key Realty</span>
      </div>

      {/* Hero image */}
      {property.heroImage ? (
        <div style={{ height: '320px', backgroundImage: `url(${property.heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem' }}>
            <span style={{ background: '#c9a227', color: '#fff', padding: '4px 14px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {property.status?.replace('_', ' ') || 'Listed'}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ height: '320px', background: 'linear-gradient(135deg, #2d4a7a, #4a6fa5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '5rem' }}>🏠</span>
        </div>
      )}

      {/* Main content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Title & price */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.25rem', lineHeight: 1.2 }}>{property.title}</h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            📍 {property.locality}
            {property.type && <span style={{ marginLeft: '0.75rem', background: '#e8e4d9', padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', textTransform: 'capitalize' }}>{property.type}</span>}
            {property.listingType && <span style={{ marginLeft: '0.5rem', background: '#e8e4d9', padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem' }}>{property.listingType.replace('_', ' ')}</span>}
          </p>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c9a227' }}>{formatPrice(property.price, property.listingType)}</div>
        </div>

        {/* Key stats */}
        <div style={{ display: 'flex', gap: '1.5rem', background: '#fff', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexWrap: 'wrap' }}>
          {property.bedrooms != null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem' }}>🛏</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{property.bedrooms}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Bedrooms</div>
            </div>
          )}
          {property.bathrooms != null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem' }}>🚿</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{property.bathrooms}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Bathrooms</div>
            </div>
          )}
          {property.area != null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem' }}>📐</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{property.area}m²</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Area</div>
            </div>
          )}
          {property.yearBuilt && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem' }}>🏗</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{property.yearBuilt}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Year Built</div>
            </div>
          )}
          {property.energyRating && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem' }}>⚡</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{property.energyRating}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Energy</div>
            </div>
          )}
        </div>

        {/* Photo gallery */}
        {allImages.length > 1 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.75rem' }}>Photos</h2>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {allImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${property.title} ${i + 1}`}
                  onClick={() => setGalleryIndex(i)}
                  style={{ height: '110px', width: '165px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a227'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.75rem' }}>Description</h2>
            <p style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{property.description}</p>
          </div>
        )}

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.75rem' }}>Features</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {property.features.map(f => (
                <span key={f} style={{ background: '#f0ede4', color: '#555', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem' }}>✓ {f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Agent contact card */}
        {agent && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e8e4d9' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '1rem' }}>Contact Agent</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <UserAvatar user={agent} size="lg" />
              <div>
                <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1rem' }}>{agent.firstName} {agent.lastName}</div>
                {agent.bio && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>{agent.bio}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {agent.phone && (
                <a href={`tel:${agent.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a2e', textDecoration: 'none', fontSize: '0.9rem' }}>
                  📞 <span>{agent.phone}</span>
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a1a2e', textDecoration: 'none', fontSize: '0.9rem' }}>
                  ✉️ <span>{agent.email}</span>
                </a>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {agent.phone && (
                <a href={`tel:${agent.phone}`} style={{ flex: 1, minWidth: '120px', padding: '0.6rem 1rem', background: '#1a1a2e', color: '#fff', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                  📞 Call
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}?subject=Enquiry: ${encodeURIComponent(property.title)}`} style={{ flex: 1, minWidth: '120px', padding: '0.6rem 1rem', background: '#c9a227', color: '#fff', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                  ✉️ Email
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e8e4d9' }}>
          <span>🔑 Golden Key Realty — Malta</span>
        </div>
      </div>

      {/* Lightbox */}
      {galleryIndex !== null && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setGalleryIndex(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img src={allImages[galleryIndex]} alt={`${property.title} ${galleryIndex + 1}`} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain', display: 'block' }} />
            {allImages.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setGalleryIndex(i => (i - 1 + allImages.length) % allImages.length); }} style={{ position: 'absolute', top: '50%', left: '-48px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', borderRadius: '8px', width: '40px', height: '60px' }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setGalleryIndex(i => (i + 1) % allImages.length); }} style={{ position: 'absolute', top: '50%', right: '-48px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', borderRadius: '8px', width: '40px', height: '60px' }}>›</button>
              </>
            )}
          </div>
          <button onClick={() => setGalleryIndex(null)} style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );
};

export default SharedPropertyPage;
