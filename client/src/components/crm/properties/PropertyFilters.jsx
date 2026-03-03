import React from 'react';

const PROPERTY_TYPES = ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'];
const LISTING_TYPES  = ['sale','long_let','short_let','both'];
const STATUS_TYPES   = ['draft','listed','under_offer','sold','rented','withdrawn'];

const PropertyFilters = ({ filters, onChange, onClear }) => {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="glass" style={{
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 'var(--space-6)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-3)',
      alignItems: 'flex-end',
    }}>
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

      {/* Clear */}
      <button onClick={onClear} style={{
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        alignSelf: 'flex-end',
        transition: 'background var(--transition-fast)',
      }}>
        ✕ Clear
      </button>
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

export default PropertyFilters;
