import React, { useState } from 'react';
import api from '../../../services/api';
import FileUpload from '../../ui/FileUpload';

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
  idNumber: '', address: '', notes: '', profileImage: '', isActive: true,
};

const normalizeInitial = (initial) => ({ ...EMPTY_FORM, ...initial,
  email: initial.email ?? '', phone: initial.phone ?? '',
  alternatePhone: initial.alternatePhone ?? '', idNumber: initial.idNumber ?? '',
  address: initial.address ?? '', notes: initial.notes ?? '', profileImage: initial.profileImage ?? '',
});

const OwnerForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial ? normalizeInitial(initial) : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      ['email','alternatePhone','idNumber','address','notes','profileImage'].forEach(k => { if (!payload[k]) payload[k] = null; });
      const response = initial?.id
        ? await api.put(`/owners/${initial.id}`, payload)
        : await api.post('/owners', payload);
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
    <div style={{ padding: 'var(--space-6)', maxWidth: 'min(95vw, 700px)', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}>
        {initial?.id ? 'Edit Owner' : 'Add Owner'}
      </h2>
      {errors._general && <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>{errors._general}</div>}
      <form onSubmit={handleSubmit}>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={sectionTitle}>Profile Photo</h3>
          <FileUpload value={form.profileImage} onChange={v => set('profileImage', v)} label="Profile Image" accept="image/*" />
        </div>

        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={sectionTitle}>Personal Information</h3>
          <div style={row}>
            <Field label="First Name *" error={errors.firstName}><input style={inp(errors.firstName)} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" /></Field>
            <Field label="Last Name *" error={errors.lastName}><input style={inp(errors.lastName)} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" /></Field>
          </div>
          <div style={row}>
            <Field label="Email"><input type="email" style={inp()} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.mt" /></Field>
            <Field label="Phone *" error={errors.phone}><input type="tel" style={inp(errors.phone)} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+356 9912 3456" /></Field>
          </div>
          <div style={row}>
            <Field label="Alternate Phone"><input type="tel" style={inp()} value={form.alternatePhone} onChange={e => set('alternatePhone', e.target.value)} placeholder="+356 9988 7766" /></Field>
            <Field label="ID / Passport Number"><input style={inp()} value={form.idNumber} onChange={e => set('idNumber', e.target.value)} placeholder="ID number" /></Field>
          </div>
          <Field label="Address"><textarea style={{ ...inp(), minHeight: '80px', resize: 'vertical' }} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address…" /></Field>
          <Field label="Notes"><textarea style={{ ...inp(), minHeight: '80px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes…" /></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', cursor: 'pointer', marginTop: 'var(--space-2)' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            <span>Active</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)' }}>
          <button type="button" onClick={onCancel} style={cancelBtn}>Cancel</button>
          <button type="submit" disabled={saving} style={saveBtn}>{saving ? 'Saving…' : 'Save Owner'}</button>
        </div>
      </form>
    </div>
  );
};

const sectionTitle = { fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' };
const row = { display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' };
const Field = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1, minWidth: '150px' }}>
    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{error}</span>}
  </div>
);
const inp = (error) => ({ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`, background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', width: '100%', outline: 'none' });
const cancelBtn = { padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' };
const saveBtn = { padding: 'var(--space-3) var(--space-8)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'var(--color-accent-gold)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', boxShadow: 'var(--shadow-gold-sm)' };

export default OwnerForm;
