import React from 'react';

const getInitials = (o) => `${o.firstName?.[0] ?? ''}${o.lastName?.[0] ?? ''}`.toUpperCase();

const DetailRow = ({ label, value }) => value != null && value !== '' ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>{value}</span>
  </div>
) : null;

const OwnerDetail = ({ owner, onEdit, onClose, canEdit, canDelete, onDelete }) => {
  if (!owner) return null;
  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {owner.profileImage
          ? <img src={owner.profileImage} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: '#fff' }}>{getInitials(owner)}</div>
        }
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-1)' }}>{owner.firstName} {owner.lastName}</h1>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: owner.isActive ? 'var(--color-success)' : 'var(--color-error)' }}>
            {owner.isActive ? '● Active' : '● Inactive'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        {canEdit && <button onClick={() => onEdit(owner)} style={actionBtn('var(--color-primary)')}>✏️ Edit</button>}
        {canDelete && <button onClick={() => onDelete(owner)} style={actionBtn('var(--color-error)')}>🗑 Delete</button>}
        <button onClick={onClose} style={actionBtn('var(--color-text-secondary)')}>✕ Close</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={secTitle}>Contact Information</h3>
          <DetailRow label="Email" value={owner.email ? <a href={`mailto:${owner.email}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{owner.email}</a> : null} />
          <DetailRow label="Phone" value={owner.phone ? <a href={`tel:${owner.phone}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{owner.phone}</a> : null} />
          <DetailRow label="Alt. Phone" value={owner.alternatePhone} />
          <DetailRow label="ID Number" value={owner.idNumber} />
          <DetailRow label="Address" value={owner.address} />
        </div>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={secTitle}>Record Info</h3>
          <DetailRow label="Status" value={owner.isActive ? 'Active' : 'Inactive'} />
          <DetailRow label="Created" value={owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : null} />
          <DetailRow label="Updated" value={owner.updatedAt ? new Date(owner.updatedAt).toLocaleDateString() : null} />
        </div>
      </div>
      {owner.notes && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
          <h3 style={secTitle}>Notes</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap', margin: 0 }}>{owner.notes}</p>
        </div>
      )}
    </div>
  );
};

const secTitle = { fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' };
const actionBtn = (color) => ({ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: `1px solid ${color}`, background: 'transparent', color, cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' });

export default OwnerDetail;
