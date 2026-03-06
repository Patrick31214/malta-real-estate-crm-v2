import React, { memo } from 'react';

const getInitials = (a) => `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

const roleBadge = (role) => {
  const map = {
    admin:   { background: 'rgba(220,53,69,0.15)',  color: 'var(--color-error)',       border: '1px solid var(--color-error)' },
    manager: { background: 'rgba(255,193,7,0.15)',  color: 'var(--color-accent-gold)', border: '1px solid var(--color-accent-gold)' },
    agent:   { background: 'rgba(13,110,253,0.15)', color: 'var(--color-primary)',     border: '1px solid var(--color-primary)' },
  };
  const s = map[role] ?? map.agent;
  return (
    <span style={{ ...s, padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' }}>
      {role ?? 'agent'}
    </span>
  );
};

const statusDot = (a) => {
  let color = 'var(--color-success, #28a745)';
  let label = 'Active';
  if (a.isBlocked)                             { color = 'var(--color-error, #dc3545)';  label = 'Blocked'; }
  else if (!a.isActive)                        { color = 'var(--color-text-muted)';       label = 'Inactive'; }
  else if (a.approvalStatus === 'pending')     { color = 'var(--color-accent-gold)';      label = 'Pending'; }
  else if (a.approvalStatus === 'rejected')    { color = 'var(--color-error, #dc3545)';  label = 'Rejected'; }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
};

const thStyle = { padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' };
const tdStyle = { padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle' };
const btnSm = (extra = {}) => ({ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', ...extra });

const AgentTable = memo(function AgentTable({ agents, onView, onEdit, onBlock, onUnblock, onDelete, canEdit, canDelete }) {
  if (!agents?.length) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No agents found.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Agent</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Branch</th>
            <th style={thStyle}>Commission</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} style={{ transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover, rgba(255,255,255,0.04))'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {a.profileImage
                    ? <img src={a.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-sm)', flexShrink: 0 }}>{getInitials(a)}</div>
                  }
                  <span style={{ fontWeight: 600 }}>{a.firstName} {a.lastName}</span>
                </div>
              </td>
              <td style={tdStyle}>{roleBadge(a.role)}</td>
              <td style={tdStyle}><span style={{ color: 'var(--color-text-secondary)' }}>{a.email}</span></td>
              <td style={tdStyle}>{a.phone ?? '—'}</td>
              <td style={tdStyle}>{a.Branch?.name ?? '—'}</td>
              <td style={tdStyle}>{a.commissionRate != null ? `${a.commissionRate}%` : '—'}</td>
              <td style={tdStyle}>{statusDot(a)}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'nowrap' }}>
                  <button style={btnSm()} onClick={() => onView(a)} title="View">👁</button>
                  {canEdit && <button style={btnSm()} onClick={() => onEdit(a)} title="Edit">✏️</button>}
                  {canEdit && (a.isBlocked
                    ? <button style={btnSm({ color: 'var(--color-success, #28a745)' })} onClick={() => onUnblock(a)} title="Unblock">🔓</button>
                    : <button style={btnSm({ color: 'var(--color-error, #dc3545)' })} onClick={() => onBlock(a)} title="Block">🚫</button>
                  )}
                  {canDelete && <button style={btnSm({ color: 'var(--color-error, #dc3545)' })} onClick={() => onDelete(a)} title="Delete">🗑</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default AgentTable;
