import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import InquiryCard from '../../components/crm/inquiries/InquiryCard';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

const InquiryForm   = React.lazy(() => import('../../components/crm/inquiries/InquiryForm'));
const InquiryDetail = React.lazy(() => import('../../components/crm/inquiries/InquiryDetail'));

const STATUS_PILLS = [
  { label: 'All',               value: '' },
  { label: 'New',               value: 'new' },
  { label: 'Open',              value: 'open' },
  { label: 'Assigned',          value: 'assigned' },
  { label: 'In Progress',       value: 'in_progress' },
  { label: 'Viewing Scheduled', value: 'viewing_scheduled' },
  { label: 'Resolved',          value: 'resolved' },
  { label: 'Closed',            value: 'closed' },
  { label: 'Spam',              value: 'spam' },
];

const EMPTY_FILTERS = {
  search: '', status: '', type: '', priority: '', source: '',
};

const CrmInquiriesPage = () => {
  usePageTimeTracker('inquiries_list', { entityType: 'inquiry' });
  const { user } = useAuth();
  const role = user?.role;
  const { showError } = useToast();

  const permMap = {};
  (user?.UserPermissions || []).forEach(p => { permMap[p.feature] = p.isEnabled; });
  const hasPerm = (key) => role === 'admin' || permMap[key] === true;

  const canCreate = role === 'admin' || role === 'manager' || hasPerm('inquiries_create');
  const canEdit   = role === 'admin' || role === 'manager' || hasPerm('inquiries_edit');
  const canDelete = role === 'admin';

  const [inquiries, setInquiries]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters]       = useState(EMPTY_FILTERS);
  const [view, setView]             = useState('grid');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [mode, setMode]             = useState('list');
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  const fetchInquiries = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] == null) delete params[k]; });
      const response = await api.get('/inquiries', { params });
      setInquiries(response.data.inquiries);
      setPagination(response.data.pagination);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load inquiries';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => { fetchInquiries(1); }, [fetchInquiries]);

  const handleView = async (inquiry) => {
    try {
      const res = await api.get(`/inquiries/${inquiry.id}`);
      setSelected(res.data);
    } catch {
      setSelected(inquiry);
    }
    setMode('detail');
  };

  const handleEdit = (inquiry) => { setSelected(inquiry); setMode('form'); };

  const handleSave = (saved) => {
    setInquiries(prev => {
      const exists = prev.find(i => i.id === saved.id);
      if (exists) return prev.map(i => i.id === saved.id ? saved : i);
      return [saved, ...prev];
    });
    setPagination(p => {
      const existsInPrev = inquiries.some(x => x.id === saved.id);
      return { ...p, total: existsInPrev ? p.total : p.total + 1 };
    });
    setMode('list');
    setSelected(null);
  };

  const handleDelete = async (inquiry) => {
    if (!window.confirm(`Delete inquiry from "${inquiry.firstName} ${inquiry.lastName}"?`)) return;
    try {
      await api.delete(`/inquiries/${inquiry.id}`);
      setInquiries(prev => prev.filter(i => i.id !== inquiry.id));
      setMode('list');
      setSelected(null);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete inquiry');
    }
  };

  const handleStatusChange = (inquiry, newStatus) => {
    setInquiries(prev => prev.map(i => i.id === inquiry.id ? { ...i, status: newStatus } : i));
  };

  const closeModal = () => { setMode('list'); setSelected(null); };

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="crm-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            Inquiries
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {loading ? 'Loading…' : `${pagination.total} inquiry${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
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
              + New Inquiry
            </button>
          )}
        </div>
      </div>

      {/* Status Pills */}
      <div className="status-pills" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {STATUS_PILLS.map((pill) => {
          const isActive = filters.status === pill.value;
          return (
            <button
              key={pill.value}
              onClick={() => setFilter('status', pill.value)}
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
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Search + Filters row */}
      <div className="crm-filters" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔎 Search by name, email, phone…"
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          style={filterInputStyle}
        />
        <select value={filters.type} onChange={e => setFilter('type', e.target.value)} style={filterSelectStyle}>
          <option value="">All Types</option>
          <option value="property">Property</option>
          <option value="work_with_us">Work With Us</option>
          <option value="affiliate">Affiliate</option>
          <option value="general">General</option>
          <option value="viewing">Viewing</option>
          <option value="valuation">Valuation</option>
        </select>
        <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)} style={filterSelectStyle}>
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.source} onChange={e => setFilter('source', e.target.value)} style={filterSelectStyle}>
          <option value="">All Sources</option>
          <option value="website">Website</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="walk_in">Walk In</option>
          <option value="referral">Referral</option>
          <option value="social_media">Social Media</option>
          <option value="other">Other</option>
        </select>
        {(filters.search || filters.type || filters.priority || filters.source) && (
          <button onClick={() => setFilters(EMPTY_FILTERS)} style={clearBtnStyle}>✕ Clear</button>
        )}
      </div>

      {/* Top Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchInquiries(p)}
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
            <div key={i} className="glass" style={{ height: '220px', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && inquiries.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📩</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>No inquiries found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your filters or create a new inquiry.</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && inquiries.length > 0 && view === 'grid' && (
        <div className="crm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {inquiries.map(inq => (
            <InquiryCard
              key={inq.id}
              inquiry={inq}
              onView={handleView}
              onEdit={handleEdit}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && inquiries.length > 0 && view === 'list' && (
        <div className="glass crm-table-wrapper" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Name', 'Type', 'Status', 'Priority', 'Source', 'Assigned To', 'Created', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inquiries.map(inq => (
                <tr key={inq.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => handleView(inq)}>
                  <td style={tdStyle}>{inq.firstName} {inq.lastName}</td>
                  <td style={tdStyle}>{(inq.type || '').replace(/_/g, ' ')}</td>
                  <td style={tdStyle}><span style={{ ...statusBadge, color: STATUS_COLORS[inq.status] || 'var(--color-text-muted)', borderColor: STATUS_COLORS[inq.status] || 'var(--color-border)' }}>{inq.status?.replace(/_/g, ' ')}</span></td>
                  <td style={tdStyle}>{inq.priority}</td>
                  <td style={tdStyle}>{inq.source?.replace(/_/g, ' ') || '—'}</td>
                  <td style={tdStyle}>{inq.assignedTo ? `${inq.assignedTo.firstName} ${inq.assignedTo.lastName}` : '—'}</td>
                  <td style={tdStyle}>{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={tdStyle} onClick={e => e.stopPropagation()}>
                    {canEdit && <button onClick={() => handleEdit(inq)} style={rowBtnStyle}>Edit</button>}
                    {canDelete && <button onClick={() => handleDelete(inq)} style={{ ...rowBtnStyle, color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchInquiries(p)}
        limit={pagination.limit}
      />

      {/* Form Modal */}
      <GlassModal isOpen={mode === 'form'} onClose={closeModal} maxWidth="90vw">
        <React.Suspense fallback={<div role="status" aria-live="polite">Loading...</div>}>
          <InquiryForm
            initial={selected}
            onSave={handleSave}
            onCancel={closeModal}
          />
        </React.Suspense>
      </GlassModal>

      {/* Detail Modal */}
      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="90vw">
        <ErrorBoundary onReset={closeModal}>
          <React.Suspense fallback={<div role="status" aria-live="polite">Loading...</div>}>
            <InquiryDetail
              inquiry={selected}
              onEdit={(i) => { setMode('form'); setSelected(i); }}
              onDelete={handleDelete}
              onClose={closeModal}
              onStatusChange={handleStatusChange}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </React.Suspense>
        </ErrorBoundary>
      </GlassModal>
    </div>
  );
};

const STATUS_COLORS = {
  new: '#3B82F6', open: '#22C55E', assigned: '#F97316',
  in_progress: '#F59E0B', viewing_scheduled: '#A855F7',
  resolved: '#10B981', closed: '#6B7280', spam: '#EF4444',
};

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

const filterInputStyle = {
  padding: 'var(--space-2) var(--space-3)',
  background: 'var(--color-surface-glass)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  minWidth: '220px',
  flex: 1,
  outline: 'none',
};

const filterSelectStyle = {
  padding: 'var(--space-2) var(--space-3)',
  background: 'var(--color-surface-glass)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  cursor: 'pointer',
};

const clearBtnStyle = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  whiteSpace: 'nowrap',
};

const thStyle = {
  padding: 'var(--space-3) var(--space-4)',
  textAlign: 'left',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
};

const statusBadge = {
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  border: '1px solid',
  background: 'var(--color-surface-glass)',
  textTransform: 'capitalize',
  whiteSpace: 'nowrap',
};

const rowBtnStyle = {
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  marginRight: '4px',
};

export default CrmInquiriesPage;

