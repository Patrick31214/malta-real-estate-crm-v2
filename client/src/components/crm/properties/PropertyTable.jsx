import React from 'react';
import UserAvatar from '../../ui/UserAvatar';
import { timeAgo } from '../../../utils/timeAgo';

const statusConfig = {
  listed:      { label: 'Listed',      color: 'var(--color-success)' },
  draft:       { label: 'Draft',       color: 'var(--color-text-muted)' },
  under_offer: { label: 'Under Offer', color: 'var(--color-warning)' },
  sold:        { label: 'Sold',        color: 'var(--color-error)' },
  rented:      { label: 'Rented',      color: 'var(--color-info)' },
  withdrawn:   { label: 'Withdrawn',   color: 'var(--color-error)' },
};

const approvalConfig = {
  pending:      { label: '⏳ Pending',  cls: 'approval-badge pending' },
  approved:     { label: '✓ Approved', cls: 'approval-badge approved' },
  rejected:     { label: '✗ Rejected', cls: 'approval-badge rejected' },
  not_required: null,
};

const formatPrice = (price, listingType) => {
  const num = parseFloat(price);
  const formatted = '€ ' + num.toLocaleString('en-MT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (listingType === 'long_let' || listingType === 'short_let') return formatted + '/mo';
  return formatted;
};

const PropertyTable = React.memo(({ properties, onView, onEdit, onToggleAvailable, onToggleFeatured, onUpdateAvailableDate, canEdit, canToggleFeatured, isFavorite, onToggleFavorite }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-glass)' }}>
            {['Fav','Ref #','Image','Title','Type','Price','Status','Approval','Beds/Baths','Features','Owner','Agent','Available','Avail. Date','Updated','Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => {
            const status = statusConfig[p.status] || statusConfig.draft;

            return (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background var(--transition-fast)' }}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {onToggleFavorite && (
                    <button
                      onClick={() => onToggleFavorite(p.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                        fontSize: '18px', lineHeight: 1,
                        color: isFavorite?.(p.id) ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
                        transition: 'color var(--transition-fast)',
                      }}
                      title={isFavorite?.(p.id) ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label={isFavorite?.(p.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isFavorite?.(p.id) ? '★' : '☆'}
                    </button>
                  )}
                </td>
                <td style={tdStyle}>
                  {p.referenceNumber
                    ? <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', background: 'var(--color-surface-glass)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '2px 6px', color: 'var(--color-accent-gold)', whiteSpace: 'nowrap' }}>{p.referenceNumber}</span>
                    : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
                  }
                </td>
                <td style={tdStyle}>
                  {p.heroImage
                    ? <img src={p.heroImage} alt={p.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    : <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))' }} />
                  }
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>{p.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>📍 {p.locality}</div>
                </td>
                <td style={{ ...tdStyle, textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>{p.type || '—'}</td>
                <td style={{ ...tdStyle, fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)', whiteSpace: 'nowrap' }}>
                  {formatPrice(p.price, p.listingType)}
                </td>
                <td style={tdStyle}>
                  <span style={{ color: status.color, fontWeight: 'var(--font-medium)' }}>{status.label}</span>
                </td>
                <td style={tdStyle}>
                  {approvalConfig[p.approvalStatus]
                    ? <span className={approvalConfig[p.approvalStatus].cls}>{approvalConfig[p.approvalStatus].label}</span>
                    : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
                  }
                  {p.isPublishedToWebsite && <span className="published-badge" style={{ marginLeft: '4px' }}>🌐</span>}
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
                  {p.bedrooms != null ? `🛏 ${p.bedrooms}` : ''} {p.bathrooms != null ? `· 🚿 ${p.bathrooms}` : ''}
                </td>
                <td style={tdStyle}>
                  {p.features && p.features.length > 0
                    ? <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-50)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>
                        {p.features.length} feature{p.features.length !== 1 ? 's' : ''}
                      </span>
                    : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
                  }
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{p.Owner ? `${p.Owner.firstName} ${p.Owner.lastName}` : '—'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <UserAvatar user={p.agent} size="sm" />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {p.agent ? `${p.agent.firstName} ${p.agent.lastName}` : '—'}
                    </span>
                  </div>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => onToggleAvailable(p)}
                    style={{
                      padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)',
                      background: p.isAvailable ? 'var(--color-success)' : 'var(--color-error)',
                      color: '#fff', fontWeight: 'var(--font-medium)',
                    }}
                  >
                    {p.isAvailable ? 'Yes' : 'No'}
                  </button>
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <input
                    type="date"
                    value={p.availableFrom ? p.availableFrom.slice(0, 10) : ''}
                    disabled={!canEdit}
                    onChange={e => onUpdateAvailableDate && onUpdateAvailableDate(p, e.target.value || null)}
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: '2px 4px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-glass)',
                      color: 'var(--color-text-secondary)',
                      cursor: canEdit ? 'pointer' : 'default',
                    }}
                  />
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                  {timeAgo(p.updatedAt)}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button onClick={() => onView(p)} style={actionBtn('#5C7A9C')} title="View">👁</button>
                    {canEdit && <button onClick={() => onEdit(p)} style={actionBtn('var(--color-primary)')} title="Edit">✏️</button>}
                    {canToggleFeatured && (
                      <button onClick={() => onToggleFeatured(p)} style={actionBtn(p.isFeatured ? 'var(--color-accent-gold)' : 'var(--color-text-muted)')} title="Toggle Featured">⭐</button>
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
});

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

const actionBtn = (color) => ({
  padding: '4px 8px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
});

export default PropertyTable;
