import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import AgentTable from '../../components/crm/agents/AgentTable';
import AgentCard from '../../components/crm/agents/AgentCard';
import GlassModal from '../../components/ui/GlassModal';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import Pagination from '../../components/ui/Pagination';

const AgentForm   = React.lazy(() => import('../../components/crm/agents/AgentForm'));
const AgentDetail = React.lazy(() => import('../../components/crm/agents/AgentDetail'));

const SORT_OPTIONS = [
  { label: 'Recently Added',  sortBy: 'createdAt',      sortOrder: 'DESC' },
  { label: 'Oldest First',    sortBy: 'createdAt',      sortOrder: 'ASC'  },
  { label: 'Name A\u2013Z',        sortBy: 'firstName',      sortOrder: 'ASC'  },
  { label: 'Name Z\u2013A',        sortBy: 'firstName',      sortOrder: 'DESC' },
  { label: 'Commission (\u2191)',  sortBy: 'commissionRate',  sortOrder: 'ASC'  },
  { label: 'Commission (\u2193)',  sortBy: 'commissionRate',  sortOrder: 'DESC' },
];

const STATUS_PILLS = [
  { label: 'All',      status: 'all'      },
  { label: 'Active',   status: 'active'   },
  { label: 'Blocked',  status: 'blocked'  },
  { label: 'Managers', status: 'managers' },
  { label: 'Agents',   status: 'agents'   },
];

const CrmAgentsPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const { showError, showSuccess } = useToast();
  const canCreate = role === 'admin';
  const canEdit   = ['admin', 'manager'].includes(role);
  const canDelete = role === 'admin';

  const [agents, setAgents]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch]         = useState('');
  const debouncedSearch             = useDebouncedValue(search, 300);
  const [activePill, setActivePill] = useState(0);
  const [sortIndex, setSortIndex]   = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [mode, setMode]             = useState('list');
  const [viewMode, setViewMode]     = useState('table');
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    if (mode !== 'list') window.scrollTo(0, 0);
  }, [mode]);

  const fetchAgents = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { sortBy, sortOrder } = SORT_OPTIONS[sortIndex];
      const params = { page, limit: 20, sortBy, sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      const pill = STATUS_PILLS[activePill];
      if (pill?.status && pill.status !== 'all') params.status = pill.status;
      const res = await api.get('/agents', { params });
      setAgents(res.data.agents);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activePill, sortIndex]);

  useEffect(() => { fetchAgents(1); }, [fetchAgents]);

  const handleView = async (agent) => {
    try {
      const res = await api.get(`/agents/${agent.id}`);
      setSelected(res.data);
    } catch {
      setSelected(agent);
    }
    setMode('detail');
  };

  const handleEdit   = (agent) => { setSelected(agent); setMode('form'); };
  const handleCreate = () => { setSelected(null); setMode('form'); };
  const closeModal   = () => { setMode('list'); setSelected(null); };

  const handleSave = () => {
    closeModal();
    fetchAgents(pagination.page);
  };

  const handleDelete = async (agent) => {
    if (!window.confirm(`Deactivate ${agent.firstName} ${agent.lastName}?`)) return;
    try {
      await api.delete(`/agents/${agent.id}`);
      showSuccess('Agent deactivated');
      closeModal();
      fetchAgents(pagination.page);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete agent');
    }
  };

  const handleBlock = async (agent) => {
    const reason = window.prompt('Reason for blocking (optional):');
    if (reason === null) return;
    try {
      await api.patch(`/agents/${agent.id}/block`, { blockedReason: reason });
      showSuccess('Agent blocked');
      fetchAgents(pagination.page);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to block agent');
    }
  };

  const handleUnblock = async (agent) => {
    try {
      await api.patch(`/agents/${agent.id}/unblock`);
      showSuccess('Agent unblocked');
      fetchAgents(pagination.page);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to unblock agent');
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>Agents</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {loading ? 'Loading\u2026' : `${pagination.total} agent${pagination.total !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={sortIndex}
            onChange={e => setSortIndex(Number(e.target.value))}
            style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}
            aria-label="Sort agents"
          >
            {SORT_OPTIONS.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
          </select>
          <button onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')} style={iconBtn} title={viewMode === 'table' ? 'Grid view' : 'Table view'}>
            {viewMode === 'table' ? '\u229E' : '\u2630'}
          </button>
          {canCreate && <button onClick={handleCreate} style={addBtn}>+ Add Agent</button>}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <input
          type="search"
          placeholder="Search by name, email, phone, license\u2026"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', boxSizing: 'border-box' }}
          aria-label="Search agents"
        />
      </div>

      {/* Status Pills */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {STATUS_PILLS.map((pill, i) => (
          <button
            key={i}
            onClick={() => setActivePill(i)}
            style={{
              padding: 'var(--space-1) var(--space-4)',
              borderRadius: '999px',
              border: `1px solid ${activePill === i ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
              background: activePill === i ? 'rgba(255,193,7,0.15)' : 'transparent',
              color: activePill === i ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Pagination top */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchAgents(p)}
        limit={pagination.limit}
        style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}
      />

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="glass" style={{ height: '52px', borderRadius: 'var(--radius-sm)', opacity: 0.5 }} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && agents.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🏢</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>No agents found</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your search or add a new agent.</p>
          {canCreate && <button onClick={handleCreate} style={{ ...addBtn, marginTop: 'var(--space-4)' }}>+ Add First Agent</button>}
        </div>
      )}

      {/* Table View */}
      {!loading && agents.length > 0 && viewMode === 'table' && (
        <div className="glass crm-table-wrapper" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <AgentTable
            agents={agents}
            onView={handleView}
            onEdit={handleEdit}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onDelete={handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      )}

      {/* Grid View */}
      {!loading && agents.length > 0 && viewMode === 'grid' && (
        <div className="crm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {agents.map(a => (
            <AgentCard
              key={a.id}
              agent={a}
              onView={handleView}
              onEdit={handleEdit}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {/* Pagination bottom */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => fetchAgents(p)}
        limit={pagination.limit}
      />

      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="1100px">
        <React.Suspense fallback={<div role="status" aria-live="polite">Loading{'\u2026'}</div>}>
          <AgentDetail
            agent={selected}
            onEdit={handleEdit}
            onClose={closeModal}
            canEdit={canEdit}
            canDelete={canDelete}
            onDelete={handleDelete}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
          />
        </React.Suspense>
      </GlassModal>

      {/* Full-page overlay for Add/Edit Agent form */}
      {mode === 'form' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          overflowY: 'auto',
        }}>
          <div style={{
            width: '100%', maxWidth: '1200px',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 0 60px rgba(196,162,101,0.15), 0 0 120px rgba(196,162,101,0.05), var(--shadow-xl)',
            margin: '40px auto 60px',
          }}>
            <React.Suspense fallback={<div role="status" aria-live="polite" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>Loading{'\u2026'}</div>}>
              <AgentForm initial={selected} onSave={handleSave} onCancel={closeModal} />
            </React.Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

const addBtn = {
  padding: 'var(--space-3) var(--space-5)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-accent-gold)',
  background: 'var(--color-accent-gold)',
  color: '#1a1000',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  whiteSpace: 'nowrap',
};

const iconBtn = {
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-lg)',
};

export default CrmAgentsPage;
