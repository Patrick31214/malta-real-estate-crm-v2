import React from 'react';

const getInitials = (o) => `${o.firstName?.[0] ?? ''}${o.lastName?.[0] ?? ''}`.toUpperCase();

const OwnerTable = ({ owners, onView, onEdit, onDelete, onQuickView, canEdit, canDelete }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', tableLayout: 'fixed' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-glass)' }}>
          <th style={{ ...thStyle, width: '110px' }}>Ref #</th>
          <th style={{ ...thStyle, width: '50px' }}>Photo</th>
          <th style={{ ...thStyle, width: '28%' }}>Name</th>
          <th style={{ ...thStyle, width: '18%' }}>Phone</th>
          <th style={{ ...thStyle, width: '8%' }}>Props</th>
          <th style={{ ...thStyle, width: '10%' }}>Status</th>
          <th style={{ ...thStyle, width: '18%' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {owners.map((o) => (
          <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
            <td style={tdStyle}>
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', background: 'var(--color-surface-glass)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '2px 6px', color: 'var(--color-accent-gold)', whiteSpace: 'nowrap' }}>
                {o.referenceNumber || '—'}
              </span>
            </td>
            <td style={{ ...tdStyle, width: '46px' }}>
              {o.profileImage
                ? <img src={o.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: '#fff' }}>{getInitials(o)}</div>
              }
            </td>
            <td style={tdStyle}>
              <button onClick={() => onView(o)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-accent-gold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.firstName} {o.lastName}
                </div>
              </button>
            </td>
            <td style={tdStyle}>
              {o.phone
                ? <a href={`tel:${o.phone}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{o.phone}</a>
                : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
              }
            </td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                {o.Properties?.length ?? 0}
              </span>
            </td>
            <td style={tdStyle}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: o.isActive ? 'var(--color-success)' : 'var(--color-error)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: o.isActive ? 'var(--color-success)' : 'var(--color-error)', display: 'inline-block' }} />
                {o.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td style={tdStyle}>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <button onClick={() => onQuickView(o)} style={actionBtn('var(--color-accent-gold)')} title="Quick View">📋</button>
                <button onClick={() => onView(o)} style={actionBtn('#5C7A9C')} title="View">👁</button>
                {canEdit && <button onClick={() => onEdit(o)} style={actionBtn('var(--color-primary)')} title="Edit">✏️</button>}
                {canDelete && <button onClick={() => onDelete(o)} style={actionBtn('var(--color-error)')} title="Delete">🗑</button>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const thStyle = { padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', whiteSpace: 'nowrap' };
const tdStyle = { padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' };
const actionBtn = (color) => ({ padding: '4px 8px', borderRadius: 'var(--radius-xs)', border: `1px solid ${color}`, background: 'transparent', color, fontSize: 'var(--text-sm)', cursor: 'pointer' });

export default OwnerTable;
