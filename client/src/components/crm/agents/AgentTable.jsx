import React from 'react';

const getInitials = (a) => `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

const roleBadge = (role) => {
  const styles = {
    admin:   { background: 'rgba(220,53,69,0.15)',  color: 'var(--color-error)',        border: '1px solid var(--color-error)' },
    manager: { background: 'rgba(255,193,7,0.15)',  color: 'var(--color-accent-gold)',  border: '1px solid var(--color-accent-gold)' },
    agent:   { background: 'rgba(13,110,253,0.15)', color: 'var(--color-primary)',      border: '1px solid var(--color-primary)' },
  };
  const s = styles[role] || styles.agent;
  return (
    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', padding: '2px 8px', borderRadius: '999px', ...s, textTransform: 'capitalize' }}>
      {role}
    </span>
  );
};

const AgentTable = ({ agents, onView, onEdit, onBlock, onUnblock, onDelete, canEdit, canDelete }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', tableLayout: 'auto' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-glass)' }}>
          <th style={thStyle}>Agent</th>
          <th style={thStyle}>Email</th>
          <th style={thStyle}>Phone</th>
          <th style={thStyle}>Role</th>
          <th style={thStyle}>Branch</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Props</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Commission</th>
          <th style={thStyle}>Status</th>
          <th style={thStyle}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((a) => (
          <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer' }} onClick={() => onView(a)}>
            <td style={tdStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {a.profileImage
                  ? <img src={a.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: '#fff', flexShrink: 0 }}>{getInitials(a)}</div>
                }
                <div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-accent-gold)', whiteSpace: 'nowrap' }}>{a.firstName} {a.lastName}</div>
                  {a.licenseNumber && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>#{a.licenseNumber}</div>}
                </div>
              </div>
            </td>
            <td style={{ ...tdStyle, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.email ? <a href={`mailto:${a.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{a.email}</a> : '—'}
            </td>
            <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{a.phone || '—'}</td>
            <td style={tdStyle}>{roleBadge(a.role)}</td>
            <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{a.Branch?.name || '—'}</td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{a.Properties?.length ?? 0}</span>
            </td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>
              {a.commissionRate != null ? <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{parseFloat(a.commissionRate).toFixed(1)}%</span> : '—'}
            </td>
            <td style={tdStyle}>
              {a.isBlocked
                ? <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error)', display: 'inline-block' }} />Blocked</span>
                : a.isActive
                  ? <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />Active</span>
                  : <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-muted)', display: 'inline-block' }} />Inactive</span>
              }
            </td>
            <td style={tdStyle} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'nowrap' }}>
                <button onClick={() => onView(a)} style={actionBtn('var(--color-accent-gold)')} title="View">👁</button>
                {canEdit && <button onClick={() => onEdit(a)} style={actionBtn('var(--color-primary)')} title="Edit">✏️</button>}
                {canEdit && (a.isBlocked
                  ? <button onClick={() => onUnblock(a)} style={actionBtn('var(--color-success)')} title="Unblock">🔓</button>
                  : <button onClick={() => onBlock(a)} style={actionBtn('var(--color-warning, #f59e0b)')} title="Block">🚫</button>
                )}
                {canDelete && <button onClick={() => onDelete(a)} style={actionBtn('var(--color-error)')} title="Delete">🗑</button>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const thStyle = {
  padding: 'var(--space-3) var(--space-4)',
  textAlign: 'left',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wider)',
  whiteSpace: 'nowrap',
};
const tdStyle = { padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle' };
const actionBtn = (color) => ({
  padding: '4px 8px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

export default AgentTable;
