import React, { useState } from 'react';
import api from '../../../services/api';

const CATEGORIES = [
  { value: 'branch',      label: 'Branch' },
  { value: 'emergency',   label: 'Emergency' },
  { value: 'staff',       label: 'Staff' },
  { value: 'legal',       label: 'Legal' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other',       label: 'Other' },
];

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  role: '',
  category: '',
  notes: '',
  isActive: true,
};

const normalizeInitial = (initial) => ({
  ...EMPTY_FORM,
  ...initial,
  email:    initial.email    ?? '',
  phone:    initial.phone    ?? '',
  company:  initial.company  ?? '',
  role:     initial.role     ?? '',
  category: initial.category ?? '',
  notes:    initial.notes    ?? '',
});

const ContactForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial ? normalizeInitial(initial) : EMPTY_FORM);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!form.email.trim() && !form.phone.trim()) {
      errs.email = 'At least one of email or phone is required';
      errs.phone = 'At least one of email or phone is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.email)    payload.email    = null;
      if (!payload.phone)    payload.phone    = null;
      if (!payload.company)  payload.company  = null;
      if (!payload.role)     payload.role     = null;
      if (!payload.category) payload.category = null;
      if (!payload.notes)    payload.notes    = null;

      let response;
      if (initial?.id) {
        response = await api.put(`/contacts/${initial.id}`, payload);
      } else {
        response = await api.post('/contacts', payload);
      }
      onSave(response.data);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        apiErrors.forEach(e => { mapped[e.path || e.param] = e.msg; });
        setErrors(mapped);
      } else {
        setErrors({ _general: err.response?.data?.error || 'Save failed' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 'min(95vw, 800px)', margin: '0 auto' }}>
      {/* Sticky close button */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', justifyContent: 'flex-end',
        padding: 'var(--space-2) 0',
        background: 'var(--color-background)',
        marginBottom: 'var(--space-2)',
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-glass)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
          }}
        >✕ Close</button>
      </div>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}>
        {initial?.id ? 'Edit Contact' : 'Add Contact'}
      </h2>

      {errors._general && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {errors._general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <Section title="Personal Information">
          <Row>
            <FormField label="First Name *" error={errors.firstName}>
              <input style={inputStyle(errors.firstName)} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. David" />
            </FormField>
            <FormField label="Last Name *" error={errors.lastName}>
              <input style={inputStyle(errors.lastName)} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. Mifsud" />
            </FormField>
          </Row>
        </Section>

        {/* Contact Details */}
        <Section title="Contact Details">
          <Row>
            <FormField label="Email" error={errors.email}>
              <input type="email" style={inputStyle(errors.email)} value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. david@example.mt" />
            </FormField>
            <FormField label="Phone" error={errors.phone}>
              <input type="tel" style={inputStyle(errors.phone)} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. +356 9912 3456" />
            </FormField>
          </Row>
          {(errors.email || errors.phone) && !errors.firstName && !errors.lastName && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', marginTop: '-var(--space-2)' }}>
              At least one of email or phone is required.
            </p>
          )}
        </Section>

        {/* Professional */}
        <Section title="Professional">
          <Row>
            <FormField label="Company">
              <input style={inputStyle()} value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Mifsud & Associates" />
            </FormField>
            <FormField label="Role / Title">
              <input style={inputStyle()} value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Notary, Plumber, Lawyer" />
            </FormField>
          </Row>
          <FormField label="Category">
            <select style={inputStyle()} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </FormField>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <FormField label="Notes">
            <textarea
              style={{ ...inputStyle(), minHeight: '100px', resize: 'vertical' }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes…"
            />
          </FormField>
        </Section>

        {/* Status */}
        <Section title="Status">
          <label style={toggleLabelStyle}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            <span>Active</span>
          </label>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-6)' }}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={saveBtnStyle}>{saving ? 'Saving…' : 'Save Contact'}</button>
        </div>
      </form>
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>{title}</h3>
    {children}
  </div>
);

const FormField = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1, minWidth: '150px' }}>
    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{error}</span>}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>{children}</div>
);

const inputStyle = (error) => ({
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
  background: 'var(--color-surface-glass)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  width: '100%',
  outline: 'none',
  backdropFilter: 'blur(8px)',
});

const toggleLabelStyle = {
  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
  fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', cursor: 'pointer',
};

const cancelBtnStyle = {
  padding: 'var(--space-3) var(--space-6)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
};

const saveBtnStyle = {
  padding: 'var(--space-3) var(--space-8)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-accent-gold)',
  background: 'var(--color-accent-gold)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  boxShadow: 'var(--shadow-gold-sm)',
};

export default ContactForm;
