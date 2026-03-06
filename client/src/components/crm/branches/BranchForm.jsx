import React, { useState, useEffect } from 'react';

const EMPTY = {
  name: '',
  address: '',
  city: '',
  locality: '',
  country: 'Malta',
  phone: '',
  email: '',
  description: '',
  logo: '',
  coverImage: '',
  latitude: '',
  longitude: '',
  managerId: '',
  isActive: true,
};

const fieldStyle = {
  width: '100%',
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-glass)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--space-1)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const BranchForm = ({ initial, managers = [], onSave, onCancel, saving }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        name:        initial.name        || '',
        address:     initial.address     || '',
        city:        initial.city        || '',
        locality:    initial.locality    || '',
        country:     initial.country     || 'Malta',
        phone:       initial.phone       || '',
        email:       initial.email       || '',
        description: initial.description || '',
        logo:        initial.logo        || '',
        coverImage:  initial.coverImage  || '',
        latitude:    initial.latitude    != null ? String(initial.latitude)  : '',
        longitude:   initial.longitude   != null ? String(initial.longitude) : '',
        managerId:   initial.managerId   || '',
        isActive:    initial.isActive    !== undefined ? initial.isActive : true,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [initial]);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Branch name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form };
    if (!payload.managerId) payload.managerId = null;
    if (!payload.latitude)  payload.latitude  = null;
    if (!payload.longitude) payload.longitude = null;
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', margin: 0 }}>
        {initial ? 'Edit Branch' : 'Add New Branch'}
      </h2>

      {/* Name */}
      <div>
        <label style={labelStyle}>Branch Name *</label>
        <input
          style={{ ...fieldStyle, borderColor: errors.name ? 'var(--color-error)' : 'var(--color-border)' }}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Golden Key Realty — Sliema HQ"
        />
        {errors.name && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.name}</p>}
      </div>

      {/* Address */}
      <div>
        <label style={labelStyle}>Address</label>
        <textarea
          style={{ ...fieldStyle, resize: 'vertical', minHeight: 72 }}
          value={form.address}
          onChange={e => set('address', e.target.value)}
          placeholder="Street address"
        />
      </div>

      {/* City / Locality */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>
          <label style={labelStyle}>City</label>
          <input style={fieldStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Sliema" />
        </div>
        <div>
          <label style={labelStyle}>Locality</label>
          <input style={fieldStyle} value={form.locality} onChange={e => set('locality', e.target.value)} placeholder="e.g. Sliema" />
        </div>
      </div>

      {/* Country */}
      <div>
        <label style={labelStyle}>Country</label>
        <input style={fieldStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Malta" />
      </div>

      {/* Phone / Email */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>
          <label style={labelStyle}>Phone</label>
          <input style={fieldStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+356 2131 2345" />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={{ ...fieldStyle, borderColor: errors.email ? 'var(--color-error)' : 'var(--color-border)' }}
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="branch@goldenkey.mt"
            type="email"
          />
          {errors.email && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.email}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...fieldStyle, resize: 'vertical', minHeight: 80 }}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Brief description of this branch..."
        />
      </div>

      {/* Coordinates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>
          <label style={labelStyle}>Latitude</label>
          <input style={fieldStyle} value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="e.g. 35.9116" type="number" step="any" />
        </div>
        <div>
          <label style={labelStyle}>Longitude</label>
          <input style={fieldStyle} value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="e.g. 14.5029" type="number" step="any" />
        </div>
      </div>

      {/* Logo URL */}
      <div>
        <label style={labelStyle}>Logo URL</label>
        <input style={fieldStyle} value={form.logo} onChange={e => set('logo', e.target.value)} placeholder="https://…" />
      </div>

      {/* Manager dropdown */}
      {managers.length > 0 && (
        <div>
          <label style={labelStyle}>Branch Manager</label>
          <select style={fieldStyle} value={form.managerId} onChange={e => set('managerId', e.target.value)}>
            <option value="">— No manager assigned —</option>
            {managers.map(m => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} ({m.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Active toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <label style={{ ...labelStyle, margin: 0 }}>Active</label>
        <button
          type="button"
          onClick={() => set('isActive', !form.isActive)}
          style={{
            width: 44,
            height: 24,
            borderRadius: '999px',
            border: 'none',
            background: form.isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
            flexShrink: 0,
          }}
          aria-label="Toggle active"
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: form.isActive ? 22 : 3,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left var(--transition-fast)',
            }}
          />
        </button>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {form.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
        <button type="button" onClick={onCancel} style={cancelBtnStyle}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={saveBtnStyle}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Branch'}
        </button>
      </div>
    </form>
  );
};

const cancelBtnStyle = {
  padding: 'var(--space-3) var(--space-5)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
};

const saveBtnStyle = {
  padding: 'var(--space-3) var(--space-5)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-accent-gold)',
  background: 'var(--color-accent-gold)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  boxShadow: 'var(--shadow-gold-sm)',
};

export default BranchForm;
