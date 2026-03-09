import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '',            label: 'All' },
  { value: 'legal',       label: 'Legal' },
  { value: 'financial',   label: 'Financial' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'insurance',   label: 'Insurance' },
  { value: 'moving',      label: 'Moving' },
  { value: 'renovation',  label: 'Renovation' },
  { value: 'consulting',  label: 'Consulting' },
  { value: 'other',       label: 'Other' },
];

const PRICE_TYPES = [
  { value: '',            label: 'Select…' },
  { value: 'fixed',       label: 'Fixed' },
  { value: 'hourly',      label: 'Hourly' },
  { value: 'percentage',  label: 'Percentage' },
  { value: 'negotiable',  label: 'Negotiable' },
  { value: 'free',        label: 'Free' },
];

const CATEGORY_COLORS = {
  legal:       { bg: '#1e3a5f', color: '#7ec8e3' },
  financial:   { bg: '#1a3d2b', color: '#6fcf97' },
  maintenance: { bg: '#3d2b0a', color: '#f2994a' },
  insurance:   { bg: '#2d1b4e', color: '#bb8fce' },
  moving:      { bg: '#1c3c4a', color: '#56c3d1' },
  renovation:  { bg: '#4a2020', color: '#eb5757' },
  consulting:  { bg: '#2a2a1a', color: '#c8b400' },
  other:       { bg: '#2a2a2a', color: '#aaa' },
};

const EMPTY_FORM = {
  name: '',
  category: '',
  description: '',
  provider: '',
  providerEmail: '',
  providerPhone: '',
  providerWebsite: '',
  price: '',
  priceCurrency: 'EUR',
  priceType: '',
  isActive: true,
  isFeatured: false,
  notes: '',
  image: '',
};

// ─── Helper components ────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  if (!category) return null;
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const label = CATEGORIES.find(x => x.value === category)?.label || category;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-semibold)',
      background: c.bg,
      color: c.color,
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
}

function PriceDisplay({ price, priceCurrency, priceType }) {
  if (priceType === 'free') return <span style={{ color: '#6fcf97', fontWeight: 600 }}>Free</span>;
  if (priceType === 'negotiable') return <span style={{ color: 'var(--color-text-muted)' }}>Negotiable</span>;
  if (!price && price !== 0) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  const suffix = priceType === 'hourly' ? '/hr' : priceType === 'percentage' ? '%' : '';
  const sym = priceCurrency === 'EUR' ? '€' : (priceCurrency || '€');
  return (
    <span style={{ color: 'var(--color-accent-gold)', fontWeight: 600 }}>
      {sym}{Number(price).toLocaleString()}{suffix}
    </span>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({ service, onView, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        cursor: 'pointer',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        border: service.isFeatured ? '1px solid var(--color-accent-gold)' : '1px solid var(--color-border)',
        position: 'relative',
      }}
      onClick={() => onView(service)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {service.isFeatured && (
        <span style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', color: 'var(--color-accent-gold)', fontSize: '18px' }} title="Featured">★</span>
      )}

      {/* Image */}
      {service.image && (
        <div style={{ width: '100%', height: '120px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 'var(--space-3)', background: 'var(--color-surface-raised)' }}>
          <img src={service.image} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Category badge */}
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <CategoryBadge category={service.category} />
        {!service.isActive && (
          <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>inactive</span>
        )}
      </div>

      {/* Name */}
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)', lineHeight: 1.3 }}>
        {service.name}
      </h3>

      {/* Provider */}
      {service.provider && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
          {service.provider}
        </p>
      )}

      {/* Description */}
      {service.description && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {service.description}
        </p>
      )}

      {/* Price */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <PriceDisplay price={service.price} priceCurrency={service.priceCurrency} priceType={service.priceType} />
      </div>

      {/* Actions */}
      {(canEdit || canDelete) && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }} onClick={e => e.stopPropagation()}>
          {canEdit && (
            <button onClick={() => onEdit(service)} style={actionBtnStyle}>Edit</button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(service)} style={{ ...actionBtnStyle, borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>Delete</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Service Table ────────────────────────────────────────────────────────────

function ServiceTable({ services, onView, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
          {['Name', 'Category', 'Provider', 'Price', 'Status', 'Actions'].map(h => (
            <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {services.map(s => (
          <tr
            key={s.id}
            style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background var(--transition-fast)' }}
            onClick={() => onView(s)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-raised)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>
              {s.isFeatured && <span style={{ color: 'var(--color-accent-gold)', marginRight: '6px' }}>★</span>}
              {s.name}
            </td>
            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <CategoryBadge category={s.category} />
            </td>
            <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
              {s.provider || '—'}
            </td>
            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <PriceDisplay price={s.price} priceCurrency={s.priceCurrency} priceType={s.priceType} />
            </td>
            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: 'var(--text-xs)',
                background: s.isActive ? '#1a3d2b' : 'var(--color-surface-raised)',
                color: s.isActive ? '#6fcf97' : 'var(--color-text-muted)',
              }}>
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td style={{ padding: 'var(--space-3) var(--space-4)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {canEdit && <button onClick={() => onEdit(s)} style={actionBtnStyle}>Edit</button>}
                {canDelete && <button onClick={() => onDelete(s)} style={{ ...actionBtnStyle, borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>Delete</button>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Service Detail ───────────────────────────────────────────────────────────

function ServiceDetail({ service, onEdit, onClose, canEdit, canDelete, onDelete }) {
  if (!service) return null;
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <CategoryBadge category={service.category} />
            {service.isFeatured && <span style={{ color: 'var(--color-accent-gold)', fontSize: '20px' }} title="Featured">★ Featured</span>}
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            {service.name}
          </h2>
          {service.provider && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{service.provider}</p>}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {canEdit && <button onClick={() => onEdit(service)} style={addBtnStyle}>Edit</button>}
          {canDelete && <button onClick={() => onDelete(service)} style={{ ...addBtnStyle, background: 'transparent', borderColor: 'var(--color-error)', color: 'var(--color-error)', boxShadow: 'none' }}>Delete</button>}
        </div>
      </div>

      {service.image && (
        <div style={{ width: '100%', maxHeight: '240px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
          <img src={service.image} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <DetailField label="Price" value={<PriceDisplay price={service.price} priceCurrency={service.priceCurrency} priceType={service.priceType} />} />
        <DetailField label="Status" value={service.isActive ? 'Active' : 'Inactive'} />
        {service.providerEmail && <DetailField label="Email" value={<a href={`mailto:${service.providerEmail}`} style={{ color: 'var(--color-accent-gold)' }}>{service.providerEmail}</a>} />}
        {service.providerPhone && <DetailField label="Phone" value={<a href={`tel:${service.providerPhone}`} style={{ color: 'var(--color-accent-gold)' }}>{service.providerPhone}</a>} />}
        {service.providerWebsite && <DetailField label="Website" value={<a href={service.providerWebsite} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-gold)' }}>{service.providerWebsite}</a>} />}
      </div>

      {service.description && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>Description</h4>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>{service.description}</p>
        </div>
      )}

      {service.notes && (
        <div>
          <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>Notes</h4>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>{service.notes}</p>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-semibold)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{value}</div>
    </div>
  );
}

// ─── Service Form ─────────────────────────────────────────────────────────────

function ServiceForm({ initial, onSave, onCancel }) {
  const { showError, showSuccess } = useToast();
  const [form, setForm] = useState(initial ? {
    name: initial.name || '',
    category: initial.category || '',
    description: initial.description || '',
    provider: initial.provider || '',
    providerEmail: initial.providerEmail || '',
    providerPhone: initial.providerPhone || '',
    providerWebsite: initial.providerWebsite || '',
    price: initial.price != null ? String(initial.price) : '',
    priceCurrency: initial.priceCurrency || 'EUR',
    priceType: initial.priceType || '',
    isActive: initial.isActive !== false,
    isFeatured: !!initial.isFeatured,
    notes: initial.notes || '',
    image: initial.image || '',
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showError('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price !== '' ? parseFloat(form.price) : null,
        category: form.category || null,
        priceType: form.priceType || null,
      };
      let saved;
      if (initial?.id) {
        const res = await api.put(`/services/${initial.id}`, payload);
        saved = res.data;
      } else {
        const res = await api.post('/services', payload);
        saved = res.data;
      }
      showSuccess(initial?.id ? 'Service updated' : 'Service created');
      onSave(saved);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-6)' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-5)' }}>
        {initial?.id ? 'Edit Service' : 'Add Service'}
      </h2>

      {/* Basic Info */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SectionLabel>Basic Information</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <FormField label="Name *">
            <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle} placeholder="e.g. Home Inspection" />
          </FormField>
          <FormField label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </FormField>
          <FormField label="Description" style={{ gridColumn: '1 / -1' }}>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief description of the service" />
          </FormField>
        </div>
      </div>

      {/* Provider Info */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SectionLabel>Provider Details</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <FormField label="Provider Name">
            <input value={form.provider} onChange={e => set('provider', e.target.value)} style={inputStyle} placeholder="Company or person name" />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.providerEmail} onChange={e => set('providerEmail', e.target.value)} style={inputStyle} placeholder="provider@example.com" />
          </FormField>
          <FormField label="Phone">
            <input value={form.providerPhone} onChange={e => set('providerPhone', e.target.value)} style={inputStyle} placeholder="+356 1234 5678" />
          </FormField>
          <FormField label="Website">
            <input value={form.providerWebsite} onChange={e => set('providerWebsite', e.target.value)} style={inputStyle} placeholder="https://..." />
          </FormField>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SectionLabel>Pricing</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          <FormField label="Price">
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle} placeholder="0.00" />
          </FormField>
          <FormField label="Currency">
            <input value={form.priceCurrency} onChange={e => set('priceCurrency', e.target.value.toUpperCase().slice(0, 3))} style={inputStyle} placeholder="EUR" maxLength={3} />
          </FormField>
          <FormField label="Price Type">
            <select value={form.priceType} onChange={e => set('priceType', e.target.value)} style={inputStyle}>
              {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </FormField>
        </div>
      </div>

      {/* Image & Flags */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SectionLabel>Additional</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <FormField label="Image URL">
            <input value={form.image} onChange={e => set('image', e.target.value)} style={inputStyle} placeholder="https://..." />
          </FormField>
          <FormField label="Notes" style={{ gridColumn: '1 / -1' }}>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Internal notes" />
          </FormField>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ accentColor: 'var(--color-accent-gold)' }} />
              Active
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} style={{ accentColor: 'var(--color-accent-gold)' }} />
              ★ Featured
            </label>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" disabled={saving} style={addBtnStyle}>{saving ? 'Saving…' : (initial?.id ? 'Update Service' : 'Add Service')}</button>
      </div>
    </form>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-accent-gold)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
      {children}
    </div>
  );
}

function FormField({ label, children, style: extraStyle }) {
  return (
    <div style={extraStyle}>
      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CrmServicesPage = () => {
  usePageTimeTracker('services_list', { entityType: 'service' });
  const { user } = useAuth();
  const role = user?.role;
  const { showError, showSuccess } = useToast();

  const canCreate = role === 'admin' || role === 'manager';
  const canEdit   = role === 'admin' || role === 'manager';
  const canDelete = role === 'admin';

  const [services, setServices]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [view, setView]             = useState('grid');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [mode, setMode]             = useState('list'); // 'list' | 'form' | 'detail'
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  const fetchServices = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search)   params.search   = search;
      if (category) params.category = category;
      const res = await api.get('/services', { params });
      setServices(res.data.services);
      setPagination(res.data.pagination);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load services';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, category, showError]);

  useEffect(() => { fetchServices(1); }, [fetchServices]);

  const handleView = async (service) => {
    try {
      const res = await api.get(`/services/${service.id}`);
      setSelected(res.data);
    } catch {
      setSelected(service);
    }
    setMode('detail');
  };

  const handleEdit = (service) => {
    setSelected(service);
    setMode('form');
  };

  const handleSave = (saved) => {
    setServices(prev => {
      const exists = prev.find(s => s.id === saved.id);
      if (exists) return prev.map(s => s.id === saved.id ? saved : s);
      return [saved, ...prev];
    });
    setPagination(p => ({ ...p, total: p.total + (services.find(x => x.id === saved.id) ? 0 : 1) }));
    setMode('list');
    setSelected(null);
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Delete service "${service.name}"?`)) return;
    try {
      await api.delete(`/services/${service.id}`);
      setServices(prev => prev.filter(s => s.id !== service.id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      setMode('list');
      setSelected(null);
      showSuccess('Service deleted');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete service');
    }
  };

  const closeModal = () => { setMode('list'); setSelected(null); };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            Services Directory
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {loading ? 'Loading…' : `${pagination.total} service${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {['grid', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: 'var(--space-2) var(--space-4)',
                border: 'none',
                background: view === v ? 'var(--color-accent-gold)' : 'transparent',
                color: view === v ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                transition: 'all var(--transition-fast)',
              }}>
                {v === 'grid' ? '⊞ Grid' : '☰ List'}
              </button>
            ))}
          </div>
          {canCreate && (
            <button onClick={() => { setSelected(null); setMode('form'); }} style={addBtnStyle}>
              + Add Service
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {CATEGORIES.map(c => {
          const isActive = category === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full, 9999px)',
                border: isActive ? '1px solid var(--color-accent-gold)' : '1px solid var(--color-border)',
                background: isActive ? 'var(--color-accent-gold)' : 'var(--color-surface-glass)',
                color: isActive ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or provider…"
          style={{ ...inputStyle, maxWidth: '400px', background: 'var(--color-surface-glass)' }}
        />
      </div>

      {/* Pagination — top */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={p => fetchServices(p)}
        limit={pagination.limit}
        style={{ marginBottom: 'var(--space-4)' }}
      />

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass" style={{ height: '200px', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && services.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🛎️</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>No services found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your filters or add a new service.</p>
        </div>
      )}

      {/* Grid view */}
      {!loading && services.length > 0 && view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {services.map(s => (
            <ServiceCard
              key={s.id}
              service={s}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {!loading && services.length > 0 && view === 'list' && (
        <div className="glass crm-table-wrapper" style={{ borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
          <ServiceTable
            services={services}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      )}

      {/* Pagination — bottom */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={p => fetchServices(p)}
        limit={pagination.limit}
      />

      {/* Form modal */}
      <GlassModal isOpen={mode === 'form'} onClose={closeModal} maxWidth="860px">
        <ServiceForm
          initial={selected}
          onSave={handleSave}
          onCancel={closeModal}
        />
      </GlassModal>

      {/* Detail modal */}
      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="700px">
        <ServiceDetail
          service={selected}
          onEdit={s => { setSelected(s); setMode('form'); }}
          onClose={closeModal}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </GlassModal>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const addBtnStyle = {
  padding: 'var(--space-3) var(--space-5)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-accent-gold)',
  background: 'var(--color-accent-gold)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  boxShadow: 'var(--shadow-gold-sm)',
  whiteSpace: 'nowrap',
};

const cancelBtnStyle = {
  padding: 'var(--space-3) var(--space-5)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
};

const actionBtnStyle = {
  padding: 'var(--space-1) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  transition: 'all var(--transition-fast)',
};

const inputStyle = {
  width: '100%',
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  boxSizing: 'border-box',
};

export default CrmServicesPage;
