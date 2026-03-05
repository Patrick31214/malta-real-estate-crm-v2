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

const ClientTable = ({ clients, onView, onEdit, canEdit, isFavorite, onToggleFavorite }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-glass)' }}>
            {['Fav','Name','Status','Looking For','Budget','Beds','Locations','Urgency','Matches','Agent','Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const status = getStatusConfig(client.status);
            const urgency = URGENCY_LABELS[client.urgency];
            const localities = client.preferredLocalities || [];
            const matchCount = client.matchCount ?? client.matches?.length ?? 0;
            const agentName = client.agent
              ? `${client.agent.firstName} ${client.agent.lastName}`
              : (client.agentName || '—');

            return (
              <tr
                key={client.id}
                style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background var(--transition-fast)' }}
              >
                {/* Favorite */}
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {onToggleFavorite && (
                    <button
                      onClick={() => onToggleFavorite(client.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                        fontSize: '18px', lineHeight: 1,
                        color: isFavorite?.(client.id) ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
                        transition: 'color var(--transition-fast)',
                      }}
                      title={isFavorite?.(client.id) ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label={isFavorite?.(client.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isFavorite?.(client.id) ? '★' : '☆'}
                    </button>
                  )}
                </td>

                {/* Name */}
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>
                      {client.firstName} {client.lastName}
                    </span>
                    {client.isVIP && <span title="VIP Client" style={{ fontSize: '14px' }}>⭐</span>}
                  </div>
                  {client.email && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{client.email}</div>
                  )}
                </td>

                {/* Status */}
                <td style={tdStyle}>
                  <span style={{ color: status.color, fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>
                    {status.label}
                  </span>
                </td>

                {/* Looking For */}
                <td style={{ ...tdStyle, textTransform: 'capitalize', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                  {(client.lookingFor || '—').replace('_', ' ')}
                </td>

                {/* Budget */}
                <td style={{ ...tdStyle, fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)', whiteSpace: 'nowrap' }}>
                  {formatBudget(client.minBudget, client.maxBudget)}
                </td>

                {/* Bedrooms */}
                <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                  {client.minBedrooms != null || client.maxBedrooms != null
                    ? `${client.minBedrooms ?? '?'} – ${client.maxBedrooms ?? '∞'}`
                    : '—'}
                </td>

                {/* Locations */}
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                    {localities.slice(0, 2).map(loc => (
                      <span key={loc} style={pillStyle}>{loc}</span>
                    ))}
                    {localities.length > 2 && (
                      <span style={{ ...pillStyle, background: 'var(--color-primary-50)', color: 'var(--color-text-muted)' }}>
                        +{localities.length - 2}
                      </span>
                    )}
                    {localities.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>—</span>}
                  </div>
                </td>

                {/* Urgency */}
                <td style={tdStyle}>
                  {urgency
                    ? <span style={{ color: urgency.color, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>
                        {urgency.label}
                      </span>
                    : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
                  }
                </td>

                {/* Matches */}
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {matchCount > 0
                    ? <span style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: 'var(--color-info-light)', color: 'var(--color-info)',
                        fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
                      }}>
                        {matchCount}
                      </span>
                    : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>0</span>
                  }
                </td>

                {/* Agent */}
                <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                  {agentName}
                </td>

                {/* Actions */}
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button onClick={() => onView(client)} style={actionBtn('#5C7A9C')} title="View">👁</button>
                    {canEdit && (
                      <button onClick={() => onEdit(client)} style={actionBtn('var(--color-primary)')} title="Edit">✏️</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

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

const tdStyle = {
  padding: 'var(--space-3) var(--space-4)',
  verticalAlign: 'middle',
};

const pillStyle = {
  fontSize: '10px',
  padding: '2px 7px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
};

const actionBtn = (color) => ({
  padding: '4px 8px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
});

export default ClientTable;
