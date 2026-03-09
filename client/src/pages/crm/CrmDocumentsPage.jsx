import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'contract',       label: 'Contract',       icon: '📝' },
  { value: 'agreement',      label: 'Agreement',      icon: '🤝' },
  { value: 'legal',          label: 'Legal',          icon: '⚖️' },
  { value: 'financial',      label: 'Financial',      icon: '💰' },
  { value: 'permit',         label: 'Permit',         icon: '🏛️' },
  { value: 'certificate',    label: 'Certificate',    icon: '🏅' },
  { value: 'energy_cert',    label: 'Energy Cert',    icon: '⚡' },
  { value: 'report',         label: 'Report',         icon: '📊' },
  { value: 'template',       label: 'Template',       icon: '📋' },
  { value: 'correspondence', label: 'Correspondence', icon: '✉️' },
  { value: 'id_document',    label: 'ID Document',    icon: '🪪' },
  { value: 'floor_plan',     label: 'Floor Plan',     icon: '🗺️' },
  { value: 'brochure',       label: 'Brochure',       icon: '📰' },
  { value: 'photo',          label: 'Photo',          icon: '🖼️' },
  { value: 'other',          label: 'Other',          icon: '📌' },
];

const CATEGORY_CONFIG = {
  contract:       { bg: 'rgba(99,102,241,0.15)',  color: '#a78bfa', border: 'rgba(99,102,241,0.35)' },
  agreement:      { bg: 'rgba(14,165,233,0.15)',  color: '#38bdf8', border: 'rgba(14,165,233,0.35)' },
  legal:          { bg: 'rgba(239,68,68,0.14)',   color: '#f87171', border: 'rgba(239,68,68,0.35)'  },
  financial:      { bg: 'rgba(234,179,8,0.14)',   color: '#fbbf24', border: 'rgba(234,179,8,0.35)'  },
  permit:         { bg: 'rgba(34,197,94,0.14)',   color: '#4ade80', border: 'rgba(34,197,94,0.35)'  },
  certificate:    { bg: 'rgba(168,85,247,0.14)',  color: '#c084fc', border: 'rgba(168,85,247,0.35)' },
  energy_cert:    { bg: 'rgba(249,115,22,0.14)',  color: '#fb923c', border: 'rgba(249,115,22,0.35)' },
  report:         { bg: 'rgba(6,182,212,0.14)',   color: '#22d3ee', border: 'rgba(6,182,212,0.35)'  },
  template:       { bg: 'rgba(16,185,129,0.14)',  color: '#34d399', border: 'rgba(16,185,129,0.35)' },
  correspondence: { bg: 'rgba(245,158,11,0.14)',  color: '#fcd34d', border: 'rgba(245,158,11,0.35)' },
  id_document:    { bg: 'rgba(236,72,153,0.14)',  color: '#f472b6', border: 'rgba(236,72,153,0.35)' },
  floor_plan:     { bg: 'rgba(20,184,166,0.14)',  color: '#2dd4bf', border: 'rgba(20,184,166,0.35)' },
  brochure:       { bg: 'rgba(139,92,246,0.14)',  color: '#a78bfa', border: 'rgba(139,92,246,0.35)' },
  photo:          { bg: 'rgba(52,211,153,0.14)',  color: '#6ee7b7', border: 'rgba(52,211,153,0.35)' },
  other:          { bg: 'rgba(107,114,128,0.14)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
};

const STATUS_CONFIG = {
  draft:          { color: '#9ca3af', bg: 'rgba(107,114,128,0.14)', label: 'Draft',          icon: '✏️' },
  pending_review: { color: '#fbbf24', bg: 'rgba(234,179,8,0.14)',   label: 'Pending Review', icon: '⏳' },
  approved:       { color: '#4ade80', bg: 'rgba(34,197,94,0.14)',   label: 'Approved',       icon: '✅' },
  signed:         { color: '#38bdf8', bg: 'rgba(14,165,233,0.14)',  label: 'Signed',         icon: '✍️' },
  archived:       { color: '#6b7280', bg: 'rgba(75,85,99,0.14)',    label: 'Archived',       icon: '📦' },
  expired:        { color: '#f87171', bg: 'rgba(239,68,68,0.14)',   label: 'Expired',        icon: '🚨' },
};

const ACCEPT_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
].join(',');

const EMPTY_FORM = {
  name: '', description: '', category: 'other', status: 'draft',
  fileUrl: '', fileName: '', fileSize: '', mimeType: '',
  tags: '', expiryDate: '', isConfidential: false,
  propertyId: '', ownerId: '', clientId: '', notes: '',
};

// ─── Style helpers ─────────────────────────────────────────────────────────────

const lbl = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)', textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)',
};

const inp = (err) => ({
  padding: 'var(--space-2) var(--space-3)', borderRadius: '8px',
  border: `1px solid ${err ? '#f87171' : 'rgba(212,175,55,0.2)'}`,
  background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', width: '100%', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
});

const sectionCard = {
  background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)',
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
  cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)', opacity: disabled ? 0.7 : 1,
  transition: 'all 0.2s',
});

const ghostBtn = {
  padding: 'var(--space-2) var(--space-4)', borderRadius: '8px',
  border: '1px solid rgba(212,175,55,0.25)', background: 'transparent',
  color: 'var(--color-text-secondary)', cursor: 'pointer',
  fontSize: 'var(--text-sm)', transition: 'all 0.2s',
};

const segBtn = (active, color) => ({
  padding: 'var(--space-2) var(--space-3)', borderRadius: '8px',
  border: `1px solid ${active ? (color || 'var(--color-accent-gold)') : 'rgba(212,175,55,0.15)'}`,
  background: active ? (color ? `${color}22` : 'rgba(212,175,55,0.12)') : 'transparent',
  color: active ? (color || 'var(--color-accent-gold)') : 'var(--color-text-secondary)',
  cursor: 'pointer', fontSize: 'var(--text-sm)',
  fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)',
  transition: 'all 0.15s', whiteSpace: 'nowrap',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-MT', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isExpired = (doc) => {
  if (!doc.expiryDate) return false;
  return new Date(doc.expiryDate) < new Date();
};

const isExpiringSoon = (doc) => {
  if (!doc.expiryDate || isExpired(doc)) return false;
  const diff = new Date(doc.expiryDate) - new Date();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType === 'text/csv') return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
  if (mimeType === 'text/plain') return '📃';
  if (mimeType.startsWith('video/')) return '🎬';
  return '📄';
};

const userName = (u) => (u ? `${u.firstName} ${u.lastName}` : '—');

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

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color }) => (
  <div style={{ flex: '1 1 150px', minWidth: 0, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${color || 'rgba(212,175,55,0.15)'}`, borderRadius: '16px', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
    <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>{icon}</div>
    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: color || 'var(--color-accent-gold)', fontFamily: 'var(--font-heading)' }}>{value}</div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
  </div>
);

// ─── Document Card (grid) ──────────────────────────────────────────────────────

const DocCard = ({ doc, onView, onEdit, onDelete, canEdit, canDelete, selected, onSelect }) => {
  const expired = isExpired(doc);
  const expiring = isExpiringSoon(doc);
  const borderColor = doc.isConfidential
    ? 'rgba(239,68,68,0.45)'
    : expired
    ? 'rgba(239,68,68,0.4)'
    : expiring
    ? 'rgba(234,179,8,0.4)'
    : 'rgba(212,175,55,0.15)';

  return (
    <div
      onClick={() => onView(doc)}
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${borderColor}`, borderRadius: '16px', padding: 'var(--space-4)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', outline: selected ? `2px solid var(--color-accent-gold)` : 'none', outlineOffset: '1px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); onSelect(doc.id, e.target.checked); }}
            style={{ flexShrink: 0, accentColor: 'var(--color-accent-gold)' }}
          />
          <span style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>{getFileIcon(doc.mimeType)}</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.isConfidential && <span title="Confidential" style={{ marginRight: '4px' }}>🔒</span>}
            {doc.name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          {canEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(doc); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }} title="Edit">✏️</button>}
          {canDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(doc); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }} title="Delete">🗑️</button>}
        </div>
      </div>

      {doc.description && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.description}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {doc.category && <CategoryBadge category={doc.category} />}
        {doc.status && <StatusBadge status={doc.status} />}
        {expired && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#f87171', background: 'rgba(239,68,68,0.14)' }}>🚨 Expired</span>}
        {expiring && !expired && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#fbbf24', background: 'rgba(234,179,8,0.14)' }}>⚠️ Expiring Soon</span>}
      </div>

      {doc.tags && doc.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {doc.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{ padding: '1px 8px', borderRadius: '999px', fontSize: '11px', background: 'rgba(212,175,55,0.1)', color: 'var(--color-accent-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>#{tag}</span>
          ))}
          {doc.tags.length > 3 && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>+{doc.tags.length - 3}</span>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 'var(--space-2)', marginTop: 'auto' }}>
        <span>{doc.expiryDate ? `Exp: ${formatDate(doc.expiryDate)}` : formatDate(doc.createdAt)}</span>
        {doc.uploadedBy && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>👤 {userName(doc.uploadedBy)}</span>}
      </div>
    </div>
  );
};

// ─── File Upload Zone ──────────────────────────────────────────────────────────

const FileUploadZone = ({ onUploaded, uploading, setUploading }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState(null);

  const doUpload = async (file) => {
    setErr(null);
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      onUploaded({ url: res.data.url, fileName: res.data.originalName, fileSize: res.data.size, mimeType: res.data.mimetype });
    } catch (e) {
      setErr(e.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      style={{ border: `2px dashed ${dragging ? 'var(--color-accent-gold)' : 'rgba(212,175,55,0.3)'}`, borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', transition: 'border-color 0.2s', background: dragging ? 'rgba(212,175,55,0.05)' : 'transparent' }}
    >
      <input ref={inputRef} type="file" accept={ACCEPT_TYPES} style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) doUpload(e.target.files[0]); }} />
      {uploading ? (
        <div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Uploading… {progress}%</div>
          <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-accent-gold)', transition: 'width 0.2s' }} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📂</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Drag &amp; drop a file here, or <span style={{ color: 'var(--color-accent-gold)', fontWeight: 'var(--font-semibold)' }}>click to browse</span></div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>PDF, DOC, DOCX, XLS, XLSX, PPT, Images, TXT, CSV — max 100 MB</div>
        </>
      )}
      {err && <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: '#f87171' }}>{err}</div>}
    </div>
  );
};

// ─── Document Form ─────────────────────────────────────────────────────────────

const DocumentForm = ({ initial, onSave, onCancel, properties, clients, owners }) => {
  const [form, setForm] = useState(initial ? {
    name: initial.name || '',
    description: initial.description || '',
    category: initial.category || 'other',
    status: initial.status || 'draft',
    fileUrl: initial.fileUrl || '',
    fileName: initial.fileName || '',
    fileSize: initial.fileSize || '',
    mimeType: initial.mimeType || '',
    tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''),
    expiryDate: initial.expiryDate ? initial.expiryDate.slice(0, 10) : '',
    isConfidential: initial.isConfidential || false,
    propertyId: initial.propertyId || '',
    ownerId: initial.ownerId || '',
    clientId: initial.clientId || '',
    notes: initial.notes || '',
  } : { ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleFileUploaded = ({ url, fileName, fileSize, mimeType }) => {
    setForm((f) => ({
      ...f,
      fileUrl: url,
      fileName,
      fileSize,
      mimeType,
      name: f.name || fileName.replace(/\.[^/.]+$/, ''),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Document name is required';
    if (!form.fileUrl) errs.fileUrl = 'Please upload a file';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const row2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* File Upload */}
      <div style={sectionCard}>
        <div style={sectionTitle}>File Upload</div>
        {form.fileUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: '10px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <span style={{ fontSize: '1.5rem' }}>{getFileIcon(form.mimeType)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: '#4ade80', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.fileName}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{formatSize(form.fileSize)} · {form.mimeType}</div>
            </div>
            <button type="button" onClick={() => setForm((f) => ({ ...f, fileUrl: '', fileName: '', fileSize: '', mimeType: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 'var(--text-sm)' }}>✕</button>
          </div>
        ) : (
          <FileUploadZone onUploaded={handleFileUploaded} uploading={uploading} setUploading={setUploading} />
        )}
        {errors.fileUrl && <span style={{ fontSize: 'var(--text-xs)', color: '#f87171', display: 'block', marginTop: 'var(--space-1)' }}>{errors.fileUrl}</span>}
      </div>

      {/* Basic Info */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Document Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={lbl}>Document Name *</label>
            <input style={inp(errors.name)} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Sale Agreement – Spinola Bay Apartment" />
            {errors.name && <span style={{ fontSize: 'var(--text-xs)', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp(), resize: 'vertical', minHeight: '70px' }} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description of this document…" />
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Category</label>
              <select style={inp()} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Expiry Date</label>
              <input type="date" style={inp()} value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Tags (comma-separated)</label>
              <input style={inp()} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="malta, contract, 2025" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
            <input type="checkbox" checked={form.isConfidential} onChange={(e) => set('isConfidential', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent-gold)' }} />
            🔒 Confidential (hidden from agents)
          </label>
        </div>
      </div>

      {/* Link to Entity */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Link to Property / Client / Owner</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={lbl}>Property</label>
            <select style={inp()} value={form.propertyId} onChange={(e) => set('propertyId', e.target.value)}>
              <option value="">— None —</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.referenceNumber} — {p.title?.slice(0, 30)}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Client</label>
            <select style={inp()} value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="">— None —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Owner</label>
            <select style={inp()} value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)}>
              <option value="">— None —</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Notes</div>
        <textarea style={{ ...inp(), resize: 'vertical', minHeight: '70px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Internal notes about this document…" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-2)' }}>
        <button type="button" style={ghostBtn} onClick={onCancel}>Cancel</button>
        <button type="submit" style={goldBtn(saving || uploading)} disabled={saving || uploading}>
          {saving ? 'Saving…' : uploading ? 'Uploading…' : initial ? 'Save Changes' : 'Add Document'}
        </button>
      </div>
    </form>
  );
};

// ─── Document Detail View ──────────────────────────────────────────────────────

const DocumentDetail = ({ doc, onClose, onEdit, onDelete, canEdit, canDelete, onStatusChange }) => {
  if (!doc) return null;
  const expired = isExpired(doc);
  const expiring = isExpiringSoon(doc);

  const isImage = doc.mimeType?.startsWith('image/');
  const isPdf   = doc.mimeType === 'application/pdf';

  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
        <span style={{ fontSize: '2.5rem', lineHeight: 1, flexShrink: 0 }}>{getFileIcon(doc.mimeType)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
            {doc.isConfidential && <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#f87171', background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.3)' }}>🔒 Confidential</span>}
            {expired && <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#f87171', background: 'rgba(239,68,68,0.14)' }}>🚨 Expired</span>}
            {expiring && !expired && <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#fbbf24', background: 'rgba(234,179,8,0.14)' }}>⚠️ Expiring Soon</span>}
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>{doc.name}</h2>
          {doc.description && <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{doc.description}</p>}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {doc.category && <CategoryBadge category={doc.category} />}
        {doc.status && <StatusBadge status={doc.status} />}
        {doc.tags?.map((t) => <span key={t} style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', background: 'rgba(212,175,55,0.1)', color: 'var(--color-accent-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>#{t}</span>)}
      </div>

      {/* File Preview */}
      {doc.fileUrl && (
        <div style={sectionCard}>
          <div style={sectionTitle}>File Preview</div>
          {isImage && (
            <img src={doc.fileUrl} alt={doc.name} style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'contain' }} />
          )}
          {isPdf && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>PDF documents can be downloaded for viewing.</div>
            </div>
          )}
          {!isImage && (
            <a href={doc.fileUrl} download={doc.fileName} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', borderRadius: '8px', border: '1px solid var(--color-accent-gold)', background: 'rgba(212,175,55,0.1)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', textDecoration: 'none' }}>
              ⬇️ Download {doc.fileName}
            </a>
          )}
        </div>
      )}

      {/* Metadata */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Metadata</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          {[
            { label: 'File Name',    value: doc.fileName || '—' },
            { label: 'File Size',    value: formatSize(doc.fileSize) },
            { label: 'File Type',    value: doc.mimeType || '—' },
            { label: 'Uploaded',     value: formatDate(doc.createdAt) },
            { label: 'Uploaded By',  value: doc.uploadedBy ? userName(doc.uploadedBy) : '—' },
            { label: 'Expiry Date',  value: formatDate(doc.expiryDate) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Entities */}
      {(doc.property || doc.client || doc.owner) && (
        <div style={sectionCard}>
          <div style={sectionTitle}>Linked To</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            {doc.property && (
              <div style={{ flex: '1 1 180px', padding: 'var(--space-3)', borderRadius: '10px', background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>🏠 Property</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{doc.property.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{doc.property.referenceNumber}</div>
              </div>
            )}
            {doc.client && (
              <div style={{ flex: '1 1 180px', padding: 'var(--space-3)', borderRadius: '10px', background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: '#c084fc', textTransform: 'uppercase', marginBottom: '4px' }}>👤 Client</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{doc.client.firstName} {doc.client.lastName}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{doc.client.email}</div>
              </div>
            )}
            {doc.owner && (
              <div style={{ flex: '1 1 180px', padding: 'var(--space-3)', borderRadius: '10px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: '#4ade80', textTransform: 'uppercase', marginBottom: '4px' }}>🏢 Owner</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{doc.owner.firstName} {doc.owner.lastName}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{doc.owner.email}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {doc.notes && (
        <div style={sectionCard}>
          <div style={sectionTitle}>Notes</div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>{doc.notes}</p>
        </div>
      )}

      {/* Status Actions */}
      {onStatusChange && (
        <div style={sectionCard}>
          <div style={sectionTitle}>Change Status</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              doc.status !== key && (
                <button key={key} onClick={() => onStatusChange(doc.id, key)} style={{ ...ghostBtn, color: cfg.color, borderColor: cfg.color + '66', padding: 'var(--space-1) var(--space-3)' }}>
                  {cfg.icon} {cfg.label}
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-2)' }}>
        {canDelete && <button onClick={() => { onClose(); onDelete(doc); }} style={{ ...ghostBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.4)' }}>🗑️ Delete</button>}
        {canEdit && <button onClick={() => { onClose(); onEdit(doc); }} style={ghostBtn}>✏️ Edit</button>}
        <button onClick={onClose} style={goldBtn(false)}>Close</button>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const CrmDocumentsPage = () => {
  usePageTimeTracker('documents_list', { entityType: 'document' });
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const canEdit   = ['admin', 'manager'].includes(user?.role);
  const canDelete = user?.role === 'admin';
  const canCreate = ['admin', 'manager', 'agent'].includes(user?.role);
  const isAdminOrManager = canEdit;

  const [docs,       setDocs]       = useState([]);
  const [stats,      setStats]      = useState({ total: 0, pendingReview: 0, expiringSoon: 0, byCategory: {}, byStatus: {} });
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [search,         setSearch]         = useState('');
  const [category,       setCategory]       = useState('');
  const [status,         setStatus]         = useState('');
  const [confidential,   setConfidential]   = useState('');
  const [view,           setView]           = useState('grid');

  const [mode,     setMode]     = useState('list'); // 'list' | 'form' | 'detail'
  const [selected, setSelected] = useState(null);

  const [properties, setProperties] = useState([]);
  const [clients,    setClients]    = useState([]);
  const [owners,     setOwners]     = useState([]);

  const [checkedIds, setCheckedIds]   = useState([]);
  const [bulkStatus, setBulkStatus]   = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  const fetchDocs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search)       params.search   = search;
      if (category)     params.category = category;
      if (status)       params.status   = status;
      if (isAdminOrManager && confidential) params.isConfidential = confidential;
      const res = await api.get('/documents', { params });
      setDocs(res.data.documents);
      setPagination(res.data.pagination);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, confidential, isAdminOrManager, showError]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/documents/stats');
      setStats(res.data);
    } catch { /* silent */ }
  }, []);

  const loadRelated = useCallback(async () => {
    try {
      const [pRes, cRes, oRes] = await Promise.all([
        api.get('/properties', { params: { limit: 200 } }),
        api.get('/clients',    { params: { limit: 200 } }),
        api.get('/owners',     { params: { limit: 200 } }),
      ]);
      setProperties(pRes.data.properties || []);
      setClients(cRes.data.clients || []);
      setOwners(oRes.data.owners || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchDocs(1); }, [fetchDocs]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { loadRelated(); }, [loadRelated]);

  const handleView = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}`);
      setSelected(res.data);
    } catch { setSelected(doc); }
    setMode('detail');
  };

  const handleEdit = (doc) => { setSelected(doc); setMode('form'); };

  const handleSave = async (formData) => {
    const isEdit = !!selected?.id;
    const payload = { ...formData };
    if (Array.isArray(payload.tags) === false) {
      payload.tags = payload.tags ? payload.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    }
    ['propertyId', 'ownerId', 'clientId'].forEach((f) => { if (!payload[f]) payload[f] = null; });
    if (!payload.expiryDate) payload.expiryDate = null;
    if (!payload.fileSize) delete payload.fileSize;

    try {
      if (isEdit) {
        const res = await api.put(`/documents/${selected.id}`, payload);
        setDocs((prev) => prev.map((d) => d.id === res.data.id ? res.data : d));
        showSuccess('Document updated');
      } else {
        const res = await api.post('/documents', payload);
        setDocs((prev) => [res.data, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
        showSuccess('Document added');
      }
      fetchStats();
      setMode('list');
      setSelected(null);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save document');
      throw err;
    }
  };

  const handleDelete = (doc) => { setDeleteTarget(doc); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/documents/${deleteTarget.id}`);
      setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
      setCheckedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      fetchStats();
      showSuccess('Document deleted');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete document');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.put(`/documents/${id}/status`, { status: newStatus });
      setDocs((prev) => prev.map((d) => d.id === id ? res.data : d));
      if (selected?.id === id) setSelected(res.data);
      fetchStats();
      showSuccess(`Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to change status');
    }
  };

  const toggleCheck = (id, checked) => {
    setCheckedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  };

  const toggleAll = (checked) => {
    setCheckedIds(checked ? docs.map((d) => d.id) : []);
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || checkedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(checkedIds.map((id) => api.put(`/documents/${id}/status`, { status: bulkStatus })));
      fetchDocs(pagination.page);
      fetchStats();
      setCheckedIds([]);
      setBulkStatus('');
      showSuccess(`Updated ${checkedIds.length} document(s) to ${STATUS_CONFIG[bulkStatus]?.label}`);
    } catch (err) {
      showError(err.response?.data?.error || 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (checkedIds.length === 0) return;
    if (!window.confirm(`Delete ${checkedIds.length} document(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await Promise.all(checkedIds.map((id) => api.delete(`/documents/${id}`)));
      setDocs((prev) => prev.filter((d) => !checkedIds.includes(d.id)));
      setPagination((p) => ({ ...p, total: p.total - checkedIds.length }));
      fetchStats();
      setCheckedIds([]);
      showSuccess(`Deleted ${checkedIds.length} document(s)`);
    } catch (err) {
      showError(err.response?.data?.error || 'Bulk delete failed');
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Modal titles ──
  const modalTitle = mode === 'form'
    ? (selected ? 'Edit Document' : 'Add Document')
    : mode === 'detail'
    ? 'Document Details'
    : null;

  // ── Top categories for badge strip ──
  const topCats = Object.entries(stats.byCategory || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>Documents</h1>
          <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Manage contracts, agreements, permits and all property documents
          </p>
        </div>
        {canCreate && (
          <button onClick={() => { setSelected(null); setMode('form'); }} style={goldBtn(false)}>
            + Add Document
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <StatCard label="Total Documents"  value={stats.total}         icon="📄" color="rgba(212,175,55,0.4)" />
        <StatCard label="Pending Review"   value={stats.pendingReview} icon="⏳" color={stats.pendingReview > 0 ? 'rgba(234,179,8,0.4)' : undefined} />
        <StatCard label="Expiring Soon"    value={stats.expiringSoon}  icon="⚠️" color={stats.expiringSoon  > 0 ? 'rgba(249,115,22,0.4)' : undefined} />
        {topCats.length > 0 && (
          <div style={{ flex: '2 1 250px', minWidth: 0, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>By Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {topCats.map(([cat, count]) => {
                const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
                const catLabel = CATEGORIES.find((c) => c.value === cat);
                return (
                  <span key={cat} onClick={() => setCategory(cat === category ? '' : cat)} style={{ padding: '2px 10px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, cursor: 'pointer' }}>
                    {catLabel?.icon} {catLabel?.label || cat} ({count})
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: '4px' }}>
          <button style={segBtn(category === '', 'var(--color-accent-gold)')} onClick={() => setCategory('')}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.value} style={segBtn(category === c.value, CATEGORY_CONFIG[c.value]?.color)} onClick={() => setCategory(category === c.value ? '' : c.value)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Search + dropdowns + view toggle */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              style={{ ...inp(), paddingLeft: '32px' }}
            />
          </div>
          <div style={{ flex: '0 1 160px' }}>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inp()}>
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {isAdminOrManager && (
            <div style={{ flex: '0 1 160px' }}>
              <select value={confidential} onChange={(e) => setConfidential(e.target.value)} style={inp()}>
                <option value="">All Documents</option>
                <option value="true">🔒 Confidential Only</option>
                <option value="false">Public Only</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button style={segBtn(view === 'grid')} onClick={() => setView('grid')} title="Grid view">⊞</button>
            <button style={segBtn(view === 'list')} onClick={() => setView('list')} title="List view">☰</button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {checkedIds.length > 0 && (
        <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent-gold)', fontWeight: 'var(--font-semibold)' }}>{checkedIds.length} selected</span>
          {isAdminOrManager && (
            <>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ ...inp(), width: 'auto', flex: '0 1 160px' }}>
                <option value="">Change status…</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={handleBulkStatusChange} disabled={!bulkStatus || bulkLoading} style={goldBtn(!bulkStatus || bulkLoading)}>Apply</button>
            </>
          )}
          {canDelete && (
            <button onClick={handleBulkDelete} disabled={bulkLoading} style={{ ...ghostBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.4)' }}>🗑️ Delete Selected</button>
          )}
          <button onClick={() => setCheckedIds([])} style={ghostBtn}>Clear</button>
        </div>
      )}

      {/* Document Grid/List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>⏳</div>
          Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>📄</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>No documents found</div>
          <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {search || category || status ? 'Try adjusting your filters' : 'Start by adding your first document'}
          </div>
          {canCreate && !search && !category && !status && (
            <button onClick={() => { setSelected(null); setMode('form'); }} style={goldBtn(false)}>+ Add Document</button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <input type="checkbox" checked={checkedIds.length === docs.length && docs.length > 0} onChange={(e) => toggleAll(e.target.checked)} style={{ accentColor: 'var(--color-accent-gold)' }} title="Select all" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Select all on this page</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {docs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canEdit={canEdit}
                canDelete={canDelete}
                selected={checkedIds.includes(doc.id)}
                onSelect={toggleCheck}
              />
            ))}
          </div>
        </>
      ) : (
        /* List / Table view */
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', width: '32px' }}>
                    <input type="checkbox" checked={checkedIds.length === docs.length && docs.length > 0} onChange={(e) => toggleAll(e.target.checked)} style={{ accentColor: 'var(--color-accent-gold)' }} />
                  </th>
                  {['Document', 'Category', 'Status', 'Linked To', 'Uploaded', 'Expiry', ''].map((h) => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--font-semibold)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => {
                  const expired = isExpired(doc);
                  const expiring = isExpiringSoon(doc);
                  return (
                    <tr key={doc.id} onClick={() => handleView(doc)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: checkedIds.includes(doc.id) ? 'rgba(212,175,55,0.05)' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <input type="checkbox" checked={checkedIds.includes(doc.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); toggleCheck(doc.id, e.target.checked); }} style={{ accentColor: 'var(--color-accent-gold)' }} />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span>{getFileIcon(doc.mimeType)}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.isConfidential && '🔒 '}{doc.name}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{formatSize(doc.fileSize)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>{doc.category && <CategoryBadge category={doc.category} />}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>
                        {doc.status && <StatusBadge status={doc.status} />}
                        {expired && <span style={{ marginLeft: '4px', fontSize: '11px', color: '#f87171' }}>🚨</span>}
                        {expiring && !expired && <span style={{ marginLeft: '4px', fontSize: '11px', color: '#fbbf24' }}>⚠️</span>}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {doc.property && <div>🏠 {doc.property.referenceNumber}</div>}
                        {doc.client && <div>👤 {doc.client.firstName} {doc.client.lastName}</div>}
                        {doc.owner && <div>🏢 {doc.owner.firstName} {doc.owner.lastName}</div>}
                        {!doc.property && !doc.client && !doc.owner && '—'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(doc.createdAt)}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: expired ? '#f87171' : expiring ? '#fbbf24' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(doc.expiryDate)}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          {canEdit && <button onClick={() => handleEdit(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-muted)' }}>✏️</button>}
                          {canDelete && <button onClick={() => handleDelete(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-muted)' }}>🗑️</button>}
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => fetchDocs(p)}
        />
      )}

      {/* Form Modal */}
      <GlassModal isOpen={mode === 'form'} onClose={() => { setMode('list'); setSelected(null); }} title={selected ? 'Edit Document' : 'Add Document'} maxWidth="760px">
        <DocumentForm
          initial={selected}
          onSave={handleSave}
          onCancel={() => { setMode('list'); setSelected(null); }}
          properties={properties}
          clients={clients}
          owners={owners}
        />
      </GlassModal>

      {/* Detail Modal */}
      <GlassModal isOpen={mode === 'detail'} onClose={() => { setMode('list'); setSelected(null); }} title={null} maxWidth="760px">
        <DocumentDetail
          doc={selected}
          onClose={() => { setMode('list'); setSelected(null); }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          onStatusChange={isAdminOrManager ? handleStatusChange : null}
        />
      </GlassModal>

      {/* Delete confirmation */}
      <GlassModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Document" maxWidth="480px">
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <button style={ghostBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button style={{ ...goldBtn(deleteLoading), background: deleteLoading ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.6)', color: 'white' }} disabled={deleteLoading} onClick={confirmDelete}>
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};

export default CrmDocumentsPage;

