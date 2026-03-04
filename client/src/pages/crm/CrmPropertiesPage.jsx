import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PropertyCard from '../../components/crm/properties/PropertyCard';
import PropertyTable from '../../components/crm/properties/PropertyTable';
import PropertyFilters from '../../components/crm/properties/PropertyFilters';
import PropertyForm from '../../components/crm/properties/PropertyForm';
import PropertyDetail from '../../components/crm/properties/PropertyDetail';

const EMPTY_FILTERS = {
  search: '', type: '', listingType: '', status: '',
  minPrice: '', maxPrice: '', minBedrooms: '',
  minArea: '', maxArea: '', floor: '',
  minYearBuilt: '', maxYearBuilt: '',
  energyRating: '', approvalStatus: '',
  hasPhotos: '', hasVideo: '',
  features: '',
};

const CrmPropertiesPage = () => {
  const { user } = useAuth();
  const role = user?.role;

  const canEdit           = ['admin','manager','agent'].includes(role);
  const canCreate         = ['admin','manager','agent'].includes(role);
  const canToggleFeatured = ['admin','manager'].includes(role);
  const canDelete         = role === 'admin';
  const canApprove        = ['admin','manager'].includes(role);

  const [properties, setProperties]   = useState([]);
  const [pagination, setPagination]   = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters]         = useState(EMPTY_FILTERS);
  const [view, setView]               = useState('grid'); // 'grid' | 'list'
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const [mode, setMode]               = useState('list'); // 'list' | 'form' | 'detail'
  const [selected, setSelected]       = useState(null);

  const fetchProperties = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] == null) delete params[k]; });
      const response = await api.get('/properties', { params });
      setProperties(response.data.properties);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  const handleToggleAvailable = async (property) => {
    try {
      const res = await api.patch(`/properties/${property.id}/toggle-available`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, isAvailable: res.data.isAvailable } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, isAvailable: res.data.isAvailable }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update availability');
    }
  };

  const handleToggleFeatured = async (property) => {
    try {
      const res = await api.patch(`/properties/${property.id}/toggle-featured`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, isFeatured: res.data.isFeatured } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, isFeatured: res.data.isFeatured }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update featured status');
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
      alert(err.response?.data?.error || 'Failed to delete property');
    }
  };

  const handleClearFilters = () => setFilters(EMPTY_FILTERS);

  const handleSubmitApproval = async (property) => {
    try {
      await api.patch(`/properties/${property.id}/submit-for-approval`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, approvalStatus: 'pending' } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, approvalStatus: 'pending' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit for approval');
    }
  };

  const handleApprove = async (property) => {
    try {
      await api.patch(`/properties/${property.id}/approve`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, approvalStatus: 'approved' } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, approvalStatus: 'approved' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (property) => {
    const notes = window.prompt('Rejection reason (optional):') || '';
    try {
      await api.patch(`/properties/${property.id}/reject`, { notes });
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, approvalStatus: 'rejected', approvalNotes: notes } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, approvalStatus: 'rejected', approvalNotes: notes }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject');
    }
  };

  const handleTogglePublish = async (property) => {
    try {
      const res = await api.patch(`/properties/${property.id}/toggle-publish`);
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, isPublishedToWebsite: res.data.isPublishedToWebsite } : p));
      if (selected?.id === property.id) setSelected(s => ({ ...s, isPublishedToWebsite: res.data.isPublishedToWebsite }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle publish');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            Properties
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {loading ? 'Loading…' : `${pagination.total} listing${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
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
