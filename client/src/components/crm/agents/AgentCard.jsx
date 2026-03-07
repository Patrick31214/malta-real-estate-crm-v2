import React, { memo } from 'react';
import { AGENT_PERMISSION_CATEGORIES } from '../../../constants/agentPermissions';

const getInitials = (a) => `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

const roleBadge = (role) => {
  const map = {
    admin:   { background: 'rgba(220,53,69,0.15)',  color: 'var(--color-error)' },
    manager: { background: 'rgba(255,193,7,0.15)',  color: 'var(--color-accent-gold)' },
    agent:   { background: 'rgba(13,110,253,0.15)', color: 'var(--color-primary)' },
  };
  const s = map[role] ?? map.agent;
  return (
    <span style={{ ...s, padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' }}>
      {role ?? 'agent'}
    </span>
  );
};

const getStatus = (a) => {
  if (a.isBlocked)                          return { label: 'Blocked',  color: 'var(--color-error, #dc3545)' };
  if (!a.isActive)                          return { label: 'Inactive', color: 'var(--color-text-muted)' };
  if (a.approvalStatus === 'pending')       return { label: 'Pending',  color: 'var(--color-accent-gold)' };
  if (a.approvalStatus === 'rejected')      return { label: 'Rejected', color: 'var(--color-error, #dc3545)' };
  return { label: 'Active', color: 'var(--color-success, #28a745)' };
};

const getPermLabel = (key) => {
  for (const cat of AGENT_PERMISSION_CATEGORIES) {
    const p = cat.permissions.find(p => p.key === key);
    if (p) return p.label;
  }
  return key;
};

const allPermKeys = AGENT_PERMISSION_CATEGORIES.flatMap(cat => cat.permissions.map(p => p.key));

const AgentCard = memo(function AgentCard({ agent: a, onView, onEdit, onBlock, onUnblock, canEdit }) {
  const status = getStatus(a);
  const btnBase = { padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' };

  const permMap = {};
  (a.UserPermissions ?? []).forEach(p => { permMap[p.feature] = p.isEnabled; });
  const enabledPerms = allPermKeys.filter(k => permMap[k] === true);

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {a.profileImage
          ? <img src={a.profileImage} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-lg)', flexShrink: 0 }}>{getInitials(a)}</div>
        }
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.firstName} {a.lastName}</div>
          {a.jobTitle && <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.jobTitle}</div>}
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {roleBadge(a.role)}
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.color, display: 'inline-block' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: status.color, fontWeight: 600 }}>{status.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        {a.email && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {a.email}</div>}
        {a.phone && <div>📞 {a.phone}</div>}
        {a.Branch?.name && <div>🏢 {a.Branch.name}</div>}
        {a.commissionRate != null && <div>💰 {a.commissionRate}% commission</div>}
      </div>

      {/* Permissions chip bar */}
      <div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.05em' }}>PERMISSIONS</div>
        {enabledPerms.length === 0 ? (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No permissions assigned</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxHeight: 72, overflowY: 'auto', paddingRight: 2 }}>
            {enabledPerms.map(k => (
              <span key={k} style={{ background: 'rgba(255,193,7,0.12)', color: 'var(--color-accent-gold)', border: '1px solid rgba(255,193,7,0.25)', borderRadius: 'var(--radius-sm)', padding: '1px 6px', fontSize: 10, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {getPermLabel(k)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
        <button
          style={{ ...btnBase, background: 'var(--color-accent-gold)', color: '#000', border: 'none', fontWeight: 600, padding: '6px 14px' }}
          onClick={() => onView(a)}
        >
          View File
        </button>
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          {canEdit && <button style={btnBase} onClick={() => onEdit(a)} title="Edit">✏️</button>}
          {canEdit && (a.isBlocked
            ? <button style={{ ...btnBase, color: 'var(--color-success, #28a745)' }} onClick={() => onUnblock(a)} title="Unblock">🔓</button>
            : <button style={{ ...btnBase, color: 'var(--color-error, #dc3545)' }} onClick={() => onBlock(a)} title="Block">🚫</button>
          )}
        </div>
      </div>
    </div>
  );
});

export default AgentCard;
