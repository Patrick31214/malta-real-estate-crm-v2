import React from 'react';

const CATEGORY_CONFIG = {
  legal:       { label: 'Legal',       color: '#4F46E5', bg: 'rgba(79,70,229,0.15)' },
  maintenance: { label: 'Maintenance', color: '#D97706', bg: 'rgba(217,119,6,0.15)' },
  emergency:   { label: 'Emergency',   color: '#DC2626', bg: 'rgba(220,38,38,0.15)' },
  staff:       { label: 'Staff',       color: '#059669', bg: 'rgba(5,150,105,0.15)' },
  branch:      { label: 'Branch',      color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
  other:       { label: 'Other',       color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
};

export const CategoryBadge = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-semibold)',
      color: cfg.color,
      background: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

const ContactTable = ({ contacts, onView, onEdit, onToggleActive, onDelete, canEdit, canDelete }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-glass)' }}>
            {['Name', 'Category', 'Company', 'Role', 'Phone', 'Email', 'Status', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background var(--transition-fast)' }}>
              <td style={tdStyle}>
                <button
                  onClick={() => onView(c)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-accent-gold)' }}>
                    {c.firstName} {c.lastName}
                  </div>
                </button>
              </td>
              <td style={tdStyle}>
                {c.category ? <CategoryBadge category={c.category} /> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
              </td>
              <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{c.company || '—'}</td>
              <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{c.role || '—'}</td>
              <td style={tdStyle}>
                {c.phone
                  ? <a href={`tel:${c.phone}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{c.phone}</a>
                  : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                }
              </td>
              <td style={tdStyle}>
                {c.email
                  ? <a href={`mailto:${c.email}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{c.email}</a>
                  : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                }
              </td>
              <td style={tdStyle}>
                <span style={{
                  display: 'inline-block',
                  width: '10px', height: '10px',
                  borderRadius: '50%',
                  background: c.isActive ? 'var(--color-success)' : 'var(--color-error)',
                  marginRight: 'var(--space-2)',
                }} />
                <span style={{ color: c.isActive ? 'var(--color-success)' : 'var(--color-error)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button onClick={() => onView(c)} style={actionBtn('#5C7A9C')} title="View">👁</button>
                  {canEdit && <button onClick={() => onEdit(c)} style={actionBtn('var(--color-primary)')} title="Edit">✏️</button>}
                  {canEdit && (
                    <button onClick={() => onToggleActive(c)} style={actionBtn(c.isActive ? 'var(--color-success)' : 'var(--color-text-muted)')} title="Toggle Active">
                      {c.isActive ? '✓' : '○'}
                    </button>
                  )}
                  {canDelete && <button onClick={() => onDelete(c)} style={actionBtn('var(--color-error)')} title="Delete">🗑</button>}
                </div>
              </td>
            </tr>
          ))}
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

const actionBtn = (color) => ({
  padding: '4px 8px',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
});

export default ContactTable;
