import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import Pagination from '../../ui/Pagination';

const STATUS_COLORS = {
  active:      { bg: 'rgba(13,110,253,0.15)',  color: 'var(--color-primary)' },
  matched:     { bg: 'rgba(255,193,7,0.15)',   color: 'var(--color-accent-gold)' },
  viewing:     { bg: 'rgba(255,193,7,0.15)',   color: 'var(--color-accent-gold)' },
  offer_made:  { bg: 'rgba(34,197,94,0.15)',   color: 'var(--color-success)' },
  contracted:  { bg: 'rgba(34,197,94,0.15)',   color: 'var(--color-success)' },
  completed:   { bg: 'rgba(34,197,94,0.15)',   color: 'var(--color-success)' },
  on_hold:     { bg: 'rgba(107,114,128,0.15)', color: 'var(--color-text-muted)' },
  inactive:    { bg: 'rgba(107,114,128,0.15)', color: 'var(--color-text-muted)' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.active;
  return (
    <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '999px', background: c.bg, color: c.color, textTransform: 'capitalize' }}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
};

const formatBudget = (min, max, currency = 'EUR') => {
  const fmt = (v) => v ? new Intl.NumberFormat('en-MT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v) : null;
  const lo = fmt(min);
  const hi = fmt(max);
  if (lo && hi) return `${lo} – ${hi}`;
  if (lo) return `From ${lo}`;
  if (hi) return `Up to ${hi}`;
  return '—';
};

const BranchClients = ({ branchId }) => {
  const { showError } = useToast();
  const [clients, setClients]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading]   = useState(false);

  const load = useCallback((page = 1) => {
    if (!branchId) return;
    setLoading(true);
    api.get(`/branches/${branchId}/clients`, { params: { page, limit: 20 } })
      .then(r => {
        setClients(r.data.clients || []);
        setPagination(r.data.pagination || {});
      })
      .catch(() => showError('Failed to load clients'))
      .finally(() => setLoading(false));
  }, [branchId]);

  useEffect(() => { load(1); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="glass" style={{ height: 72, borderRadius: 'var(--radius-md)', opacity: 0.5 }} />
      ))}
    </div>
  );

  if (!clients.length) return (
    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-10)' }}>
      <div style={{ fontSize: '40px', marginBottom: 'var(--space-3)' }}>👥</div>
      <p>No clients in this branch yet.</p>
    </div>
  );

  return (
    <div>
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={load}
        limit={pagination.limit}
        style={{ marginBottom: 'var(--space-4)' }}
      />

      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Client', 'Contact', 'Looking For', 'Budget', 'Status', 'Agent'].map(h => (
                <th
                  key={h}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>
                    {c.firstName} {c.lastName}
                    {c.isVIP && <span style={{ marginLeft: '6px', color: 'var(--color-accent-gold)' }}>⭐</span>}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: 'var(--text-xs)' }}>
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div style={{ color: 'var(--color-text-muted)' }}>{c.phone}</div>}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>
                    {c.lookingFor?.replace(/_/g, ' ') || '—'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 'var(--text-xs)' }}>
                    {formatBudget(c.minBudget, c.maxBudget, c.budgetCurrency)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <StatusBadge status={c.status} />
                </td>
                <td style={tdStyle}>
                  {c.agent
                    ? <span style={{ fontSize: 'var(--text-xs)' }}>{c.agent.firstName} {c.agent.lastName}</span>
                    : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

const tdStyle = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
};

export default BranchClients;
