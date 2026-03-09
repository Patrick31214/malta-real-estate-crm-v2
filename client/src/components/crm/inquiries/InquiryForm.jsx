import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';

const INQUIRY_TYPES = [
  { value: 'property',     label: 'Property' },
  { value: 'work_with_us', label: 'Work With Us' },
  { value: 'affiliate',    label: 'Affiliate' },
  { value: 'general',      label: 'General' },
  { value: 'viewing',      label: 'Viewing' },
  { value: 'valuation',    label: 'Valuation' },
];

const SOURCES = [
  { value: 'website',      label: 'Website' },
  { value: 'phone',        label: 'Phone' },
  { value: 'email',        label: 'Email' },
  { value: 'whatsapp',     label: 'WhatsApp' },
  { value: 'walk_in',      label: 'Walk In' },
  { value: 'referral',     label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other',        label: 'Other' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUSES = [
  { value: 'new',               label: 'New' },
  { value: 'open',              label: 'Open' },
  { value: 'assigned',          label: 'Assigned' },
  { value: 'in_progress',       label: 'In Progress' },
  { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
  { value: 'resolved',          label: 'Resolved' },
  { value: 'closed',            label: 'Closed' },
  { value: 'spam',              label: 'Spam' },
];

const EMPTY_FORM = {
  type: 'general',
  firstName: '', lastName: '', email: '', phone: '',
  message: '', source: '', priority: 'medium',
  status: 'new', propertyId: '', assignedToId: '',
  adminNotes: '',
};

const InquiryForm = ({ initial, onSave, onCancel }) => {
  const isEdit = !!initial?.id;
  const { showError, showSuccess } = useToast();

  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        type:         initial.type         || 'general',
        firstName:    initial.firstName    || '',
        lastName:     initial.lastName     || '',
        email:        initial.email        || '',
        phone:        initial.phone        || '',
        message:      initial.message      || '',
        source:       initial.source       || '',
        priority:     initial.priority     || 'medium',
        status:       initial.status       || 'new',
        propertyId:   initial.propertyId   || '',
        assignedToId: initial.assignedToId || '',
        adminNotes:   initial.adminNotes   || '',
      };
    }
    return { ...EMPTY_FORM };
  });

  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents]       = useState([]);

  useEffect(() => {
    api.get('/properties', { params: { limit: 200, status: 'listed' } })
      .then(r => setProperties(r.data.properties || []))
      .catch(() => {});
    api.get('/agents', { params: { limit: 200, status: 'active' } })
      .then(r => setAgents(r.data.agents || r.data.users || []))
      .catch(() => {});
  }, []);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.type)              e.type      = 'Type is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      ['propertyId', 'assignedToId', 'source'].forEach(f => { if (payload[f] === '') payload[f] = null; });
      const res = isEdit
        ? await api.put(`/inquiries/${initial.id}`, payload)
        : await api.post('/inquiries', payload);
      showSuccess(isEdit ? 'Inquiry updated' : 'Inquiry created');
      onSave(res.data);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save inquiry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)' }}>
        {isEdit ? 'Edit Inquiry' : 'New Inquiry'}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        {/* Type */}
        <div style={fieldRow}>
          <label style={labelStyle}>Type <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <select value={form.type} onChange={e => set('type', e.target.value)} style={selectStyle}>
            {INQUIRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errors.type && <span style={errStyle}>{errors.type}</span>}
        </div>

        {/* Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={{ ...inputStyle, borderColor: errors.firstName ? 'var(--color-error)' : undefined }} placeholder="First name" />
            {errors.firstName && <span style={errStyle}>{errors.firstName}</span>}
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} placeholder="Last name" />
          </div>
        </div>

        {/* Email + Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={{ ...inputStyle, borderColor: errors.email ? 'var(--color-error)' : undefined }} placeholder="email@example.com" />
            {errors.email && <span style={errStyle}>{errors.email}</span>}
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} placeholder="+356 ..." />
          </div>
        </div>

        {/* Message */}
        <div style={fieldRow}>
          <label style={labelStyle}>Message</label>
          <textarea
            value={form.message}
            onChange={e => set('message', e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Inquiry message..."
          />
        </div>

        {/* Source + Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} style={selectStyle}>
              <option value="">— Select source —</option>
              {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} style={selectStyle}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Status (edit only) */}
        {isEdit && (
          <div style={fieldRow}>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        {/* Property */}
        <div style={fieldRow}>
          <label style={labelStyle}>Property (optional)</label>
          <select value={form.propertyId} onChange={e => set('propertyId', e.target.value)} style={selectStyle}>
            <option value="">— No property linked —</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.title || p.referenceNumber} {p.locality ? `– ${p.locality}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned To */}
        <div style={fieldRow}>
          <label style={labelStyle}>Assign to Agent (optional)</label>
          <select value={form.assignedToId} onChange={e => set('assignedToId', e.target.value)} style={selectStyle}>
            <option value="">— Unassigned —</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
            ))}
          </select>
        </div>

        {/* Admin Notes */}
        <div style={fieldRow}>
          <label style={labelStyle}>Admin Notes</label>
          <textarea
            value={form.adminNotes}
            onChange={e => set('adminNotes', e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Internal notes..."
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={saveBtnStyle}>
            {saving ? 'Saving…' : isEdit ? 'Update Inquiry' : 'Create Inquiry'}
          </button>
        </div>
      </form>
    </div>
  );
};

const fieldRow = { marginBottom: 'var(--space-4)' };

const labelStyle = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--space-1)',
};

const inputStyle = {
  width: '100%',
  padding: 'var(--space-3)',
  background: 'var(--color-surface-glass)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  boxSizing: 'border-box',
  outline: 'none',
};

const selectStyle = { ...inputStyle };

const errStyle = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-error)',
  marginTop: '4px',
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

export default InquiryForm;
