import React, { useState, useRef } from 'react';
import UserAvatar from '../../ui/UserAvatar';
import { timeAgo } from '../../../utils/timeAgo';

const statusConfig = {
  listed:      { label: 'Listed',      color: 'var(--color-success)',  bg: 'var(--color-success-light)' },
  draft:       { label: 'Draft',       color: 'var(--color-text-muted)', bg: 'var(--color-primary-50)' },
  under_offer: { label: 'Under Offer', color: 'var(--color-warning)',  bg: 'var(--color-warning-light)' },
  sold:        { label: 'Sold',        color: 'var(--color-error)',    bg: 'var(--color-error-light)' },
  rented:      { label: 'Rented',      color: 'var(--color-info)',     bg: 'var(--color-info-light)' },
  withdrawn:   { label: 'Withdrawn',   color: 'var(--color-error)',    bg: 'var(--color-error-light)' },
};

const STATUS_OPTIONS = ['draft', 'listed', 'under_offer', 'sold', 'rented', 'withdrawn'];

const approvalConfig = {
  pending:      { label: '⏳ Pending',  cls: 'approval-badge pending' },
  approved:     { label: '✓ Approved', cls: 'approval-badge approved' },
  rejected:     { label: '✗ Rejected', cls: 'approval-badge rejected' },
  not_required: { label: null, cls: '' },
};

const formatPrice = (price, listingType) => {
  const num = parseFloat(price);
  const formatted = '€ ' + num.toLocaleString('en-MT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (listingType === 'long_let' || listingType === 'short_let') return formatted + '/mo';
  return formatted;
};

const isVideoUrl = (url) => url && /\.(mp4|webm|ogg|mov)$/i.test(url);

const PropertyCard = React.memo(({ property, onView, onEdit, onToggleAvailable, onToggleFeatured, onStatusChange, onShare, onUpdateAvailableDate, canEdit, canToggleFeatured, isFavorite, onToggleFavorite }) => {
  const [statusChanging, setStatusChanging] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const touchStartX = useRef(null);

  const status   = statusConfig[property.status]   || statusConfig.draft;
  const approval = approvalConfig[property.approvalStatus] || approvalConfig.not_required;
  const ownerName = property.Owner ? `${property.Owner.firstName} ${property.Owner.lastName}` : '—';

  const mediaItems = [property.heroImage, ...(property.images || [])].filter(Boolean);
  const currentMedia = mediaItems[imgIndex] || null;
  const isVideo = isVideoUrl(currentMedia);

  const prevImage = (e) => {
    e.stopPropagation();
    setImgIndex(i => (i - 1 + mediaItems.length) % mediaItems.length);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setImgIndex(i => (i + 1) % mediaItems.length);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setImgIndex(i => (i + 1) % mediaItems.length);
      else setImgIndex(i => (i - 1 + mediaItems.length) % mediaItems.length);
    }
    touchStartX.current = null;
  };

  const heroStyle = currentMedia && !isVideo
    ? { backgroundImage: `url(${currentMedia})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, var(--color-primary-300) 0%, var(--color-primary-500) 100%)' };

  return (
    <div className="property-card glass" style={cardStyle}>
      {/* Image / Media carousel */}
      <div
        style={{ position: 'relative', height: '180px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', overflow: 'hidden', ...heroStyle }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Video player */}
        {isVideo && currentMedia && (
          <video
            src={currentMedia}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            muted
            loop
            playsInline
            preload="none"
          />
        )}

        {/* Play icon overlay for videos */}
        {isVideo && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
          }}>
            <span style={{ fontSize: '40px', opacity: 0.9 }}>▶</span>
          </div>
        )}

        {/* Left arrow */}
        {mediaItems.length > 1 && (
          <button
            onClick={prevImage}
            style={{
              position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
              width: '28px', height: '28px', cursor: 'pointer',
              color: '#fff', fontSize: '14px', lineHeight: 1, zIndex: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Previous image"
          >‹</button>
        )}

        {/* Right arrow */}
        {mediaItems.length > 1 && (
          <button
            onClick={nextImage}
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
              width: '28px', height: '28px', cursor: 'pointer',
              color: '#fff', fontSize: '14px', lineHeight: 1, zIndex: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Next image"
          >›</button>
        )}

        {/* Dot indicators */}
        {mediaItems.length > 1 && (
          <div style={{
            position: 'absolute', bottom: '28px', left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: '5px', zIndex: 3,
          }}>
            {mediaItems.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                style={{
                  width: i === imgIndex ? '16px' : '6px', height: '6px',
                  borderRadius: '3px',
                  background: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.2s',
                }}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Status badge */}
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
          color: status.color, background: status.bg,
          zIndex: 2,
        }}>
          {status.label}
        </span>

        {/* Favorite toggle */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(property.id); }}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
              width: '28px', height: '28px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', lineHeight: 1, zIndex: 4,
              transition: 'background var(--transition-fast)',
              color: isFavorite ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.8)',
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}

        {/* Featured star */}
        {property.isFeatured && (
          <span style={{ position: 'absolute', top: onToggleFavorite ? '42px' : '10px', right: '10px', fontSize: '18px', zIndex: 2 }} title="Featured">⭐</span>
        )}

        {/* Availability dot */}
        <span style={{
          position: 'absolute', bottom: '10px', right: '10px',
          width: '10px', height: '10px', borderRadius: '50%',
          background: property.isAvailable ? 'var(--color-success)' : 'var(--color-error)',
          border: '2px solid white', zIndex: 2,
        }} title={property.isAvailable ? 'Available' : 'Unavailable'} />

        {/* Photo count */}
        {mediaItems.length > 0 && (
          <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--radius-full)', zIndex: 2 }}>
            📷 {mediaItems.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 'var(--space-4)' }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)',
          marginBottom: 'var(--space-1)', color: 'var(--color-text-primary)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {property.title}
        </h3>
        {property.referenceNumber && (
          <div style={{ marginBottom: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', background: 'var(--color-surface-glass)', border: '1px solid var(--color-accent-gold)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', color: 'var(--color-accent-gold)', fontWeight: 600, letterSpacing: '0.5px' }}>
              {property.referenceNumber}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{
            fontSize: 'var(--text-xs)', padding: '2px 8px',
            background: 'var(--color-primary-100)', borderRadius: 'var(--radius-full)',
            color: 'var(--color-text-secondary)',
          }}>
            📍 {property.locality}
          </span>
        </div>

        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', marginBottom: 'var(--space-2)' }}>
          {formatPrice(property.price, property.listingType)}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          {property.type && (
            <span style={tagStyle}>{property.type}</span>
          )}
          {property.listingType && (
            <span style={tagStyle}>{property.listingType.replace('_', ' ')}</span>
          )}
        </div>

        {/* Quick status change dropdown */}
        {canEdit && onStatusChange && (
          <div style={{ marginBottom: 'var(--space-3)' }} onClick={e => e.stopPropagation()}>
            <select
              value={property.status || 'draft'}
              disabled={statusChanging}
              onChange={async (e) => {
                e.stopPropagation();
                const newStatus = e.target.value;
                if (newStatus === property.status) return;
                setStatusChanging(true);
                try {
                  await onStatusChange(property, newStatus);
                } finally {
                  setStatusChanging(false);
                }
              }}
              style={{
                width: '100%',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${(statusConfig[property.status] || statusConfig.draft).color}`,
                background: 'var(--color-surface-glass)',
                color: (statusConfig[property.status] || statusConfig.draft).color,
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
                cursor: statusChanging ? 'not-allowed' : 'pointer',
                outline: 'none',
                opacity: statusChanging ? 0.6 : 1,
              }}
              aria-label="Change property status"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          {property.bedrooms != null && <span>🛏 {property.bedrooms}</span>}
          {property.bathrooms != null && <span>🚿 {property.bathrooms}</span>}
          {property.area != null && <span>📐 {property.area}m²</span>}
        </div>

        {/* Top features */}
        {property.features && property.features.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
            {property.features.slice(0, 4).map(f => (
              <span key={f} className="feature-chip" style={{ cursor: 'default', fontSize: '10px', padding: '2px 8px' }}>{f}</span>
            ))}
            {property.features.length > 4 && (
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-50)', color: 'var(--color-text-muted)' }}>+{property.features.length - 4} more</span>
            )}
          </div>
        )}

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
          Owner: {ownerName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <UserAvatar user={property.agent} size="sm" />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {property.agent ? `${property.agent.firstName} ${property.agent.lastName}` : 'No agent'}
          </span>
        </div>

        {/* Available Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }} onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>📅 Avail. Date:</span>
          {canEdit ? (
            <input
              type="date"
              value={property.availableFrom ? property.availableFrom.slice(0, 10) : ''}
              onChange={e => onUpdateAvailableDate && onUpdateAvailableDate(property, e.target.value || null)}
              style={{
                fontSize: 'var(--text-xs)',
                padding: '2px 4px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-glass)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                flex: 1,
                minWidth: 0,
              }}
            />
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              {property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : 'No date set'}
            </span>
          )}
        </div>

        {/* Updated time */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
          Updated: {timeAgo(property.updatedAt)}
        </div>

        {/* Approval + Published badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
          {approval.label && <span className={approval.cls}>{approval.label}</span>}
          {property.isPublishedToWebsite && <span className="published-badge">🌐 Published</span>}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap',
      }}>
        <button onClick={() => onView(property)} style={btnStyle('#5C7A9C')}>👁 View</button>
        {canEdit && <button onClick={() => onEdit(property)} style={btnStyle('var(--color-primary)')}>✏️ Edit</button>}
        {onShare && <button onClick={() => onShare(property)} style={btnStyle('var(--color-accent-gold)')} title="Copy shareable link">📋</button>}

        {/* Toggle Available */}
        <button
          onClick={() => onToggleAvailable(property)}
          style={{
            ...btnStyle(property.isAvailable ? 'var(--color-success)' : 'var(--color-error)'),
            marginLeft: 'auto',
          }}
          title={property.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
        >
          {property.isAvailable ? '✓ Avail.' : '✗ N/A'}
        </button>

        {/* Toggle Featured */}
        {canToggleFeatured && (
          <button
            onClick={() => onToggleFeatured(property)}
            style={btnStyle(property.isFeatured ? 'var(--color-accent-gold)' : 'var(--color-text-muted)')}
            title={property.isFeatured ? 'Unfeature' : 'Feature'}
          >
            ⭐
          </button>
        )}
      </div>
    </div>
  );
});

const cardStyle = {
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
  cursor: 'pointer',
};

const tagStyle = {
  fontSize: 'var(--text-xs)',
  padding: '2px 8px',
  background: 'var(--color-surface-glass)',
  borderRadius: 'var(--radius-full)',
  color: 'var(--color-text-muted)',
  textTransform: 'capitalize',
};

const btnStyle = (color) => ({
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  fontWeight: 'var(--font-medium)',
  transition: 'background var(--transition-fast)',
  whiteSpace: 'nowrap',
});

export default PropertyCard;
