import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import Pagination from '../../components/ui/Pagination';
import AgentTable from '../../components/crm/agents/AgentTable';
import AgentCard from '../../components/crm/agents/AgentCard';

const AgentForm   = lazy(() => import('../../components/crm/agents/AgentForm'));
const AgentDetail = lazy(() => import('../../components/crm/agents/AgentDetail'));

const STATUS_PILLS = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'blocked',  label: 'Blocked' },
  { key: 'managers', label: 'Managers' },
  { key: 'agents',   label: 'Agents' },
];

const SORT_OPTIONS = [
  { label: 'Newest First',    sortBy: 'createdAt', sortOrder: 'DESC' },
  { label: 'Oldest First',    sortBy: 'createdAt', sortOrder: 'ASC'  },
  { label: 'Name A–Z',        sortBy: 'firstName', sortOrder: 'ASC'  },
  { label: 'Name Z–A',        sortBy: 'firstName', sortOrder: 'DESC' },
  { label: 'Commission High', sortBy: 'commissionRate', sortOrder: 'DESC' },
  { label: 'Commission Low',  sortBy: 'commissionRate', sortOrder: 'ASC'  },
];

const LIMIT = 20;

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
  overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'var(--space-6)',
};

const overlayCardStyle = {
  background: 'var(--color-surface, #12122a)', borderRadius: 'var(--radius-lg)',
  width: '100%', maxWidth: 960, minHeight: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
};

export default function CrmAgentsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const canEdit   = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  const [agents, setAgents]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [activePill, setActivePill] = useState('all');
  const [sortIndex, setSortIndex]   = useState(0);
  const [viewMode, setViewMode]     = useState('table'); // 'table' | 'grid'
  const [loading, setLoading]       = useState(false);

  /* overlay mode: null | 'detail' | 'form' */
  const [mode, setMode]         = useState(null);
  const [selected, setSelected] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const sort = SORT_OPTIONS[sortIndex];

  const fetchAgents = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = {
        page: p, limit: LIMIT,
        sortBy: sort.sortBy, sortOrder: sort.sortOrder,
        status: activePill,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await api.get('/agents', { params });
      setAgents(data.agents ?? []);
      setPagination(data.pagination ?? { total: 0, page: p, totalPages: 1 });
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activePill, sort.sortBy, sort.sortOrder, showError]);

  useEffect(() => {
    setPage(1);
    fetchAgents(1);
  }, [debouncedSearch, activePill, sortIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAgents(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFull = async (agent) => {
    try {
      const { data } = await api.get(`/agents/${agent.id}`);
      return data;
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to load agent details');
      return agent; // fallback
    }
  };

  const handleView = useCallback(async (agent) => {
    const full = await fetchFull(agent);
    setSelected(full);
    setMode('detail');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = useCallback(async (agent) => {
    const full = await fetchFull(agent);
    setSelected(full);
    setMode('form');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = useCallback(() => {
    setSelected(null);
    setMode('form');
  }, []);

  const handleSave = useCallback(() => {
    setMode(null);
    setSelected(null);
    fetchAgents(page);
  }, [page, fetchAgents]);

  const handleClose = useCallback(() => {
    setMode(null);
    setSelected(null);
  }, []);

  const handleEditFromDetail = useCallback(async (agent) => {
    const full = await fetchFull(agent);
    setSelected(full);
    setMode('form');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = useCallback(async (agent) => {
    if (!window.confirm(`Delete agent ${agent.firstName} ${agent.lastName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/agents/${agent.id}`);
      showSuccess('Agent deleted');
      fetchAgents(page);
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to delete agent');
    }
  }, [page, fetchAgents, showSuccess, showError]);

  const handleBlock = useCallback(async (agent) => {
    const reason = window.prompt(`Block ${agent.firstName} ${agent.lastName}? Enter reason (optional):`);
    if (reason === null) return; // cancelled
    try {
      await api.patch(`/agents/${agent.id}/block`, { blockedReason: reason || null });
      showSuccess('Agent blocked');
      fetchAgents(page);
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to block agent');
    }
  }, [page, fetchAgents, showSuccess, showError]);

  const handleUnblock = useCallback(async (agent) => {
    if (!window.confirm(`Unblock ${agent.firstName} ${agent.lastName}?`)) return;
    try {
      await api.patch(`/agents/${agent.id}/unblock`);
      showSuccess('Agent unblocked');
      fetchAgents(page);
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to unblock agent');
    }
  }, [page, fetchAgents, showSuccess, showError]);

  const inputStyle = { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' };
  const btnGold = { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' };
  const btnIcon = (active) => ({ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: active ? 'var(--color-accent-gold)' : 'transparent', color: active ? '#000' : 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)' });
  const pillStyle = (active) => ({ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full, 999px)', border: '1px solid', borderColor: active ? 'var(--color-accent-gold)' : 'var(--color-border)', background: active ? 'rgba(255,193,7,0.15)' : 'transparent', color: active ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' });

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Agents</h1>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{pagination.total} total</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Sort */}
          <select value={sortIndex} onChange={e => setSortIndex(Number(e.target.value))} style={inputStyle}>
            {SORT_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
          </select>
          {/* View toggle */}
          <button onClick={() => setViewMode('table')} style={btnIcon(viewMode === 'table')} title="Table view">☰</button>
          <button onClick={() => setViewMode('grid')}  style={btnIcon(viewMode === 'grid')}  title="Grid view">⊞</button>
          {/* Add */}
          {canEdit && <button onClick={handleCreate} style={btnGold}>+ Add Agent</button>}
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone…"
          style={{ ...inputStyle, width: '100%', maxWidth: 400, boxSizing: 'border-box' }}
        />
      </div>

      {/* ── Status Pills ── */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {STATUS_PILLS.map(p => (
          <button key={p.key} onClick={() => { setActivePill(p.key); setPage(1); }} style={pillStyle(activePill === p.key)}>{p.label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>Loading agents…</div>
      ) : viewMode === 'table' ? (
        <div className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {agents.length ? agents.map(a => (
            <AgentCard
              key={a.id}
              agent={a}
              onView={handleView}
              onEdit={handleEdit}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              canEdit={canEdit}
            />
          )) : <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No agents found.</div>}
        </div>
      )}

      {/* ── Pagination ── */}
      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={LIMIT}
        onPageChange={setPage}
      />

      {/* ── Detail Overlay ── */}
      {mode === 'detail' && selected && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
          <div style={overlayCardStyle}>
            <Suspense fallback={<div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>}>
              <AgentDetail
                agent={selected}
                onEdit={handleEditFromDetail}
                onClose={handleClose}
                onRefresh={() => fetchAgents(page)}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* ── Form Overlay ── */}
      {mode === 'form' && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
          <div style={overlayCardStyle}>
            <Suspense fallback={<div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>}>
              <AgentForm
                initial={selected}
                onSave={handleSave}
                onCancel={handleClose}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
