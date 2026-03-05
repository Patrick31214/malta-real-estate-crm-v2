import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import OwnerTable from '../../components/crm/owners/OwnerTable';
import OwnerCard from '../../components/crm/owners/OwnerCard';
import GlassModal from '../../components/ui/GlassModal';
import useFavorites from '../../hooks/useFavorites';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import Pagination from '../../components/ui/Pagination';

const OwnerForm = React.lazy(() => import('../../components/crm/owners/OwnerForm'));
const OwnerDetail = React.lazy(() => import('../../components/crm/owners/OwnerDetail'));

const SORT_OPTIONS = [
  { label: 'Recently Added', sortBy: 'createdAt',      sortOrder: 'DESC' },
  { label: 'Oldest First',   sortBy: 'createdAt',      sortOrder: 'ASC'  },
  { label: 'Last Updated',   sortBy: 'updatedAt',      sortOrder: 'DESC' },
  { label: 'Name A–Z',       sortBy: 'firstName',      sortOrder: 'ASC'  },
  { label: 'Name Z–A',       sortBy: 'firstName',      sortOrder: 'DESC' },
  { label: 'Reference #',    sortBy: 'referenceNumber', sortOrder: 'ASC' },
  { label: 'Active First',   sortBy: 'isActive',       sortOrder: 'DESC' },
];

const STATUS_PILLS = [
  { label: 'All',      isActive: '',      isVIP: '' },
  { label: 'Active',   isActive: 'true',  isVIP: '' },
  { label: 'Inactive', isActive: 'false', isVIP: '' },
  { label: 'VIP',      isActive: '',      isVIP: 'true' },
];

const CrmOwnersPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const { showError } = useToast();
  const canCreate = ['admin', 'manager', 'agent'].includes(role);
  const canEdit   = ['admin', 'manager', 'agent'].includes(role);
  const canDelete = role === 'admin';

  const [owners, setOwners]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch]         = useState('');
  const debouncedSearch             = useDebouncedValue(search, 300);
  const [activePill, setActivePill] = useState(1); // Default to 'Active'
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortIndex, setSortIndex]   = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [mode, setMode]             = useState('list');
  const [viewMode, setViewMode]     = useState('table');
  const [selected, setSelected]     = useState(null);
  const [phonesBlurred, setPhonesBlurred] = useState(true);

  const { favorites, toggleFavorite, isFavorite } = useFavorites('favorites_owners');

  // Scroll to top when opening detail or form views
  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  const fetchOwners = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { sortBy, sortOrder } = SORT_OPTIONS[sortIndex];
      const params = { page, limit: 20, sortBy, sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      const pill = STATUS_PILLS[activePill] || STATUS_PILLS[1];
      if (pill.isActive !== '') params.isActive = pill.isActive;
      if (pill.isVIP !== '') params.isVIP = pill.isVIP;
      const response = await api.get('/owners', { params });
      setOwners(response.data.owners);
      setPagination(response.data.pagination);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load owners';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activePill, sortIndex]);

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
      showError(err.response?.data?.error || 'Failed to delete owner');
    }
  };

  const closeModal = () => { setMode('list'); setSelected(null); };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div className="crm-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>Owners</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{loading ? 'Loading…' : `${pagination.total} owner${pagination.total !== 1 ? 's' : ''}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
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
            aria-label="Sort owners by"
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
          <button onClick={() => setPhonesBlurred(b => !b)} style={iconBtn} title={phonesBlurred ? 'Reveal all phones' : 'Blur all phones'} aria-label={phonesBlurred ? 'Reveal all phone numbers' : 'Blur all phone numbers'}>{phonesBlurred ? '🔒 Blur All' : '🔓 Reveal All'}</button>
          <button onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')} style={iconBtn}>{viewMode === 'table' ? '⊞' : '☰'}</button>
          {canCreate && <button onClick={() => { setSelected(null); setMode('form'); }} style={addBtn}>+ Add Owner</button>}
        </div>
      </div>

      {/* Status pills */}
      <div className="status-pills" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {STATUS_PILLS.map((pill, i) => {
          const isActive = activePill === i && !showFavoritesOnly;
          return (
            <button
              key={i}
              onClick={() => { setActivePill(i); setShowFavoritesOnly(false); }}
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
        <button
          onClick={() => setShowFavoritesOnly(f => !f)}
          style={{
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full, 9999px)',
            border: showFavoritesOnly ? '1px solid var(--color-accent-gold)' : '1px solid var(--color-border)',
            background: showFavoritesOnly ? 'var(--color-accent-gold)' : 'var(--color-surface-glass)',
            color: showFavoritesOnly ? '#fff' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            fontWeight: showFavoritesOnly ? 'var(--font-semibold)' : 'var(--font-normal)',
            transition: 'all var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
        >
          ⭐ Favorites {favorites.length > 0 ? `(${favorites.length})` : ''}
        </button>
      </div>

      <div className="glass crm-filters" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={filterLabel}>Search</label>
          <input style={filterInput} placeholder="Name, email, phone, ref #…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setSearch(''); setActivePill(1); setSortIndex(0); setShowFavoritesOnly(false); }} style={clearBtn}>Clear</button>
      </div>

      {error && <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>{error}</div>}

      {/* Pagination — top */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchOwners(p)}
        limit={pagination.limit}
        style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}
      />

      {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>{[1,2,3,4,5].map(i => <div key={i} className="glass" style={{ height: '52px', borderRadius: 'var(--radius-sm)', opacity: 0.5 }} />)}</div>}
      {!loading && owners.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>👤</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>No owners found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your search or add a new owner.</p>
        </div>
      )}

      {!loading && owners.length > 0 && viewMode === 'table' && (
        <div className="glass crm-table-wrapper" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <OwnerTable owners={showFavoritesOnly ? owners.filter(o => isFavorite(o.id)) : owners} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} canEdit={canEdit} canDelete={canDelete} phonesBlurred={phonesBlurred} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
        </div>
      )}

      {!loading && owners.length > 0 && viewMode === 'grid' && (
        <div className="crm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {(showFavoritesOnly ? owners.filter(o => isFavorite(o.id)) : owners).map(o => (
            <OwnerCard
              key={o.id}
              owner={o}
              onView={handleView}
              onEdit={handleEdit}
              canEdit={canEdit}
              phonesBlurred={phonesBlurred}
              isFavorite={isFavorite(o.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Pagination — bottom */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchOwners(p)}
        limit={pagination.limit}
      />

      <GlassModal isOpen={mode === 'form'} onClose={closeModal} maxWidth="700px">
        <React.Suspense fallback={<div role="status" aria-live="polite">Loading...</div>}>
          <OwnerForm initial={selected} onSave={handleSave} onCancel={closeModal} />
        </React.Suspense>
      </GlassModal>

      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="1100px">
        <React.Suspense fallback={<div role="status" aria-live="polite">Loading...</div>}>
          <OwnerDetail owner={selected} onEdit={handleEdit} onClose={closeModal} canEdit={canEdit} canDelete={canDelete} onDelete={handleDelete} />
        </React.Suspense>
      </GlassModal>
    </div>
  );
};

const addBtn = { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-gold)', background: 'var(--color-accent-gold)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', boxShadow: 'var(--shadow-gold-sm)', whiteSpace: 'nowrap' };
const iconBtn = { padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-lg)' };
const filterLabel = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' };
const filterInput = { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', width: '100%', outline: 'none' };
const clearBtn = { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', alignSelf: 'flex-end' };

export default CrmOwnersPage;
