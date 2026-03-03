import React, { useState } from 'react';

const getInitials = (o) => `${o.firstName?.[0] ?? ''}${o.lastName?.[0] ?? ''}`.toUpperCase();

const blurredStyle = { filter: 'blur(5px)', userSelect: 'none', cursor: 'default', transition: 'filter 0.3s ease', display: 'inline-block' };

const OwnerCard = ({ owner, onView, onEdit, canEdit }) => {
  const [revealed, setRevealed] = useState(false);

  return (
  <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'transform var(--transition-fast)' }} onClick={() => onView(owner)}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
      {owner.profileImage
        ? <img src={owner.profileImage} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: '#fff', flexShrink: 0 }}>{getInitials(owner)}</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{owner.firstName} {owner.lastName}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: owner.isActive ? 'var(--color-success)' : 'var(--color-error)' }}>{owner.isActive ? 'Active' : 'Inactive'}</div>
      </div>
    </div>
    {owner.phone && (
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 'var(--space-1)' }}>
        📞 {revealed
          ? <a href={`tel:${owner.phone}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none', transition: 'filter 0.3s ease' }}>{owner.phone}</a>
          : <span style={blurredStyle}>{owner.phone}</span>
        }
      </div>
    )}
    {owner.email && (
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 'var(--space-1)' }}>
        ✉️ {revealed
          ? <a href={`mailto:${owner.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none', transition: 'filter 0.3s ease' }}>{owner.email}</a>
          : <span style={blurredStyle}>{owner.email}</span>
        }
      </div>
    )}
    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
      <button onClick={(e) => { e.stopPropagation(); setRevealed(r => !r); }} style={{ padding: '4px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-accent-gold)', background: 'transparent', color: 'var(--color-accent-gold)', fontSize: 'var(--text-xs)', cursor: 'pointer' }} title={revealed ? 'Hide' : 'Reveal'}>{revealed ? '🙈 Hide' : '👁 Reveal'}</button>
      {canEdit && (
        <button onClick={(e) => { e.stopPropagation(); onEdit(owner); }} style={{ padding: '4px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>Edit</button>
      )}
    </div>
  </div>
  );
};

export default OwnerCard;
