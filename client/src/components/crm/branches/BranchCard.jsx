import React from 'react';

const getInitials = (name) =>
  name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

const BranchCard = React.memo(({ branch, onEdit, onDelete, onViewDetail, canEdit, canDelete }) => {
  const location = [branch.locality, branch.city].filter(Boolean).join(', ') || branch.address || '—';

  return (
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.2s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-accent-gold), 0 8px 24px rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      {/* Cover image / gradient header */}
      <div style={{
        height: 80,
        background: branch.coverImage
          ? `url(${branch.coverImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Status badge overlay */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <span style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: '999px',
            background: branch.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(107,114,128,0.2)',
            color: branch.isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${branch.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.3)'}`,
          }}>
            {branch.isActive ? '● Active' : '○ Inactive'}
          </span>
        </div>

        {/* Logo / initials — overlapping bottom of header */}
        <div style={{ position: 'absolute', bottom: -22, left: 16 }}>
          {branch.logo
            ? (
              <img
                src={branch.logo}
                alt={branch.name}
                style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '2px solid var(--color-border)', background: 'var(--color-surface-glass)' }}
              />
            )
            : (
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--color-accent-gold), #b8860b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-base)',
                fontWeight: 800,
                color: '#fff',
                border: '2px solid var(--color-border)',
              }}>
                {getInitials(branch.name)}
              </div>
            )
          }
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: 'var(--space-4)', paddingTop: 'calc(var(--space-4) + 22px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
        {/* Name */}
        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {branch.name}
        </div>

        {/* Location */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📍 {location}
        </div>

        {/* Manager */}
        {branch.manager && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>
            👤 {branch.manager.firstName} {branch.manager.lastName}
          </div>
        )}

        {/* Contact row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {branch.phone && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>📞 {branch.phone}</span>
          )}
          {branch.email && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
              ✉️ {branch.email}
            </span>
          )}
        </div>

        {/* Agent count */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', color: 'var(--color-accent-gold)', width: 'fit-content' }}>
          🧑‍💼 {branch.agentCount ?? 0} agent{(branch.agentCount ?? 0) !== 1 ? 's' : ''}
        </div>

        {/* Description */}
        {branch.description && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {branch.description}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'auto', paddingTop: 'var(--space-2)', flexWrap: 'wrap' }}>
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(branch)}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-accent-gold)',
                background: 'var(--color-accent-gold)',
                color: '#000',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              👁 View Branch
            </button>
          )}
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
    </div>
  );
});

BranchCard.displayName = 'BranchCard';

const btnStyle = (color) => ({
  padding: '6px 12px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'background 0.15s',
  whiteSpace: 'nowrap',
});

export default BranchCard;
