import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';

const RoleBadge = ({ role }) => {
  const map = {
    manager: { bg: 'rgba(255,193,7,0.15)', color: 'var(--color-accent-gold)' },
    agent:   { bg: 'rgba(13,110,253,0.15)', color: 'var(--color-primary)' },
  };
  const c = map[role] || map.agent;
  return (
    <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '999px', background: c.bg, color: c.color, textTransform: 'capitalize' }}>
      {role}
    </span>
  );
};

const StatusDot = ({ isBlocked, isActive }) => {
  if (isBlocked) return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>🚫 Blocked</span>;
  if (isActive)  return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>● Active</span>;
  return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>○ Inactive</span>;
};

const MiniStat = ({ label, value, color = 'var(--color-accent-gold)' }) => (
  <div style={{ textAlign: 'center', minWidth: 48 }}>
    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value ?? 0}</div>
    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>{label}</div>
  </div>
);

const BranchAgents = ({ branchId, canManage }) => {
  const { showError, showSuccess } = useToast();
  const [agents, setAgents]       = useState([]);
  const [metricsMap, setMetricsMap] = useState({});
  const [loading, setLoading]     = useState(false);
  const [removing, setRemoving]   = useState(null);
  const [viewMode, setViewMode]   = useState('cards'); // 'cards' | 'table'
  const [sortCol, setSortCol]     = useState('name');
  const [sortDir, setSortDir]     = useState('asc');

  const load = useCallback(() => {
    if (!branchId) return;
    setLoading(true);
    Promise.all([
      api.get(`/branches/${branchId}/agents`),
      api.get(`/branches/${branchId}/metrics`, { params: { period: 'all' } }),
    ])
      .then(([agentsRes, metricsRes]) => {
        setAgents(agentsRes.data.agents || []);
        // Build a map of agentId -> metrics
        const map = {};
        for (const a of (metricsRes.data.agentBreakdown || [])) {
          map[a.agentId] = a.metrics;
        }
        setMetricsMap(map);
      })
      .catch(err => showError('Failed to load agents'))
      .finally(() => setLoading(false));
  }, [branchId, showError]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (agentId) => {
    setRemoving(agentId);
    try {
      await api.patch(`/branches/${branchId}/remove-agent`, { agentId });
      showSuccess('Agent removed from branch');
      setAgents(prev => prev.filter(a => a.id !== agentId));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to remove agent');
    } finally {
      setRemoving(null);
    }
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const getAgentSortValue = (agent, col) => {
    const m = metricsMap[agent.id] || {};
    if (col === 'name')        return `${agent.firstName} ${agent.lastName}`.toLowerCase();
    if (col === 'role')        return agent.role;
    if (col === 'logins')      return m.totalLogins || 0;
    if (col === 'hours')       return m.totalSessionHours || 0;
    if (col === 'clients')     return m.clientsCreated || 0;
    if (col === 'properties')  return m.propertiesCreated || 0;
    if (col === 'inquiries')   return m.inquiriesResolved || 0;
    if (col === 'actions')     return m.totalActions || 0;
    if (col === 'commission')  return agent.commissionRate || 0;
    return '';
  };

  const sortedAgents = [...agents].sort((a, b) => {
    const av = getAgentSortValue(a, sortCol);
    const bv = getAgentSortValue(b, sortCol);
    let cmp = 0;
    if (typeof av === 'number') cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="glass" style={{ height: 80, borderRadius: 'var(--radius-md)', opacity: 0.5 }} />
      ))}
    </div>
  );

  if (!agents.length) return (
    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-10)' }}>
      <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🧑‍💼</div>
      <p>No agents assigned to this branch.</p>
    </div>
  );

  const SortTh = ({ col, label }) => (
    <th
      onClick={() => handleSort(col)}
      style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 700, color: sortCol === col ? 'var(--color-accent-gold)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}
    >
      {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {agents.length} agent{agents.length !== 1 ? 's' : ''}
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {[{ key: 'cards', label: '⊞ Cards' }, { key: 'table', label: '☰ Table' }].map(v => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              style={{ padding: 'var(--space-1) var(--space-3)', border: 'none', background: viewMode === v.key ? 'var(--color-accent-gold)' : 'transparent', color: viewMode === v.key ? '#000' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: viewMode === v.key ? 700 : 400, transition: 'all 0.15s' }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards view */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {sortedAgents.map(agent => {
            const m = metricsMap[agent.id] || {};
            return (
              <div
                key={agent.id}
                className="glass"
                style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
              >
                {/* Agent header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {agent.profileImage
                    ? <img src={agent.profileImage} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${agent.isActive ? 'var(--color-accent-gold)' : 'var(--color-text-muted)'}` }} />
                    : (
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), #0a58ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 'var(--text-sm)', flexShrink: 0, border: `2px solid ${agent.isActive ? 'var(--color-accent-gold)' : 'var(--color-text-muted)'}` }}>
                        {(agent.firstName?.[0] || '') + (agent.lastName?.[0] || '')}
                      </div>
                    )
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                        {agent.firstName} {agent.lastName}
                      </span>
                      <RoleBadge role={agent.role} />
                      <StatusDot isBlocked={agent.isBlocked} isActive={agent.isActive} />
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {agent.email}{agent.phone ? ` · ${agent.phone}` : ''}
                    </div>
                    {agent.jobTitle && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{agent.jobTitle}</div>
                    )}
                  </div>
                </div>

                {/* Mini metrics row */}
                <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap' }}>
                  <MiniStat label="Logins"     value={m.totalLogins}          color="var(--color-accent-gold)" />
                  <MiniStat label="Hours"      value={m.totalSessionHours}    color="#9b59b6" />
                  <MiniStat label="Clients"    value={m.clientsCreated}       color="var(--color-success)" />
                  <MiniStat label="Properties" value={m.propertiesCreated}    color="var(--color-primary)" />
                  <MiniStat label="Actions"    value={m.totalActions}         color="var(--color-text-secondary)" />
                </div>

                {/* Actions */}
                {canManage && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleRemove(agent.id)}
                      disabled={removing === agent.id}
                      style={{ padding: '4px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', fontSize: 'var(--text-xs)', cursor: removing === agent.id ? 'not-allowed' : 'pointer', opacity: removing === agent.id ? 0.6 : 1 }}
                    >
                      {removing === agent.id ? '…' : 'Remove from Branch'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <SortTh col="name"       label="Name" />
                <SortTh col="role"       label="Role" />
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <SortTh col="logins"     label="Logins" />
                <SortTh col="hours"      label="Hours" />
                <SortTh col="clients"    label="Clients" />
                <SortTh col="properties" label="Props" />
                <SortTh col="inquiries"  label="Inquiries" />
                <SortTh col="actions"    label="Actions" />
                <SortTh col="commission" label="Commission" />
                {canManage && <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}></th>}
              </tr>
            </thead>
            <tbody>
              {sortedAgents.map(agent => {
                const m = metricsMap[agent.id] || {};
                return (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {agent.profileImage
                          ? <img src={agent.profileImage} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#000' }}>{(agent.firstName?.[0] || '') + (agent.lastName?.[0] || '')}</div>
                        }
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{agent.firstName} {agent.lastName}</span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><RoleBadge role={agent.role} /></td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusDot isBlocked={agent.isBlocked} isActive={agent.isActive} /></td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-accent-gold)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{m.totalLogins ?? 0}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#9b59b6', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{m.totalSessionHours ?? 0}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-success)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{m.clientsCreated ?? 0}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{m.propertiesCreated ?? 0}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{m.inquiriesResolved ?? 0}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{m.totalActions ?? 0}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      {agent.commissionRate != null ? `${parseFloat(agent.commissionRate).toFixed(1)}%` : '—'}
                    </td>
                    {canManage && (
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <button
                          onClick={() => handleRemove(agent.id)}
                          disabled={removing === agent.id}
                          style={{ padding: '3px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', fontSize: 'var(--text-xs)', cursor: removing === agent.id ? 'not-allowed' : 'pointer', opacity: removing === agent.id ? 0.6 : 1 }}
                        >
                          {removing === agent.id ? '…' : 'Remove'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BranchAgents;
