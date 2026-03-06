import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';
import BranchCard from '../../components/crm/branches/BranchCard';
import BranchForm from '../../components/crm/branches/BranchForm';
import BranchDetail from '../../components/crm/branches/BranchDetail';

const CrmBranchesPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const { showError, showSuccess } = useToast();

  const permMap = {};
  (user?.UserPermissions || []).forEach(p => { permMap[p.feature] = p.isEnabled; });
  const hasPerm = (key) => role === 'admin' || permMap[key] === true;

  const canCreate = hasPerm('branches_create');
  const canEdit   = hasPerm('branches_edit');
  const canDelete = role === 'admin';

  const [branches, setBranches]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView]             = useState('grid');
  const [loading, setLoading]       = useState(false);
  const [managers, setManagers]     = useState([]);

  const [mode, setMode]         = useState('list'); // 'list' | 'form' | 'agents' | 'confirm-delete'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]     = useState(false);

  // Stats derived from current page (full stats would need a separate API call)
  const totalBranches  = pagination.total;
  const activeBranches = branches.filter(b => b.isActive).length;
  const totalAgents    = branches.reduce((sum, b) => sum + (b.agentCount || 0), 0);

  const fetchBranches = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search)       params.search   = search;
      if (statusFilter) params.isActive = statusFilter;
      const res = await api.get('/branches', { params });
      setBranches(res.data.branches);
      setPagination(res.data.pagination);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchBranches(1); }, [fetchBranches]);

  // Fetch managers for the form dropdown
  useEffect(() => {
    api.get('/agents', { params: { status: 'managers', limit: 100 } })
      .then(res => setManagers(res.data.agents || []))
      .catch(() => {});
  }, []);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      let saved;
      if (selected) {
        const res = await api.put(`/branches/${selected.id}`, formData);
        saved = res.data;
        setBranches(prev => prev.map(b => b.id === saved.id ? { ...b, ...saved } : b));
        showSuccess('Branch updated successfully');
      } else {
        const res = await api.post('/branches', formData);
        saved = res.data;
        setBranches(prev => [saved, ...prev]);
        setPagination(p => ({ ...p, total: p.total + 1 }));
        showSuccess('Branch created successfully');
      }
      setMode('list');
      setSelected(null);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branch) => {
    try {
      await api.delete(`/branches/${branch.id}`);
      setBranches(prev => prev.filter(b => b.id !== branch.id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      showSuccess('Branch deactivated successfully');
      setMode('list');
      setSelected(null);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to deactivate branch');
    }
  };

  const openEdit   = (b) => { setSelected(b); setMode('form'); };
  const openDelete = (b) => { setSelected(b); setMode('confirm-delete'); };
  const openAgents = (b) => { setSelected(b); setMode('agents'); };
  const openDetail = (b) => { setSelected(b); setMode('detail'); };
  const closeModal = ()  => { setMode('list'); setSelected(null); };

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-3xl)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Branches
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {loading ? 'Loading…' : `${totalBranches} branch${totalBranches !== 1 ? 'es' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            {['grid', 'list'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  border: 'none',
                  background: view === v ? 'var(--color-accent-gold)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {v === 'grid' ? '⊞ Grid' : '☰ List'}
              </button>
            ))}
          </div>
          {canCreate && (
            <button
              onClick={() => { setSelected(null); setMode('form'); }}
              style={addBtnStyle}
            >
              + Add Branch
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}
      >
        {[
          { label: 'Total Branches', value: totalBranches, icon: '🏢' },
          { label: 'Active',         value: activeBranches, icon: '✅' },
          { label: 'Inactive',       value: totalBranches - activeBranches, icon: '⏸' },
          { label: 'Total Agents',   value: totalAgents, icon: '🧑‍💼' },
        ].map(stat => (
          <div
            key={stat.label}
            className="glass"
            style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}
          >
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-1)' }}>{stat.icon}</div>
            <div
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--color-accent-gold)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <input
          style={{
            flex: 1,
            minWidth: 220,
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-glass)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--text-sm)',
          }}
          placeholder="Search by name, city, locality…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[
            { label: 'All', value: '' },
            { label: '✅ Active', value: 'true' },
            { label: '⏸ Inactive', value: 'false' },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setStatusFilter(p.value)}
              style={{
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: '999px',
                border: statusFilter === p.value ? '1px solid var(--color-accent-gold)' : '1px solid var(--color-border)',
                background: statusFilter === p.value ? 'var(--color-accent-gold)' : 'var(--color-surface-glass)',
                color: statusFilter === p.value ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: statusFilter === p.value ? 'var(--font-semibold)' : 'var(--font-normal)',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pagination — top */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={fetchBranches}
        limit={pagination.limit}
        style={{ marginBottom: 'var(--space-4)' }}
      />

      {/* Loading skeletons */}
      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="glass"
              style={{ height: '240px', borderRadius: 'var(--radius-lg)', opacity: 0.5 }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && branches.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🏢</div>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              marginBottom: 'var(--space-2)',
              color: 'var(--color-text-secondary)',
            }}
          >
            No branches found
          </h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            {search ? 'Try a different search term.' : 'Add your first branch to get started.'}
          </p>
        </div>
      )}

      {/* Grid View */}
      {!loading && branches.length > 0 && view === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {branches.map(b => (
            <BranchCard
              key={b.id}
              branch={b}
              onEdit={openEdit}
              onDelete={openDelete}
              onViewAgents={openAgents}
              onViewDetail={openDetail}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && branches.length > 0 && view === 'list' && (
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Branch', 'City', 'Phone', 'Email', 'Agents', 'Status', 'Actions'].map(h => (
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
              {branches.map(b => (
                <tr
                  key={b.id}
                  style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background var(--transition-fast)' }}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)', maxWidth: 220 }}>
                    {b.name}
                  </td>
                  <td style={tdStyle}>{b.city || '—'}</td>
                  <td style={tdStyle}>{b.phone || '—'}</td>
                  <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.email || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,193,7,0.1)', color: 'var(--color-accent-gold)' }}>
                      {b.agentCount ?? 0}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: b.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                        color: b.isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
                      }}
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button onClick={() => openDetail(b)} style={rowBtn('var(--color-text-secondary)')}>View</button>
                      <button onClick={() => openAgents(b)} style={rowBtn('var(--color-accent-gold)')}>Agents</button>
                      {canEdit && <button onClick={() => openEdit(b)} style={rowBtn('var(--color-primary)')}>Edit</button>}
                      {canDelete && <button onClick={() => openDelete(b)} style={rowBtn('var(--color-error)')}>🗑</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination — bottom */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={fetchBranches}
        limit={pagination.limit}
      />

      {/* Detail Modal */}
      <GlassModal isOpen={mode === 'detail'} onClose={closeModal} maxWidth="1100px">
        <BranchDetail
          branch={selected}
          onEdit={(b) => { setMode('form'); setSelected(b); }}
          onDelete={(b) => { setMode('confirm-delete'); setSelected(b); }}
          onClose={closeModal}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </GlassModal>

      {/* Form Modal */}
      <GlassModal isOpen={mode === 'form'} onClose={closeModal} maxWidth="700px">
        <BranchForm
          initial={selected}
          managers={managers}
          onSave={handleSave}
          onCancel={closeModal}
          saving={saving}
        />
      </GlassModal>

      {/* Agents Modal */}
      <GlassModal isOpen={mode === 'agents'} onClose={closeModal} maxWidth="700px" title={`Agents — ${selected?.name || ''}`}>
        <AgentsPanel branch={selected} onClose={closeModal} />
      </GlassModal>

      {/* Confirm Delete Modal */}
      <GlassModal isOpen={mode === 'confirm-delete'} onClose={closeModal} maxWidth="450px">
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⚠️</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
            Deactivate Branch?
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
            Are you sure you want to deactivate <strong>{selected?.name}</strong>?
            This will mark the branch as inactive but won't delete any data.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <button onClick={closeModal} style={cancelBtnStyle}>Cancel</button>
            <button
              onClick={() => handleDelete(selected)}
              style={{
                padding: 'var(--space-3) var(--space-5)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-error)',
                background: 'var(--color-error)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
              }}
            >
              Deactivate
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};

/* Inline agents panel shown in modal */
const AgentsPanel = ({ branch, onClose }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branch) return;
    setLoading(true);
    api.get(`/branches/${branch.id}`)
      .then(res => setAgents(res.data.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [branch]);

  if (!branch) return null;

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-8)' }}>Loading…</div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
          No agents assigned to this branch.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {agents.map(a => (
            <div
              key={a.id}
              className="glass"
              style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
            >
              {a.profileImage
                ? <img src={a.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 'var(--text-sm)', flexShrink: 0 }}>
                    {(a.firstName?.[0] || '') + (a.lastName?.[0] || '')}
                  </div>
                )
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                  {a.firstName} {a.lastName}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{a.email}</div>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '999px', background: 'rgba(13,110,253,0.1)', color: 'var(--color-primary)', textTransform: 'capitalize' }}>
                {a.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const tdStyle = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
};

const rowBtn = (color) => ({
  padding: '3px 10px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
});

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

const cancelBtnStyle = {
  padding: 'var(--space-3) var(--space-5)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
};

export default CrmBranchesPage;

