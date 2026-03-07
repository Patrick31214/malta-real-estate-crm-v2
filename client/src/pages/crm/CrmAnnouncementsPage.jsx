import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import Pagination from '../../components/ui/Pagination';

// ── Constants ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent:    { color: '#F87171', bg: 'rgba(220,38,38,0.14)',    border: 'rgba(220,38,38,0.45)',   label: 'Urgent',    icon: '🔴' },
  important: { color: '#FBBF24', bg: 'rgba(217,119,6,0.14)',    border: 'rgba(217,119,6,0.45)',   label: 'Important', icon: '🟠' },
  normal:    { color: '#E8B820', bg: 'rgba(212,175,55,0.14)',   border: 'rgba(212,175,55,0.45)',  label: 'Normal',    icon: '🟡' },
  low:       { color: '#9CA3AF', bg: 'rgba(107,114,128,0.10)',  border: 'rgba(107,114,128,0.3)',  label: 'Low',       icon: '⚪' },
};

const TYPE_CONFIG = {
  general:         { icon: '📢',   label: 'General' },
  policy:          { icon: '📋',    label: 'Policy' },
  maintenance:     { icon: '🔧',    label: 'Maintenance' },
  property_update: { icon: '🏠',    label: 'Property Update' },
  achievement:     { icon: '🏆',    label: 'Achievement' },
  event:           { icon: '📅',    label: 'Event' },
};

const PRIORITIES = ['urgent', 'important', 'normal', 'low'];
const TYPES      = ['general', 'policy', 'maintenance', 'property_update', 'achievement', 'event'];
const ROLES      = ['admin', 'manager', 'agent', 'client'];

// ── Style helpers ─────────────────────────────────────────────────────────────────────────────

const lbl = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)', textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)',
};

const inp = (err) => ({
  padding: 'var(--space-2) var(--space-3)', borderRadius: '8px',
  border: `1px solid ${err ? '#F87171' : 'rgba(212,175,55,0.2)'}`,
  background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', width: '100%', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
});

const errStyle = { fontSize: 'var(--text-xs)', color: '#F87171', marginTop: '4px', display: 'block' };

const sectionCard = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(212,175,55,0.15)',
  borderRadius: '16px', padding: 'var(--space-5)',
};

const sectionTitle = {
  fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
  color: 'var(--color-accent-gold)', textTransform: 'uppercase',
  letterSpacing: '0.12em', marginBottom: 'var(--space-4)',
};

const goldBtn = (disabled) => ({
  padding: 'var(--space-2) var(--space-5)', borderRadius: '8px',
  border: '1px solid var(--color-accent-gold)',
  background: disabled ? 'rgba(212,175,55,0.3)' : 'var(--color-accent-gold)',
  color: disabled ? 'rgba(255,255,255,0.5)' : '#0a0a0f',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)',
  opacity: disabled ? 0.7 : 1, transition: 'all 0.2s',
});

const ghostBtn = {
  padding: 'var(--space-2) var(--space-4)', borderRadius: '8px',
  border: '1px solid rgba(212,175,55,0.25)',
  background: 'transparent', color: 'var(--color-text-secondary)',
  cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 0.2s',
};

const segBtn = (active, activeColor) => ({
  padding: 'var(--space-2) var(--space-3)', borderRadius: '8px',
  border: `1px solid ${active ? (activeColor || 'var(--color-accent-gold)') : 'rgba(212,175,55,0.15)'}`,
  background: active ? (activeColor ? `${activeColor}22` : 'rgba(212,175,55,0.12)') : 'transparent',
  color: active ? (activeColor || 'var(--color-accent-gold)') : 'var(--color-text-secondary)',
  cursor: 'pointer', fontSize: 'var(--text-sm)',
  fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)',
  transition: 'all 0.15s',
});

// ── Badge components ──────────────────────────────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 10px', borderRadius: '999px',
      fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`, letterSpacing: '0.05em',
    }}>
      {cfg.label}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.general;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '999px',
      fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
      border: '1px solid rgba(212,175,55,0.15)',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ── Announcement Form ──────────────────────────────────────────────────────────────────────────────────

const AnnouncementForm = ({ initial, onSave, onClose }) => {
  const { showError, showSuccess } = useToast();
  const [form, setForm] = useState({
    title:           initial?.title          || '',
    content:         initial?.content        || '',
    priority:        initial?.priority       || 'normal',
    type:            initial?.type           || 'general',
    targetType:      initial?.targetType     || 'all',
    targetRoles:     Array.isArray(initial?.targetRoles)     ? initial.targetRoles     : [],
    targetBranchIds: Array.isArray(initial?.targetBranchIds) ? initial.targetBranchIds : [],
    targetUserIds:   Array.isArray(initial?.targetUserIds)   ? initial.targetUserIds   : [],
    startsAt:        initial?.startsAt  ? new Date(initial.startsAt).toISOString().slice(0, 16)  : '',
    expiresAt:       initial?.expiresAt ? new Date(initial.expiresAt).toISOString().slice(0, 16) : '',
    isPinned:        initial?.isPinned        || false,
    isActive:        initial?.isActive !== undefined ? initial.isActive : true,
  });
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [branches,     setBranches]     = useState([]);
  const [users,        setUsers]        = useState([]);
  const [userSearch,   setUserSearch]   = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    api.get('/branches?limit=100')
      .then(r => setBranches(r.data.branches || r.data || []))
      .catch(() => {});
  }, []);

  const searchUsers = useCallback(async (q) => {
    if (!q || q.length < 2) { setUsers([]); return; }
    setLoadingUsers(true);
    try {
      const r = await api.get(`/agents?search=${encodeURIComponent(q)}&limit=20`);
      setUsers(r.data.agents || r.data.users || []);
    } catch { setUsers([]); }
    finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch, searchUsers]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleRole   = (r)  => setForm(f => ({ ...f, targetRoles:     f.targetRoles.includes(r)     ? f.targetRoles.filter(x => x !== r)     : [...f.targetRoles, r] }));
  const toggleBranch = (id) => setForm(f => ({ ...f, targetBranchIds: f.targetBranchIds.includes(id) ? f.targetBranchIds.filter(x => x !== id) : [...f.targetBranchIds, id] }));
  const toggleUser   = (id) => setForm(f => ({ ...f, targetUserIds:   f.targetUserIds.includes(id)   ? f.targetUserIds.filter(x => x !== id)   : [...f.targetUserIds, id] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim())   errs.title   = 'Title is required';
    if (!form.content.trim()) errs.content = 'Content is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetRoles:     form.targetType === 'roles'    ? form.targetRoles     : null,
        targetBranchIds: form.targetType === 'branches' ? form.targetBranchIds : null,
        targetUserIds:   form.targetType === 'users'    ? form.targetUserIds   : null,
        startsAt:  form.startsAt  || null,
        expiresAt: form.expiresAt || null,
      };
      if (initial?.id) {
        await api.put(`/announcements/${initial.id}`, payload);
      } else {
        await api.post('/announcements', payload);
      }
      showSuccess(initial?.id ? 'Announcement updated successfully' : 'Announcement created successfully');
      onSave();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save announcement');
    } finally { setSaving(false); }
  };

  const audienceLabel = () => {
    if (form.targetType === 'all')      return 'Everyone';
    if (form.targetType === 'roles')    return form.targetRoles.length     > 0 ? `Roles: ${form.targetRoles.join(', ')}` : 'No roles selected';
    if (form.targetType === 'branches') return form.targetBranchIds.length > 0 ? `${form.targetBranchIds.length} branch(es)` : 'No branches selected';
    if (form.targetType === 'users')    return form.targetUserIds.length   > 0 ? `${form.targetUserIds.length} specific user(s)` : 'No users selected';
    return '';
  };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-accent-gold)', margin: 0 }}>
          {initial?.id ? '✏️ Edit Announcement' : '✨ New Announcement'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
          {initial?.id ? 'Update the announcement details below.' : 'Create a new announcement for your team.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={sectionCard}>
              <div style={sectionTitle}>📝 Content</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={lbl}>Title *</label>
                  <input
                    style={inp(errors.title)}
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="Announcement title…"
                  />
                  {errors.title && <span style={errStyle}>{errors.title}</span>}
                </div>
                <div>
                  <label style={lbl}>Content *</label>
                  <textarea
                    style={{ ...inp(errors.content), minHeight: '160px', resize: 'vertical' }}
                    value={form.content}
                    onChange={e => set('content', e.target.value)}
                    placeholder="Write your announcement content here…"
                  />
                  {errors.content && <span style={errStyle}>{errors.content}</span>}
                </div>
              </div>
            </div>

            <div style={sectionCard}>
              <div style={sectionTitle}>🎯 Priority</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {PRIORITIES.map(p => {
                  const pc = PRIORITY_CONFIG[p];
                  const sel = form.priority === p;
                  return (
                    <button key={p} type="button" onClick={() => set('priority', p)} style={segBtn(sel, sel ? pc.color : null)}>
                      {pc.icon} {pc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={sectionCard}>
              <div style={sectionTitle}>🏷️ Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {TYPES.map(t => {
                  const tc = TYPE_CONFIG[t];
                  return (
                    <button key={t} type="button" onClick={() => set('type', t)} style={segBtn(form.type === t)}>
                      {tc.icon} {tc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={sectionCard}>
              <div style={sectionTitle}>👥 Target Audience</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {[['all', 'Everyone'], ['roles', 'By Role'], ['branches', 'By Branch'], ['users', 'Specific Users']].map(([val, label2]) => (
                    <button key={val} type="button" onClick={() => set('targetType', val)} style={segBtn(form.targetType === val)}>
                      {label2}
                    </button>
                  ))}
                </div>

                {form.targetType === 'roles' && (
                  <div>
                    <label style={lbl}>Select Roles</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {ROLES.map(r => (
                        <button key={r} type="button" onClick={() => toggleRole(r)} style={segBtn(form.targetRoles.includes(r))}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.targetType === 'branches' && (
                  <div>
                    <label style={lbl}>Select Branches</label>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {branches.length === 0
                        ? <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No branches found</span>
                        : branches.map(b => (
                          <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                            <input type="checkbox" checked={form.targetBranchIds.includes(b.id)} onChange={() => toggleBranch(b.id)} />
                            {b.name}
                          </label>
                        ))
                      }
                    </div>
                  </div>
                )}

                {form.targetType === 'users' && (
                  <div>
                    <label style={lbl}>Search Users</label>
                    <input
                      style={{ ...inp(), marginBottom: 'var(--space-2)' }}
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Type name to search…"
                    />
                    {loadingUsers && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Searching…</div>}
                    {users.length > 0 && (
                      <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--space-2)' }}>
                        {users.map(u => (
                          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                            <input type="checkbox" checked={form.targetUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} />
                            {u.firstName} {u.lastName} <span style={{ color: 'var(--color-text-muted)' }}>{`(${u.role})`}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {form.targetUserIds.length > 0 && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>
                        ✓ {form.targetUserIds.length} user(s) selected
                      </div>
                    )}
                  </div>
                )}

                <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(212,175,55,0.06)', borderRadius: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', border: '1px solid rgba(212,175,55,0.12)' }}>
                  👁️ Visible to: <strong style={{ color: 'var(--color-accent-gold)' }}>{audienceLabel()}</strong>
                </div>
              </div>
            </div>

            <div style={sectionCard}>
              <div style={sectionTitle}>📅 Schedule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={lbl}>Publish At (blank = immediately)</label>
                  <input type="datetime-local" style={inp()} value={form.startsAt} onChange={e => set('startsAt', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Expires At (optional)</label>
                  <input type="datetime-local" style={inp()} value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={sectionCard}>
              <div style={sectionTitle}>⚙️ Options</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <input type="checkbox" checked={form.isPinned} onChange={e => set('isPinned', e.target.checked)} />
                  📌 Pin this announcement (appears at the top)
                </label>
                {initial?.id && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                    ✅ Active (visible to audience)
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
          <button type="submit" disabled={saving} style={goldBtn(saving)}>
            {saving ? '⏳ Saving…' : (initial?.id ? '✓ Update Announcement' : '✨ Create Announcement')}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Announcement Detail ──────────────────────────────────────────────────────────────────────────────────

const AnnouncementDetail = ({ announcement: a, canEdit, onEdit, onDelete }) => {
  const readCount = Array.isArray(a.readByUserIds) ? a.readByUserIds.length : 0;
  const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const targetDesc = () => {
    if (!a.targetType || a.targetType === 'all') return 'Everyone';
    if (a.targetType === 'roles')    return `Roles: ${(Array.isArray(a.targetRoles)     ? a.targetRoles     : []).join(', ') || '—'}`;
    if (a.targetType === 'branches') return `${Array.isArray(a.targetBranchIds) ? a.targetBranchIds.length : 0} branch(es)`;
    if (a.targetType === 'users')    return `${Array.isArray(a.targetUserIds)   ? a.targetUserIds.length   : 0} specific user(s)`;
    return '—';
  };
  const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general;

  return (
    <div style={{ padding: 'var(--space-7)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '3rem', lineHeight: 1, flexShrink: 0 }}>{tc.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            <PriorityBadge priority={a.priority} />
            <TypeBadge type={a.type} />
            {a.isPinned && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '999px', fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}>
                📌 Pinned
              </span>
            )}
            {!a.isActive && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px', fontSize: 'var(--text-xs)', color: '#9CA3AF', border: '1px solid rgba(156,163,175,0.3)', background: 'rgba(156,163,175,0.08)' }}>
                Inactive
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>
            {a.title}
          </h1>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
            <button onClick={onEdit} style={{ ...ghostBtn, borderColor: 'rgba(212,175,55,0.4)', color: 'var(--color-accent-gold)' }}>
              ✏️ Edit
            </button>
            <button onClick={onDelete} style={{ ...ghostBtn, borderColor: 'rgba(248,113,113,0.4)', color: '#F87171' }}>
              🗑 Delete
            </button>
          </div>
        )}
      </div>

      <div style={{ ...sectionCard, marginBottom: 'var(--space-6)', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
        {a.content}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {[
          ['✍️ Author',   a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}` : '—'],
          ['📅 Created',  fmt(a.createdAt)],
          ['🕐 Starts',   a.startsAt  ? fmt(a.startsAt)  : 'Immediately'],
          ['⌛ Expires',  a.expiresAt ? fmt(a.expiresAt) : 'Never'],
          ['👥 Audience', targetDesc()],
          ['👁️ Read by',  `${readCount} user(s)`],
        ].map(([k, v]) => (
          <div key={k} style={{ ...sectionCard, padding: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{k}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main page ───────────────────────────────────────────────────────────────────────────────────────

const getTargetingLabel = (a) => {
  if (a.targetType === 'roles')    return `Roles: ${(a.targetRoles    || []).join(', ')}`;
  if (a.targetType === 'branches') return `${(a.targetBranchIds || []).length} branch(es)`;
  if (a.targetType === 'users')    return `${(a.targetUserIds   || []).length} user(s)`;
  return '';
};

const CrmAnnouncementsPage = () => {
  const { user }                   = useAuth();
  const { showError, showSuccess } = useToast();
  const isAdmin   = user?.role === 'admin';
  const canCreate = ['admin', 'manager'].includes(user?.role);
  const canEdit   = canCreate;

  const [announcements, setAnnouncements] = useState([]);
  const [pagination,    setPagination]    = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading,  setLoading]  = useState(false);
  const [filters,  setFilters]  = useState({ search: '', priority: '', type: '', status: 'active' });
  const [mode,     setMode]     = useState('list');
  const [selected, setSelected] = useState(null);
  const [readIds,  setReadIds]  = useState(new Set());

  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && mode !== 'list') { setMode('list'); setSelected(null); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mode]);

  const fetchAnnouncements = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const endpoint = canCreate ? '/announcements/admin' : '/announcements';
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.search)   params.set('search',   filters.search);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.type)     params.set('type',     filters.type);
      const r = await api.get(`${endpoint}?${params}`);
      let items = r.data.announcements || [];
      if (canCreate) {
        if (filters.status === 'active')   items = items.filter(a => a.isActive);
        if (filters.status === 'inactive') items = items.filter(a => !a.isActive);
      }
      setAnnouncements(items);
      setPagination(r.data.pagination || { total: items.length, page, limit: 20, totalPages: 1 });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to load announcements');
    } finally { setLoading(false); }
  }, [filters, canCreate, showError]);

  useEffect(() => { fetchAnnouncements(1); }, [fetchAnnouncements]);

  const handleMarkRead = async (a) => {
    if (readIds.has(a.id)) return;
    try {
      await api.patch(`/announcements/${a.id}/read`);
      setReadIds(s => new Set([...s, a.id]));
    } catch { /* silent */ }
  };

  const handleViewDetail = (a) => {
    setSelected(a);
    setMode('detail');
    handleMarkRead(a);
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/announcements/${a.id}`);
      showSuccess('Announcement deleted');
      if (mode !== 'list') { setMode('list'); setSelected(null); }
      fetchAnnouncements(pagination.page);
    } catch (err) {
      showError(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleToggleActive = async (a) => {
    try {
      await api.patch(`/announcements/${a.id}/toggle-active`);
      showSuccess(a.isActive ? 'Announcement deactivated' : 'Announcement activated');
      fetchAnnouncements(pagination.page);
    } catch (err) {
      showError(err.response?.data?.error || 'Toggle failed');
    }
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const isUnread = (a) => {
    if (readIds.has(a.id)) return false;
    const reads = Array.isArray(a.readByUserIds) ? a.readByUserIds : [];
    return !reads.includes(user?.id);
  };

  const pinned  = announcements.filter(a => a.isPinned);
  const regular = announcements.filter(a => !a.isPinned);
  const activeCount = announcements.filter(a => a.isActive).length;
  const pinnedCount = pinned.length;
  const unreadCount = announcements.filter(a => isUnread(a)).length;

  const selectStyle = {
    padding: 'var(--space-2) var(--space-3)', borderRadius: '8px',
    border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)',
    outline: 'none', cursor: 'pointer',
  };

  const AnnouncementCard = ({ a }) => {
    const pc     = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
    const tc     = TYPE_CONFIG[a.type]         || TYPE_CONFIG.general;
    const unread = isUnread(a);
    return (
      <div
        className={`announcement-card${a.isPinned ? ' pinned' : ''}`}
        style={{ borderLeft: `3px solid ${pc.color}`, cursor: 'pointer', opacity: a.isActive ? 1 : 0.55 }}
        onClick={() => handleViewDetail(a)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>{tc.icon}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                <PriorityBadge priority={a.priority} />
                <TypeBadge type={a.type} />
                {a.isPinned && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>📌 Pinned</span>
                )}
                {unread && (
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: pc.color, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${pc.color}` }} title="Unread" />
                )}
                {!a.isActive && (
                  <span style={{ fontSize: 'var(--text-xs)', color: '#9CA3AF', background: 'rgba(156,163,175,0.08)', padding: '1px 8px', borderRadius: '999px', border: '1px solid rgba(156,163,175,0.2)' }}>Inactive</span>
                )}
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-1)', lineHeight: 1.3 }}>
                {a.title}
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.6' }}>
                {a.content}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {canEdit && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => { setSelected(a); setMode('form'); }}
                  style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: 'var(--color-accent-gold)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
                >Edit</button>
                <button
                  onClick={() => handleToggleActive(a)}
                  style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.15)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
                >{a.isActive ? 'Deactivate' : 'Activate'}</button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(a)}
                    style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#F87171', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
                  >Delete</button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap', borderTop: '1px solid rgba(212,175,55,0.08)', paddingTop: 'var(--space-2)' }}>
          {a.createdBy && <span>✍️ {a.createdBy.firstName} {a.createdBy.lastName}</span>}
          {a.targetType && a.targetType !== 'all' && <span>👥 {getTargetingLabel(a)}</span>}
          {a.expiresAt && <span>⌛ Expires {new Date(a.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
        </div>
      </div>
    );
  };

  const modalBack = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    zIndex: 9000, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 'var(--space-4)',
  };
  const modalContent = (maxW) => ({
    background: 'var(--color-surface)', borderRadius: '20px',
    width: '90vw', maxWidth: maxW, maxHeight: '90vh', overflow: 'auto',
    border: '1px solid rgba(212,175,55,0.2)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  });
  const modalTopBar = {
    position: 'sticky', top: 0, display: 'flex', justifyContent: 'flex-end',
    padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface)',
    borderBottom: '1px solid rgba(212,175,55,0.1)', zIndex: 10,
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)',
            margin: '0 0 var(--space-1)',
            background: 'linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-gold-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            📢 Announcements
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Team announcements, notices, and important updates
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setSelected(null); setMode('form'); }}
            style={{ ...goldBtn(false), padding: 'var(--space-3) var(--space-6)', boxShadow: '0 4px 16px rgba(212,175,55,0.25)' }}
          >
            ✨ New Announcement
          </button>
        )}
      </div>

      {/* Stats bar */}
      {canCreate && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'Active',  value: activeCount, icon: '✅', color: '#4ADE80' },
            { label: 'Pinned',  value: pinnedCount, icon: '📌',   color: 'var(--color-accent-gold)' },
            { label: 'Unread',  value: unreadCount, icon: '🔔',      color: '#FBBF24' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ ...sectionCard, padding: 'var(--space-4)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color, fontFamily: 'var(--font-heading)' }}>{value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ ...sectionCard, marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          placeholder="🔍 Search announcements…"
          style={{ ...inp(), minWidth: '200px', flex: 1 }}
        />
        <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)} style={selectStyle}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].icon} {PRIORITY_CONFIG[p].label}</option>)}
        </select>
        <select value={filters.type} onChange={e => setFilter('type', e.target.value)} style={selectStyle}>
          <option value="">All Categories</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}</option>)}
        </select>
        {canCreate && (
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={selectStyle}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>⏳</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Loading announcements…</div>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: 'var(--space-16)', textAlign: 'center', ...sectionCard }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>📭</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)' }}>No announcements found</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            {canCreate ? 'Create your first announcement to get started.' : 'Check back later for updates.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {pinned.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: '1rem' }}>📌</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pinned</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,175,55,0.4), transparent)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {pinned.map(a => <AnnouncementCard key={a.id} a={a} />)}
              </div>
            </section>
          )}

          {regular.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>All Announcements</span>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,175,55,0.15), transparent)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {regular.map(a => <AnnouncementCard key={a.id} a={a} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div style={{ marginTop: 'var(--space-8)' }}>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={fetchAnnouncements} limit={pagination.limit} />
        </div>
      )}

      {/* Form modal */}
      {mode === 'form' && (
        <div style={modalBack} onClick={() => { setMode('list'); setSelected(null); }}>
          <div style={modalContent('900px')} onClick={e => e.stopPropagation()}>
            <div style={modalTopBar}>
              <button onClick={() => { setMode('list'); setSelected(null); }} style={{ ...ghostBtn, padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}>
                ✕ Close
              </button>
            </div>
            <AnnouncementForm
              initial={selected}
              onSave={() => { setMode('list'); setSelected(null); fetchAnnouncements(pagination.page); }}
              onClose={() => { setMode('list'); setSelected(null); }}
            />
          </div>
        </div>
      )}

      {/* Detail modal */}
      {mode === 'detail' && selected && (
        <div style={modalBack} onClick={() => { setMode('list'); setSelected(null); }}>
          <div style={modalContent('760px')} onClick={e => e.stopPropagation()}>
            <div style={modalTopBar}>
              <button onClick={() => { setMode('list'); setSelected(null); }} style={{ ...ghostBtn, padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}>
                ✕ Close
              </button>
            </div>
            <AnnouncementDetail
              announcement={selected}
              canEdit={canEdit}
              onEdit={() => setMode('form')}
              onDelete={() => handleDelete(selected)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmAnnouncementsPage;
