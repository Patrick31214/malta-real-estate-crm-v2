import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import PropertyCard from '../../components/crm/properties/PropertyCard';
import PropertyTable from '../../components/crm/properties/PropertyTable';
import PropertyFilters from '../../components/crm/properties/PropertyFilters';
import PropertyForm from '../../components/crm/properties/PropertyForm';
import PropertyDetail from '../../components/crm/properties/PropertyDetail';

const EMPTY_FILTERS = {
  search: '', type: '', listingType: '', status: '',
  minPrice: '', maxPrice: '', minBedrooms: '', minBathrooms: '',
  minArea: '', maxArea: '', floor: '',
  minYearBuilt: '', maxYearBuilt: '',
  energyRating: '', approvalStatus: '',
  hasPhotos: '', hasVideo: '', hasDroneMedia: '', has3DView: '', hasVirtualTour: '',
  isAvailable: '', isFeatured: '',
  isPetFriendly: '', acceptsChildren: '', acceptsSharing: '', acceptsShortLet: '',
  childFriendlyRequired: '', isNegotiable: '', acceptedAgeRange: '',
  features: '',
};

const SORT_OPTIONS = [
  { label: 'Recently Added',  sortBy: 'createdAt',  sortOrder: 'DESC' },
  { label: 'Oldest First',    sortBy: 'createdAt',  sortOrder: 'ASC'  },
  { label: 'Last Updated',    sortBy: 'updatedAt',  sortOrder: 'DESC' },
  { label: 'Price: High → Low', sortBy: 'price',   sortOrder: 'DESC' },
  { label: 'Price: Low → High', sortBy: 'price',   sortOrder: 'ASC'  },
  { label: 'Title A–Z',       sortBy: 'title',      sortOrder: 'ASC'  },
  { label: 'Title Z–A',       sortBy: 'title',      sortOrder: 'DESC' },
  { label: 'Locality A–Z',    sortBy: 'locality',   sortOrder: 'ASC'  },
  { label: 'Bedrooms: Most',  sortBy: 'bedrooms',   sortOrder: 'DESC' },
  { label: 'Area: Largest',   sortBy: 'area',       sortOrder: 'DESC' },
  { label: 'Status: Listed',  sortBy: 'status',     sortOrder: 'ASC'  },
];

const STATUS_PILLS = [
  { label: 'All',          status: '',            isAvailable: '' },
  { label: 'Available',    status: '',            isAvailable: 'true' },
  { label: 'Listed',       status: 'listed',      isAvailable: '' },
  { label: 'Draft',        status: 'draft',       isAvailable: '' },
  { label: 'Under Offer',  status: 'under_offer', isAvailable: '' },
  { label: 'Sold',         status: 'sold',        isAvailable: '' },
  { label: 'Rented',       status: 'rented',      isAvailable: '' },
  { label: 'Withdrawn',    status: 'withdrawn',   isAvailable: '' },
];

const CrmPropertiesPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const { showError } = useToast();

  const canEdit           = ['admin','manager','agent'].includes(role);
  const canCreate         = ['admin','manager','agent'].includes(role);
  const canToggleFeatured = ['admin','manager'].includes(role);
  const canDelete         = role === 'admin';
  const canApprove        = ['admin','manager'].includes(role);

  const [properties, setProperties]   = useState([]);
  const [pagination, setPagination]   = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters]         = useState(EMPTY_FILTERS);
  const [sortIndex, setSortIndex]     = useState(0);
  const [activePill, setActivePill]   = useState(0);
  const [view, setView]               = useState('grid'); // 'grid' | 'list'
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const [mode, setMode]               = useState('list'); // 'list' | 'form' | 'detail'
  const [selected, setSelected]       = useState(null);

  // Scroll to top when opening detail or form views
  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  const fetchProperties = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { sortBy, sortOrder } = SORT_OPTIONS[sortIndex];
      const pill = STATUS_PILLS[activePill];
      const params = { page, limit: 20, sortBy, sortOrder, ...filters };
      // Apply pill overrides when a specific pill is active (not "All")
      if (activePill !== 0) {
        if (pill.status !== '') params.status = pill.status;
        else delete params.status;
        if (pill.isAvailable !== '') params.isAvailable = pill.isAvailable;
        else delete params.isAvailable;
      } else {
        delete params.status;
        delete params.isAvailable;
      }
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] == null) delete params[k]; });
      const response = await api.get('/properties', { params });
      setProperties(response.data.properties);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [filters, sortIndex, activePill]);

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  const handleToggleAvailable = async (property) => {
    try {
      const res = await api.patch(`/properties/${property.id}/toggle-available`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, isAvailable: res.data.isAvailable } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, isAvailable: res.data.isAvailable }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update availability');
    }
  };

  const handleToggleFeatured = async (property) => {
    try {
      const res = await api.patch(`/properties/${property.id}/toggle-featured`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, isFeatured: res.data.isFeatured } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, isFeatured: res.data.isFeatured }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update featured status');
    }
  };

  const handleStatusChange = async (property, newStatus) => {
    try {
      const res = await api.put(`/properties/${property.id}`, { status: newStatus });
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, status: res.data.status || newStatus } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, status: res.data.status || newStatus }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleView = async (property) => {
    try {
      const res = await api.get(`/properties/${property.id}`);
      setSelected(res.data);
      setMode('detail');
    } catch {
      setSelected(property);
      setMode('detail');
    }
  };

  const handleEdit = (property) => {
    setSelected(property);
    setMode('form');
  };

  const handleShare = (property) => {
    const url = `${window.location.origin}/shared/property/${property.id}${user ? `?agent=${user.id}` : ''}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied! Share with your client.');
    }).catch(() => {
      prompt('Copy this link:', url);
    });
  };

  const handleSave = (savedProperty) => {
    setProperties(prev => {
      const exists = prev.find(p => p.id === savedProperty.id);
      if (exists) return prev.map(p => p.id === savedProperty.id ? savedProperty : p);
      return [savedProperty, ...prev];
    });
    setPagination(p => ({ ...p, total: p.total + (properties.find(x => x.id === savedProperty.id) ? 0 : 1) }));
    setMode('list');
    setSelected(null);
  };

  const handleDelete = async (property) => {
    if (!window.confirm(`Withdraw "${property.title}"? This will set the status to Withdrawn.`)) return;
    try {
      await api.delete(`/properties/${property.id}`);
      setProperties(prev => prev.filter(p => p.id !== property.id));
      setMode('list');
      setSelected(null);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete property');
    }
  };

  const handleClearFilters = () => { setFilters(EMPTY_FILTERS); setSortIndex(0); setActivePill(0); };

  const handleSubmitApproval = async (property) => {
    try {
      await api.patch(`/properties/${property.id}/submit-for-approval`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, approvalStatus: 'pending' } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, approvalStatus: 'pending' }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit for approval');
    }
  };

  const handleApprove = async (property) => {
    try {
      await api.patch(`/properties/${property.id}/approve`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, approvalStatus: 'approved' } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, approvalStatus: 'approved' }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (property) => {
    const notes = window.prompt('Rejection reason (optional):') || '';
    try {
      await api.patch(`/properties/${property.id}/reject`, { notes });
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, approvalStatus: 'rejected', approvalNotes: notes } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, approvalStatus: 'rejected', approvalNotes: notes }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to reject');
    }
  };

  const handleTogglePublish = async (property) => {
    try {
      const res = await api.patch(`/properties/${property.id}/toggle-publish`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, isPublishedToWebsite: res.data.isPublishedToWebsite } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, isPublishedToWebsite: res.data.isPublishedToWebsite }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to toggle publish');
    }
  };

  // Slide-over panel for form/detail
  if (mode === 'form') {
    return (
      <div style={panelStyle}>
        <div style={{ overflowY: 'auto', height: '100%' }}>
          <PropertyForm
            initial={selected}
            onSave={handleSave}
            onCancel={() => { setMode('list'); setSelected(null); }}
          />
        </div>
      </div>
    );
  }

  if (mode === 'detail') {
    return (
      <div style={panelStyle}>
        <div style={{ overflowY: 'auto', height: '100%' }}>
          <PropertyDetail
            property={selected}
            onEdit={(p) => { setMode('form'); setSelected(p); }}
            onToggleAvailable={handleToggleAvailable}
            onToggleFeatured={handleToggleFeatured}
            onDelete={handleDelete}
            onClose={() => { setMode('list'); setSelected(null); }}
            onSubmitApproval={handleSubmitApproval}
            onApprove={handleApprove}
            onReject={handleReject}
            onTogglePublish={handleTogglePublish}
            canEdit={canEdit}
            canToggleFeatured={canToggleFeatured}
            canDelete={canDelete}
            canApprove={canApprove}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            Properties
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {loading ? 'Loading…' : `${pagination.total} listing${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Sort dropdown */}
          <select
            value={sortIndex}
            onChange={e => setSortIndex(Number(e.target.value))}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-glass)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              outline: 'none',
            }}
            aria-label="Sort properties by"
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {['grid','list'].map(v => (
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
            <button
              onClick={() => { setSelected(null); setMode('form'); }}
              style={{
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
              }}
            >
              + Add Property
            </button>
          )}
        </div>
      </div>

      {/* Status Pills */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {STATUS_PILLS.map((pill, i) => (
          <button
            key={i}
            onClick={() => setActivePill(i)}
            style={{
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: 'var(--radius-full, 9999px)',
              border: activePill === i ? '1px solid var(--color-accent-gold)' : '1px solid var(--color-border)',
              background: activePill === i ? 'var(--color-accent-gold)' : 'var(--color-surface-glass)',
              color: activePill === i ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              fontWeight: activePill === i ? 'var(--font-semibold)' : 'var(--font-normal)',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap',
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <PropertyFilters filters={filters} onChange={setFilters} onClear={handleClearFilters} />

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass" style={{ height: '360px', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && properties.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🏠</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>No properties found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your filters or add a new property.</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && properties.length > 0 && view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {properties.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              onView={handleView}
              onEdit={handleEdit}
              onToggleAvailable={handleToggleAvailable}
              onToggleFeatured={handleToggleFeatured}
              onStatusChange={handleStatusChange}
              onShare={handleShare}
              canEdit={canEdit}
              canToggleFeatured={canToggleFeatured}
            />
          ))}
        </div>
      )}

      {/* List/Table View */}
      {!loading && properties.length > 0 && view === 'list' && (
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <PropertyTable
            properties={properties}
            onView={handleView}
            onEdit={handleEdit}
            onToggleAvailable={handleToggleAvailable}
            onToggleFeatured={handleToggleFeatured}
            canEdit={canEdit}
            canToggleFeatured={canToggleFeatured}
          />
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchProperties(pagination.page - 1)}
            style={pageBtn(pagination.page <= 1)}
          >← Prev</button>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchProperties(pagination.page + 1)}
            style={pageBtn(pagination.page >= pagination.totalPages)}
          >Next →</button>
        </div>
      )}
    </div>
  );
};

const panelStyle = {
  position: 'fixed', inset: 0, background: 'var(--color-background)',
  zIndex: 'var(--z-modal)', overflowY: 'auto',
};

const pageBtn = (disabled) => ({
  padding: 'var(--space-2) var(--space-5)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 'var(--text-sm)',
  opacity: disabled ? 0.5 : 1,
});

export default CrmPropertiesPage;
