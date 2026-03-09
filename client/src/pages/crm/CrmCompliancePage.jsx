import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'aml_kyc',                label: 'AML / KYC',             icon: '🔍' },
  { value: 'property_documentation', label: 'Property Docs',         icon: '📋' },
  { value: 'licensing',              label: 'Licensing',              icon: '📜' },
  { value: 'insurance',              label: 'Insurance',              icon: '🛡️' },
  { value: 'tax_compliance',         label: 'Tax Compliance',         icon: '💰' },
  { value: 'data_protection',        label: 'Data Protection',        icon: '🔒' },
  { value: 'health_safety',          label: 'Health & Safety',        icon: '⚠️' },
  { value: 'other',                  label: 'Other',                  icon: '📌' },
];

const CATEGORY_CONFIG = {
  aml_kyc:                { bg: 'rgba(99,102,241,0.15)',  color: '#a78bfa', border: 'rgba(99,102,241,0.35)' },
  property_documentation: { bg: 'rgba(14,165,233,0.15)',  color: '#38bdf8', border: 'rgba(14,165,233,0.35)' },
  licensing:              { bg: 'rgba(34,197,94,0.14)',   color: '#4ade80', border: 'rgba(34,197,94,0.35)'  },
  insurance:              { bg: 'rgba(168,85,247,0.14)',  color: '#c084fc', border: 'rgba(168,85,247,0.35)' },
  tax_compliance:         { bg: 'rgba(234,179,8,0.14)',   color: '#fbbf24', border: 'rgba(234,179,8,0.35)'  },
  data_protection:        { bg: 'rgba(239,68,68,0.14)',   color: '#f87171', border: 'rgba(239,68,68,0.35)'  },
  health_safety:          { bg: 'rgba(249,115,22,0.14)',  color: '#fb923c', border: 'rgba(249,115,22,0.35)' },
  other:                  { bg: 'rgba(107,114,128,0.14)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
};

const PRIORITY_CONFIG = {
  critical: { color: '#f87171', bg: 'rgba(239,68,68,0.14)',   border: 'rgba(239,68,68,0.4)',   label: 'Critical', icon: '🔴' },
  high:     { color: '#fb923c', bg: 'rgba(249,115,22,0.14)',  border: 'rgba(249,115,22,0.4)',  label: 'High',     icon: '🟠' },
  medium:   { color: '#fbbf24', bg: 'rgba(234,179,8,0.14)',   border: 'rgba(234,179,8,0.4)',   label: 'Medium',   icon: '🟡' },
  low:      { color: '#4ade80', bg: 'rgba(34,197,94,0.14)',   border: 'rgba(34,197,94,0.4)',   label: 'Low',      icon: '🟢' },
};

const STATUS_CONFIG = {
  pending:        { color: '#9ca3af', bg: 'rgba(107,114,128,0.14)', label: 'Pending',     icon: '⏳' },
  in_progress:    { color: '#38bdf8', bg: 'rgba(14,165,233,0.14)',  label: 'In Progress', icon: '🔄' },
  completed:      { color: '#4ade80', bg: 'rgba(34,197,94,0.14)',   label: 'Completed',   icon: '✅' },
  overdue:        { color: '#f87171', bg: 'rgba(239,68,68,0.14)',   label: 'Overdue',     icon: '🚨' },
  not_applicable: { color: '#6b7280', bg: 'rgba(75,85,99,0.14)',    label: 'N/A',         icon: '⊘'  },
};

const INTERVALS = [
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually',  label: 'Annually'  },
];

const MALTA_TEMPLATES = [
  { title: 'AML/KYC Verification',           category: 'aml_kyc',                priority: 'critical', description: 'Anti-Money Laundering and Know Your Customer verification for property transactions as required by FIAU.' },
  { title: 'Energy Performance Certificate', category: 'property_documentation', priority: 'high',     description: 'EPC certificate required for all property sales and long-let agreements in Malta.' },
  { title: 'FIAU Reporting Compliance',      category: 'aml_kyc',                priority: 'critical', description: 'Financial Intelligence Analysis Unit compliance reporting for subject persons in real estate.' },
  { title: 'Planning Authority Permit',      category: 'licensing',              priority: 'high',     description: 'Planning Authority of Malta permit verification for property developments and alterations.' },
  { title: 'Stamp Duty Filing',              category: 'tax_compliance',         priority: 'high',     description: 'Property transfer tax and stamp duty filing with the Commissioner for Revenue.' },
  { title: 'Property Insurance Check',       category: 'insurance',              priority: 'medium',   description: 'Verify adequate building and contents insurance coverage for managed properties.' },
  { title: 'GDPR Data Protection',           category: 'data_protection',        priority: 'high',     description: 'General Data Protection Regulation compliance for client data handling and storage.' },
  { title: 'Sanitary Authority Requirements',category: 'health_safety',          priority: 'medium',   description: 'Malta Sanitary Authority requirements for rental properties including hygiene standards.' },
];

const EMPTY_FORM = {
  title: '', description: '', category: 'other', priority: 'medium',
  status: 'pending', dueDate: '', notes: '',
  assignedToId: '', isRecurring: false, recurringInterval: '',
};

// ─── Style helpers ────────────────────────────────────────────────────────────

const lbl = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)' };

const inp = (err) => ({ padding: 'var(--space-2) var(--space-3)', borderRadius: '8px', border: `1px solid ${err ? '#f87171' : 'rgba(212,175,55,0.2)'}`, background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', width: '100%', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' });

const sectionCard = { background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', padding: 'var(--space-5)' };

const sectionTitle = { fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 'var(--space-4)' };

const goldBtn = (disabled) => ({ padding: 'var(--space-2) var(--space-5)', borderRadius: '8px', border: '1px solid var(--color-accent-gold)', background: disabled ? 'rgba(212,175,55,0.3)' : 'var(--color-accent-gold)', color: disabled ? 'rgba(255,255,255,0.5)' : '#0a0a0f', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', opacity: disabled ? 0.7 : 1, transition: 'all 0.2s' });

const ghostBtn = { padding: 'var(--space-2) var(--space-4)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.25)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 0.2s' };

const segBtn = (active, color) => ({ padding: 'var(--space-2) var(--space-3)', borderRadius: '8px', border: `1px solid ${active ? (color || 'var(--color-accent-gold)') : 'rgba(212,175,55,0.15)'}`, background: active ? (color ? `${color}22` : 'rgba(212,175,55,0.12)') : 'transparent', color: active ? (color || 'var(--color-accent-gold)') : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)', transition: 'all 0.15s', whiteSpace: 'nowrap' });

// ─── Badges ───────────────────────────────────────────────────────────────────

const CategoryBadge = ({ category }) => {
  const cat = CATEGORIES.find((c) => c.value === category);
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cat?.icon} {cat?.label || category}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-MT', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isItemOverdue = (item) => {
  if (!item.dueDate || ['completed', 'not_applicable'].includes(item.status)) return false;
  return new Date(item.dueDate) < new Date();
};

const userName = (u) => (u ? `${u.firstName} ${u.lastName}` : '—');

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color }) => (
  <div style={{ flex: '1 1 150px', minWidth: 0, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${color || 'rgba(212,175,55,0.15)'}`, borderRadius: '16px', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
    <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>{icon}</div>
    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: color || 'var(--color-accent-gold)', fontFamily: 'var(--font-heading)' }}>{value}</div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
  </div>
);

// ─── Item Card (grid) ─────────────────────────────────────────────────────────

const ItemCard = ({ item, onView, onEdit, onDelete, canEdit, canDelete }) => {
  const overdue = isItemOverdue(item);
  return (
    <div
      onClick={() => onView(item)}
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.5)' : 'rgba(212,175,55,0.15)'}`, borderRadius: '16px', padding: 'var(--space-4)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
            {item.priority === 'critical' && <span title="Critical">⚡</span>}
            {overdue && <span title="Overdue">🚨</span>}
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{item.title}</span>
          </div>
          <CategoryBadge category={item.category} />
        </div>
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          {canEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }} title="Edit">✏️</button>}
          {canDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }} title="Delete">🗑️</button>}
        </div>
      </div>

      {item.description && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <PriorityBadge priority={item.priority} />
        <StatusBadge status={item.status} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 'var(--space-2)', marginTop: 'auto' }}>
        <span>{item.dueDate ? `Due: ${formatDate(item.dueDate)}` : 'No due date'}</span>
        {item.assignedTo && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>👤 {userName(item.assignedTo)}</span>}
      </div>
    </div>
  );
};

// ─── Compliance Form ──────────────────────────────────────────────────────────

const ComplianceForm = ({ initial, onSave, onCancel, users }) => {
  const [form, setForm] = useState(initial ? {
    title: initial.title || '',
    description: initial.description || '',
    category: initial.category || 'other',
    priority: initial.priority || 'medium',
    status: initial.status || 'pending',
    dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '',
    notes: initial.notes || '',
    assignedToId: initial.assignedToId || '',
    isRecurring: initial.isRecurring || false,
    recurringInterval: initial.recurringInterval || '',
  } : { ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const row2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={sectionCard}>
        <div style={sectionTitle}>Basic Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={lbl}>Title *</label>
            <input style={inp(errors.title)} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. AML/KYC Check" />
            {errors.title && <span style={{ fontSize: 'var(--text-xs)', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.title}</span>}
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp(), resize: 'vertical', minHeight: '80px' }} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the compliance requirement…" />
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Category</label>
              <select style={inp()} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Priority</label>
              <select style={inp()} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Due Date</label>
              <input type="date" style={inp()} value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>Assignment &amp; Notes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={lbl}>Assign To</label>
            <select style={inp()} value={form.assignedToId} onChange={(e) => set('assignedToId', e.target.value)}>
              <option value="">— Unassigned —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp(), resize: 'vertical', minHeight: '70px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Additional notes…" />
          </div>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>Recurring Schedule</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => set('isRecurring', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent-gold)' }} />
            This is a recurring compliance item
          </label>
          {form.isRecurring && (
            <div>
              <label style={lbl}>Recurring Interval</label>
              <select style={inp()} value={form.recurringInterval} onChange={(e) => set('recurringInterval', e.target.value)}>
                <option value="">Select interval…</option>
                {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-2)' }}>
        <button type="button" style={ghostBtn} onClick={onCancel}>Cancel</button>
        <button type="submit" style={goldBtn(saving)} disabled={saving}>{saving ? 'Saving…' : (initial ? 'Save Changes' : 'Create Item')}</button>
      </div>
    </form>
  );
};

// ─── Detail View ──────────────────────────────────────────────────────────────

const ComplianceDetail = ({ item, onClose, onEdit, onStatusChange, canEdit, canDelete, onDelete }) => {
  const overdue = isItemOverdue(item);

  const actionBtn = (label, newStatus, color) => (
    <button onClick={() => onStatusChange(item, newStatus)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: '8px', border: `1px solid ${color}`, background: `${color}22`, color, cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', transition: 'all 0.2s' }}>
      {label}
    </button>
  );

  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-3)', lineHeight: 1.3 }}>
          {item.priority === 'critical' && '⚡ '}{overdue && '🚨 '}{item.title}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <CategoryBadge category={item.category} />
          <PriorityBadge priority={item.priority} />
          <StatusBadge status={item.status} />
          {item.isRecurring && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '999px', fontSize: 'var(--text-xs)', color: '#38bdf8', background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)' }}>
              🔁 Recurring ({item.recurringInterval || '—'})
            </span>
          )}
        </div>
      </div>

      {/* Status actions */}
      {!['not_applicable'].includes(item.status) && (
        <div style={{ ...sectionCard, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 'var(--space-2)' }}>Change Status:</span>
          {item.status !== 'pending'        && actionBtn('Pending',        'pending',        '#9ca3af')}
          {item.status !== 'in_progress'    && actionBtn('In Progress',    'in_progress',    '#38bdf8')}
          {item.status !== 'completed'      && actionBtn('Completed ✅',   'completed',      '#4ade80')}
          {item.status !== 'overdue'        && actionBtn('Overdue',        'overdue',        '#f87171')}
          {item.status !== 'not_applicable' && actionBtn('N/A',            'not_applicable', '#6b7280')}
        </div>
      )}

      {/* Details grid */}
      <div style={{ ...sectionCard, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 'var(--space-4)' }}>
        {[
          { label: 'Due Date',     value: formatDate(item.dueDate),        color: overdue ? '#f87171' : undefined },
          { label: 'Completed',    value: formatDate(item.completedDate),   color: item.completedDate ? '#4ade80' : undefined, hide: !item.completedDate },
          { label: 'Assigned To',  value: userName(item.assignedTo) },
          { label: 'Completed By', value: userName(item.completedBy),       hide: !item.completedBy },
          { label: 'Created By',   value: userName(item.createdBy) },
          { label: 'Created',      value: formatDate(item.createdAt) },
        ].filter((r) => !r.hide).map((r) => (
          <div key={r.label}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.label}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: r.color || 'var(--color-text-primary)', fontWeight: 'var(--font-semibold)' }}>{r.value}</div>
          </div>
        ))}
      </div>

      {item.description && (
        <div style={sectionCard}>
          <div style={sectionTitle}>Description</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.description}</p>
        </div>
      )}

      {item.notes && (
        <div style={sectionCard}>
          <div style={sectionTitle}>Notes</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.notes}</p>
        </div>
      )}

      {(item.property || item.client) && (
        <div style={{ ...sectionCard, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {item.property && (
            <div style={{ background: 'rgba(14,165,233,0.07)', borderRadius: '12px', padding: 'var(--space-3)', border: '1px solid rgba(14,165,233,0.2)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🏠 Linked Property</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-semibold)' }}>{item.property.title}</div>
              {item.property.referenceNumber && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Ref: {item.property.referenceNumber}</div>}
            </div>
          )}
          {item.client && (
            <div style={{ background: 'rgba(99,102,241,0.07)', borderRadius: '12px', padding: 'var(--space-3)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: '#a78bfa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>👤 Linked Client</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-semibold)' }}>{item.client.firstName} {item.client.lastName}</div>
              {item.client.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{item.client.email}</div>}
            </div>
          )}
        </div>
      )}

      {item.attachments && item.attachments.length > 0 && (
        <div style={sectionCard}>
          <div style={sectionTitle}>Attachments ({item.attachments.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {item.attachments.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-accent-gold)', textDecoration: 'none' }}>
                📎 {url.split('/').pop() || `Attachment ${i + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-2)' }}>
        {canDelete && <button style={{ ...ghostBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }} onClick={() => onDelete(item)}>Delete</button>}
        {canEdit   && <button style={goldBtn(false)} onClick={() => onEdit(item)}>Edit Item</button>}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CrmCompliancePage = () => {
  usePageTimeTracker('compliance_list', { entityType: 'compliance' });
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const canEdit   = ['admin', 'manager'].includes(user?.role);
  const canDelete = user?.role === 'admin';
  const canCreate = ['admin', 'manager'].includes(user?.role);

  const [items,      setItems]      = useState([]);
  const [stats,      setStats]      = useState({ total: 0, overdue: 0, dueThisWeek: 0, completedThisMonth: 0, complianceScore: 100 });
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [users,      setUsers]      = useState([]);

  const [search,         setSearch]         = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [viewMode,       setViewMode]       = useState('grid');

  const [mode,     setMode]     = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get('/compliance/stats');
      setStats(r.data);
    } catch { /* silent */ }
  }, []);

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)         params.set('search',   search);
      if (filterStatus)   params.set('status',   filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      if (filterPriority) params.set('priority', filterPriority);
      const r = await api.get(`/compliance?${params}`);
      setItems(r.data.items || []);
      setPagination(r.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch {
      showError('Failed to load compliance items');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterCategory, filterPriority, showError]);

  const fetchUsers = useCallback(async () => {
    try {
      const r = await api.get('/users?limit=100');
      setUsers(r.data.users || r.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (canCreate) fetchUsers(); }, [canCreate, fetchUsers]);

  // Debounced search re-fetch
  useEffect(() => {
    const t = setTimeout(() => fetchItems(1), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  // Re-fetch when filters change (but not search — that's debounced above)
  useEffect(() => { fetchItems(1); }, [filterStatus, filterCategory, filterPriority]); // eslint-disable-line

  const handleSave = async (formData) => {
    try {
      if (selected) {
        const r = await api.put(`/compliance/${selected.id}`, formData);
        setItems((prev) => prev.map((i) => (i.id === selected.id ? r.data : i)));
        showSuccess('Compliance item updated');
      } else {
        const r = await api.post('/compliance', formData);
        setItems((prev) => [r.data, ...prev]);
        showSuccess('Compliance item created');
      }
      setMode(null);
      setSelected(null);
      fetchStats();
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to save');
      throw err;
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      const r = await api.put(`/compliance/${item.id}`, { status: newStatus });
      setItems((prev) => prev.map((i) => (i.id === item.id ? r.data : i)));
      if (selected?.id === item.id) setSelected(r.data);
      showSuccess('Status updated');
      fetchStats();
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/compliance/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (mode === 'detail') { setMode(null); setSelected(null); }
      showSuccess('Compliance item deleted');
      fetchStats();
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to delete');
    }
  };

  const handleCreateFromTemplate = async (tpl) => {
    try {
      const r = await api.post('/compliance', { ...tpl, status: 'pending' });
      setItems((prev) => [r.data, ...prev]);
      showSuccess(`"${tpl.title}" added`);
      fetchStats();
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to create from template');
    }
  };

  const closeModal = () => { setMode(null); setSelected(null); };
  const scoreColor = stats.complianceScore >= 80 ? '#4ade80' : stats.complianceScore >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>🛡️ Malta Compliance</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: '4px 0 0' }}>AML, KYC, and regulatory compliance checklists for Malta real estate</p>
        </div>
        {canCreate && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button style={ghostBtn} onClick={() => setMode('templates')}>📋 Templates</button>
            <button style={goldBtn(false)} onClick={() => { setSelected(null); setMode('form'); }}>+ Add Item</button>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <StatCard label="Total Items"     value={stats.total}              icon="📊" />
        <StatCard label="Overdue"         value={stats.overdue}            icon="🚨" color={stats.overdue > 0 ? '#f87171' : undefined} />
        <StatCard label="Due This Week"   value={stats.dueThisWeek}        icon="⏰" color={stats.dueThisWeek > 0 ? '#fbbf24' : undefined} />
        <StatCard label="Done This Month" value={stats.completedThisMonth} icon="✅" color="#4ade80" />
        <StatCard label="Score"           value={`${stats.complianceScore}%`} icon="🎯" color={scoreColor} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input style={{ ...inp(), paddingLeft: '36px' }} placeholder="Search compliance items…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { value: '',               label: 'All' },
            { value: 'pending',        label: 'Pending' },
            { value: 'in_progress',    label: 'In Progress' },
            { value: 'completed',      label: 'Completed' },
            { value: 'overdue',        label: 'Overdue' },
            { value: 'not_applicable', label: 'N/A' },
          ].map((s) => (
            <button key={s.value} style={segBtn(filterStatus === s.value, STATUS_CONFIG[s.value]?.color)} onClick={() => setFilterStatus(s.value)}>
              {s.label}
            </button>
          ))}
        </div>

        <select style={{ ...inp(), width: 'auto', minWidth: '160px' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>

        <select style={{ ...inp(), width: 'auto', minWidth: '140px' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          <button style={segBtn(viewMode === 'grid')} onClick={() => setViewMode('grid')} title="Grid view">⊞</button>
          <button style={segBtn(viewMode === 'list')} onClick={() => setViewMode('list')} title="List view">☰</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }} role="status" aria-live="polite">Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ ...sectionCard, textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🛡️</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>No compliance items found</div>
          {canCreate && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={ghostBtn} onClick={() => setMode('templates')}>Browse Templates</button>
              <button style={goldBtn(false)} onClick={() => { setSelected(null); setMode('form'); }}>Create Your First Item</button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item}
              onView={(i) => { setSelected(i); setMode('detail'); }}
              onEdit={(i) => { setSelected(i); setMode('form'); }}
              onDelete={handleDelete}
              canEdit={canEdit} canDelete={canDelete}
            />
          ))}
        </div>
      ) : (
        <div style={{ ...sectionCard, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                  {['Title', 'Category', 'Priority', 'Status', 'Due Date', 'Assigned To', ''].map((h) => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'var(--font-semibold)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const overdue = isItemOverdue(item);
                  return (
                    <tr key={item.id}
                      onClick={() => { setSelected(item); setMode('detail'); }}
                      style={{ borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.priority === 'critical' && <span>⚡</span>}
                          {overdue && <span>🚨</span>}
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>{item.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}><CategoryBadge category={item.category} /></td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}><PriorityBadge priority={item.priority} /></td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={item.status} /></td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: overdue ? '#f87171' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(item.dueDate)}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{item.assignedTo ? userName(item.assignedTo) : '—'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          {canEdit   && <button onClick={() => { setSelected(item); setMode('form'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}>✏️</button>}
                          {canDelete && <button onClick={() => handleDelete(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={fetchItems} limit={pagination.limit} />
      )}

      {/* Add / Edit Modal */}
      <GlassModal isOpen={mode === 'form'} onClose={closeModal} title={selected ? 'Edit Compliance Item' : 'New Compliance Item'} maxWidth="680px">
        <ComplianceForm initial={selected} onSave={handleSave} onCancel={closeModal} users={users} />
      </GlassModal>

      {/* Detail Modal */}
      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="780px">
        {selected && (
          <ComplianceDetail item={selected} onClose={closeModal}
            onEdit={(i) => { setSelected(i); setMode('form'); }}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            canEdit={canEdit} canDelete={canDelete}
          />
        )}
      </GlassModal>

      {/* Templates Modal */}
      <GlassModal isOpen={mode === 'templates'} onClose={() => setMode(null)} title="Malta Compliance Templates" maxWidth="700px">
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Pre-built compliance items tailored for Malta real estate regulations. Click to add to your checklist.
          </p>
          {MALTA_TEMPLATES.map((tpl, i) => (
            <div key={i} style={{ ...sectionCard, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{tpl.title}</span>
                  <CategoryBadge category={tpl.category} />
                  <PriorityBadge priority={tpl.priority} />
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>{tpl.description}</p>
              </div>
              <button style={{ ...goldBtn(false), flexShrink: 0, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)' }} onClick={() => handleCreateFromTemplate(tpl)}>
                + Add
              </button>
            </div>
          ))}
        </div>
      </GlassModal>
    </div>
  );
};

export default CrmCompliancePage;
