import React, { useState } from 'react';
import api from '../../../services/api';

const PRIORITIES = ['low', 'normal', 'important', 'urgent'];
const ROLES = ['admin', 'manager', 'agent', 'client'];
const TYPES = ['general', 'policy', 'maintenance', 'property_update', 'achievement', 'event'];

const lbl = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)', textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)',
};
const inp = (err) => ({
  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)',
  border: `1px solid ${err ? 'var(--color-error)' : 'rgba(212,175,55,0.2)'}`,
  background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', width: '100%', outline: 'none',
});
const errStyle = { fontSize: 'var(--text-xs)', color: 'var(--color-error)' };

const AnnouncementForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title:      initial?.title      || '',
    content:    initial?.content    || '',
    priority:   initial?.priority   || 'normal',
    type:       initial?.type       || 'general',
    targetType: initial?.targetType || 'all',
    targetRoles: Array.isArray(initial?.targetRoles) ? initial.targetRoles : [],
    startsAt:   initial?.startsAt  ? new Date(initial.startsAt).toISOString().slice(0, 16)  : '',
    expiresAt:  initial?.expiresAt ? new Date(initial.expiresAt).toISOString().slice(0, 16) : '',
    isPinned:   initial?.isPinned  || false,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleRole = (role) =>
    setForm(f => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter(r => r !== role)
        : [...f.targetRoles, role],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim())   errs.title   = 'Title required';
    if (!form.content.trim()) errs.content = 'Content required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetRoles: form.targetType === 'roles' ? form.targetRoles : null,
        startsAt:    form.startsAt  || null,
        expiresAt:   form.expiresAt || null,
      };
      const res = initial?.id
        ? await api.put(`/announcements/${initial.id}`, payload)
        : await api.post('/announcements', payload);
      onSave(res.data);
    } catch (err) {
      setErrors({ _general: err.response?.data?.error || 'Save failed' });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-6)', color: 'var(--color-accent-gold)' }}>
        {initial?.id ? 'Edit Announcement' : 'New Announcement'}
      </h2>
      {errors._general && (
        <div style={{ background: 'rgba(220,38,38,0.1)', color: '#F87171', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', border: '1px solid rgba(220,38,38,0.3)' }}>
          {errors._general}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={lbl}>Title *</label>
            <input style={inp(errors.title)} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title" />
            {errors.title && <span style={errStyle}>{errors.title}</span>}
          </div>
          <div>
            <label style={lbl}>Content *</label>
            <textarea style={{ ...inp(errors.content), minHeight: '120px', resize: 'vertical' }} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Announcement content..." />
            {errors.content && <span style={errStyle}>{errors.content}</span>}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={lbl}>Priority</label>
              <select style={inp()} value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={lbl}>Type</label>
              <select style={inp()} value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={lbl}>Publish At (blank = now)</label>
              <input type="datetime-local" style={inp()} value={form.startsAt} onChange={e => set('startsAt', e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={lbl}>Expires At (optional)</label>
              <input type="datetime-local" style={inp()} value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Target Roles (empty = all roles)</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => toggleRole(r)}
                  style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.targetRoles.includes(r) ? 'var(--color-accent-gold)' : 'var(--color-border)'}`, background: form.targetRoles.includes(r) ? 'rgba(202,163,81,0.2)' : 'transparent', color: form.targetRoles.includes(r) ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={form.isPinned} onChange={e => set('isPinned', e.target.checked)} />
            Pin this announcement
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button type="button" onClick={onCancel}
            style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            style={{ padding: 'var(--space-3) var(--space-8)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'var(--color-accent-gold)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm;
