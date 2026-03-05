import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import ClientCard from '../../components/crm/clients/ClientCard';
import ClientTable from '../../components/crm/clients/ClientTable';
import ClientFilters from '../../components/crm/clients/ClientFilters';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import GlassModal from '../../components/ui/GlassModal';
import { CLIENT_STATUSES } from '../../constants/clientRequirements';
import useFavorites from '../../hooks/useFavorites';
import Pagination from '../../components/ui/Pagination';

const ClientForm = React.lazy(() => import('../../components/crm/clients/ClientForm'));
const ClientDetail = React.lazy(() => import('../../components/crm/clients/ClientDetail'));
const ClientMatches = React.lazy(() => import('../../components/crm/clients/ClientMatches'));

const EMPTY_FILTERS = {
  search: '', status: '', type: '', nationality: '',
  minBudget: '', maxBudget: '', isVIP: '',
  bedrooms: '', propertyType: '', listingType: '',
};

const CLIENT_STATUS_PILLS = [
  { label: 'All', value: '' },
  ...CLIENT_STATUSES.map(s => ({ label: s.label, value: s.value })),
];

const CrmClientsPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const { showError } = useToast();

  const canCreate = ['admin', 'manager', 'agent'].includes(role);
  const canEdit   = ['admin', 'manager', 'agent'].includes(role);
  const canDelete = role === 'admin';
  const canVIP    = ['admin', 'manager'].includes(role);

  const [clients, setClients]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters]       = useState(EMPTY_FILTERS);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [view, setView]             = useState('grid'); // 'grid' | 'list'
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const { favorites, toggleFavorite, isFavorite } = useFavorites('favorites_clients');

  const [mode, setMode]         = useState('list'); // 'list' | 'form' | 'detail' | 'matches'
  const [selected, setSelected] = useState(null);

  // Scroll to top when opening detail or form views
  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  const fetchClients = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] == null) delete params[k]; });
      const response = await api.get('/clients', { params });
      setClients(response.data.clients);
      setPagination(response.data.pagination);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load clients';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClients(1);
  }, [fetchClients]);

  const handleToggleVIP = async (client) => {
    try {
      const res = await api.patch(`/clients/${client.id}/toggle-vip`);
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, isVIP: res.data.isVIP } : c));
      if (selected?.id === client.id) setSelected(s => ({ ...s, isVIP: res.data.isVIP }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update VIP status');
    }
  };

  const handleStatusChange = async (client, status) => {
    try {
      const res = await api.patch(`/clients/${client.id}/status`, { status });
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: res.data.status } : c));
      if (selected?.id === client.id) setSelected(s => ({ ...s, status: res.data.status }));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleView = async (client) => {
    try {
      const res = await api.get(`/clients/${client.id}`);
      setSelected(res.data);
      setMode('detail');
    } catch {
      setSelected(client);
      setMode('detail');
    }
  };

  const handleEdit = (client) => {
    setSelected(client);
    setMode('form');
  };

  const handleMatches = (client) => {
    setSelected(client);
    setMode('matches');
  };

  const handleSave = (savedClient) => {
    setClients(prev => {
      const exists = prev.find(c => c.id === savedClient.id);
      if (exists) return prev.map(c => c.id === savedClient.id ? savedClient : c);
      return [savedClient, ...prev];
    });
    setPagination(p => ({ ...p, total: p.total + (clients.find(x => x.id === savedClient.id) ? 0 : 1) }));
    setMode('list');
    setSelected(null);
  };

  const handleDelete = async (client) => {
    if (!window.confirm(`Delete client "${client.firstName} ${client.lastName}"?`)) return;
    try {
      await api.delete(`/clients/${client.id}`);
      setClients(prev => prev.filter(c => c.id !== client.id));
      setMode('list');
      setSelected(null);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete client');
    }
  };

  const handleClearFilters = () => { setFilters(EMPTY_FILTERS); setShowFavoritesOnly(false); };

  const closeModal = () => { setMode('list'); setSelected(null); };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="crm-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            Clients
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {loading ? 'Loading…' : `${pagination.total} client${pagination.total !== 1 ? 's' : ''}`}
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
            <button
              onClick={() => { setSelected(null); setMode('form'); }}
              style={addBtnStyle}
            >
              + Add Client
            </button>
          )}
        </div>
      </div>

      {/* Status Pills */}
      <div className="status-pills" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {CLIENT_STATUS_PILLS.map((pill, i) => {
          const isActive = filters.status === pill.value && !showFavoritesOnly;
          return (
            <button
              key={i}
              onClick={() => { setFilters(f => ({ ...f, status: pill.value })); setShowFavoritesOnly(false); }}
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

      {/* Filters */}
      <div className="crm-filters">
        <ClientFilters filters={filters} onChange={setFilters} onClear={handleClearFilters} />
      </div>

      {/* Pagination — top */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchClients(p)}
        limit={pagination.limit}
        style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}
      />

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass" style={{ height: '260px', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && clients.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>👥</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>No clients found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your filters or add a new client.</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && clients.length > 0 && view === 'grid' && (
        <div className="crm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {(showFavoritesOnly ? clients.filter(c => isFavorite(c.id)) : clients).map(c => (
            <ClientCard
              key={c.id}
              client={c}
              onView={handleView}
              onEdit={handleEdit}
              onToggleVIP={handleToggleVIP}
              onViewMatches={handleMatches}
              canEdit={canEdit}
              canVIP={canVIP}
              isFavorite={isFavorite(c.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* List/Table View */}
      {!loading && clients.length > 0 && view === 'list' && (
        <div className="glass crm-table-wrapper" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <ClientTable
            clients={showFavoritesOnly ? clients.filter(c => isFavorite(c.id)) : clients}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVIP={handleToggleVIP}
            onViewMatches={handleMatches}
            canEdit={canEdit}
            canDelete={canDelete}
            canVIP={canVIP}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      )}

      {/* Pagination — bottom */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchClients(p)}
        limit={pagination.limit}
      />

      {/* Form modal */}
      <GlassModal isOpen={mode === 'form'} onClose={closeModal} maxWidth="90vw">
        <React.Suspense fallback={<div role="status" aria-live="polite">Loading...</div>}>
          <ClientForm
            initial={selected}
            onSave={handleSave}
            onCancel={closeModal}
          />
        </React.Suspense>
      </GlassModal>

      {/* Detail modal */}
      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="90vw">
        <ErrorBoundary onReset={closeModal}>
          <React.Suspense fallback={<div role="status" aria-live="polite">Loading...</div>}>
            <ClientDetail
              client={selected}
              onEdit={(c) => { setMode('form'); setSelected(c); }}
              onDelete={handleDelete}
              onClose={closeModal}
              onToggleVIP={handleToggleVIP}
              onStatusChange={handleStatusChange}
              onViewMatches={handleMatches}
              canEdit={canEdit}
              canDelete={canDelete}
              canVIP={canVIP}
            />
          </React.Suspense>
        </ErrorBoundary>
      </GlassModal>

      {/* Matches modal */}
      <GlassModal isOpen={mode === 'matches'} onClose={() => setMode('detail')} maxWidth="90vw">
        <React.Suspense fallback={<div role="status" aria-live="polite">Loading...</div>}>
          <ClientMatches
            clientId={selected?.id}
            onClose={() => setMode('detail')}
          />
        </React.Suspense>
      </GlassModal>
    </div>
  );
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

export default CrmClientsPage;
