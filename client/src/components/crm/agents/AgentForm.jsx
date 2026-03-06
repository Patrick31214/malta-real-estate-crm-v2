import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import FileUpload from '../../ui/FileUpload';
import { AGENT_PERMISSION_CATEGORIES, ALL_PERMISSION_KEYS } from '../../../constants/agentPermissions';

/* ── tiny sub-components ─────────────────────────────────────────────────── */

const SPECIALIZATIONS = ['Residential', 'Commercial', 'Luxury', 'Holiday Rentals', 'Land', 'New Developments', 'Off-Plan', 'Investment', 'Student Accommodation'];
const LANGUAGES = ['English', 'Maltese', 'Italian', 'French', 'German', 'Spanish', 'Arabic', 'Russian', 'Chinese'];

function SearchableMultiSelect({ options, value = [], onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));
  const toggle = (o) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 38, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', cursor: 'pointer', alignItems: 'center' }}>
        {value.length ? value.map(v => <span key={v} style={{ background: 'var(--color-accent-gold)', color: '#000', borderRadius: 4, padding: '1px 6px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>{v} <span onClick={e => { e.stopPropagation(); toggle(v); }}>×</span></span>) : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{placeholder}</span>}
        <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: 10 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--color-surface, #1a1a2e)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ padding: '8px', border: 'none', borderBottom: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(o => (
              <div key={o} onClick={() => toggle(o)} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', background: value.includes(o) ? 'rgba(255,193,7,0.1)' : 'transparent' }}>
                <span style={{ width: 14, height: 14, border: '1px solid var(--color-border)', borderRadius: 2, background: value.includes(o) ? 'var(--color-accent-gold)' : 'transparent', display: 'inline-block', flexShrink: 0 }} />
                {o}
              </div>
            ))}
          </div>
        </div>
      )}
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

function SearchableSingleSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = options.filter(o => o.value.toLowerCase().includes(q.toLowerCase()) || o.label.toLowerCase().includes(q.toLowerCase()));
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ minHeight: 38, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
        <span style={{ color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{selected?.label ?? placeholder}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--color-surface, #1a1a2e)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ padding: '8px', border: 'none', borderBottom: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {placeholder && <div onClick={() => { onChange(''); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{placeholder}</div>}
            {filtered.map(o => (
              <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 'var(--text-sm)', background: value === o.value ? 'rgba(255,193,7,0.1)' : 'transparent' }}>{o.label}</div>
            ))}
          </div>
        </div>
      )}
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const colors = ['', 'var(--color-error, #dc3545)', 'var(--color-error, #dc3545)', 'var(--color-accent-gold)', 'var(--color-accent-gold)', 'var(--color-success, #28a745)'];
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score] : 'var(--color-border)' }} />)}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: colors[score] }}>{labels[score]}</div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */

const inputStyle = { width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' };

const ROLE_OPTIONS = [
  { value: 'agent',   label: 'Agent' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin',   label: 'Admin' },
];
const APPROVAL_OPTIONS = [
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function buildInitialPermissions() {
  return ALL_PERMISSION_KEYS.reduce((acc, k) => { acc[k] = false; return acc; }, {});
}

export default function AgentForm({ initial, onSave, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const { showSuccess, showError } = useToast();

  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  /* form fields */
  const [fields, setFields] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', role: 'agent', jobTitle: '',
    branchId: '', licenseNumber: '', commissionRate: '',
    bio: '', nationality: '', dateOfBirth: '', address: '',
    emergencyContact: '', emergencyPhone: '',
    startDate: '', eireLicenseExpiry: '',
    approvalStatus: 'pending',
    isActive: true,
    specializations: [], languages: [],
    profileImage: [], passportImage: [], idCardImage: [], contractFile: [],
  });

  const [permissions, setPermissions] = useState(buildInitialPermissions);

  /* load agent data on edit */
  useEffect(() => {
    if (!initial) return;
    setFields({
      firstName: initial.firstName ?? '',
      lastName: initial.lastName ?? '',
      email: initial.email ?? '',
      password: '',
      phone: initial.phone ?? '',
      role: initial.role ?? 'agent',
      jobTitle: initial.jobTitle ?? '',
      branchId: initial.branchId ? String(initial.branchId) : '',
      licenseNumber: initial.licenseNumber ?? '',
      commissionRate: initial.commissionRate != null ? String(initial.commissionRate) : '',
      bio: initial.bio ?? '',
      nationality: initial.nationality ?? '',
      dateOfBirth: initial.dateOfBirth ? initial.dateOfBirth.split('T')[0] : '',
      address: initial.address ?? '',
      emergencyContact: initial.emergencyContact ?? '',
      emergencyPhone: initial.emergencyPhone ?? '',
      startDate: initial.startDate ? initial.startDate.split('T')[0] : '',
      eireLicenseExpiry: initial.eireLicenseExpiry ? initial.eireLicenseExpiry.split('T')[0] : '',
      approvalStatus: initial.approvalStatus ?? 'pending',
      isActive: initial.isActive !== false,
      specializations: Array.isArray(initial.specializations) ? initial.specializations : [],
      languages: Array.isArray(initial.languages) ? initial.languages : [],
      profileImage: initial.profileImage ? [initial.profileImage] : [],
      passportImage: initial.passportImage ? [initial.passportImage] : [],
      idCardImage: initial.idCardImage ? [initial.idCardImage] : [],
      contractFile: initial.contractFile ? [initial.contractFile] : [],
    });

    /* build permissions from UserPermissions */
    const base = buildInitialPermissions();
    if (Array.isArray(initial.UserPermissions)) {
      initial.UserPermissions.forEach(p => { base[p.feature] = Boolean(p.isEnabled); });
    }
    setPermissions(base);
  }, [initial]);

  /* load branches */
  useEffect(() => {
    api.get('/branches').then(({ data }) => {
      const list = Array.isArray(data) ? data : data.branches ?? [];
      setBranches(list.map(b => ({ value: String(b.id), label: `${b.name}${b.city ? ` – ${b.city}` : ''}` })));
    }).catch(() => {});
  }, []);

  const set = (key, val) => setFields(f => ({ ...f, [key]: val }));

  /* ── permission handlers ─────────────────────────────────────────────── */

  const togglePermission = useCallback(async (key, val) => {
    const prev = permissions[key];
    setPermissions(p => ({ ...p, [key]: val }));
    if (isEdit && initial?.id) {
      try {
        await api.patch(`/agents/${initial.id}/permissions/${key}`, { isEnabled: val });
      } catch (err) {
        showError(err.response?.data?.error || `Failed to save permission: ${key}`);
        setPermissions(p => ({ ...p, [key]: prev }));
      }
    }
  }, [isEdit, initial?.id, permissions, showError]);

  const bulkPermissions = useCallback(async (nextPerms) => {
    const prev = { ...permissions };
    setPermissions(nextPerms);
    if (isEdit && initial?.id) {
      try {
        await api.put(`/agents/${initial.id}/permissions`, { permissions: nextPerms });
      } catch (err) {
        showError(err.response?.data?.error || 'Failed to save permissions');
        setPermissions(prev);
      }
    }
  }, [isEdit, initial?.id, permissions, showError]);

  const selectAllPermissions = useCallback(() => {
    const next = ALL_PERMISSION_KEYS.reduce((acc, k) => { acc[k] = true; return acc; }, {});
    bulkPermissions(next);
  }, [bulkPermissions]);

  const deselectAllPermissions = useCallback(() => {
    const next = ALL_PERMISSION_KEYS.reduce((acc, k) => { acc[k] = false; return acc; }, {});
    bulkPermissions(next);
  }, [bulkPermissions]);

  const selectAllCategory = useCallback((cat) => {
    const next = { ...permissions };
    cat.permissions.forEach(p => { next[p.key] = true; });
    if (isEdit && initial?.id) {
      const prev = { ...permissions };
      setPermissions(next);
      api.put(`/agents/${initial.id}/permissions`, { permissions: next }).catch(err => {
        showError(err.response?.data?.error || 'Failed to save permissions');
        setPermissions(prev);
      });
    } else {
      setPermissions(next);
    }
  }, [isEdit, initial?.id, permissions, showError]);

  const deselectAllCategory = useCallback((cat) => {
    const next = { ...permissions };
    cat.permissions.forEach(p => { next[p.key] = false; });
    if (isEdit && initial?.id) {
      const prev = { ...permissions };
      setPermissions(next);
      api.put(`/agents/${initial.id}/permissions`, { permissions: next }).catch(err => {
        showError(err.response?.data?.error || 'Failed to save permissions');
        setPermissions(prev);
      });
    } else {
      setPermissions(next);
    }
  }, [isEdit, initial?.id, permissions, showError]);

  /* ── submit ──────────────────────────────────────────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.firstName.trim()) return showError('First name is required');
    if (!fields.lastName.trim()) return showError('Last name is required');
    if (!fields.email.trim()) return showError('Email is required');
    if (!isEdit && !fields.password.trim()) return showError('Password is required');

    const payload = {
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: fields.phone || null,
      role: fields.role,
      jobTitle: fields.jobTitle || null,
      branchId: fields.branchId || null,
      licenseNumber: fields.licenseNumber || null,
      commissionRate: fields.commissionRate !== '' ? parseFloat(fields.commissionRate) : null,
      bio: fields.bio || null,
      nationality: fields.nationality || null,
      dateOfBirth: fields.dateOfBirth || null,
      address: fields.address || null,
      emergencyContact: fields.emergencyContact || null,
      emergencyPhone: fields.emergencyPhone || null,
      startDate: fields.startDate || null,
      eireLicenseExpiry: fields.eireLicenseExpiry || null,
      approvalStatus: fields.approvalStatus,
      isActive: fields.isActive,
      specializations: fields.specializations,
      languages: fields.languages,
      profileImage: fields.profileImage[0] ?? null,
      passportImage: fields.passportImage[0] ?? null,
      idCardImage: fields.idCardImage[0] ?? null,
      contractFile: fields.contractFile[0] ?? null,
    };

    if (!isEdit) {
      payload.password = fields.password;
      payload.permissions = permissions;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/agents/${initial.id}`, payload);
      } else {
        await api.post('/agents', payload);
      }
      showSuccess(isEdit ? 'Agent updated' : 'Agent created');
      onSave?.();
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  /* ── inline modals ───────────────────────────────────────────────────── */

  const doResetPw = async () => {
    if (!newPassword.trim()) return showError('Enter a new password');
    try {
      await api.patch(`/agents/${initial.id}/reset-password`, { newPassword });
      setPwModalOpen(false);
      setNewPassword('');
      showSuccess('Password reset successfully');
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed'); }
  };

  const doChangeEmail = async () => {
    if (!newEmail.trim()) return showError('Enter a new email');
    try {
      await api.patch(`/agents/${initial.id}/email`, { newEmail });
      set('email', newEmail);
      setEmailModalOpen(false);
      setNewEmail('');
      showSuccess('Email updated');
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed'); }
  };

  const btnPrimary = { padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)' };
  const btnSecondary = { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)' };

  const SectionHeader = ({ title }) => (
    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>{title}</h3>
  );

  const enabledCount = ALL_PERMISSION_KEYS.filter(k => permissions[k]).length;

  const Modal = ({ title, onClose: closeModal, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-6)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{isEdit ? 'Edit Agent' : 'Add New Agent'}</h2>
        <button type="button" onClick={onCancel} style={btnSecondary}>✕ Cancel</button>
      </div>

      {/* ── Section 1: Personal ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader title="Personal Information" />
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Profile Photo</label>
          <FileUpload accept="image/jpeg,image/png,image/webp" multiple={false} value={fields.profileImage} onChange={v => set('profileImage', v)} label="Upload Profile Photo" />
        </div>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>First Name *</label>
            <input style={inputStyle} value={fields.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" required />
          </div>
          <div>
            <label style={labelStyle}>Last Name *</label>
            <input style={inputStyle} value={fields.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" required />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={fields.phone} onChange={e => set('phone', e.target.value)} placeholder="+356 xxxx xxxx" />
          </div>
          <div>
            <label style={labelStyle}>Nationality</label>
            <input style={inputStyle} value={fields.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Nationality" />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input type="date" style={inputStyle} value={fields.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={fields.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
          </div>
          <div>
            <label style={labelStyle}>Emergency Contact</label>
            <input style={inputStyle} value={fields.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="Name" />
          </div>
          <div>
            <label style={labelStyle}>Emergency Phone</label>
            <input style={inputStyle} value={fields.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} placeholder="+356 xxxx xxxx" />
          </div>
        </div>
      </div>

      {/* ── Section 2: Professional ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader title="Professional Details" />
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Role *</label>
            <SearchableSingleSelect options={ROLE_OPTIONS} value={fields.role} onChange={v => set('role', v)} placeholder="Select role" />
          </div>
          <div>
            <label style={labelStyle}>Job Title</label>
            <input style={inputStyle} value={fields.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="e.g. Senior Property Consultant" />
          </div>
          <div>
            <label style={labelStyle}>Branch</label>
            <SearchableSingleSelect options={branches} value={fields.branchId} onChange={v => set('branchId', v)} placeholder="Select branch" />
          </div>
          <div>
            <label style={labelStyle}>License Number</label>
            <input style={inputStyle} value={fields.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="License #" />
          </div>
          <div>
            <label style={labelStyle}>Commission Rate (%)</label>
            <input type="number" min="0" max="100" step="0.01" style={inputStyle} value={fields.commissionRate} onChange={e => set('commissionRate', e.target.value)} placeholder="e.g. 2.5" />
          </div>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type="date" style={inputStyle} value={fields.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>EIRE License Expiry</label>
            <input type="date" style={inputStyle} value={fields.eireLicenseExpiry} onChange={e => set('eireLicenseExpiry', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Specializations</label>
            <SearchableMultiSelect options={SPECIALIZATIONS} value={fields.specializations} onChange={v => set('specializations', v)} placeholder="Select specializations…" />
          </div>
          <div>
            <label style={labelStyle}>Languages</label>
            <SearchableMultiSelect options={LANGUAGES} value={fields.languages} onChange={v => set('languages', v)} placeholder="Select languages…" />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <label style={labelStyle}>Bio</label>
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4} value={fields.bio} onChange={e => set('bio', e.target.value)} placeholder="Brief agent biography…" />
        </div>
      </div>

      {/* ── Section 3: Documents ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader title="Documents" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Passport Image</label>
            <FileUpload accept="image/jpeg,image/png,application/pdf" multiple={false} value={fields.passportImage} onChange={v => set('passportImage', v)} label="Upload Passport" />
          </div>
          <div>
            <label style={labelStyle}>ID Card Image</label>
            <FileUpload accept="image/jpeg,image/png,application/pdf" multiple={false} value={fields.idCardImage} onChange={v => set('idCardImage', v)} label="Upload ID Card" />
          </div>
          <div>
            <label style={labelStyle}>Employment Contract</label>
            <FileUpload accept="application/pdf,image/jpeg,image/png" multiple={false} value={fields.contractFile} onChange={v => set('contractFile', v)} label="Upload Contract" />
          </div>
        </div>
      </div>

      {/* ── Section 4: Credentials ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader title="Login Credentials" />
        {!isEdit ? (
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" style={inputStyle} value={fields.email} onChange={e => set('email', e.target.value)} placeholder="agent@example.com" required />
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <input type="password" style={inputStyle} value={fields.password} onChange={e => set('password', e.target.value)} placeholder="Create password" required />
              <PasswordStrength password={fields.password} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Email: <strong style={{ color: 'var(--color-text-primary)' }}>{fields.email}</strong></span>
            <button type="button" onClick={() => setPwModalOpen(true)} style={btnSecondary}>🔑 Reset Password</button>
            <button type="button" onClick={() => setEmailModalOpen(true)} style={btnSecondary}>✉️ Change Email</button>
          </div>
        )}
      </div>

      {/* ── Section 5: Permissions ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            Feature Permissions <span style={{ color: 'var(--color-accent-gold)' }}>({enabledCount}/{ALL_PERMISSION_KEYS.length} enabled)</span>
          </h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="button" onClick={selectAllPermissions} style={{ ...btnSecondary, fontSize: 'var(--text-xs)', padding: '4px 10px' }}>Select All</button>
            <button type="button" onClick={deselectAllPermissions} style={{ ...btnSecondary, fontSize: 'var(--text-xs)', padding: '4px 10px' }}>Deselect All</button>
          </div>
        </div>
        {isEdit && <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Permissions are saved immediately when toggled.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {AGENT_PERMISSION_CATEGORIES.map(cat => {
            const catEnabled = cat.permissions.filter(p => permissions[p.key]).length;
            const allOn = catEnabled === cat.permissions.length;
            return (
              <div key={cat.id} className="glass" style={{ borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{cat.icon} {cat.label} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({catEnabled}/{cat.permissions.length})</span></span>
                  <button type="button" onClick={() => allOn ? deselectAllCategory(cat) : selectAllCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>
                    {allOn ? 'None' : 'All'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cat.permissions.map(p => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
                      <input
                        type="checkbox"
                        checked={!!permissions[p.key]}
                        onChange={e => togglePermission(p.key, e.target.checked)}
                        style={{ width: 14, height: 14, accentColor: 'var(--color-accent-gold)', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ color: permissions[p.key] ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 6: Account Status (edit only) ── */}
      {isEdit && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <SectionHeader title="Account Status" />
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Approval Status</label>
              <SearchableSingleSelect options={APPROVAL_OPTIONS} value={fields.approvalStatus} onChange={v => set('approvalStatus', v)} placeholder="Select status" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                <input type="checkbox" checked={fields.isActive} onChange={e => set('isActive', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-accent-gold)' }} />
                Active Account
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Agent')}</button>
      </div>

      {/* ── Reset Password Modal ── */}
      {pwModalOpen && (
        <Modal title="Reset Password" onClose={() => { setPwModalOpen(false); setNewPassword(''); }}>
          <label style={labelStyle}>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="Enter new password" />
          <PasswordStrength password={newPassword} />
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setPwModalOpen(false); setNewPassword(''); }} style={btnSecondary}>Cancel</button>
            <button type="button" onClick={doResetPw} style={btnPrimary}>Reset Password</button>
          </div>
        </Modal>
      )}

      {/* ── Change Email Modal ── */}
      {emailModalOpen && (
        <Modal title="Change Email" onClose={() => { setEmailModalOpen(false); setNewEmail(''); }}>
          <label style={labelStyle}>New Email</label>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} placeholder="Enter new email" />
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setEmailModalOpen(false); setNewEmail(''); }} style={btnSecondary}>Cancel</button>
            <button type="button" onClick={doChangeEmail} style={btnPrimary}>Change Email</button>
          </div>
        </Modal>
      )}
    </form>
  );
}
