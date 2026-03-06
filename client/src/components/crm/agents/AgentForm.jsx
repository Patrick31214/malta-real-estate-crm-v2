import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { AGENT_PERMISSION_CATEGORIES, ALL_PERMISSION_KEYS } from '../../../constants/agentPermissions';

const SPECIALIZATIONS = [
  'Residential Sales', 'Commercial', 'Luxury', 'Rentals',
  'New Developments', 'Investment', 'Land', 'Industrial', 'Holiday Lets',
];

const LANGUAGES = [
  'English', 'Maltese', 'Italian', 'French', 'German',
  'Russian', 'Arabic', 'Spanish', 'Chinese', 'Portuguese',
];

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

const buildDefaultPermissions = () => {
  const perms = {};
  ALL_PERMISSION_KEYS.forEach(k => { perms[k] = false; });
  return perms;
};

const ToggleChip = ({ label, selected, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!selected)}
    style={{
      padding: '4px 12px',
      borderRadius: '999px',
      border: `1px solid ${selected ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
      background: selected ? 'rgba(255,193,7,0.15)' : 'transparent',
      color: selected ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
      fontSize: 'var(--text-xs)',
      cursor: 'pointer',
      transition: 'all var(--transition-fast)',
    }}
  >
    {selected ? '✓ ' : ''}{label}
  </button>
);

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

const AgentForm = ({ initial, onSave, onCancel }) => {
  const { showError, showSuccess } = useToast();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', nationality: '', address: '',
    emergencyContact: '', emergencyPhone: '',
    role: 'agent', branchId: '', licenseNumber: '',
    eireLicenseExpiry: '', commissionRate: '',
    specializations: [], languages: [],
    bio: '', profileImage: '',
    startDate: '',
    passportImage: '', idCardImage: '', contractFile: '',
    password: '',
    isActive: true,
  });

  const [permissions, setPermissions] = useState(buildDefaultPermissions());
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(!isEdit);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
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
      });

      // Load permissions
      const permMap = buildDefaultPermissions();
      (initial.UserPermissions || []).forEach(p => {
        if (p.feature in permMap) permMap[p.feature] = p.isEnabled;
      });
      setPermissions(permMap);
    }
  }, [initial]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleSpecialization = (s) => set('specializations', form.specializations.includes(s) ? form.specializations.filter(x => x !== s) : [...form.specializations, s]);
  const toggleLanguage = (l) => set('languages', form.languages.includes(l) ? form.languages.filter(x => x !== l) : [...form.languages, l]);

  const setPermission = (key, val) => setPermissions(p => ({ ...p, [key]: val }));
  const selectAllCategory = (cat) => {
    const update = {};
    cat.permissions.forEach(p => { update[p.key] = true; });
    setPermissions(prev => ({ ...prev, ...update }));
  };
  const deselectAllCategory = (cat) => {
    const update = {};
    cat.permissions.forEach(p => { update[p.key] = false; });
    setPermissions(prev => ({ ...prev, ...update }));
  };
  const selectAllPermissions = () => {
    const all = {};
    ALL_PERMISSION_KEYS.forEach(k => { all[k] = true; });
    setPermissions(all);
  };
  const deselectAllPermissions = () => setPermissions(buildDefaultPermissions());

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
        permissions,
      };
      if (isEdit) delete payload.password;

      let res;
      if (isEdit) {
        res = await api.put(`/agents/${initial.id}`, payload);
      } else {
        res = await api.post('/agents', payload);
      }
      showSuccess(isEdit ? 'Agent updated successfully' : 'Agent created successfully');
      onSave(res.data);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) return showError('Password must be at least 8 characters');
    try {
      await api.patch(`/agents/${initial.id}/password`, { newPassword });
      showSuccess('Password reset successfully');
      setResetPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to reset password');
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
      showError(err.response?.data?.error || 'Failed to change email');
    }
  };

  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' };
  const field = (label, content) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {content}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-4)', maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', margin: 0 }}>
          {isEdit ? 'Edit Agent' : 'Create Agent'}
        </h2>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xl)', color: 'var(--color-text-muted)' }}>✕</button>
      </div>

      {/* Section 1 — Personal */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <h3 style={secTitle}>👤 Personal Information</h3>
        {form.profileImage && (
          <div style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
            <img src={form.profileImage} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          {field('Profile Image URL', <input type="url" value={form.profileImage} onChange={e => set('profileImage', e.target.value)} style={inputStyle} placeholder="https://..." />)}
        </div>
        <div style={{ ...grid2, marginBottom: 'var(--space-4)' }}>
          {field('First Name *', <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} />)}
          {field('Last Name *', <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} />)}
          {field('Phone', <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />)}
          {field('Date of Birth', <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} style={inputStyle} />)}
          {field('Nationality', <input value={form.nationality} onChange={e => set('nationality', e.target.value)} style={inputStyle} />)}
          {field('Start Date', <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle} />)}
        </div>
        {field('Address', <textarea value={form.address} onChange={e => set('address', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />)}
        <div style={{ ...grid2, marginTop: 'var(--space-4)' }}>
          {field('Emergency Contact Name', <input value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} style={inputStyle} />)}
          {field('Emergency Contact Phone', <input type="tel" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} style={inputStyle} />)}
        </div>
      </div>

      {/* Section 2 — Professional */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <h3 style={secTitle}>💼 Professional Details</h3>
        <div style={{ ...grid2, marginBottom: 'var(--space-4)' }}>
          {field('Role', (
            <select value={form.role} onChange={e => set('role', e.target.value)} style={inputStyle}>
              <option value="agent">Agent</option>
              <option value="manager">Manager</option>
            </select>
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
          <label style={labelStyle}>Specializations</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {SPECIALIZATIONS.map(s => (
              <ToggleChip key={s} label={s} selected={form.specializations.includes(s)} onChange={() => toggleSpecialization(s)} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Languages</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {LANGUAGES.map(l => (
              <ToggleChip key={l} label={l} selected={form.languages.includes(l)} onChange={() => toggleLanguage(l)} />
            ))}
          </div>
        </div>

        {field('Bio', <textarea value={form.bio} onChange={e => set('bio', e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Agent biography..." />)}
      </div>

      {/* Section 3 — Documents */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <h3 style={secTitle}>📄 Documents</h3>
        <div style={grid2}>
          {field('Passport Image URL', <input type="url" value={form.passportImage} onChange={e => set('passportImage', e.target.value)} style={inputStyle} placeholder="https://..." />)}
          {field('ID Card Image URL', <input type="url" value={form.idCardImage} onChange={e => set('idCardImage', e.target.value)} style={inputStyle} placeholder="https://..." />)}
          {field('Employment Contract URL', <input type="url" value={form.contractFile} onChange={e => set('contractFile', e.target.value)} style={inputStyle} placeholder="https://..." />)}
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Upload files first via the Files section, then paste the URL here.
        </p>
      </div>

      {/* Section 4 — Credentials */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
        <h3 style={secTitle}>🔐 Login Credentials</h3>
        {!isEdit && (
          <div style={grid2}>
            {field('Login Email *', <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} />)}
            <div>
              {field('Password *', <input required type="password" minLength={8} value={form.password} onChange={e => set('password', e.target.value)} style={inputStyle} />)}
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

      {/* Section 5 — Permissions */}
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
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={permissions[p.key] || false}
                      onChange={e => setPermission(p.key, e.target.checked)}
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

      {/* Section 6 — Account Status (edit only) */}
      {isEdit && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
          <h3 style={secTitle}>⚙️ Account Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
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

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div style={modalOverlay}>
          <div className="glass" style={modalBox}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>Reset Password</h3>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={labelStyle}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} minLength={8} placeholder="Min. 8 characters" />
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
