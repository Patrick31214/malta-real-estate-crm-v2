import React, { useState } from 'react';
import api from '../../../services/api';
import FileUpload from '../../ui/FileUpload';

const RELATIONSHIPS = ['Daughter', 'Son', 'Property Manager', 'Mother', 'Father', 'Spouse', 'Lawyer', 'Accountant', 'Brother', 'Sister', 'Other'];

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
  idNumber: '', nationality: '', preferredLanguage: '', dateOfBirth: '',
  companyName: '', taxId: '', address: '', notes: '', profileImage: '', isActive: true,
};

const EMPTY_CONTACT = { relationship: '', firstName: '', lastName: '', phone: '', alternatePhone: '', email: '', notes: '', isEmergency: false, isPrimary: false };

const normalizeInitial = (initial) => ({
  ...EMPTY_FORM, ...initial,
  email: initial.email ?? '', phone: initial.phone ?? '',
  alternatePhone: initial.alternatePhone ?? '', idNumber: initial.idNumber ?? '',
  nationality: initial.nationality ?? '', preferredLanguage: initial.preferredLanguage ?? '',
  dateOfBirth: initial.dateOfBirth ?? '', companyName: initial.companyName ?? '',
  taxId: initial.taxId ?? '', address: initial.address ?? '',
  notes: initial.notes ?? '', profileImage: initial.profileImage ?? '',
});

const OwnerForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial ? normalizeInitial(initial) : EMPTY_FORM);
  const [contacts, setContacts] = useState(initial?.contacts ?? []);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const addContact = () => setContacts(c => [...c, { ...EMPTY_CONTACT }]);
  const removeContact = (i) => setContacts(c => c.filter((_, idx) => idx !== i));
  const setContact = (i, key, value) => setContacts(c => c.map((ct, idx) => idx === i ? { ...ct, [key]: value } : ct));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    contacts.forEach((c, i) => {
      if (!c.firstName?.trim()) errs[`contact_${i}_firstName`] = 'Required';
      if (!c.relationship?.trim()) errs[`contact_${i}_relationship`] = 'Required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, contacts };
      ['email','alternatePhone','idNumber','nationality','preferredLanguage','dateOfBirth','companyName','taxId','address','notes','profileImage','lastName'].forEach(k => { if (!payload[k]) payload[k] = null; });
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

        {/* Profile Photo */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={sectionTitle}>Profile Photo <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(optional)</span></h3>
          <FileUpload value={form.profileImage} onChange={v => set('profileImage', v)} label="Profile Image" accept="image/*" />
        </div>

        {/* Personal Information */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={sectionTitle}>Personal Information</h3>
          <div style={row}>
            <Field label="First Name *" error={errors.firstName}><input style={inp(errors.firstName)} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" /></Field>
            <Field label="Last Name"><input style={inp()} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" /></Field>
          </div>
          <div style={row}>
            <Field label="Phone *" error={errors.phone}><input type="tel" style={inp(errors.phone)} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+356 9912 3456" /></Field>
            <Field label="Alternate Phone"><input type="tel" style={inp()} value={form.alternatePhone} onChange={e => set('alternatePhone', e.target.value)} placeholder="+356 9988 7766" /></Field>
          </div>
          <div style={row}>
            <Field label="Email"><input type="email" style={inp()} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.mt" /></Field>
            <Field label="ID / Passport Number"><input style={inp()} value={form.idNumber} onChange={e => set('idNumber', e.target.value)} placeholder="ID number" /></Field>
          </div>
          <div style={row}>
            <Field label="Date of Birth"><input type="date" style={inp()} value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></Field>
            <Field label="Nationality"><input style={inp()} value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. Maltese" /></Field>
          </div>
          <Field label="Preferred Language"><input style={inp()} value={form.preferredLanguage} onChange={e => set('preferredLanguage', e.target.value)} placeholder="e.g. English, Maltese" /></Field>
        </div>

        {/* Company / Tax */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={sectionTitle}>Company / Tax</h3>
          <div style={row}>
            <Field label="Company Name"><input style={inp()} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Company name (if applicable)" /></Field>
            <Field label="Tax ID / VAT Number"><input style={inp()} value={form.taxId} onChange={e => set('taxId', e.target.value)} placeholder="VAT / Tax ID" /></Field>
          </div>
        </div>

        {/* Address & Notes */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={sectionTitle}>Address &amp; Notes</h3>
          <Field label="Address"><textarea style={{ ...inp(), minHeight: '80px', resize: 'vertical' }} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address…" /></Field>
          <Field label="Notes"><textarea style={{ ...inp(), minHeight: '80px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes…" /></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', cursor: 'pointer', marginTop: 'var(--space-2)' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            <span>Active</span>
          </label>
        </div>

        {/* Contacts / Relatives */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ ...sectionTitle, margin: 0, border: 'none', padding: 0 }}>Contacts / Relatives</h3>
            <button type="button" onClick={addContact} style={addContactBtn}>+ Add Contact</button>
          </div>
          {contacts.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No contacts added yet.</p>}
          {contacts.map((c, i) => (
            <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-3)', position: 'relative' }}>
              <button type="button" onClick={() => removeContact(i)} style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: 'var(--text-lg)', lineHeight: 1 }}>×</button>
              <div style={row}>
                <Field label="Relationship *" error={errors[`contact_${i}_relationship`]}>
                  <select style={inp(errors[`contact_${i}_relationship`])} value={c.relationship} onChange={e => setContact(i, 'relationship', e.target.value)}>
                    <option value="">Select…</option>
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="First Name *" error={errors[`contact_${i}_firstName`]}><input style={inp(errors[`contact_${i}_firstName`])} value={c.firstName} onChange={e => setContact(i, 'firstName', e.target.value)} placeholder="First name" /></Field>
                <Field label="Last Name"><input style={inp()} value={c.lastName} onChange={e => setContact(i, 'lastName', e.target.value)} placeholder="Last name" /></Field>
              </div>
              <div style={row}>
                <Field label="Phone"><input type="tel" style={inp()} value={c.phone} onChange={e => setContact(i, 'phone', e.target.value)} placeholder="+356…" /></Field>
                <Field label="Alt. Phone"><input type="tel" style={inp()} value={c.alternatePhone} onChange={e => setContact(i, 'alternatePhone', e.target.value)} placeholder="+356…" /></Field>
                <Field label="Email"><input type="email" style={inp()} value={c.email} onChange={e => setContact(i, 'email', e.target.value)} placeholder="email@…" /></Field>
              </div>
              <Field label="Notes"><input style={inp()} value={c.notes} onChange={e => setContact(i, 'notes', e.target.value)} placeholder="Notes…" /></Field>
              <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-2)' }}>
                <label style={toggleLabel}><input type="checkbox" checked={c.isEmergency} onChange={e => setContact(i, 'isEmergency', e.target.checked)} /><span>Emergency Contact</span></label>
                <label style={toggleLabel}><input type="checkbox" checked={c.isPrimary} onChange={e => setContact(i, 'isPrimary', e.target.checked)} /><span>Primary Contact</span></label>
              </div>
            </div>
          ))}
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
const addContactBtn = { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'transparent', color: 'var(--color-accent-gold)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' };
const toggleLabel = { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', cursor: 'pointer' };

export default OwnerForm;
