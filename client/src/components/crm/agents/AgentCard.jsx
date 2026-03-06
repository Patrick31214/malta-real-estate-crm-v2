import React from 'react';

const getInitials = (a) => `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

const RoleBadge = ({ role }) => {
  const colors = {
    admin:   { bg: 'rgba(220,53,69,0.15)',  color: 'var(--color-error)' },
    manager: { bg: 'rgba(255,193,7,0.15)',  color: 'var(--color-accent-gold)' },
    agent:   { bg: 'rgba(13,110,253,0.15)', color: 'var(--color-primary)' },
  };
  const c = colors[role] || colors.agent;
  return (
    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', padding: '2px 10px', borderRadius: '999px', background: c.bg, color: c.color, textTransform: 'capitalize' }}>
      {role}
    </span>
  );
};

const AgentCard = React.memo(({ agent, onView, onEdit, onBlock, onUnblock, canEdit }) => {
  const chips = (items) => items?.length > 0
    ? items.slice(0, 3).map((item, i) => (
        <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '999px', background: 'var(--color-surface-glass)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
          {item}
        </span>
      ))
    : null;

  return (
    <div
      className="glass"
      style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'transform var(--transition-fast)', position: 'relative' }}
      onClick={() => onView(agent)}
    >
      {/* Status indicator */}
      <div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
        {agent.isBlocked
          ? <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', fontWeight: 'var(--font-semibold)' }}>🚫 Blocked</span>
          : agent.isActive
            ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} title="Active" />
            : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-muted)', display: 'inline-block' }} title="Inactive" />
        }
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        {agent.profileImage
          ? <img src={agent.profileImage} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: '#fff', flexShrink: 0 }}>{getInitials(agent)}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
            {agent.firstName} {agent.lastName}
          </div>
          <RoleBadge role={agent.role} />
        </div>
      </div>

      {/* Info */}
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        ✉️ {agent.email || '—'}
      </div>
      {agent.phone && (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
          📞 {agent.phone}
        </div>
      )}
      {agent.Branch && (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
          🏢 {agent.Branch.name}
        </div>
      )}
      {agent.licenseNumber && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', fontFamily: 'monospace' }}>
          License: {agent.licenseNumber}
        </div>
      )}
      {agent.commissionRate != null && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>
          Commission: {parseFloat(agent.commissionRate).toFixed(1)}%
        </div>
      )}

      {/* Chips */}
      {agent.specializations?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-2)' }}>
          {chips(agent.specializations)}
          {agent.specializations.length > 3 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>+{agent.specializations.length - 3} more</span>
          )}
        </div>
      )}
      {agent.languages?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-2)' }}>
          {agent.languages.slice(0, 3).map((l, i) => (
            <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', color: 'var(--color-accent-gold)' }}>
              🌐 {l}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(agent)} style={btn('var(--color-accent-gold)')}>👁 View</button>
        {canEdit && <button onClick={() => onEdit(agent)} style={btn('var(--color-primary)')}>✏️ Edit</button>}
        {canEdit && (agent.isBlocked
          ? <button onClick={() => onUnblock(agent)} style={btn('var(--color-success)')}>🔓</button>
          : <button onClick={() => onBlock(agent)} style={btn('var(--color-warning, #f59e0b)')}>🚫</button>
        )}
      </div>
    </div>
  );
});

AgentCard.displayName = 'AgentCard';

const btn = (color) => ({
  padding: '4px 12px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
});

export default AgentCard;
