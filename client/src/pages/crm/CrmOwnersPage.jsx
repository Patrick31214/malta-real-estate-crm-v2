import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import OwnerTable from '../../components/crm/owners/OwnerTable';
import OwnerCard from '../../components/crm/owners/OwnerCard';
import OwnerForm from '../../components/crm/owners/OwnerForm';
import OwnerDetail from '../../components/crm/owners/OwnerDetail';
import GlassModal from '../../components/ui/GlassModal';

const CrmOwnersPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canCreate = ['admin', 'manager', 'agent'].includes(role);
  const canEdit   = ['admin', 'manager', 'agent'].includes(role);
  const canDelete = role === 'admin';

  const [owners, setOwners]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch]         = useState('');
  const [filterActive, setFilterActive] = useState('true');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [mode, setMode]             = useState('list');
  const [viewMode, setViewMode]     = useState('table');
  const [selected, setSelected]     = useState(null);

  const fetchOwners = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filterActive !== '') params.isActive = filterActive;
      const response = await api.get('/owners', { params });
      setOwners(response.data.owners);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load owners');
    } finally {
      setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => { fetchOwners(1); }, [fetchOwners]);

  const handleView = async (owner) => {
    try {
      const res = await api.get(`/owners/${owner.id}`);
      setSelected(res.data);
    } catch { setSelected(owner); }
    setMode('detail');
  };

  const handleEdit = (owner) => { setSelected(owner); setMode('form'); };

  const handleSave = (saved) => {
    setOwners(prev => {
      const exists = prev.find(o => o.id === saved.id);
      const updated = exists ? prev.map(o => o.id === saved.id ? saved : o) : [saved, ...prev];
      setPagination(p => ({ ...p, total: exists ? p.total : p.total + 1 }));
      return updated;
    });
    setMode('list');
    setSelected(null);
  };

  const handleDelete = async (owner) => {
    if (!window.confirm(`Delete "${owner.firstName} ${owner.lastName}"?`)) return;
    try {
      await api.delete(`/owners/${owner.id}`);
      setOwners(prev => prev.filter(o => o.id !== owner.id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      setMode('list');
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete owner');
    }
  };

  const closeModal = () => { setMode('list'); setSelected(null); };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>Owners</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{loading ? 'Loading…' : `${pagination.total} owner${pagination.total !== 1 ? 's' : ''}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')} style={iconBtn}>{viewMode === 'table' ? '⊞' : '☰'}</button>
          {canCreate && <button onClick={() => { setSelected(null); setMode('form'); }} style={addBtn}>+ Add Owner</button>}
        </div>
      </div>

      <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={filterLabel}>Search</label>
          <input style={filterInput} placeholder="Name, email, phone, ref #…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex: '0 1 160px' }}>
          <label style={filterLabel}>Status</label>
          <select style={filterInput} value={filterActive} onChange={e => setFilterActive(e.target.value)}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>
        </div>
        <button onClick={() => { setSearch(''); setFilterActive('true'); }} style={clearBtn}>Clear</button>
      </div>

      {error && <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>{error}</div>}
      {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>{[1,2,3,4,5].map(i => <div key={i} className="glass" style={{ height: '52px', borderRadius: 'var(--radius-sm)', opacity: 0.5 }} />)}</div>}
      {!loading && owners.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>👤</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>No owners found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your search or add a new owner.</p>
        </div>
      )}

      {!loading && owners.length > 0 && viewMode === 'table' && (
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <OwnerTable owners={owners} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} canEdit={canEdit} canDelete={canDelete} />
        </div>
      )}

      {!loading && owners.length > 0 && viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {owners.map(o => <OwnerCard key={o.id} owner={o} onView={handleView} onEdit={handleEdit} canEdit={canEdit} />)}
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
          <button disabled={pagination.page <= 1} onClick={() => fetchOwners(pagination.page - 1)} style={pageBtn(pagination.page <= 1)}>← Prev</button>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchOwners(pagination.page + 1)} style={pageBtn(pagination.page >= pagination.totalPages)}>Next →</button>
        </div>
      )}

      <GlassModal isOpen={mode === 'form'} onClose={closeModal} maxWidth="700px">
        <OwnerForm initial={selected} onSave={handleSave} onCancel={closeModal} />
      </GlassModal>

      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="750px">
        <OwnerDetail owner={selected} onEdit={handleEdit} onClose={closeModal} canEdit={canEdit} canDelete={canDelete} onDelete={handleDelete} />
      </GlassModal>
    </div>
  );
};

const addBtn = { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'var(--color-accent-gold)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', boxShadow: 'var(--shadow-gold-sm)', whiteSpace: 'nowrap' };
const iconBtn = { padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-lg)' };
const filterLabel = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' };
const filterInput = { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', width: '100%', outline: 'none' };
const clearBtn = { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', alignSelf: 'flex-end' };
const pageBtn = (disabled) => ({ padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', opacity: disabled ? 0.5 : 1 });

export default CrmOwnersPage;
