import React from 'react';

const statusConfig = {
  listed:      { label: 'Listed',      color: 'var(--color-success)',  bg: 'var(--color-success-light)' },
  draft:       { label: 'Draft',       color: 'var(--color-text-muted)', bg: 'var(--color-primary-50)' },
  under_offer: { label: 'Under Offer', color: 'var(--color-warning)',  bg: 'var(--color-warning-light)' },
  sold:        { label: 'Sold',        color: 'var(--color-error)',    bg: 'var(--color-error-light)' },
  rented:      { label: 'Rented',      color: 'var(--color-info)',     bg: 'var(--color-info-light)' },
  withdrawn:   { label: 'Withdrawn',   color: 'var(--color-error)',    bg: 'var(--color-error-light)' },
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
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
  </div>
) : null;

const PropertyDetail = ({ property, onEdit, onToggleAvailable, onToggleFeatured, onDelete, onClose, canEdit, canToggleFeatured, canDelete }) => {
  if (!property) return null;

  const status = statusConfig[property.status] || statusConfig.draft;
  const ownerName = property.Owner ? `${property.Owner.firstName} ${property.Owner.lastName}` : '—';
  const agentName = property.agent ? `${property.agent.firstName} ${property.agent.lastName}` : '—';

  const allImages = [property.heroImage, ...(property.images || [])].filter(Boolean);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
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
      </div>

      {/* Image gallery */}
      {allImages.length > 1 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', overflowX: 'auto' }}>
          {allImages.map((img, i) => (
            <img key={i} src={img} alt={`${property.title} ${i + 1}`} style={{ height: '80px', width: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* Title + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{property.title}</h1>
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
          <button onClick={onClose} style={actionBtn('var(--color-text-secondary)')}>✕ Close</button>
        </div>
      </div>

      {/* Price */}
      <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', marginBottom: 'var(--space-4)' }}>
        {formatPrice(property.price, property.listingType)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
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
              <DetailRow label="Name" value={ownerName} />
              <DetailRow label="Phone" value={property.Owner.phone} />
              <DetailRow label="Email" value={property.Owner.email} />
              <DetailRow label="Alt Phone" value={property.Owner.alternatePhone} />
            </>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No owner assigned</p>}
        </div>

        {/* Agent */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={sectionTitle}>Agent</h3>
          {property.agent ? (
            <>
              <DetailRow label="Name" value={agentName} />
              <DetailRow label="Email" value={property.agent.email} />
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
        {property.features && property.features.length > 0 && (
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Features</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              {property.features.map(f => (
                <span key={f} style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-100)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>✓ {f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Media links */}
        {(property.virtualTourUrl || property.videoUrl) && (
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Media</h3>
            {property.virtualTourUrl && <a href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>🏠 Virtual Tour</a>}
            {property.videoUrl && <a href={property.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)' }}>🎬 Video</a>}
          </div>
        )}
      </div>

      {/* Description */}
      {property.description && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
          <h3 style={sectionTitle}>Description</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>{property.description}</p>
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
