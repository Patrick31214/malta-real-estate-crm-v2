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

const BranchAgents = ({ branchId, canManage }) => {
  const { showError, showSuccess } = useToast();
  const [agents, setAgents]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(() => {
    if (!branchId) return;
    setLoading(true);
    api.get(`/branches/${branchId}/agents`)
      .then(r => { setAgents(r.data.agents || []); setTotal(r.data.total || 0); })
      .catch((err) => { console.error('BranchAgents error:', err); showError('Failed to load agents'); })
      .finally(() => setLoading(false));
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (agentId) => {
    setRemoving(agentId);
    try {
      await api.patch(`/branches/${branchId}/remove-agent`, { agentId });
      showSuccess('Agent removed from branch');
      setAgents(prev => prev.filter(a => a.id !== agentId));
      setTotal(t => Math.max(0, t - 1));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to remove agent');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="glass" style={{ height: 72, borderRadius: 'var(--radius-md)', opacity: 0.5 }} />
      ))}
    </div>
  );

  if (!agents.length) return (
    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-10)' }}>
      <div style={{ fontSize: '40px', marginBottom: 'var(--space-3)' }}>🧑‍💼</div>
      <p>No agents assigned to this branch.</p>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        {total} agent{total !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {agents.map(agent => (
          <div
            key={agent.id}
            className="glass"
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar */}
            {agent.profileImage
              ? <img src={agent.profileImage} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : (
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 'bold', fontSize: 'var(--text-sm)', flexShrink: 0,
                }}>
                  {(agent.firstName?.[0] || '') + (agent.lastName?.[0] || '')}
                </div>
              )
            }

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                  {agent.firstName} {agent.lastName}
                </span>
                <RoleBadge role={agent.role} />
                <StatusDot isBlocked={agent.isBlocked} isActive={agent.isActive} />
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {agent.email}{agent.phone ? ` · ${agent.phone}` : ''}
              </div>
              {agent.jobTitle && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {agent.jobTitle}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)' }}>
                  {agent.propertyCount || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Properties</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-success)' }}>
                  {agent.soldRentedCount || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Sold/Rented</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                  {agent.clientCount || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Clients</div>
              </div>
              {agent.commissionRate != null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)' }}>
                    {parseFloat(agent.commissionRate).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Commission</div>
                </div>
              )}
            </div>

            {/* Remove action */}
            {canManage && (
              <button
                onClick={() => handleRemove(agent.id)}
                disabled={removing === agent.id}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-error)',
                  background: 'transparent',
                  color: 'var(--color-error)',
                  fontSize: 'var(--text-xs)',
                  cursor: removing === agent.id ? 'not-allowed' : 'pointer',
                  opacity: removing === agent.id ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {removing === agent.id ? '…' : 'Remove'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchAgents;
