import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';
import { AGENT_PERMISSION_CATEGORIES } from '../../constants/agentPermissions';

// ── Tab definitions ────────────────────────────────────────────────────────────

const ALL_TABS = [
  { key: 'profile',       label: 'Profile',       icon: '👤', roles: ['admin', 'manager', 'agent', 'client'] },
  { key: 'company',       label: 'Company',        icon: '🏢', roles: ['admin'] },
  { key: 'users',         label: 'Users',          icon: '👥', roles: ['admin', 'manager'] },
  { key: 'permissions',   label: 'Permissions',    icon: '🔐', roles: ['admin'] },
  { key: 'notifications', label: 'Notifications',  icon: '🔔', roles: ['admin', 'manager', 'agent', 'client'] },
  { key: 'appearance',    label: 'Appearance',     icon: '🎨', roles: ['admin', 'manager', 'agent', 'client'] },
  { key: 'privacy',       label: 'Data & Privacy', icon: '🛡️', roles: ['admin', 'manager', 'agent', 'client'] },
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'AED', 'SAR'];
const TIMEZONES  = ['Europe/Malta', 'Europe/London', 'Europe/Paris', 'UTC', 'America/New_York'];
const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};
const ROLE_COLORS = {
  admin: '#A85C5C', manager: '#8B6914', agent: '#B8912A', client: 'var(--color-text-muted)',
};

function relativeTime(dateStr) {
  if (!dateStr) return 'Never';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-MT', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function SectionCard({ title, children, style }) {
  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: 'var(--space-5)', ...style }}>
      {title && (
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function FormRow({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>{hint}</p>}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  background: 'var(--color-surface-glass)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimary = {
  padding: 'var(--space-2) var(--space-5)',
  background: 'var(--color-accent-gold)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  color: '#0a0a0a',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  letterSpacing: 'var(--tracking-wide)',
};

const btnSecondary = {
  padding: 'var(--space-2) var(--space-4)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
};

function Toggle({ checked, onChange, label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>{label}</div>
        {description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.1)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
        aria-checked={checked}
        role="switch"
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: checked ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
          transition: 'left 0.2s', display: 'block',
        }} />
      </button>
    </div>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────────

function ProfileTab({ user, onUserUpdated }) {
  const { showSuccess, showError } = useToast();
  const [saving, setSaving]     = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [profile, setProfile]   = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
  });
  const [pw, setPw]   = useState({ current: '', newPw: '', confirm: '' });
  const [twoFA, setTwoFA] = useState(false);

  const handleProfileChange = (e) => setProfile(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', {
        firstName: profile.firstName,
        lastName:  profile.lastName,
        phone:     profile.phone,
      });
      onUserUpdated(data.user);
      showSuccess('Profile updated successfully');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPw !== pw.confirm) { showError('New passwords do not match'); return; }
    if (pw.newPw.length < 8)     { showError('Password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pw.current, newPassword: pw.newPw });
      showSuccess('Password changed successfully');
      setPw({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <SectionCard title="Personal Information">
        <form onSubmit={saveProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormRow label="First Name">
              <input name="firstName" value={profile.firstName} onChange={handleProfileChange} style={inputStyle} required />
            </FormRow>
            <FormRow label="Last Name">
              <input name="lastName" value={profile.lastName} onChange={handleProfileChange} style={inputStyle} required />
            </FormRow>
          </div>
          <FormRow label="Email Address" hint="Contact admin to change your email address">
            <input value={profile.email} style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} readOnly />
          </FormRow>
          <FormRow label="Phone Number">
            <input name="phone" value={profile.phone} onChange={handleProfileChange} style={inputStyle} placeholder="+356 XXXX XXXX" />
          </FormRow>
          <FormRow label="Role">
            <div style={{ ...inputStyle, display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'default', width: 'auto' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ROLE_COLORS[user?.role], display: 'inline-block' }} />
              <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
          </FormRow>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Change Password">
        <form onSubmit={changePassword}>
          <FormRow label="Current Password">
            <input type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} style={inputStyle} required />
          </FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormRow label="New Password">
              <input type="password" value={pw.newPw} onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))} style={inputStyle} required minLength={8} />
            </FormRow>
            <FormRow label="Confirm New Password">
              <input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} required />
            </FormRow>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <button type="submit" style={btnPrimary} disabled={pwSaving}>{pwSaving ? 'Changing…' : 'Change Password'}</button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Security">
        <Toggle
          checked={twoFA}
          onChange={setTwoFA}
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account (coming soon)"
        />
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Last Login</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{relativeTime(user?.lastLoginAt)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 160, padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Member Since</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-MT', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Company Settings Tab ───────────────────────────────────────────────────────

function CompanyTab() {
  const { showSuccess, showError } = useToast();
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.get('/settings/system')
      .then(r => setConfig(r.data))
      .catch(() => showError('Failed to load company settings'))
      .finally(() => setLoading(false));
  }, [showError]);

  const set       = (key, val)    => setConfig(c => ({ ...c, [key]: val }));
  const setSocial = (k, v)        => setConfig(c => ({ ...c, socialMedia:   { ...c.socialMedia,   [k]: v } }));
  const setBizH   = (day, f, v)   => setConfig(c => ({ ...c, businessHours: { ...c.businessHours, [day]: { ...c.businessHours[day], [f]: v } } }));
  const setFeature= (k, v)        => setConfig(c => ({ ...c, features:      { ...c.features,      [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/settings/system', config);
      setConfig(data);
      showSuccess('Company settings saved');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-8)', textAlign: 'center' }}>Loading…</div>;
  if (!config)  return null;

  return (
    <form onSubmit={save}>
      <SectionCard title="Company Information">
        <FormRow label="Company Name">
          <input value={config.companyName} onChange={e => set('companyName', e.target.value)} style={inputStyle} />
        </FormRow>
        <FormRow label="Address">
          <input value={config.companyAddress} onChange={e => set('companyAddress', e.target.value)} style={inputStyle} placeholder="123 Republic Street, Valletta" />
        </FormRow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormRow label="Phone">
            <input value={config.companyPhone} onChange={e => set('companyPhone', e.target.value)} style={inputStyle} placeholder="+356 2XXX XXXX" />
          </FormRow>
          <FormRow label="Email">
            <input type="email" value={config.companyEmail} onChange={e => set('companyEmail', e.target.value)} style={inputStyle} />
          </FormRow>
        </div>
        <FormRow label="Website">
          <input value={config.companyWebsite} onChange={e => set('companyWebsite', e.target.value)} style={inputStyle} placeholder="https://www.example.com" />
        </FormRow>
        <FormRow label="VAT / Tax Number">
          <input value={config.vatNumber} onChange={e => set('vatNumber', e.target.value)} style={inputStyle} placeholder="MT12345678" />
        </FormRow>
      </SectionCard>

      <SectionCard title="Regional Settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormRow label="Default Currency">
            <select value={config.defaultCurrency} onChange={e => set('defaultCurrency', e.target.value)} style={inputStyle}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormRow>
          <FormRow label="Timezone">
            <select value={config.timezone} onChange={e => set('timezone', e.target.value)} style={inputStyle}>
              {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormRow>
        </div>
      </SectionCard>

      <SectionCard title="Business Hours">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {Object.entries(DAY_LABELS).map(([day, label]) => {
            const h = (config.businessHours || {})[day] || { open: '09:00', close: '18:00', enabled: false };
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setBizH(day, 'enabled', !h.enabled)}
                  style={{ ...btnSecondary, minWidth: 36, padding: '4px 8px', background: h.enabled ? 'rgba(184,145,42,0.15)' : 'transparent', borderColor: h.enabled ? 'var(--color-accent-gold)' : 'var(--color-border)', color: h.enabled ? 'var(--color-accent-gold)' : 'var(--color-text-muted)' }}
                >
                  {h.enabled ? '✓' : '✕'}
                </button>
                <span style={{ width: 90, fontSize: 'var(--text-sm)', color: h.enabled ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{label}</span>
                <input type="time" value={h.open}  onChange={e => setBizH(day, 'open',  e.target.value)} disabled={!h.enabled} style={{ ...inputStyle, width: 110, opacity: h.enabled ? 1 : 0.4 }} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>–</span>
                <input type="time" value={h.close} onChange={e => setBizH(day, 'close', e.target.value)} disabled={!h.enabled} style={{ ...inputStyle, width: 110, opacity: h.enabled ? 1 : 0.4 }} />
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Social Media Links">
        {[['facebook', '📘 Facebook'], ['instagram', '📸 Instagram'], ['linkedin', '💼 LinkedIn'], ['twitter', '🐦 Twitter / X']].map(([k, lbl]) => (
          <FormRow key={k} label={lbl}>
            <input value={(config.socialMedia || {})[k] || ''} onChange={e => setSocial(k, e.target.value)} style={inputStyle} placeholder={`https://www.${k}.com/…`} />
          </FormRow>
        ))}
      </SectionCard>

      <SectionCard title="Feature Toggles">
        {[
          ['enableChat',               'Live Chat',             'Enable the in-app messaging system'],
          ['enableMortgageCalculator', 'Mortgage Calculator',   'Show the mortgage calculator tool'],
          ['enableCompliance',         'Compliance Tracking',   'Enable compliance management module'],
          ['enableDocuments',          'Document Management',   'Enable the documents module'],
          ['enableReports',            'Reports & Analytics',   'Enable the reports and analytics module'],
        ].map(([k, lbl, desc]) => (
          <Toggle key={k} checked={!!(config.features || {})[k]} onChange={v => setFeature(k, v)} label={lbl} description={desc} />
        ))}
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save Company Settings'}</button>
      </div>
    </form>
  );
}

// ── User Management Tab ────────────────────────────────────────────────────────

function UsersTab({ currentUser }) {
  const { showSuccess, showError } = useToast();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading]     = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)     params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get(`/users?${params}`);
      const list = Array.isArray(data) ? data : (data.users || []);
      setUsers(list);
      setTotal(data.total || list.length);
    } catch {
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, showError]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const changeRole = async (userId, newRole) => {
    try {
      await api.patch(`/agents/${userId}`, { role: newRole });
      showSuccess('Role updated');
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const toggleBlock = async (u) => {
    try {
      if (u.isBlocked) {
        await api.patch(`/agents/${u.id}/unblock`);
        showSuccess(`${u.firstName} unblocked`);
      } else {
        await api.patch(`/agents/${u.id}/block`, { reason: 'Blocked via Settings' });
        showSuccess(`${u.firstName} blocked`);
      }
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const setApproval = async (userId, status) => {
    try {
      await api.patch(`/agents/${userId}/${status}`);
      showSuccess('Approval status updated');
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update approval status');
    }
  };

  const byRole = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <div>
      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {[['Total', total, '👥'], ['Admins', byRole.admin || 0, '🔑'], ['Managers', byRole.manager || 0, '🏢'], ['Agents', byRole.agent || 0, '🧑‍💼']].map(([lbl, val, ico]) => (
          <div key={lbl} className="glass" style={{ flex: '1 1 100px', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem' }}>{ico}</div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)' }}>{val}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          style={{ ...inputStyle, flex: '1 1 200px' }}
        />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 140 }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="agent">Agent</option>
          <option value="client">Client</option>
        </select>
      </div>

      {/* User table */}
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>No users found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['User', 'Role', 'Status', 'Last Login', isAdmin ? 'Actions' : null].filter(Boolean).map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(184,145,42,0.15)', border: '1px solid rgba(184,145,42,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', flexShrink: 0 }}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {isAdmin && u.id !== currentUser?.id ? (
                        <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ ...inputStyle, width: 100, padding: '2px 6px' }}>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="agent">Agent</option>
                          <option value="client">Client</option>
                        </select>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}40`, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.isBlocked ? '#A85C5C' : u.isActive ? '#5CA87A' : '#888', display: 'inline-block' }} />
                          <span style={{ color: u.isBlocked ? '#A85C5C' : u.isActive ? '#5CA87A' : 'var(--color-text-muted)' }}>
                            {u.isBlocked ? 'Blocked' : u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </span>
                        {u.approvalStatus && u.approvalStatus !== 'approved' && (
                          <span style={{ fontSize: 'var(--text-xs)', color: u.approvalStatus === 'pending' ? '#8B6914' : '#A85C5C', textTransform: 'capitalize' }}>
                            {u.approvalStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                      {relativeTime(u.lastLoginAt)}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {u.id !== currentUser?.id && (
                          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => toggleBlock(u)}
                              style={{ ...btnSecondary, fontSize: 'var(--text-xs)', padding: '3px 8px', borderColor: u.isBlocked ? 'rgba(92,168,122,0.5)' : 'rgba(168,92,92,0.5)', color: u.isBlocked ? '#5CA87A' : '#A85C5C' }}
                            >
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            {u.approvalStatus === 'pending' && (
                              <>
                                <button type="button" onClick={() => setApproval(u.id, 'approve')} style={{ ...btnSecondary, fontSize: 'var(--text-xs)', padding: '3px 8px', borderColor: 'rgba(92,168,122,0.5)', color: '#5CA87A' }}>Approve</button>
                                <button type="button" onClick={() => setApproval(u.id, 'reject')}  style={{ ...btnSecondary, fontSize: 'var(--text-xs)', padding: '3px 8px', borderColor: 'rgba(168,92,92,0.5)', color: '#A85C5C' }}>Reject</button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btnSecondary}>← Prev</button>
          <span style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Page {page}</span>
          <button type="button" onClick={() => setPage(p => p + 1)} disabled={users.length < 20} style={btnSecondary}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Permissions Tab ────────────────────────────────────────────────────────────

function PermissionsTab() {
  const { showSuccess, showError } = useToast();
  const [users, setUsers]               = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions]   = useState({});
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [userSearch, setUserSearch]     = useState('');

  useEffect(() => {
    api.get('/users?limit=100')
      .then(r => { const list = Array.isArray(r.data) ? r.data : (r.data.users || []); setUsers(list); })
      .catch(() => showError('Failed to load users'));
  }, [showError]);

  const loadUserPerms = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const { data } = await api.get(`/agents/${user.id}/permissions`);
      const map = {};
      data.forEach(p => { map[p.feature] = p.isEnabled; });
      setPermissions(map);
    } catch {
      showError('Failed to load user permissions');
    } finally {
      setLoading(false);
    }
  };

  const togglePerm = (key) => setPermissions(p => ({ ...p, [key]: !p[key] }));

  const applyPreset = (preset) => {
    const next = {};
    AGENT_PERMISSION_CATEGORIES.forEach(cat => {
      cat.permissions.forEach(p => {
        if (preset === 'all')        next[p.key] = true;
        else if (preset === 'none')  next[p.key] = false;
        else if (preset === 'basic') {
          next[p.key] = ['properties_view', 'clients_view', 'dashboard_view', 'agents_view'].includes(p.key);
        } else if (preset === 'management') {
          next[p.key] = !p.key.startsWith('admin_') && !p.key.endsWith('_delete');
        }
      });
    });
    setPermissions(next);
  };

  const savePerms = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = Object.entries(permissions).map(([feature, isEnabled]) => ({ feature, isEnabled }));
      await api.put(`/settings/users/${selectedUser.id}/permissions`, { permissions: payload });
      showSuccess('Permissions saved successfully');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u =>
    !userSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
      {/* User selector */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users…" style={{ ...inputStyle, padding: '6px 10px' }} />
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No users</div>
            ) : filteredUsers.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => loadUserPerms(u)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-3)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left',
                  background: selectedUser?.id === u.id ? 'rgba(184,145,42,0.1)' : 'transparent',
                  borderLeft: selectedUser?.id === u.id ? '3px solid var(--color-accent-gold)' : '3px solid transparent',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(184,145,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', flexShrink: 0 }}>
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.firstName} {u.lastName}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{u.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permission matrix */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selectedUser ? (
          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-10)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🔐</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Select a user to manage their permissions</div>
          </div>
        ) : loading ? (
          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{selectedUser.role}</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {[['all', 'All On'], ['management', 'Management'], ['basic', 'Basic'], ['none', 'All Off']].map(([p, lbl]) => (
                  <button key={p} type="button" onClick={() => applyPreset(p)} style={{ ...btnSecondary, fontSize: 'var(--text-xs)', padding: '4px 10px' }}>{lbl}</button>
                ))}
                <button type="button" onClick={savePerms} style={{ ...btnPrimary, fontSize: 'var(--text-xs)' }} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>

            {AGENT_PERMISSION_CATEGORIES.map(cat => (
              <div key={cat.id} className="glass" style={{ borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'rgba(255,255,255,0.02)' }}>
                  <span>{cat.icon}</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{cat.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {cat.permissions.filter(p => permissions[p.key]).length}/{cat.permissions.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {cat.permissions.map(perm => (
                    <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <input
                        type="checkbox"
                        checked={!!permissions[perm.key]}
                        onChange={() => togglePerm(perm.key)}
                        style={{ accentColor: 'var(--color-accent-gold)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 'var(--text-xs)', color: permissions[perm.key] ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────────

function NotificationsTab() {
  const { showSuccess } = useToast();
  const storageKey = 'gkr-notif-prefs';
  const defaults = {
    emailNewInquiry: true, emailPropertyStatus: true, emailChatMessage: false, emailAnnouncement: true,
    inAppInquiry: true, inAppChat: true, inAppAnnouncement: true, inAppPropertyStatus: true,
    frequency: 'immediate',
  };
  const [prefs, setPrefs] = useState(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; }
    catch { return defaults; }
  });

  const set = (k, v) => setPrefs(p => ({ ...p, [k]: v }));

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(prefs));
    showSuccess('Notification preferences saved');
  };

  return (
    <div>
      <SectionCard title="Email Notifications">
        {[
          ['emailNewInquiry',     'New Inquiry',            'Get notified when a new inquiry is received'],
          ['emailPropertyStatus', 'Property Status Change', 'When a property status is updated'],
          ['emailChatMessage',    'Chat Message',           'Email alert for new chat messages'],
          ['emailAnnouncement',   'Announcements',          'Receive company-wide announcements via email'],
        ].map(([k, lbl, desc]) => (
          <Toggle key={k} checked={prefs[k]} onChange={v => set(k, v)} label={lbl} description={desc} />
        ))}
      </SectionCard>

      <SectionCard title="In-App Notifications">
        {[
          ['inAppInquiry',        'New Inquiry',            'Show badge for new inquiries'],
          ['inAppChat',           'Chat Messages',          'Show badge for unread chat messages'],
          ['inAppAnnouncement',   'Announcements',          'Show announcements in notification bell'],
          ['inAppPropertyStatus', 'Property Status Change', 'Show property update notifications'],
        ].map(([k, lbl, desc]) => (
          <Toggle key={k} checked={prefs[k]} onChange={v => set(k, v)} label={lbl} description={desc} />
        ))}
      </SectionCard>

      <SectionCard title="Notification Frequency">
        <FormRow label="Digest Frequency">
          <select value={prefs.frequency} onChange={e => set('frequency', e.target.value)} style={{ ...inputStyle, maxWidth: 260 }}>
            <option value="immediate">Immediate (as they happen)</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Digest</option>
          </select>
        </FormRow>
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={save} style={btnPrimary}>Save Preferences</button>
      </div>
    </div>
  );
}

// ── Appearance Tab ─────────────────────────────────────────────────────────────

function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();
  const { showSuccess }        = useToast();
  const storageKey = 'gkr-appearance-prefs';
  const defaults   = { fontSize: 'medium', compactMode: false };
  const [prefs, setPrefs] = useState(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; }
    catch { return defaults; }
  });

  const set = (k, v) => setPrefs(p => ({ ...p, [k]: v }));

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(prefs));
    showSuccess('Appearance preferences saved');
  };

  return (
    <div>
      <SectionCard title="Theme">
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {[['dark', '🌙', 'Dark Mode', 'Elegant dark theme (default)'], ['light', '☀️', 'Light Mode', 'Clean light theme']].map(([t, ico, lbl, desc]) => (
            <button
              key={t}
              type="button"
              onClick={t !== theme ? toggleTheme : undefined}
              style={{
                flex: '1 1 160px', padding: 'var(--space-5)', borderRadius: 'var(--radius-md)',
                border: `2px solid ${theme === t ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
                background: theme === t ? 'rgba(184,145,42,0.08)' : 'transparent',
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{ico}</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: theme === t ? 'var(--color-accent-gold)' : 'var(--color-text-primary)' }}>{lbl}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>{desc}</div>
              {theme === t && <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>✓ Active</div>}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Layout Preferences">
        <FormRow label="Font Size">
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']].map(([v, lbl]) => (
              <button
                key={v}
                type="button"
                onClick={() => set('fontSize', v)}
                style={{
                  ...btnSecondary,
                  padding: 'var(--space-2) var(--space-4)',
                  background: prefs.fontSize === v ? 'rgba(184,145,42,0.12)' : 'transparent',
                  borderColor: prefs.fontSize === v ? 'var(--color-accent-gold)' : 'var(--color-border)',
                  color: prefs.fontSize === v ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </FormRow>
        <Toggle
          checked={prefs.compactMode}
          onChange={v => set('compactMode', v)}
          label="Compact Mode"
          description="Reduce spacing for a denser layout"
        />
      </SectionCard>

      <SectionCard title="Dashboard Widgets">
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🧩</div>
          <div style={{ fontSize: 'var(--text-sm)' }}>Customizable dashboard widget arrangement</div>
          <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Coming soon</div>
        </div>
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={save} style={btnPrimary}>Save Preferences</button>
      </div>
    </div>
  );
}

// ── Data & Privacy Tab ─────────────────────────────────────────────────────────

function PrivacyTab({ user, onLogout }) {
  const { showSuccess, showError } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting]           = useState(false);
  const [exporting, setExporting]         = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/auth/me');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Data exported successfully');
    } catch {
      showError('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { showError('Please type DELETE to confirm'); return; }
    setDeleting(true);
    try {
      await api.delete(`/agents/${user?.id}`);
      showSuccess('Account deleted');
      setTimeout(onLogout, 1500);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete account. Contact an administrator.');
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionCard title="Your Data">
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>
          You can download a copy of your personal data stored in the CRM at any time.
        </p>
        <button type="button" onClick={exportData} style={btnPrimary} disabled={exporting}>
          {exporting ? 'Exporting…' : '⬇ Export My Data'}
        </button>
      </SectionCard>

      <SectionCard title="Data Retention">
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
          <p style={{ marginBottom: 'var(--space-2)' }}>Your data is retained in accordance with GDPR and Malta data protection laws.</p>
          <p style={{ marginBottom: 'var(--space-2)' }}>Activity logs are retained for a maximum of 12 months. Property and transaction records are kept for 7 years for compliance purposes.</p>
          <p><a href="#privacy" style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>View Privacy Policy ↗</a></p>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" style={{ border: '1px solid rgba(168,92,92,0.3)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <FormRow label='Type "DELETE" to confirm'>
          <input
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            style={{ ...inputStyle, maxWidth: 200, borderColor: 'rgba(168,92,92,0.4)' }}
          />
        </FormRow>
        <button
          type="button"
          onClick={deleteAccount}
          disabled={deleteConfirm !== 'DELETE' || deleting}
          style={{ ...btnSecondary, borderColor: 'rgba(168,92,92,0.5)', color: '#A85C5C', opacity: deleteConfirm !== 'DELETE' ? 0.5 : 1 }}
        >
          {deleting ? 'Deleting…' : '⚠ Delete My Account'}
        </button>
      </SectionCard>
    </div>
  );
}

// ── Audit Log Panel ────────────────────────────────────────────────────────────

function AuditLogPanel() {
  const { showError }     = useToast();
  const [logs, setLogs]   = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (p) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/settings/audit-log?page=${p}&limit=20`);
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      showError('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetchLogs(page); }, [fetchLogs, page]);

  const ACTION_ICONS = {
    settings_updated: '⚙️', permissions_updated: '🔐',
    user_blocked: '🚫', user_unblocked: '✅', user_approved: '✅', user_rejected: '❌',
    login: '🔑', logout: '🔒',
  };

  return (
    <SectionCard title="System Audit Log">
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-6)' }}>Loading…</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-6)' }}>No audit log entries</div>
      ) : (
        <div>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', padding: 'var(--space-3) 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 2 }}>{ACTION_ICONS[log.action] || '📋'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{log.description || log.action}</div>
                {log.User && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    by {log.User.firstName} {log.User.lastName} ({log.User.role})
                  </div>
                )}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {relativeTime(log.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
      {total > 20 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btnSecondary}>← Prev</button>
          <span style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button type="button" onClick={() => setPage(p => p + 1)} disabled={logs.length < 20} style={btnSecondary}>Next →</button>
        </div>
      )}
    </SectionCard>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CrmSettingsPage() {
  usePageTimeTracker('settings', { entityType: 'settings' });
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData]   = useState(user);

  const role = user?.role || 'agent';
  const visibleTabs = ALL_TABS.filter(t => t.roles.includes(role));

  useEffect(() => { setUserData(user); }, [user]);

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':       return <ProfileTab user={userData} onUserUpdated={setUserData} />;
      case 'company':       return <div><CompanyTab /><AuditLogPanel /></div>;
      case 'users':         return <UsersTab currentUser={user} />;
      case 'permissions':   return <PermissionsTab />;
      case 'notifications': return <NotificationsTab />;
      case 'appearance':    return <AppearanceTab />;
      case 'privacy':       return <PrivacyTab user={userData} onLogout={logout} />;
      default:              return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)', marginBottom: 'var(--space-1)' }}>
          Settings
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Configure your CRM — profile, roles, integrations, and system preferences.
        </p>
      </div>

      {/* Tab navigation — horizontal scrollable strip */}
      <div style={{ borderBottom: '1px solid var(--color-border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-accent-gold)' : 'transparent'}`,
                color: activeTab === tab.key ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
                fontWeight: activeTab === tab.key ? 'var(--font-semibold)' : 'var(--font-normal)',
                fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', transition: 'all 0.15s',
                marginBottom: '-1px',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {renderTab()}
      </div>
    </div>
  );
}
