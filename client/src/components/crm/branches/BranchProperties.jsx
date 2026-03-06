import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import Pagination from '../../ui/Pagination';

const STATUS_COLORS = {
  draft:       { bg: 'rgba(107,114,128,0.15)', color: 'var(--color-text-muted)' },
  listed:      { bg: 'rgba(13,110,253,0.15)',  color: 'var(--color-primary)' },
  under_offer: { bg: 'rgba(255,193,7,0.15)',   color: 'var(--color-accent-gold)' },
  sold:        { bg: 'rgba(34,197,94,0.15)',   color: 'var(--color-success)' },
  rented:      { bg: 'rgba(34,197,94,0.15)',   color: 'var(--color-success)' },
  withdrawn:   { bg: 'rgba(220,53,69,0.15)',   color: 'var(--color-error)' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '999px', background: c.bg, color: c.color, textTransform: 'capitalize' }}>
      {status?.replace('_', ' ') || '—'}
    </span>
  );
};

const formatPrice = (price, currency = 'EUR') => {
  if (price == null) return '—';
  return new Intl.NumberFormat('en-MT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
};

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Listed', value: 'listed' },
  { label: 'Under Offer', value: 'under_offer' },
  { label: 'Sold', value: 'sold' },
  { label: 'Rented', value: 'rented' },
  { label: 'Draft', value: 'draft' },
];

const BranchProperties = ({ branchId }) => {
  const { showError } = useToast();
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback((page = 1) => {
    if (!branchId) return;
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    api.get(`/branches/${branchId}/properties`, { params })
      .then(r => {
        setProperties(r.data.properties || []);
        setPagination(r.data.pagination || {});
      })
      .catch((err) => { console.error('BranchProperties error:', err); showError('Failed to load properties'); })
      .finally(() => setLoading(false));
  }, [branchId, statusFilter]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      {/* Status filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            style={{
              padding: '4px 12px',
              borderRadius: '999px',
              border: statusFilter === f.value ? '1px solid var(--color-accent-gold)' : '1px solid var(--color-border)',
              background: statusFilter === f.value ? 'var(--color-accent-gold)' : 'transparent',
              color: statusFilter === f.value ? '#fff' : 'var(--color-text-secondary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              fontWeight: statusFilter === f.value ? 'var(--font-semibold)' : 'var(--font-normal)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={load}
        limit={pagination.limit}
        style={{ marginBottom: 'var(--space-4)' }}
      />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass" style={{ height: 180, borderRadius: 'var(--radius-md)', opacity: 0.5 }} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '40px', marginBottom: 'var(--space-3)' }}>🏘</div>
          <p>No properties found{statusFilter ? ' for this filter' : ' in this branch'}.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {properties.map(p => (
            <div
              key={p.id}
              className="glass"
              style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              {/* Image */}
              <div style={{ height: 120, background: 'var(--color-surface-glass)', flexShrink: 0, overflow: 'hidden' }}>
                {p.heroImage
                  ? <img src={p.heroImage} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🏠</div>
                }
              </div>

              {/* Details */}
              <div style={{ padding: 'var(--space-3)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', flex: 1, lineHeight: '1.3' }}>
                    {p.title}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  📍 {p.locality}
                  {p.bedrooms != null && ` · ${p.bedrooms} bd`}
                  {p.bathrooms != null && ` · ${p.bathrooms} ba`}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', marginTop: 'auto' }}>
                  {formatPrice(p.price, p.currency)}
                </div>
                {p.agent && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    👤 {p.agent.firstName} {p.agent.lastName}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={load}
        limit={pagination.limit}
      />
    </div>
  );
};

export default BranchProperties;
