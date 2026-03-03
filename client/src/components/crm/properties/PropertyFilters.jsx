import React, { useState } from 'react';

const PROPERTY_TYPES = ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'];
const LISTING_TYPES  = ['sale','long_let','short_let','both'];
const STATUS_TYPES   = ['draft','listed','under_offer','sold','rented','withdrawn'];
const APPROVAL_STATUSES = ['pending','approved','rejected','not_required'];

const QUICK_FEATURES = [
  { label: '🌊 Sea View', value: 'Sea View' },
  { label: '🏊 Pool',     value: 'Private Pool' },
  { label: '🐾 Pet Friendly', value: 'Pet Friendly' },
  { label: '🅿️ Parking', value: 'Garage' },
  { label: '🛗 Lift',    value: 'Lift' },
  { label: '🤫 Quiet',   value: 'Quiet Neighborhood' },
  { label: '🔥 Fireplace', value: 'Fireplace' },
  { label: '❄️ A/C',    value: 'Air Conditioning' },
];

const PropertyFilters = ({ filters, onChange, onClear }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  const toggleFeaturePill = (featureValue) => {
    const current = filters.features ? filters.features.split(',').map(f => f.trim()).filter(Boolean) : [];
    const next = current.includes(featureValue)
      ? current.filter(f => f !== featureValue)
      : [...current, featureValue];
    handleChange('features', next.join(','));
  };

  const activeFeatures = filters.features ? filters.features.split(',').map(f => f.trim()).filter(Boolean) : [];

  return (
    <div className="glass" style={{
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 'var(--space-6)',
    }}>
      {/* Row 1: main filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end', marginBottom: 'var(--space-3)' }}>
        {/* Search */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Search</label>
          <input
            type="text"
            placeholder="Title, locality, description…"
            value={filters.search || ''}
            onChange={e => handleChange('search', e.target.value)}
            style={{ ...inputStyle, minWidth: '200px' }}
          />
        </div>

        {/* Type */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Type</label>
          <select value={filters.type || ''} onChange={e => handleChange('type', e.target.value)} style={inputStyle}>
            <option value="">All Types</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
          </select>
        </div>

        {/* Listing Type */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Listing</label>
          <select value={filters.listingType || ''} onChange={e => handleChange('listingType', e.target.value)} style={inputStyle}>
            <option value="">All Listings</option>
            {LISTING_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>

        {/* Status */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Status</label>
          <select value={filters.status || ''} onChange={e => handleChange('status', e.target.value)} style={inputStyle}>
            <option value="">All Statuses</option>
            {STATUS_TYPES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>

        {/* Min Price */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Min €</label>
          <input type="number" placeholder="0" value={filters.minPrice || ''} onChange={e => handleChange('minPrice', e.target.value)} style={{ ...inputStyle, width: '100px' }} />
        </div>

        {/* Max Price */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Max €</label>
          <input type="number" placeholder="Any" value={filters.maxPrice || ''} onChange={e => handleChange('maxPrice', e.target.value)} style={{ ...inputStyle, width: '100px' }} />
        </div>

        {/* Bedrooms */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Min Beds</label>
          <input type="number" placeholder="Any" min={0} value={filters.minBedrooms || ''} onChange={e => handleChange('minBedrooms', e.target.value)} style={{ ...inputStyle, width: '80px' }} />
        </div>

        {/* Advanced toggle + Clear */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignSelf: 'flex-end' }}>
          <button onClick={() => setShowAdvanced(v => !v)} style={clearBtnStyle}>
            {showAdvanced ? '▲ Less' : '▼ More'}
          </button>
          <button onClick={onClear} style={clearBtnStyle}>✕ Clear</button>
        </div>
      </div>

      {/* Row 2: advanced filters */}
      {showAdvanced && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end', marginBottom: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-light)' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Min Area m²</label>
            <input type="number" placeholder="Any" value={filters.minArea || ''} onChange={e => handleChange('minArea', e.target.value)} style={{ ...inputStyle, width: '90px' }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Max Area m²</label>
            <input type="number" placeholder="Any" value={filters.maxArea || ''} onChange={e => handleChange('maxArea', e.target.value)} style={{ ...inputStyle, width: '90px' }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Floor</label>
            <input type="number" placeholder="Any" value={filters.floor || ''} onChange={e => handleChange('floor', e.target.value)} style={{ ...inputStyle, width: '70px' }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Year Built ≥</label>
            <input type="number" placeholder="Any" value={filters.minYearBuilt || ''} onChange={e => handleChange('minYearBuilt', e.target.value)} style={{ ...inputStyle, width: '90px' }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Year Built ≤</label>
            <input type="number" placeholder="Any" value={filters.maxYearBuilt || ''} onChange={e => handleChange('maxYearBuilt', e.target.value)} style={{ ...inputStyle, width: '90px' }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Energy Rating</label>
            <input type="text" placeholder="e.g. A" value={filters.energyRating || ''} onChange={e => handleChange('energyRating', e.target.value)} style={{ ...inputStyle, width: '80px' }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Approval</label>
            <select value={filters.approvalStatus || ''} onChange={e => handleChange('approvalStatus', e.target.value)} style={inputStyle}>
              <option value="">Any</option>
              {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Has Photos</label>
            <select value={filters.hasPhotos || ''} onChange={e => handleChange('hasPhotos', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Has Video</label>
            <select value={filters.hasVideo || ''} onChange={e => handleChange('hasVideo', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
      )}

      {/* Row 3: feature quick-filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-light)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', alignSelf: 'center', marginRight: 'var(--space-1)' }}>Features:</span>
        {QUICK_FEATURES.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            className={`filter-pill${activeFeatures.includes(value) ? ' active' : ''}`}
            onClick={() => toggleFeaturePill(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const fieldWrap = { display: 'flex', flexDirection: 'column', gap: '4px' };

const labelStyle = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
};

const inputStyle = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-glass)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  backdropFilter: 'blur(8px)',
};

const clearBtnStyle = {
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  transition: 'background var(--transition-fast)',
};

export default PropertyFilters;
