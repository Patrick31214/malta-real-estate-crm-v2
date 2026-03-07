import React, { useState, useEffect } from 'react';
import ImageDropZone from '../../ui/ImageDropZone';

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
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--space-1)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const sectionTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-sm)',
  fontWeight: 700,
  color: 'var(--color-accent-gold)',
  marginBottom: 'var(--space-4)',
  marginTop: 0,
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px solid rgba(255,193,7,0.2)',
};

const Field = ({ label, error, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
    {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 4, marginBottom: 0 }}>{error}</p>}
  </div>
);

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
    <div style={{ overflowY: 'auto', maxHeight: '90vh' }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'rgba(255,193,7,0.15)', border: '2px solid rgba(255,193,7,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            🏢
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: '#fff', margin: 0 }}>
              {initial ? 'Edit Branch' : 'Add New Branch'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--text-xs)', margin: '2px 0 0' }}>
              {initial ? `Editing: ${initial.name}` : 'Fill in the details below to create a new branch'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {/* Left column: Location & Contact */}
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={sectionTitle}>📍 Location & Contact</h3>

            <Field label="Branch Name *" error={errors.name}>
              <input
                style={{ ...fieldStyle, borderColor: errors.name ? 'var(--color-error)' : 'var(--color-border)' }}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Golden Key Realty — Sliema HQ"
              />
            </Field>

            <Field label="Address">
              <textarea
                style={{ ...fieldStyle, resize: 'vertical', minHeight: 64 }}
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Street address"
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="City">
                <input style={fieldStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Sliema" />
              </Field>
              <Field label="Locality">
                <input style={fieldStyle} value={form.locality} onChange={e => set('locality', e.target.value)} placeholder="e.g. Sliema" />
              </Field>
            </div>

            <Field label="Country">
              <input style={fieldStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Malta" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Phone">
                <input style={fieldStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+356 2131 2345" />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  style={{ ...fieldStyle, borderColor: errors.email ? 'var(--color-error)' : 'var(--color-border)' }}
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="branch@example.mt"
                  type="email"
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Latitude">
                <input style={fieldStyle} value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="35.9116" type="number" step="any" />
              </Field>
              <Field label="Longitude">
                <input style={fieldStyle} value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="14.5029" type="number" step="any" />
              </Field>
            </div>
          </div>

          {/* Right column: Details & Config */}
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={sectionTitle}>⚙️ Details & Configuration</h3>

            <Field label="Description">
              <textarea
                style={{ ...fieldStyle, resize: 'vertical', minHeight: 80 }}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief description of this branch..."
              />
            </Field>

            <ImageDropZone
              value={form.logo}
              onChange={url => set('logo', url)}
              variant="logo"
              label="Branch Logo"
              placeholder="Drag & drop logo or click to browse"
            />

            <ImageDropZone
              value={form.coverImage}
              onChange={url => set('coverImage', url)}
              variant="cover"
              label="Cover Image"
              placeholder="Drag & drop cover image or click to browse"
            />

            {managers.length > 0 && (
              <Field label="Branch Manager">
                <select style={fieldStyle} value={form.managerId} onChange={e => set('managerId', e.target.value)}>
                  <option value="">— No manager assigned —</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.email})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Active toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Branch Status</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {form.isActive ? 'Branch is visible and accepting clients' : 'Branch is hidden and inactive'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                style={{ width: 44, height: 24, borderRadius: '999px', border: 'none', background: form.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                aria-label="Toggle active status"
              >
                <span style={{ position: 'absolute', top: 3, left: form.isActive ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'var(--color-accent-gold)', color: '#000', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Branch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BranchForm;
