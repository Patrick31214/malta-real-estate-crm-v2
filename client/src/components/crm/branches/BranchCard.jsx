import React from 'react';

const getInitials = (name) =>
  name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

const StatusBadge = ({ isActive }) => (
  <span
    style={{
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-semibold)',
      padding: '2px 10px',
      borderRadius: '999px',
      background: isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
      color: isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
      textTransform: 'capitalize',
    }}
  >
    {isActive ? '● Active' : '○ Inactive'}
  </span>
);

const BranchCard = React.memo(({ branch, onEdit, onDelete, onViewAgents, onViewDetail, canEdit, canDelete }) => {
  const location = [branch.locality, branch.city].filter(Boolean).join(', ') || branch.address || '—';

  return (
    <div
      className="glass"
      style={{
        padding: 'var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        position: 'relative',
      }}
    >
      {/* Status badge top-right */}
      <div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)' }}>
        <StatusBadge isActive={branch.isActive} />
      </div>

      {/* Header: Logo / initials + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingRight: 'var(--space-16)' }}>
        {branch.logo
          ? (
            <img
              src={branch.logo}
              alt={branch.name}
              style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
            />
          )
          : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--color-accent-gold), #b8860b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-bold)',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {getInitials(branch.name)}
            </div>
          )
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-base)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {branch.name}
          </div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            📍 {location}
          </div>
        </div>
      </div>

      {/* Address */}
      {branch.address && (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
          {branch.address}
        </div>
      )}

      {/* Contact row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        {branch.phone && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            📞 {branch.phone}
          </span>
        )}
        {branch.email && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
            ✉️ {branch.email}
          </span>
        )}
      </div>

      {/* Manager */}
      {branch.manager && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>
          👤 Manager: {branch.manager.firstName} {branch.manager.lastName}
        </div>
      )}

      {/* Agent count */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semibold)',
          padding: '4px 10px',
          borderRadius: '999px',
          background: 'rgba(255,193,7,0.1)',
          border: '1px solid rgba(255,193,7,0.3)',
          color: 'var(--color-accent-gold)',
          width: 'fit-content',
        }}
      >
        🧑‍💼 {branch.agentCount ?? 0} agent{(branch.agentCount ?? 0) !== 1 ? 's' : ''}
      </div>

      {/* Description */}
      {branch.description && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {branch.description}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'auto', paddingTop: 'var(--space-2)', flexWrap: 'wrap' }}>
        {onViewDetail && (
          <button onClick={() => onViewDetail(branch)} style={btnStyle('var(--color-text-secondary)')}>
            👁 View
          </button>
        )}
        <button onClick={() => onViewAgents(branch)} style={btnStyle('var(--color-accent-gold)')}>
          🧑‍💼 Agents
        </button>
        {canEdit && (
          <button onClick={() => onEdit(branch)} style={btnStyle('var(--color-primary)')}>
            ✏️ Edit
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(branch)} style={btnStyle('var(--color-error)')}>
            🗑
          </button>
        )}
      </div>
    </div>
  );
});

BranchCard.displayName = 'BranchCard';

const btnStyle = (color) => ({
  padding: '4px 12px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  fontWeight: 'var(--font-medium)',
  transition: 'background var(--transition-fast)',
});

export default BranchCard;
