import React, { useState } from 'react';
import { PROPERTY_FEATURES, CATEGORY_ICONS } from '../../../constants/propertyFeatures';

const PROPERTY_TYPES = ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'];
const LISTING_TYPES  = ['sale','long_let','short_let','both'];
const STATUS_TYPES   = ['draft','listed','under_offer','sold','rented','withdrawn'];
const APPROVAL_STATUSES = ['pending','approved','rejected','not_required'];

const PropertyFilters = ({ filters, onChange, onClear }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFeaturesPanel, setShowFeaturesPanel] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [featureSearch, setFeatureSearch] = useState('');

  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  const activeFeatures = filters.features ? filters.features.split(',').map(f => f.trim()).filter(Boolean) : [];

  const toggleFeature = (featureValue) => {
    const next = activeFeatures.includes(featureValue)
      ? activeFeatures.filter(f => f !== featureValue)
      : [...activeFeatures, featureValue];
    handleChange('features', next.join(','));
  };

  const clearFeatures = () => handleChange('features', '');

  const toggleCategory = (cat) => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const searchLower = featureSearch.toLowerCase();

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
          <div style={fieldWrap}>
            <label style={labelStyle}>Pet Friendly</label>
            <select value={filters.isPetFriendly || ''} onChange={e => handleChange('isPetFriendly', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Accepts Children</label>
            <select value={filters.acceptsChildren || ''} onChange={e => handleChange('acceptsChildren', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Accepts Sharing</label>
            <select value={filters.acceptsSharing || ''} onChange={e => handleChange('acceptsSharing', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Short Let</label>
            <select value={filters.acceptsShortLet || ''} onChange={e => handleChange('acceptsShortLet', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Child Friendly</label>
            <select value={filters.childFriendlyRequired || ''} onChange={e => handleChange('childFriendlyRequired', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Required</option>
              <option value="false">Not Req.</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Negotiable</label>
            <select value={filters.isNegotiable || ''} onChange={e => handleChange('isNegotiable', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Age Range</label>
            <input type="text" placeholder="e.g. 25-55" value={filters.acceptedAgeRange || ''} onChange={e => handleChange('acceptedAgeRange', e.target.value)} style={{ ...inputStyle, width: '100px' }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Has Drone</label>
            <select value={filters.hasDroneMedia || ''} onChange={e => handleChange('hasDroneMedia', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Has 3D View</label>
            <select value={filters.has3DView || ''} onChange={e => handleChange('has3DView', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Virtual Tour</label>
            <select value={filters.hasVirtualTour || ''} onChange={e => handleChange('hasVirtualTour', e.target.value)} style={{ ...inputStyle, width: '90px' }}>
              <option value="">Any</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
      )}

      {/* Row 3: Features button + panel toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-light)', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setShowFeaturesPanel(v => !v)}
          className={`filter-pill${activeFeatures.length > 0 ? ' active' : ''}`}
          style={{ fontWeight: 'var(--font-semibold)' }}
        >
          🔍 Features{activeFeatures.length > 0 ? ` (${activeFeatures.length} selected)` : ''}
          <span style={{ marginLeft: '4px' }}>{showFeaturesPanel ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Features expandable panel */}
      <div className={`feature-filter-panel${showFeaturesPanel ? ' open' : ''}`}>
        <div className="glass" style={{
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginTop: 'var(--space-3)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
        }}>
          {/* Panel header: search + clear + close */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <input
              type="text"
              placeholder="🔎 Search features…"
              value={featureSearch}
              onChange={e => setFeatureSearch(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            {activeFeatures.length > 0 && (
              <button type="button" onClick={clearFeatures} style={clearBtnStyle}>Clear All</button>
            )}
            <button type="button" onClick={() => setShowFeaturesPanel(false)} style={clearBtnStyle}>✕ Close</button>
          </div>

          {/* Category sections */}
          {Object.entries(PROPERTY_FEATURES).map(([category, features]) => {
            const icon = CATEGORY_ICONS[category] || '';
            const isExpanded = !!expandedCategories[category];
            const selectedInCat = features.filter(f => activeFeatures.includes(f)).length;
            const visibleFeatures = featureSearch
              ? features.filter(f => f.toLowerCase().includes(searchLower))
              : features;

            if (featureSearch && visibleFeatures.length === 0) return null;

            return (
              <div key={category} style={{ marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)', overflow: 'hidden' }}>
                {/* Category header */}
                <div
                  className="feature-category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span>{icon}</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{category}</span>
                    {selectedInCat > 0 && (
                      <span style={{
                        fontSize: 'var(--text-xs)', padding: '1px 7px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-accent-gold)', color: '#fff',
                        fontWeight: 'var(--font-semibold)',
                      }}>{selectedInCat}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {isExpanded || featureSearch ? '▲' : '▼'}
                  </span>
                </div>

                {/* Feature chips */}
                {(isExpanded || featureSearch) && (
                  <div style={{ padding: 'var(--space-2) var(--space-3) var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {visibleFeatures.map(feature => (
                      <button
                        key={feature}
                        type="button"
                        className={`feature-chip${activeFeatures.includes(feature) ? ' selected' : ''}`}
                        onClick={() => toggleFeature(feature)}
                      >
                        {activeFeatures.includes(feature) && <span>✓ </span>}{feature}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
