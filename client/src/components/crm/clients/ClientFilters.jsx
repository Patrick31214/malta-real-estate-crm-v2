import React from 'react';
import { CLIENT_STATUSES, URGENCY_LABELS, CLIENT_PREFERENCES } from '../../../constants/clientRequirements';

const ClientFilters = ({ filters, onChange, onClear, onAdd, canCreate }) => {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="glass" style={{
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 'var(--space-6)',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>

        {/* Search */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Search</label>
          <input
            type="text"
            placeholder="Name, email, phone…"
            value={filters.search || ''}
            onChange={e => handleChange('search', e.target.value)}
            style={{ ...inputStyle, minWidth: '200px' }}
          />
        </div>

        {/* Status */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Status</label>
          <select value={filters.status || ''} onChange={e => handleChange('status', e.target.value)} style={inputStyle}>
            <option value="">All Statuses</option>
            {CLIENT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Looking For */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Looking For</label>
          <select value={filters.lookingFor || ''} onChange={e => handleChange('lookingFor', e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {CLIENT_PREFERENCES.lookingFor.map(v => (
              <option key={v} value={v}>{v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        {/* Urgency */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Urgency</label>
          <select value={filters.urgency || ''} onChange={e => handleChange('urgency', e.target.value)} style={inputStyle}>
            <option value="">Any Urgency</option>
            {Object.entries(URGENCY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* VIP Toggle */}
        <div style={fieldWrap}>
          <label style={labelStyle}>VIP</label>
          <button
            type="button"
            onClick={() => handleChange('isVIP', filters.isVIP === 'true' ? '' : 'true')}
            style={{
              ...inputStyle,
              cursor: 'pointer',
              background: filters.isVIP === 'true' ? 'var(--color-accent-gold)' : 'var(--color-surface-glass)',
              color: filters.isVIP === 'true' ? '#fff' : 'var(--color-text-secondary)',
              border: `1px solid ${filters.isVIP === 'true' ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
              fontWeight: filters.isVIP === 'true' ? 'var(--font-semibold)' : 'var(--font-normal)',
              whiteSpace: 'nowrap',
            }}
          >
            ⭐ VIP Only
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignSelf: 'flex-end', marginLeft: 'auto' }}>
          <button onClick={onClear} style={clearBtnStyle}>✕ Clear</button>
          {canCreate && (
            <button
              onClick={onAdd}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-accent-gold)',
                background: 'var(--color-accent-gold)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
                whiteSpace: 'nowrap',
              }}
            >
              + Add Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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

export default ClientFilters;
