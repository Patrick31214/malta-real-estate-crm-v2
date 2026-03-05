import React from 'react';
import { CLIENT_STATUSES, URGENCY_LABELS } from '../../../constants/clientRequirements';

const getStatusConfig = (value) => CLIENT_STATUSES.find(s => s.value === value) || { label: value, color: 'var(--color-text-muted)' };

const formatBudget = (min, max) => {
  const fmt = (n) => {
    if (!n) return null;
    const num = Number(n);
    if (num >= 1000000) return `€${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `€${Math.round(num / 1000)}k`;
    return `€${num.toLocaleString()}`;
  };
  const fMin = fmt(min);
  const fMax = fmt(max);
  if (fMin && fMax) return `${fMin} – ${fMax}`;
  if (fMin) return `From ${fMin}`;
  if (fMax) return `Up to ${fMax}`;
  return '—';
};

const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
};

const avatarColors = [
  '#9C8367','#5C7A9C','#6B8F6B','#C49A45','#A85C5C','#876F55','#5C4A35',
];

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const ClientCard = React.memo(({ client, onView, onEdit, canEdit, isFavorite, onToggleFavorite }) => {
  const status = getStatusConfig(client.status);
  const urgency = URGENCY_LABELS[client.urgency];
  const initials = getInitials(client.firstName, client.lastName);
  const avatarColor = getAvatarColor(`${client.firstName}${client.lastName}`);
  const localities = client.preferredLocalities || [];
  const matchCount = client.matchCount ?? client.matches?.length ?? 0;
  const lookingFor = (client.lookingFor || '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="glass" style={cardStyle}>
      {/* Header: avatar + VIP + name + nationality */}
      <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        {/* Avatar */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
          background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-base)',
          fontFamily: 'var(--font-heading)',
          position: 'relative',
        }}>
          {initials}
          {client.isVIP && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              fontSize: '14px', lineHeight: 1,
            }} title="VIP Client">⭐</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h3 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)',
              color: 'var(--color-text-primary)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {client.firstName} {client.lastName}
            </h3>
          </div>
          {client.nationality && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              🌍 {client.nationality}
            </div>
          )}
        </div>

        {/* Status badge */}
        <span style={{
          padding: '2px 8px', borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
          color: status.color, background: 'var(--color-surface-glass)',
          border: `1px solid ${status.color}`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {status.label}
        </span>

        {/* Favorite toggle */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(client.id); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
              fontSize: '18px', lineHeight: 1, flexShrink: 0,
              color: isFavorite ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
              transition: 'color var(--transition-fast)',
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0 var(--space-4) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {/* Budget */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Budget</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)' }}>
            {formatBudget(client.minBudget, client.maxBudget)}
          </span>
        </div>

        {/* Looking for */}
        {client.lookingFor && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Looking For</span>
            <span style={tagStyle}>{lookingFor}</span>
          </div>
        )}

        {/* Localities */}
        {localities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
            {localities.slice(0, 3).map(loc => (
              <span key={loc} style={pillStyle}>{loc}</span>
            ))}
            {localities.length > 3 && (
              <span style={{ ...pillStyle, background: 'var(--color-primary-50)', color: 'var(--color-text-muted)' }}>
                +{localities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Urgency + Matches row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-1)' }}>
          {urgency ? (
            <span style={{
              fontSize: 'var(--text-xs)', padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              color: urgency.color, border: `1px solid ${urgency.color}`,
              background: 'var(--color-surface-glass)',
            }}>
              ⏰ {urgency.label}
            </span>
          ) : <span />}

          {matchCount > 0 && (
            <span style={{
              fontSize: 'var(--text-xs)', padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-info-light)', color: 'var(--color-info)',
              fontWeight: 'var(--font-semibold)',
            }}>
              🔗 {matchCount} match{matchCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex', gap: 'var(--space-2)',
      }}>
        <button onClick={() => onView(client)} style={btnStyle('#5C7A9C')}>👁 View</button>
        {canEdit && <button onClick={() => onEdit(client)} style={btnStyle('var(--color-primary)')}>✏️ Edit</button>}
      </div>
    </div>
  );
});

const cardStyle = {
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
};

const tagStyle = {
  fontSize: 'var(--text-xs)',
  padding: '2px 8px',
  background: 'var(--color-surface-glass)',
  borderRadius: 'var(--radius-full)',
  color: 'var(--color-text-muted)',
  textTransform: 'capitalize',
};

const pillStyle = {
  fontSize: '10px',
  padding: '2px 7px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-text-secondary)',
};

const btnStyle = (color) => ({
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  fontWeight: 'var(--font-medium)',
  transition: 'background var(--transition-fast)',
  whiteSpace: 'nowrap',
});

ClientCard.displayName = 'ClientCard';

export default ClientCard;
