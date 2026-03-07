import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import Pagination from '../../components/ui/Pagination';

// ── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent:    { color: '#DC2626', bg: 'rgba(220,38,38,0.15)', label: 'Urgent' },
  important: { color: '#D97706', bg: 'rgba(217,119,6,0.15)', label: 'Important' },
  normal:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', label: 'Normal' },
  low:       { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', label: 'Low' },
};

const TYPE_CONFIG = {
  general:         { icon: '📢', label: 'General' },
  policy:          { icon: '📋', label: 'Policy' },
  maintenance:     { icon: '🔧', label: 'Maintenance' },
  property_update: { icon: '🏠', label: 'Property Update' },
  achievement:     { icon: '🏆', label: 'Achievement' },
  event:           { icon: '📅', label: 'Event' },
};

const PRIORITIES = ['urgent', 'important', 'normal', 'low'];
const TYPES = ['general', 'policy', 'maintenance', 'property_update', 'achievement', 'event'];
const ROLES = ['admin', 'manager', 'agent', 'client'];

// ── Overlay helpers ───────────────────────────────────────────────────────────

const backdropStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  zIndex: 9000, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: 'var(--space-4)',
};
const overlayContentStyle = {
  background: 'var(--color-background)', borderRadius: 'var(--radius-lg)',
  width: '90vw', maxHeight: '90vh', overflow: 'auto',
  position: 'relative', boxShadow: 'var(--shadow-glass)',
};
const closeBtnStyle = {
  position: 'sticky', top: 'var(--space-3)', float: 'right',
  marginRight: 'var(--space-3)', zIndex: 10,
  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)',
  color: 'var(--color-text-secondary)', cursor: 'pointer',
  fontSize: 'var(--text-sm)', backdropFilter: 'blur(8px)',
};

// ── Label / input styles ──────────────────────────────────────────────────────

const lbl = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)', textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)',
};
const inp = (err) => ({
  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)',
  border: `1px solid ${err ? 'var(--color-error)' : 'var(--color-border)'}`,
  background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', width: '100%', outline: 'none', boxSizing: 'border-box',
});
const errStyle = { fontSize: 'var(--text-xs)', color: 'var(--color-error)' };

// ── AnnouncementForm overlay ──────────────────────────────────────────────────

const AnnouncementForm = ({ initial, onSave, onClose }) => {
  const { showError, showSuccess } = useToast();
  const now = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState({
    title: initial?.title || '',
    content: initial?.content || '',
    priority: initial?.priority || 'normal',
    type: initial?.type || 'general',
    targetType: initial?.targetType || 'all',
    targetRoles: Array.isArray(initial?.targetRoles) ? initial.targetRoles : [],
    targetBranchIds: Array.isArray(initial?.targetBranchIds) ? initial.targetBranchIds : [],
    targetUserIds: Array.isArray(initial?.targetUserIds) ? initial.targetUserIds : [],
    startsAt: initial?.startsAt ? new Date(initial.startsAt).toISOString().slice(0, 16) : '',
    expiresAt: initial?.expiresAt ? new Date(initial.expiresAt).toISOString().slice(0, 16) : '',
    isPinned: initial?.isPinned || false,
    isActive: initial?.isActive !== undefined ? initial.isActive : true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    api.get('/branches?limit=100').then(r => setBranches(r.data.branches || r.data || [])).catch(() => {});
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

  const toggleRole = (role) =>
    setForm(f => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter(r => r !== role)
        : [...f.targetRoles, role],
    }));

  const toggleBranch = (id) =>
    setForm(f => ({
      ...f,
      targetBranchIds: f.targetBranchIds.includes(id)
        ? f.targetBranchIds.filter(b => b !== id)
        : [...f.targetBranchIds, id],
    }));

  const toggleUser = (id) =>
    setForm(f => ({
      ...f,
      targetUserIds: f.targetUserIds.includes(id)
        ? f.targetUserIds.filter(u => u !== id)
        : [...f.targetUserIds, id],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title required';
    if (!form.content.trim()) errs.content = 'Content required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetRoles: form.targetType === 'roles' ? form.targetRoles : null,
        targetBranchIds: form.targetType === 'branches' ? form.targetBranchIds : null,
        targetUserIds: form.targetType === 'users' ? form.targetUserIds : null,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };
      if (initial?.id) {
        await api.put(`/announcements/${initial.id}`, payload);
      } else {
        await api.post('/announcements', payload);
      }
      showSuccess(initial?.id ? 'Announcement updated' : 'Announcement created');
      onSave();
    } catch (err) {
      showError(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const targetingAudience = () => {
    if (form.targetType === 'all') return 'Everyone';
    if (form.targetType === 'roles') return form.targetRoles.length > 0 ? `Roles: ${form.targetRoles.join(', ')}` : 'No roles selected';
    if (form.targetType === 'branches') return form.targetBranchIds.length > 0 ? `${form.targetBranchIds.length} branch(es)` : 'No branches selected';
    if (form.targetType === 'users') return form.targetUserIds.length > 0 ? `${form.targetUserIds.length} specific user(s)` : 'No users selected';
    return '';
  };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}>
        {initial?.id ? 'Edit Announcement' : 'New Announcement'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Content</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={lbl}>Title *</label>
                  <input style={inp(errors.title)} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title" />
                  {errors.title && <span style={errStyle}>{errors.title}</span>}
                </div>
                <div>
                  <label style={lbl}>Content *</label>
                  <textarea style={{ ...inp(errors.content), minHeight: '150px', resize: 'vertical' }} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Announcement content…" />
                  {errors.content && <span style={errStyle}>{errors.content}</span>}
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Priority</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {PRIORITIES.map(p => {
                  const pc = PRIORITY_CONFIG[p];
                  const sel = form.priority === p;
                  return (
                    <button key={p} type="button" onClick={() => set('priority', p)}
                      style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: `2px solid ${sel ? pc.color : 'var(--color-border)'}`, background: sel ? pc.bg : 'transparent', color: sel ? pc.color : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: sel ? 'var(--font-semibold)' : 'var(--font-normal)', transition: 'all 0.15s' }}>
                      {pc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Type</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {TYPES.map(t => {
                  const tc = TYPE_CONFIG[t];
                  const sel = form.type === t;
                  return (
                    <button key={t} type="button" onClick={() => set('type', t)}
                      style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: `2px solid ${sel ? 'var(--color-accent-gold)' : 'var(--color-border)'}`, background: sel ? 'rgba(202,163,81,0.15)' : 'transparent', color: sel ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span>{tc.icon}</span> {tc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Targeting</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {[['all','Everyone'],['roles','Specific Roles'],['branches','Specific Branches'],['users','Specific Users']].map(([val, lbl2]) => (
                    <button key={val} type="button" onClick={() => set('targetType', val)}
                      style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: `2px solid ${form.targetType === val ? 'var(--color-accent-gold)' : 'var(--color-border)'}`, background: form.targetType === val ? 'rgba(202,163,81,0.15)' : 'transparent', color: form.targetType === val ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                      {lbl2}
                    </button>
                  ))}
                </div>

                {form.targetType === 'roles' && (
                  <div>
                    <label style={lbl}>Select Roles</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {ROLES.map(r => (
                        <button key={r} type="button" onClick={() => toggleRole(r)}
                          style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.targetRoles.includes(r) ? 'var(--color-accent-gold)' : 'var(--color-border)'}`, background: form.targetRoles.includes(r) ? 'rgba(202,163,81,0.2)' : 'transparent', color: form.targetRoles.includes(r) ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>{r}</button>
                      ))}
                    </div>
                  </div>
                )}

                {form.targetType === 'branches' && (
                  <div>
                    <label style={lbl}>Select Branches</label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      {branches.length === 0 && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No branches found</span>}
                      {branches.map(b => (
                        <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                          <input type="checkbox" checked={form.targetBranchIds.includes(b.id)} onChange={() => toggleBranch(b.id)} />
                          {b.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {form.targetType === 'users' && (
                  <div>
                    <label style={lbl}>Search & Select Users</label>
                    <input style={{ ...inp(), marginBottom: 'var(--space-2)' }} value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Type to search users…" />
                    {loadingUsers && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Searching…</div>}
                    {users.length > 0 && (
                      <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                        {users.map(u => (
                          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                            <input type="checkbox" checked={form.targetUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} />
                            {u.firstName} {u.lastName} ({u.role})
                          </label>
                        ))}
                      </div>
                    )}
                    {form.targetUserIds.length > 0 && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>{form.targetUserIds.length} user(s) selected</div>
                    )}
                  </div>
                )}

                <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(202,163,81,0.08)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  👥 Visible to: <strong>{targetingAudience()}</strong>
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Schedule</h3>
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

            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Options</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={form.isPinned} onChange={e => set('isPinned', e.target.checked)} />
                📌 Pin this announcement (appears at top)
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button type="button" onClick={onClose} style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ padding: 'var(--space-3) var(--space-8)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'var(--color-accent-gold)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── AnnouncementDetail overlay ────────────────────────────────────────────────

const AnnouncementDetail = ({ announcement: a, canEdit, onEdit, onDelete, onClose }) => {
  const pc = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
  const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general;

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const readCount = Array.isArray(a.readByUserIds) ? a.readByUserIds.length : 0;

  const targetDesc = () => {
    if (!a.targetType || a.targetType === 'all') return 'Everyone';
    if (a.targetType === 'roles') return `Roles: ${(Array.isArray(a.targetRoles) ? a.targetRoles : []).join(', ') || '—'}`;
    if (a.targetType === 'branches') return `${(Array.isArray(a.targetBranchIds) ? a.targetBranchIds.length : 0)} branch(es)`;
    if (a.targetType === 'users') return `${(Array.isArray(a.targetUserIds) ? a.targetUserIds.length : 0)} specific user(s)`;
    return '—';
  };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '2.5rem' }}>{tc.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: pc.color, background: pc.bg }}>{pc.label}</span>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>{tc.label}</span>
            {a.isPinned && <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', border: '1px solid var(--color-accent-gold)' }}>📌 Pinned</span>}
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', margin: 0 }}>{a.title}</h1>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
            <button onClick={onEdit} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'transparent', color: 'var(--color-accent-gold)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Edit</button>
            <button onClick={onDelete} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Delete</button>
          </div>
        )}
      </div>

      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', whiteSpace: 'pre-wrap', lineHeight: 'var(--leading-relaxed)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
        {a.content}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        {[
          ['By', a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}` : '—'],
          ['Created', formatDate(a.createdAt)],
          ['Starts', a.startsAt ? formatDate(a.startsAt) : 'Immediately'],
          ['Expires', a.expiresAt ? formatDate(a.expiresAt) : 'Never'],
          ['Audience', targetDesc()],
          ['Read by', `${readCount} user(s)`],
        ].map(([k, v]) => (
          <div key={k} className="glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>{k}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const CrmAnnouncementsPage = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const isAdmin = user?.role === 'admin';
  const canCreate = ['admin', 'manager'].includes(user?.role);
  const canEdit = canCreate;

  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', priority: '', type: '', status: 'active' });
  const [mode, setMode] = useState('list'); // 'list' | 'form' | 'detail'
  const [selected, setSelected] = useState(null);
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && mode !== 'list') { setMode('list'); setSelected(null); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mode]);

  const fetchAnnouncements = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const endpoint = canCreate ? '/announcements/admin' : '/announcements';
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.search) params.set('search', filters.search);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.type) params.set('type', filters.type);
      const r = await api.get(`${endpoint}?${params}`);
      let items = r.data.announcements || [];
      if (!canCreate && filters.status === 'active') {
        // already filtered server-side
      } else if (canCreate && filters.status === 'active') {
        items = items.filter(a => a.isActive);
      } else if (canCreate && filters.status === 'inactive') {
        items = items.filter(a => !a.isActive);
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
    if (!window.confirm(`Delete "${a.title}"?`)) return;
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

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>📢 Announcements</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Team announcements and important notices</p>
        </div>
        {canCreate && (
          <button onClick={() => { setSelected(null); setMode('form'); }}
            style={{ padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'var(--color-accent-gold)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', boxShadow: 'var(--shadow-gold-sm)' }}>
            + New Announcement
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Search announcements…"
          style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', minWidth: '200px', flex: 1, outline: 'none' }} />
        <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)}
          style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
        </select>
        <select value={filters.type} onChange={e => setFilter('type', e.target.value)}
          style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}</option>)}
        </select>
        {canCreate && (
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
            style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>No announcements found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {announcements.map(a => {
            const pc = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
            const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general;
            const unread = isUnread(a);
            return (
              <div key={a.id} className="glass"
                style={{ borderLeft: `4px solid ${pc.color}`, cursor: 'pointer', opacity: !a.isActive ? 0.6 : 1, transition: 'box-shadow 0.15s' }}
                onClick={() => handleViewDetail(a)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-glass)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{tc.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: pc.color, background: pc.bg }}>{pc.label}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>{tc.label}</span>
                        {a.isPinned && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>📌</span>}
                        {unread && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: pc.color, display: 'inline-block', flexShrink: 0 }} title="Unread" />}
                        {!a.isActive && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>(Inactive)</span>}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', margin: 0 }}>{a.title}</h3>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {a.content}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button onClick={() => { setSelected(a); setMode('form'); }}
                          style={{ padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>Edit</button>
                        <button onClick={() => handleToggleActive(a)}
                          style={{ padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>{a.isActive ? 'Deactivate' : 'Activate'}</button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(a)}
                            style={{ padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  {a.createdBy && <span>By {a.createdBy.firstName} {a.createdBy.lastName}</span>}
                  {a.targetType && a.targetType !== 'all' && (
                    <span>👥 {a.targetType === 'roles' ? `Roles: ${(a.targetRoles || []).join(', ')}` : a.targetType === 'branches' ? `${(a.targetBranchIds || []).length} branch(es)` : `${(a.targetUserIds || []).length} user(s)`}</span>
                  )}
                  {a.expiresAt && <span>Expires: {new Date(a.expiresAt).toLocaleDateString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={fetchAnnouncements} limit={pagination.limit} />
        </div>
      )}

      {/* Create/Edit form overlay */}
      {mode === 'form' && (
        <div style={backdropStyle} onClick={() => { setMode('list'); setSelected(null); }}>
          <div style={overlayContentStyle} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setMode('list'); setSelected(null); }} style={closeBtnStyle}>✕ Close</button>
            <AnnouncementForm
              initial={selected}
              onSave={() => { setMode('list'); setSelected(null); fetchAnnouncements(pagination.page); }}
              onClose={() => { setMode('list'); setSelected(null); }}
            />
          </div>
        </div>
      )}

      {/* Detail overlay */}
      {mode === 'detail' && selected && (
        <div style={backdropStyle} onClick={() => { setMode('list'); setSelected(null); }}>
          <div style={overlayContentStyle} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setMode('list'); setSelected(null); }} style={closeBtnStyle}>✕ Close</button>
            <AnnouncementDetail
              announcement={selected}
              canEdit={canEdit}
              onEdit={() => setMode('form')}
              onDelete={() => handleDelete(selected)}
              onClose={() => { setMode('list'); setSelected(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmAnnouncementsPage;

