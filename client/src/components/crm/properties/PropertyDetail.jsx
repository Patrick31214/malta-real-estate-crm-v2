import React, { useState, useCallback } from 'react';
import UserAvatar from '../../ui/UserAvatar';
import { PROPERTY_FEATURES, CATEGORY_ICONS } from '../../../constants/propertyFeatures';
import api from '../../../services/api';
import BlurredText from '../../ui/BlurredText';
import { useAuth } from '../../../context/AuthContext';

/* ── Copy Description Button ────────────────────────────────────────────────────── */
const CopyDescriptionButton = ({ description }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!description) return;
    navigator.clipboard.writeText(description).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: open a prompt so the user can manually copy
      window.prompt('Copy the description:', description);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '4px 10px',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${copied ? 'var(--color-success)' : 'var(--color-text-muted)'}`,
        background: 'transparent',
        color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
        fontSize: 'var(--text-xs)',
        cursor: 'pointer',
        fontWeight: 'var(--font-medium)',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ Copied!' : '📋 Copy Description'}
    </button>
  );
};

/* ── Image Gallery with lightbox ─────────────────────────────────────────────── */
const ImageGallery = ({ images, title }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const open = useCallback((i) => setLightboxIndex(i), []);
  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback((e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }, [images.length]);
  const next = useCallback((e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }, [images.length]);

  const downloadOne = async (url, idx) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${title || 'image'}-${idx + 1}.jpg`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error('Download failed, falling back to new tab:', err);
      window.open(url, '_blank');
    }
  };

  const downloadAll = () => {
    images.reduce((p, url, i) => p.then(() => downloadOne(url, i)), Promise.resolve());
  };

  if (!images || images.length === 0) return null;

  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-2)' }}>
        <button onClick={downloadAll} style={dlBtnStyle}>⬇ Download All</button>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-1)' }}>
        {images.map((img, i) => (
          <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={img}
              alt={`${title} ${i + 1}`}
              style={{ height: '100px', width: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.15s', display: 'block' }}
              onClick={() => open(i)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent-gold)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
            />
            <button
              onClick={e => { e.stopPropagation(); downloadOne(img, i); }}
              style={{ position: 'absolute', bottom: '4px', right: '4px', padding: '2px 6px', borderRadius: 'var(--radius-xs)', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', fontSize: '10px', lineHeight: 1 }}
              title="Download"
              aria-label={`Download image ${i + 1}`}
            >⬇</button>
          </div>
        ))}
      </div>
      {lightboxIndex !== null && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          onClick={close}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <img src={images[lightboxIndex]} alt={`${title} ${lightboxIndex + 1}`} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 'var(--radius-md)', objectFit: 'contain', display: 'block' }} />
            {images.length > 1 && (
              <>
                <button onClick={prev} style={arrowBtn('left')}>‹</button>
                <button onClick={next} style={arrowBtn('right')}>›</button>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <span style={{ color: '#fff', fontSize: 'var(--text-sm)' }}>{lightboxIndex + 1} / {images.length}</span>
            <button onClick={() => downloadOne(images[lightboxIndex], lightboxIndex)} style={dlBtnStyle}>⬇ Download</button>
            <button onClick={close} style={{ ...dlBtnStyle, background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }}>✕ Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const dlBtnStyle = { padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'transparent', color: 'var(--color-accent-gold)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' };
const arrowBtn = (side) => ({ position: 'absolute', top: '50%', [side]: '-48px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', width: '40px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' });

const statusConfig = {
  listed:      { label: 'Listed',      color: 'var(--color-success)',  bg: 'var(--color-success-light)' },
  draft:       { label: 'Draft',       color: 'var(--color-text-muted)', bg: 'var(--color-primary-50)' },
  under_offer: { label: 'Under Offer', color: 'var(--color-warning)',  bg: 'var(--color-warning-light)' },
  sold:        { label: 'Sold',        color: 'var(--color-error)',    bg: 'var(--color-error-light)' },
  rented:      { label: 'Rented',      color: 'var(--color-info)',     bg: 'var(--color-info-light)' },
  withdrawn:   { label: 'Withdrawn',   color: 'var(--color-error)',    bg: 'var(--color-error-light)' },
};

const approvalConfig = {
  pending:      { label: '⏳ Pending Approval', cls: 'approval-badge pending' },
  approved:     { label: '✓ Approved',          cls: 'approval-badge approved' },
  rejected:     { label: '✗ Rejected',          cls: 'approval-badge rejected' },
  not_required: { label: null, cls: '' },
};

const formatPrice = (price, listingType) => {
  const num = parseFloat(price);
  const formatted = '€ ' + num.toLocaleString('en-MT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (listingType === 'long_let' || listingType === 'short_let') return formatted + '/mo';
  return formatted;
};

const DetailRow = ({ label, value }) => value != null && value !== '' ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', overflowWrap: 'break-word' }}>{value}</span>
  </div>
) : null;

const MatchedClientsSection = ({ propertyId }) => {
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    api.get(`/properties/${propertyId}/matched-clients`)
      .then(res => setMatches(res.data.matches || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) return <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Loading matched clients…</div>;
  if (!matches.length) return null;

  return (
    <div style={{ marginTop: 'var(--space-6)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
        Matched Clients ({matches.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {matches.map(m => (
          <div key={m.clientId || m.id} className="glass" style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>
              {m.Client ? `${m.Client.firstName} ${m.Client.lastName}` : m.clientId}
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
              background: m.matchScore >= 70 ? 'var(--color-success-light)' : m.matchScore >= 50 ? 'var(--color-warning-light)' : 'var(--color-error-light)',
              color: m.matchScore >= 70 ? 'var(--color-success)' : m.matchScore >= 50 ? 'var(--color-warning)' : 'var(--color-error)',
            }}>
              {Math.round(m.matchScore)}% match
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PropertyDetail = ({ property, onEdit, onToggleAvailable, onToggleFeatured, onDelete, onClose, onSubmitApproval, onApprove, onReject, onTogglePublish, canEdit, canToggleFeatured, canDelete, canApprove }) => {
  const { user } = useAuth();

  if (!property) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/shared/property/${property.id}${user ? `?agent=${user.id}` : ''}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied! Share with your client.');
    }).catch(() => {
      prompt('Copy this link:', url);
    });
  };

  const status   = statusConfig[property.status]   || statusConfig.draft;
  const approval = approvalConfig[property.approvalStatus] || approvalConfig.not_required;
  const ownerName = property.Owner ? `${property.Owner.firstName} ${property.Owner.lastName}` : '—';
  const agentName = property.agent ? `${property.agent.firstName} ${property.agent.lastName}` : '—';

  const allImages = [property.heroImage, ...(property.images || [])].filter(Boolean);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero */}
      <div style={{
        height: '300px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-6)', position: 'relative',
        ...(property.heroImage
          ? { backgroundImage: `url(${property.heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))' }),
      }}>
        <span style={{
          position: 'absolute', top: '16px', left: '16px',
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          background: status.bg, color: status.color,
          fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)',
        }}>{status.label}</span>
        {property.isFeatured && <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '24px' }}>⭐</span>}
        {approval.label && (
          <span style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
            <span className={approval.cls}>{approval.label}</span>
          </span>
        )}
        {property.isPublishedToWebsite && (
          <span className="published-badge" style={{ position: 'absolute', bottom: '16px', right: '16px' }}>🌐 Published</span>
        )}
      </div>

      {/* Image gallery */}
      {allImages.length > 0 && (
        <ImageGallery images={allImages} title={property.title} />
      )}

      {/* Title + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{property.title}</h1>
          {property.referenceNumber && (
            <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)', background: 'var(--color-surface-glass)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '2px 8px', color: 'var(--color-accent-gold)', display: 'inline-block', marginBottom: 'var(--space-1)' }}>
              {property.referenceNumber}
            </span>
          )}
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>📍 {property.locality}{property.Branch ? ` · ${property.Branch.name}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {canEdit && <button onClick={() => onEdit(property)} style={actionBtn('var(--color-primary)')}>✏️ Edit</button>}
          <button onClick={() => onToggleAvailable(property)} style={actionBtn(property.isAvailable ? 'var(--color-success)' : 'var(--color-error)')}>
            {property.isAvailable ? '✓ Available' : '✗ Unavailable'}
          </button>
          {canToggleFeatured && (
            <button onClick={() => onToggleFeatured(property)} style={actionBtn(property.isFeatured ? 'var(--color-accent-gold)' : 'var(--color-text-muted)')}>
              {property.isFeatured ? '★ Unfeature' : '☆ Feature'}
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(property)} style={actionBtn('var(--color-error)')}>🗑 Delete</button>
          )}
          {/* Approval workflow */}
          {canEdit && (property.approvalStatus === 'rejected' || property.approvalStatus === 'not_required') && (
            <button onClick={() => onSubmitApproval && onSubmitApproval(property)} style={actionBtn('var(--color-warning)')}>📤 Submit</button>
          )}
          {canApprove && property.approvalStatus === 'pending' && (
            <>
              <button onClick={() => onApprove && onApprove(property)} style={actionBtn('var(--color-success)')}>✓ Approve</button>
              <button onClick={() => onReject && onReject(property)} style={actionBtn('var(--color-error)')}>✗ Reject</button>
            </>
          )}
          {canApprove && (
            <button
              onClick={() => onTogglePublish && onTogglePublish(property)}
              style={actionBtn(property.isPublishedToWebsite ? 'var(--color-info)' : 'var(--color-text-muted)')}
              title={property.approvalStatus !== 'approved' && !property.isPublishedToWebsite ? 'Must be approved first' : ''}
            >
              {property.isPublishedToWebsite ? '🌐 Unpublish' : '🌐 Publish'}
            </button>
          )}
          <button onClick={onClose} style={actionBtn('var(--color-text-secondary)')}>✕ Close</button>
          <button onClick={handleCopyLink} style={actionBtn('var(--color-accent-gold)')}>📋 Copy Link</button>
        </div>
      </div>

      {/* Price */}
      <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', marginBottom: 'var(--space-4)' }}>
        {formatPrice(property.price, property.listingType)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Property details */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={sectionTitle}>Property Details</h3>
          <DetailRow label="Type" value={property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : null} />
          <DetailRow label="Listing Type" value={property.listingType ? property.listingType.replace('_', ' ') : null} />
          <DetailRow label="Bedrooms" value={property.bedrooms} />
          <DetailRow label="Bathrooms" value={property.bathrooms} />
          <DetailRow label="Area" value={property.area ? `${property.area} m²` : null} />
          <DetailRow label="Floor" value={property.floor} />
          <DetailRow label="Total Floors" value={property.totalFloors} />
          <DetailRow label="Year Built" value={property.yearBuilt} />
          <DetailRow label="Energy Rating" value={property.energyRating} />
          <DetailRow label="Available From" value={property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : null} />
        </div>

        {/* Owner */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={sectionTitle}>Owner</h3>
          {property.Owner ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <UserAvatar user={{ firstName: property.Owner.firstName, lastName: property.Owner.lastName }} size="lg" />
                <div>
                  <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{ownerName}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {property.Owner.phone ? <BlurredText text={property.Owner.phone} type="phone" href={`tel:${property.Owner.phone}`} /> : null}
                  </div>
                </div>
              </div>
              <DetailRow label="Email" value={property.Owner.email ? <BlurredText text={property.Owner.email} type="email" href={`mailto:${property.Owner.email}`} /> : null} />
              <DetailRow label="Alt Phone" value={property.Owner.alternatePhone} />
            </>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No owner assigned</p>}
        </div>

        {/* Agent */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={sectionTitle}>Agent</h3>
          {property.agent ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <UserAvatar user={property.agent} size="lg" />
                <div>
                  <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{agentName}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{property.agent.email}</div>
                </div>
              </div>
              <DetailRow label="Phone" value={property.agent.phone} />
            </>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No agent assigned</p>}
        </div>

        {/* Location */}
        {property.address && (
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Location</h3>
            <DetailRow label="Locality" value={property.locality} />
            <DetailRow label="Address" value={property.address} />
            <DetailRow label="Coordinates" value={property.latitude ? `${property.latitude}, ${property.longitude}` : null} />
          </div>
        )}

        {/* Features */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', gridColumn: '1 / -1' }}>
          <h3 style={sectionTitle}>Features</h3>
          {property.features && property.features.length > 0 ? (
            <div>
              {Object.entries(PROPERTY_FEATURES).map(([category, catFeatures]) => {
                const matched = catFeatures.filter(f => property.features.includes(f));
                if (matched.length === 0) return null;
                return (
                  <div key={category} style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>
                      {CATEGORY_ICONS[category]} {category}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {matched.map(f => (
                        <span key={f} className="feature-chip selected" style={{ cursor: 'default' }}>✓ {f}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Features not in any category */}
              {(() => {
                const allCatFeatures = Object.values(PROPERTY_FEATURES).flat();
                const uncategorized = property.features.filter(f => !allCatFeatures.includes(f));
                if (uncategorized.length === 0) return null;
                return (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>Other</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {uncategorized.map(f => (
                        <span key={f} className="feature-chip selected" style={{ cursor: 'default' }}>✓ {f}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No features listed</p>
          )}
        </div>

        {/* Media links */}
        {(property.virtualTourUrl || property.videoUrl || property.droneVideoUrl || property.threeDViewUrl) && (
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Media</h3>
            {property.virtualTourUrl && <a href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>🏠 Virtual Tour</a>}
            {property.videoUrl && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)' }}>🎬 Property Video</p>
                <video controls src={property.videoUrl} style={{ width: '100%', maxHeight: '400px', borderRadius: 'var(--radius-md)' }} />
              </div>
            )}
            {property.droneVideoUrl && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)' }}>🚁 Drone Video</p>
                <video controls src={property.droneVideoUrl} style={{ width: '100%', maxHeight: '400px', borderRadius: 'var(--radius-md)' }} />
              </div>
            )}
            {property.threeDViewUrl && (
              property.threeDViewUrl.startsWith('http') ? (
                <a href={property.threeDViewUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>🏠 3D View</a>
              ) : (
                <a href={property.threeDViewUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>🏠 3D View (file)</a>
              )
            )}
          </div>
        )}

        {/* Drone Images */}
        {property.droneImages && property.droneImages.length > 0 && (
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', gridColumn: '1 / -1' }}>
            <h3 style={sectionTitle}>🚁 Drone Images</h3>
            <ImageGallery images={property.droneImages} title={`${property.title}-drone`} />
          </div>
        )}
      </div>

      {/* Approval Notes (shown when rejected) */}
      {property.approvalNotes && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)', borderLeft: '4px solid var(--color-error)' }}>
          <h3 style={{ ...sectionTitle, color: 'var(--color-error)' }}>Rejection Notes</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>{property.approvalNotes}</p>
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <h3 style={sectionTitle}>Description</h3>
            <CopyDescriptionButton description={property.description} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>{property.description}</p>
        </div>
      )}

      {/* Matched Clients */}
      <MatchedClientsSection propertyId={property.id} />

      {/* Internal Specifications */}
      {(property.acceptsChildren != null || property.isPetFriendly != null || property.acceptsSharing != null ||
        property.acceptsShortLet != null || property.isNegotiable != null || property.childFriendlyRequired != null ||
        property.acceptedAgeRange || property.internalNotes ||
        (property.petPolicy && Object.keys(property.petPolicy).length > 0) ||
        (property.tenantPolicy && Object.keys(property.tenantPolicy).length > 0) ||
        (property.nationalityPolicy && Object.keys(property.nationalityPolicy).length > 0) ||
        (property.contractTerms && Object.keys(property.contractTerms).length > 0)) && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)', borderLeft: '4px solid var(--color-warning, #D97706)' }}>
          <h3 style={sectionTitle}>🔒 Internal Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
            {property.acceptsChildren != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Accepts Children: <b>{property.acceptsChildren ? 'Yes' : 'No'}</b></div>}
            {property.childFriendlyRequired != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Child-Friendly Required: <b>{property.childFriendlyRequired ? 'Yes' : 'No'}</b></div>}
            {property.acceptsSharing != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Accepts Sharing: <b>{property.acceptsSharing ? 'Yes' : 'No'}</b></div>}
            {property.acceptsShortLet != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Accepts Short Let: <b>{property.acceptsShortLet ? 'Yes' : 'No'}</b></div>}
            {property.isPetFriendly != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Pet Friendly: <b>{property.isPetFriendly ? 'Yes' : 'No'}</b></div>}
            {property.isNegotiable != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Negotiable: <b>{property.isNegotiable ? 'Yes' : 'No'}</b></div>}
            {property.acceptedAgeRange && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Age Range: <b>{property.acceptedAgeRange}</b></div>}
          </div>
          {property.internalNotes && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Internal Notes</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', margin: 0 }}>{property.internalNotes}</p>
            </div>
          )}

          {/* Pet Policy */}
          {property.petPolicy && Object.keys(property.petPolicy).length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>🐾 Pet Policy</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                {property.petPolicy.acceptsDogs != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Dogs: <b>{property.petPolicy.acceptsDogs ? 'Yes' : 'No'}</b></div>}
                {property.petPolicy.acceptsSmallDogs != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Small Dogs Only: <b>{property.petPolicy.acceptsSmallDogs ? 'Yes' : 'No'}</b></div>}
                {property.petPolicy.acceptsCats != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Cats: <b>{property.petPolicy.acceptsCats ? 'Yes' : 'No'}</b></div>}
                {property.petPolicy.acceptsBirds != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Birds: <b>{property.petPolicy.acceptsBirds ? 'Yes' : 'No'}</b></div>}
                {property.petPolicy.acceptsFish != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Fish/Aquarium: <b>{property.petPolicy.acceptsFish ? 'Yes' : 'No'}</b></div>}
                {property.petPolicy.maxPets != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Max Pets: <b>{property.petPolicy.maxPets}</b></div>}
                {property.petPolicy.petDeposit != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Pet Deposit: <b>{property.petPolicy.petDeposit ? 'Required' : 'Not Required'}</b></div>}
                {property.petPolicy.petRestrictions && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>Restrictions: <b>{property.petPolicy.petRestrictions}</b></div>}
              </div>
            </div>
          )}

          {/* Tenant Preferences */}
          {property.tenantPolicy && Object.keys(property.tenantPolicy).length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>👥 Tenant Preferences</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                {property.tenantPolicy.acceptsFamilies != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Families: <b>{property.tenantPolicy.acceptsFamilies ? 'Yes' : 'No'}</b></div>}
                {property.tenantPolicy.acceptsCouples != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Couples: <b>{property.tenantPolicy.acceptsCouples ? 'Yes' : 'No'}</b></div>}
                {property.tenantPolicy.acceptsSingles != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Singles: <b>{property.tenantPolicy.acceptsSingles ? 'Yes' : 'No'}</b></div>}
                {property.tenantPolicy.acceptsStudents != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Students: <b>{property.tenantPolicy.acceptsStudents ? 'Yes' : 'No'}</b></div>}
                {property.tenantPolicy.acceptsSharers != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Sharers: <b>{property.tenantPolicy.acceptsSharers ? 'Yes' : 'No'}</b></div>}
                {property.tenantPolicy.acceptsRetirees != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Retirees: <b>{property.tenantPolicy.acceptsRetirees ? 'Yes' : 'No'}</b></div>}
                {property.tenantPolicy.acceptsChildren != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Children: <b>{property.tenantPolicy.acceptsChildren ? 'Yes' : 'No'}</b></div>}
                {property.tenantPolicy.acceptsNewborns != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Newborns: <b>{property.tenantPolicy.acceptsNewborns ? 'Yes' : 'No'}</b></div>}
                {property.tenantPolicy.maxOccupants != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Max Occupants: <b>{property.tenantPolicy.maxOccupants}</b></div>}
                {property.tenantPolicy.minAge != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Min Age: <b>{property.tenantPolicy.minAge}</b></div>}
                {property.tenantPolicy.maxAge != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Max Age: <b>{property.tenantPolicy.maxAge}</b></div>}
              </div>
            </div>
          )}

          {/* Nationality Policy */}
          {property.nationalityPolicy && Object.keys(property.nationalityPolicy).length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>🌍 Nationality Preferences</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                {property.nationalityPolicy.acceptsAll != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Any Nationality: <b>{property.nationalityPolicy.acceptsAll ? 'Yes' : 'No'}</b></div>}
                {property.nationalityPolicy.acceptedRegions && property.nationalityPolicy.acceptedRegions.length > 0 && (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>
                    Accepted Regions: <b>{property.nationalityPolicy.acceptedRegions.map(r => r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ')}</b>
                  </div>
                )}
                {property.nationalityPolicy.notes && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>Notes: <b>{property.nationalityPolicy.notes}</b></div>}
              </div>
            </div>
          )}

          {/* Contract Terms */}
          {property.contractTerms && Object.keys(property.contractTerms).length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>📋 Contract Terms</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                {property.contractTerms.acceptsTnCs != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>T&amp;Cs Accepted: <b>{property.contractTerms.acceptsTnCs ? 'Yes' : 'No'}</b></div>}
                {property.contractTerms.minimumTerm && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Min Term: <b>{property.contractTerms.minimumTerm.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</b></div>}
                {property.contractTerms.maximumTerm && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Max Term: <b>{property.contractTerms.maximumTerm.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</b></div>}
                {property.contractTerms.depositMonths != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Deposit: <b>{property.contractTerms.depositMonths} month(s)</b></div>}
                {property.contractTerms.advanceMonths != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Advance: <b>{property.contractTerms.advanceMonths} month(s)</b></div>}
                {property.contractTerms.agencyFee && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Agency Fee: <b>{property.contractTerms.agencyFee}</b></div>}
                {property.contractTerms.breakClause != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Break Clause: <b>{property.contractTerms.breakClause ? 'Yes' : 'No'}</b></div>}
                {property.contractTerms.guarantorRequired != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Guarantor: <b>{property.contractTerms.guarantorRequired ? 'Required' : 'Not Required'}</b></div>}
                {property.contractTerms.proofOfIncomeRequired != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Proof of Income: <b>{property.contractTerms.proofOfIncomeRequired ? 'Required' : 'Not Required'}</b></div>}
                {property.contractTerms.employmentLetterRequired != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Employment Letter: <b>{property.contractTerms.employmentLetterRequired ? 'Required' : 'Not Required'}</b></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const sectionTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-base)',
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-3)',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-2)',
};

const actionBtn = (color) => ({
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  transition: 'all var(--transition-fast)',
});

export default PropertyDetail;
