import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import FileUpload from '../../ui/FileUpload';
import { AGENT_PERMISSION_CATEGORIES, ALL_PERMISSION_KEYS } from '../../../constants/agentPermissions';

/* ─────────────── DATA CONSTANTS ─────────────── */

const ROLE_OPTIONS = [
  { group: 'Core Roles', options: ['Admin', 'Manager', 'Senior Agent', 'Agent', 'Junior Agent', 'Trainee / Intern'] },
  { group: 'Employment Types', options: ['Employee', 'Partner', 'Associate', 'Contractor', 'Freelancer'] },
  { group: 'Property Roles', options: ['Property Manager', 'Letting Agent', 'Sales Agent', 'Rental Agent'] },
  { group: 'Office Roles', options: ['Office Manager', 'Receptionist', 'Marketing Manager', 'IT Support'] },
  { group: 'Professional', options: ['Legal Advisor', 'Compliance Officer', 'Accountant', 'Financial Advisor'] },
  { group: 'Ownership', options: ['Owner / Director', 'Co-Owner', 'Investor', 'Silent Partner'] },
  { group: 'Support', options: ['Customer Service', 'Virtual Assistant', 'Consultant'] },
  { group: 'Management', options: ['Branch Manager', 'Regional Manager', 'Area Manager'] },
  { group: 'Technical', options: ['Maintenance Coordinator', 'Property Inspector', 'Valuer / Appraiser'] },
];

// Flat list for searchable dropdown
const ALL_ROLES = ROLE_OPTIONS.flatMap(g => g.options);

const SPECIALIZATIONS = [
  'Property Sales', 'Property Rentals', 'Commercial Sales', 'Commercial Leasing',
  'Luxury Properties', 'Budget Properties', 'Student Housing', 'Holiday Lets',
  'New Developments', 'Off-Plan Sales', 'Renovation Projects', 'Land Sales',
  'Property Management', 'Facility Management', 'HOA / Condominium Management',
  'Car Rental', 'Boat Rental', 'Motorcycle Rental', 'Yacht Charter',
  'Boat Tours', 'Guided Tours', 'Excursions', 'Airport Transfers',
  'Relocation Services', 'Immigration Assistance', 'Visa Services',
  'Interior Design', 'Home Staging', 'Renovation Consulting',
  'Legal Services', 'Notary Services', 'Contract Preparation',
  'Mortgage Brokering', 'Financial Planning', 'Insurance',
  'Market Analysis', 'Property Valuation', 'Investment Advisory',
  'Photography', 'Videography', 'Drone Services', 'Virtual Tours', '3D Mapping',
  'Social Media Marketing', 'Digital Marketing', 'Print Advertising',
  'Cleaning Services', 'Maintenance Services', 'Security Services',
  'Key Holding', 'Property Inspections', 'Inventory Management',
  'Short-term Rentals (Airbnb)', 'Long-term Rentals', 'Corporate Housing',
  'Event Planning', 'Venue Rental', 'Co-working Spaces',
  'Residential Sales', 'Commercial', 'Industrial', 'Investment',
];

const LANGUAGES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Azerbaijani',
  'Basque', 'Bengali', 'Bosnian', 'Bulgarian', 'Burmese',
  'Cantonese', 'Catalan', 'Croatian', 'Czech',
  'Danish', 'Dutch',
  'English', 'Estonian',
  'Fijian', 'Filipino / Tagalog', 'Finnish', 'French',
  'Galician', 'Georgian', 'German', 'Greek', 'Gujarati',
  'Hausa', 'Hawaiian', 'Hebrew', 'Hindi', 'Hungarian',
  'Icelandic', 'Igbo', 'Indonesian', 'Irish',
  'Italian',
  'Japanese',
  'Kazakh', 'Khmer', 'Korean', 'Kurdish',
  'Lao', 'Latvian', 'Lithuanian', 'Luxembourgish',
  'Macedonian', 'Malagasy', 'Malay', 'Maltese', 'Mandarin Chinese', 'Maori',
  'Montenegrin',
  'Nepali', 'Norwegian',
  'Pashto', 'Persian / Farsi', 'Polish', 'Portuguese', 'Punjabi',
  'Romanian', 'Romansh', 'Russian',
  'Samoan', 'Scottish Gaelic', 'Serbian', 'Sinhala', 'Slovak', 'Slovenian',
  'Somali', 'Spanish', 'Swahili', 'Swedish',
  'Tamil', 'Telugu', 'Thai', 'Tongan', 'Turkish', 'Turkmen',
  'Ukrainian', 'Urdu', 'Uzbek',
  'Vietnamese',
  'Welsh', 'Wolof',
  'Xhosa',
  'Yoruba',
  'Zulu',
];

/* ─────────────── STYLES ─────────────── */

const inputStyle = {
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
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
  letterSpacing: 'var(--tracking-wider)',
};

const secTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-4)',
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px solid var(--color-border-light)',
};

const grid2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 'var(--space-4)',
};

/* ─────────────── HELPERS ─────────────── */

const buildDefaultPermissions = () => {
  const perms = {};
  ALL_PERMISSION_KEYS.forEach(k => { perms[k] = false; });
  return perms;
};

/* ─────────────── SUB-COMPONENTS ─────────────── */

/** Searchable multi-select dropdown (starts closed) */
const SearchableMultiSelect = ({ options, value, onChange, placeholder = 'Search…' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const toggle = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 100 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          alignItems: 'center',
          minHeight: '36px',
        }}
      >
        {value.length === 0 && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {placeholder}
          </span>
        )}
        {value.map(v => (
          <span
            key={v}
            style={{
              background: 'rgba(196,162,101,0.2)',
              border: '1px solid var(--color-accent-gold)',
              color: 'var(--color-accent-gold)',
              borderRadius: '999px',
              padding: '1px 8px',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {v}
            <span
              onClick={(e) => { e.stopPropagation(); toggle(v); }}
              style={{ cursor: 'pointer', fontWeight: 'bold', lineHeight: 1 }}
            >×</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          {open ? '▲' : '▼'}
        </span>
      </div>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-gold-md)',
          maxHeight: '240px',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '6px', borderBottom: '1px solid var(--color-border-light)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search…"
              style={{ ...inputStyle, marginBottom: 0 }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              No results
            </div>
          )}
          {filtered.map(opt => (
            <label
              key={opt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px 12px',
                cursor: 'pointer',
                background: value.includes(opt) ? 'rgba(196,162,101,0.1)' : 'transparent',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-primary)',
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ accentColor: 'var(--color-accent-gold)' }}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

/** Searchable single-select dropdown for Role (starts closed) */
const SearchableSingleSelect = ({ options, value, onChange, placeholder = 'Select…' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 100 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          {value || placeholder}
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-gold-md)',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '6px', borderBottom: '1px solid var(--color-border-light)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search…"
              style={{ ...inputStyle, marginBottom: 0 }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          {filtered.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
              style={{
                padding: '7px 12px',
                cursor: 'pointer',
                background: value === opt ? 'rgba(196,162,101,0.15)' : 'transparent',
                color: value === opt ? 'var(--color-accent-gold)' : 'var(--color-text-primary)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {opt}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              No results
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PasswordStrength = ({ password }) => {
  const score = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#198754'];
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 'var(--space-1)' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= score ? colors[score - 1] : 'var(--color-border)' }} />
        ))}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: colors[score - 1] || 'var(--color-text-muted)' }}>
        {password ? labels[score - 1] || 'Very Weak' : ''}
      </div>
    </div>
  );
};

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─────────────── HELPERS ─────────────── */

/**
 * Extracts a user-friendly error message from an axios error.
 * Handles three shapes:
 *   - express-validator 422: { errors: [{ msg, ... }] }
 *   - Sequelize/custom string: { error: '...' } or { message: '...' }
 *   - Network / no response: err.message
 */
const extractErrorMessage = (err, fallback = 'An error occurred') => {
  const data = err.response?.data;
  if (data?.errors && Array.isArray(data.errors)) {
    return data.errors.map(e => e.msg || e.message || String(e)).filter(Boolean).join(', ');
  }
  return data?.error || data?.message || err.message || fallback;
};

/* ─────────────── MAIN COMPONENT ─────────────── */

const AgentForm = ({ initial, onSave, onCancel }) => {
  const { showError, showSuccess } = useToast();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', nationality: '', address: '',
    emergencyContact: '', emergencyPhone: '',
    role: 'agent', jobTitle: '', branchId: '',
    licenseNumber: '', eireLicenseExpiry: '',
    commissionRate: '', specializations: [], languages: [],
    bio: '', profileImage: '',
    startDate: '',
    passportImage: '', idCardImage: '', contractFile: '',
    password: '',
    isActive: true,
    approvalStatus: 'approved',
  });

  const [permissions, setPermissions] = useState(buildDefaultPermissions());
  const [permSaving, setPermSaving] = useState({}); // key → true while PATCH in-flight
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changeEmailModal, setChangeEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    api.get('/branches').then(r => setBranches(r.data?.branches || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (initial) {
      setForm({
        firstName: initial.firstName || '',
        lastName: initial.lastName || '',
        email: initial.email || '',
        phone: initial.phone || '',
        dateOfBirth: initial.dateOfBirth ? initial.dateOfBirth.split('T')[0] : '',
        nationality: initial.nationality || '',
        address: initial.address || '',
        emergencyContact: initial.emergencyContact || '',
        emergencyPhone: initial.emergencyPhone || '',
        role: initial.role || 'agent',
        jobTitle: initial.jobTitle || '',
        branchId: initial.branchId || '',
        licenseNumber: initial.licenseNumber || '',
        eireLicenseExpiry: initial.eireLicenseExpiry ? initial.eireLicenseExpiry.split('T')[0] : '',
        commissionRate: initial.commissionRate != null ? String(initial.commissionRate) : '',
        specializations: initial.specializations || [],
        languages: initial.languages || [],
        bio: initial.bio || '',
        profileImage: initial.profileImage || '',
        startDate: initial.startDate ? initial.startDate.split('T')[0] : '',
        passportImage: initial.passportImage || '',
        idCardImage: initial.idCardImage || '',
        contractFile: initial.contractFile || '',
        password: '',
        isActive: initial.isActive !== false,
        approvalStatus: initial.approvalStatus || 'approved',
      });

      // Load permissions
      const permMap = buildDefaultPermissions();
      if (initial.UserPermissions && initial.UserPermissions.length > 0) {
        initial.UserPermissions.forEach(p => {
          if (p.feature in permMap) permMap[p.feature] = p.isEnabled;
        });
        setPermissions(permMap);
      } else if (initial.id) {
        // Fallback: fetch from dedicated permissions endpoint when UserPermissions is absent
        api.get(`/agents/${initial.id}/permissions`)
          .then(res => {
            const fetched = { ...permMap };
            res.data.forEach(p => {
              if (p.feature in fetched) fetched[p.feature] = p.isEnabled;
            });
            setPermissions(fetched);
          })
          .catch(() => setPermissions({ ...permMap }));
      } else {
        setPermissions(permMap);
      }
    } else {
      // Reset form for create mode
      setForm({
        firstName: '', lastName: '', email: '', phone: '',
        dateOfBirth: '', nationality: '', address: '',
        emergencyContact: '', emergencyPhone: '',
        role: 'agent', jobTitle: '', branchId: '',
        licenseNumber: '', eireLicenseExpiry: '',
        commissionRate: '', specializations: [], languages: [],
        bio: '', profileImage: '',
        startDate: '',
        passportImage: '', idCardImage: '', contractFile: '',
        password: '',
        isActive: true,
        approvalStatus: 'approved',
      });
      setPermissions(buildDefaultPermissions());
    }
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const setPermission = async (key, val) => {
    setPermissions(p => ({ ...p, [key]: val }));
    if (isEdit && initial?.id) {
      setPermSaving(s => ({ ...s, [key]: true }));
      try {
        await api.patch(`/agents/${initial.id}/permissions/${key}`, { isEnabled: val });
      } catch (err) {
        showError(extractErrorMessage(err, `Failed to save permission: ${key}`));
        setPermissions(p => ({ ...p, [key]: !val }));
      } finally {
        setPermSaving(s => { const n = { ...s }; delete n[key]; return n; });
      }
    }
  };
  const selectAllCategory = async (cat) => {
    const prev = { ...permissions };
    const update = {};
    cat.permissions.forEach(p => { update[p.key] = true; });
    const next = { ...permissions, ...update };
    setPermissions(next);
    if (isEdit && initial?.id) {
      try {
        await api.put(`/agents/${initial.id}/permissions`, { permissions: next });
      } catch (err) {
        showError(extractErrorMessage(err, 'Failed to save permissions'));
        setPermissions(prev);
      }
    }
  };
  const deselectAllCategory = async (cat) => {
    const prev = { ...permissions };
    const update = {};
    cat.permissions.forEach(p => { update[p.key] = false; });
    const next = { ...permissions, ...update };
    setPermissions(next);
    if (isEdit && initial?.id) {
      try {
        await api.put(`/agents/${initial.id}/permissions`, { permissions: next });
      } catch (err) {
        showError(extractErrorMessage(err, 'Failed to save permissions'));
        setPermissions(prev);
      }
    }
  };
  const selectAllPermissions = async () => {
    const prev = { ...permissions };
    const all = {};
    ALL_PERMISSION_KEYS.forEach(k => { all[k] = true; });
    setPermissions(all);
    if (isEdit && initial?.id) {
      try {
        await api.put(`/agents/${initial.id}/permissions`, { permissions: all });
      } catch (err) {
        showError(extractErrorMessage(err, 'Failed to save permissions'));
        setPermissions(prev);
      }
    }
  };
  const deselectAllPermissions = async () => {
    const prev = { ...permissions };
    const none = buildDefaultPermissions();
    setPermissions(none);
    if (isEdit && initial?.id) {
      try {
        await api.put(`/agents/${initial.id}/permissions`, { permissions: none });
      } catch (err) {
        showError(extractErrorMessage(err, 'Failed to save permissions'));
        setPermissions(prev);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) return showError('First name is required');
    if (!form.lastName.trim()) return showError('Last name is required');
    if (!form.email.trim()) return showError('Email is required');
    if (!isEdit && form.password.length < 8) return showError('Password must be at least 8 characters');

    setSaving(true);
    try {
      const payload = {
        ...form,
        commissionRate: form.commissionRate !== '' ? (isNaN(parseFloat(form.commissionRate)) ? null : parseFloat(form.commissionRate)) : null,
      };

      let res;
      if (isEdit) {
        // DON'T send permissions — they're already saved via PATCH/PUT in real-time
        delete payload.password;
        delete payload.permissions;
        res = await api.put(`/agents/${initial.id}`, payload);
      } else {
        // For CREATE — send permissions with the payload
        payload.permissions = permissions;
        res = await api.post('/agents', payload);
      }
      showSuccess(isEdit ? 'Agent updated successfully' : 'Agent created successfully');
      onSave(res.data);
    } catch (err) {
      showError(extractErrorMessage(err, 'Failed to save agent'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) return showError('Password must be at least 8 characters');
    try {
      await api.patch(`/agents/${initial.id}/reset-password`, { newPassword });
      showSuccess('Password reset successfully');
      setResetPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      showError(extractErrorMessage(err, 'Failed to reset password'));
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.includes('@')) return showError('Valid email required');
    try {
      await api.patch(`/agents/${initial.id}/email`, { newEmail });
      showSuccess('Email updated successfully');
      setChangeEmailModal(false);
      setNewEmail('');
      set('email', newEmail);
    } catch (err) {
      showError(extractErrorMessage(err, 'Failed to change email'));
    }
  };

  const field = (label, content) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {content}
    </div>
  );

  // Approval status badge colors
  const approvalColors = { approved: '#20c997', pending: '#ffc107', rejected: '#dc3545' };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'var(--space-4) var(--space-6)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', margin: 0 }}>
          {isEdit ? 'Edit Agent' : 'Add New Agent'}
        </h2>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xl)', color: 'var(--color-text-muted)' }}>✕</button>
      </div>

      <div style={{ padding: 'var(--space-6)' }}>

      {/* ── Section 1: Personal Information ── */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <h3 style={secTitle}>👤 Personal Information</h3>

        {/* Profile Photo - drag and drop */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {field('Profile Photo', (
            <FileUpload
              accept="image/jpeg,image/png,image/webp"
              multiple={false}
              value={form.profileImage ? [form.profileImage] : []}
              onChange={(urls) => set('profileImage', urls[0] || '')}
              label="Drag & drop profile photo or click to browse (JPG, PNG, WebP)"
            />
          ))}
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {field('First Name *', <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} />)}
          {field('Last Name *', <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} />)}
          {field('Phone', <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />)}
          {field('Date of Birth', <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} style={inputStyle} />)}
          {field('Nationality', <input value={form.nationality} onChange={e => set('nationality', e.target.value)} style={inputStyle} />)}
          {field('Start Date', <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle} />)}
        </div>
        {field('Address', <textarea value={form.address} onChange={e => set('address', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          {field('Emergency Contact Name', <input value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} style={inputStyle} />)}
          {field('Emergency Contact Phone', <input type="tel" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} style={inputStyle} />)}
        </div>
      </div>

      {/* ── Section 2: Professional Details ── */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <h3 style={secTitle}>💼 Professional Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {field('System Role', (
            <select value={form.role} onChange={e => set('role', e.target.value)} style={inputStyle}>
              <option value="agent">Agent</option>
              <option value="manager">Manager</option>
              {isEdit && <option value="admin">Admin</option>}
            </select>
          ))}
          {field('Job Title', (
            <SearchableSingleSelect
              options={ALL_ROLES}
              value={form.jobTitle}
              onChange={(v) => set('jobTitle', v)}
              placeholder="Select or search job title…"
            />
          ))}
          {field('Branch', (
            <select value={form.branchId} onChange={e => set('branchId', e.target.value)} style={inputStyle}>
              <option value="">— Select Branch —</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          ))}
          {field('EIRA License Number', <input value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} style={inputStyle} />)}
          {field('License Expiry Date', <input type="date" value={form.eireLicenseExpiry} onChange={e => set('eireLicenseExpiry', e.target.value)} style={inputStyle} />)}
          {field('Commission Rate (%)', <input type="number" min="0" max="100" step="0.01" value={form.commissionRate} onChange={e => set('commissionRate', e.target.value)} style={inputStyle} placeholder="0.00" />)}
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          {field('Specializations', (
            <SearchableMultiSelect
              options={SPECIALIZATIONS}
              value={form.specializations}
              onChange={(v) => set('specializations', v)}
              placeholder="Select specializations…"
            />
          ))}
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          {field('Languages', (
            <SearchableMultiSelect
              options={LANGUAGES}
              value={form.languages}
              onChange={(v) => set('languages', v)}
              placeholder="Select languages…"
            />
          ))}
        </div>

        {field('Bio', <textarea value={form.bio} onChange={e => set('bio', e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Agent biography…" />)}
      </div>

      {/* ── Section 3: Documents ── */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <h3 style={secTitle}>📄 Documents</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-5)' }}>
          {field('Passport / National ID Image', (
            <FileUpload
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple={false}
              value={form.passportImage ? [form.passportImage] : []}
              onChange={(urls) => set('passportImage', urls[0] || '')}
              label="Drag & drop passport or click to browse (JPG, PNG, PDF)"
            />
          ))}
          {field('ID Card Image', (
            <FileUpload
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple={false}
              value={form.idCardImage ? [form.idCardImage] : []}
              onChange={(urls) => set('idCardImage', urls[0] || '')}
              label="Drag & drop ID card or click to browse (JPG, PNG, PDF)"
            />
          ))}
          {field('Employment Contract', (
            <FileUpload
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              multiple={false}
              value={form.contractFile ? [form.contractFile] : []}
              onChange={(urls) => set('contractFile', urls[0] || '')}
              label="Drag & drop contract or click to browse (PDF, DOC, DOCX)"
            />
          ))}
          {/* Other Documents */}
          <div style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            background: 'var(--color-surface-glass)',
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}>
            <span style={{ fontSize: '32px' }}>📎</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>Other Documents</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Drag & drop or click to upload additional documents</span>
          </div>
        </div>
      </div>

      {/* ── Section 4: Login Credentials ── */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <h3 style={secTitle}>🔐 Login Credentials</h3>
        {!isEdit && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {field('Login Email *', <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} />)}
            <div>
              {field('Password *', (
                <div style={{ position: 'relative' }}>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    style={{ ...inputStyle, paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', padding: 0, display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              ))}
              <PasswordStrength password={form.password} />
            </div>
          </div>
        )}
        {isEdit && (
          <div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              Current email: <strong style={{ color: 'var(--color-text-primary)' }}>{form.email}</strong>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setChangeEmailModal(true)} style={actionBtn('var(--color-primary)')}>✉️ Change Email</button>
              <button type="button" onClick={() => setResetPasswordModal(true)} style={actionBtn('var(--color-accent-gold)')}>🔑 Reset Password</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 5: Feature Permissions ── */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border-light)' }}>
          <h3 style={{ ...secTitle, margin: 0, border: 'none', padding: 0 }}>🔑 Feature Permissions</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="button" onClick={selectAllPermissions} style={smallBtn('var(--color-success)')}>✓ Select All</button>
            <button type="button" onClick={deselectAllPermissions} style={smallBtn('var(--color-error)')}>✕ Deselect All</button>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          Default: all OFF. Check the features this agent should have access to.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {AGENT_PERMISSION_CATEGORIES.map(cat => {
            const allEnabled = cat.permissions.every(p => permissions[p.key]);
            const noneEnabled = cat.permissions.every(p => !permissions[p.key]);
            return (
              <div key={cat.id} style={{ background: 'var(--color-surface-glass)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    {cat.icon} {cat.label}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {!allEnabled && <button type="button" onClick={() => selectAllCategory(cat)} style={tinyBtn('var(--color-success)')}>All</button>}
                    {!noneEnabled && <button type="button" onClick={() => deselectAllCategory(cat)} style={tinyBtn('var(--color-error)')}>None</button>}
                  </div>
                </div>
                {cat.permissions.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', cursor: permSaving[p.key] ? 'wait' : 'pointer', opacity: permSaving[p.key] ? 0.6 : 1 }}>
                    <input
                      type="checkbox"
                      checked={permissions[p.key] || false}
                      onChange={e => setPermission(p.key, e.target.checked)}
                      disabled={!!permSaving[p.key]}
                      style={{ accentColor: 'var(--color-accent-gold)', width: '14px', height: '14px' }}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{p.label}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 6: Account Status (edit only) ── */}
      {isEdit && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
          <h3 style={secTitle}>⚙️ Account Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <div
                  onClick={() => set('isActive', !form.isActive)}
                  style={{ width: 36, height: 20, borderRadius: 10, position: 'relative', background: form.isActive ? 'var(--color-success)' : 'var(--color-border)', transition: 'background var(--transition-fast)', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: 3, left: form.isActive ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left var(--transition-fast)' }} />
                </div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              </label>
              <div>
                <label style={labelStyle}>Approval Status</label>
                <select value={form.approvalStatus} onChange={e => set('approvalStatus', e.target.value)} style={inputStyle}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {initial?.createdAt && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Created: {new Date(initial.createdAt).toLocaleDateString()}
                </span>
              )}
              {initial?.lastLoginAt && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Last login: {new Date(initial.lastLoginAt).toLocaleDateString()}
                </span>
              )}
              <span style={{ fontSize: 'var(--text-xs)', color: approvalColors[form.approvalStatus] || 'var(--color-text-muted)', fontWeight: 'var(--font-semibold)', textTransform: 'capitalize' }}>
                ● {form.approvalStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <button type="button" onClick={onCancel} style={{ ...actionBtn('var(--color-border)'), color: 'var(--color-text-secondary)' }}>Cancel</button>
        <button type="submit" disabled={saving} style={{ padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#1a1000', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Agent'}
        </button>
      </div>
      </div>{/* end content padding div */}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div style={modalOverlay}>
          <div className="glass" style={modalBox}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>Reset Password</h3>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  minLength={8}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', padding: 0, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setResetPasswordModal(false); setNewPassword(''); }} style={actionBtn('var(--color-border)')}>Cancel</button>
              <button type="button" onClick={handleResetPassword} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#1a1000', fontWeight: 'var(--font-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {changeEmailModal && (
        <div style={modalOverlay}>
          <div className="glass" style={modalBox}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>Change Login Email</h3>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={labelStyle}>New Email Address</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} placeholder="new@email.com" />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setChangeEmailModal(false); setNewEmail(''); }} style={actionBtn('var(--color-border)')}>Cancel</button>
              <button type="button" onClick={handleChangeEmail} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#1a1000', fontWeight: 'var(--font-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Update Email</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

const actionBtn = (color) => ({
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color: color === 'var(--color-border)' ? 'var(--color-text-secondary)' : color,
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
});

const smallBtn = (color) => ({
  padding: '4px 12px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
});

const tinyBtn = (color) => ({
  padding: '2px 8px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: '10px',
  cursor: 'pointer',
});

const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
};

const modalBox = {
  padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)',
  minWidth: '320px', maxWidth: '480px', width: '90%',
};

export default AgentForm;
