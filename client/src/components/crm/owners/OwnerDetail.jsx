import React, { useState } from 'react';
import BlurredText from '../../ui/BlurredText';
import api from '../../../services/api';

const getInitials = (o) => `${o.firstName?.[0] ?? ''}${o.lastName?.[0] ?? ''}`.toUpperCase();

const DetailRow = ({ label, value }) => value != null && value !== '' ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>{value}</span>
  </div>
) : null;

const OwnerDetail = ({ owner, onEdit, onClose, canEdit, canDelete, onDelete, onViewProperty }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [inlineProperty, setInlineProperty] = useState(null);
  const [loadingPropertyId, setLoadingPropertyId] = useState(null);

  const handlePropertyClick = async (p) => {
    // Toggle off if same property
    if (selectedPropertyId === p.id) {
      setSelectedPropertyId(null);
      setInlineProperty(null);
      return;
    }
    setSelectedPropertyId(p.id);
    setInlineProperty(null);
    setLoadingPropertyId(p.id);
    try {
      const res = await api.get(`/properties/${p.id}`);
      setInlineProperty(res.data);
    } catch {
      setInlineProperty(null);
    } finally {
      setLoadingPropertyId(null);
    }
  };

  if (!owner) return null;
  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {owner.profileImage
          ? <img src={owner.profileImage} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: '#fff' }}>{getInitials(owner)}</div>
        }
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>{owner.firstName} {owner.lastName}</h1>
            {owner.referenceNumber && (
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)', background: 'var(--color-surface-glass)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '2px 8px', color: 'var(--color-accent-gold)' }}>
                {owner.referenceNumber}
              </span>
            )}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: owner.isActive ? 'var(--color-success)' : 'var(--color-error)' }}>
            {owner.isActive ? '● Active' : '● Inactive'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        {canEdit && <button onClick={() => onEdit(owner)} style={actionBtn('var(--color-primary)')}>✏️ Edit</button>}
        {canDelete && <button onClick={() => onDelete(owner)} style={actionBtn('var(--color-error)')}>🗑 Delete</button>}
        <button onClick={onClose} style={actionBtn('var(--color-text-secondary)')}>✕ Close</button>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={secTitle}>Contact Information</h3>
          <DetailRow label="Email" value={owner.email ? <BlurredText text={owner.email} type="email" href={`mailto:${owner.email}`} /> : null} />
          <DetailRow label="Phone" value={owner.phone ? <BlurredText text={owner.phone} type="phone" href={`tel:${owner.phone}`} /> : null} />
          <DetailRow label="Alt. Phone" value={owner.alternatePhone} />
          <DetailRow label="ID Number" value={owner.idNumber} />
          <DetailRow label="Date of Birth" value={owner.dateOfBirth} />
          <DetailRow label="Nationality" value={owner.nationality} />
          <DetailRow label="Language" value={owner.preferredLanguage} />
          <DetailRow label="Address" value={owner.address} />
        </div>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={secTitle}>Company / Record</h3>
          <DetailRow label="Company" value={owner.companyName} />
          <DetailRow label="Tax ID / VAT" value={owner.taxId} />
          <DetailRow label="Reference #" value={owner.referenceNumber} />
          <DetailRow label="Status" value={owner.isActive ? 'Active' : 'Inactive'} />
          <DetailRow label="Created" value={owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : null} />
          <DetailRow label="Updated" value={owner.updatedAt ? new Date(owner.updatedAt).toLocaleDateString() : null} />
        </div>
      </div>

      {/* Notes */}
      {owner.notes && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={secTitle}>Notes</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap', margin: 0 }}>{owner.notes}</p>
        </div>
      )}

      {/* Linked Properties */}
      {owner.Properties && owner.Properties.length > 0 && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={secTitle}>Linked Properties ({owner.Properties.length})</h3>
          {owner.Properties.map(p => (
            <React.Fragment key={p.id}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}
                onClick={() => handlePropertyClick(p)}
                title="Click to expand property details"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: 'var(--color-accent-gold)', fontWeight: 'var(--font-medium)', textDecoration: 'underline' }}>{p.title || p.id}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                    {[p.referenceNumber, p.type, p.locality].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0, marginLeft: 'var(--space-3)' }}>
                  {p.price && <span style={{ color: 'var(--color-accent-gold)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)' }}>{p.currency || '€'}{Number(p.price).toLocaleString()}</span>}
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{p.status}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{selectedPropertyId === p.id ? '▲ Collapse' : '▼ Expand'}</span>
                </div>
              </div>

              {/* Inline property detail */}
              {selectedPropertyId === p.id && (
                <div style={{ background: 'var(--color-primary-50)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-2)', border: '1px solid var(--color-border-light)' }}>
                  {loadingPropertyId === p.id && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</p>
                  )}
                  {inlineProperty && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        <div>
                          <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>{inlineProperty.title}</div>
                          {inlineProperty.referenceNumber && (
                            <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', background: 'var(--color-surface-glass)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '1px 6px', color: 'var(--color-accent-gold)' }}>
                              {inlineProperty.referenceNumber}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          {onViewProperty && (
                            <button onClick={() => onViewProperty(inlineProperty)} style={actionBtn('var(--color-primary)')}>Open in Properties</button>
                          )}
                          <button onClick={() => { setSelectedPropertyId(null); setInlineProperty(null); }} style={actionBtn('var(--color-text-secondary)')}>✕ Close</button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                        <div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)' }}>Details</div>
                          {inlineProperty.type && <div><span style={{ color: 'var(--color-text-muted)' }}>Type: </span>{inlineProperty.type}</div>}
                          {inlineProperty.listingType && <div><span style={{ color: 'var(--color-text-muted)' }}>Listing: </span>{inlineProperty.listingType.replace(/_/g,' ')}</div>}
                          {inlineProperty.locality && <div><span style={{ color: 'var(--color-text-muted)' }}>Locality: </span>{inlineProperty.locality}</div>}
                          {inlineProperty.status && <div><span style={{ color: 'var(--color-text-muted)' }}>Status: </span>{inlineProperty.status}</div>}
                          {inlineProperty.price && <div><span style={{ color: 'var(--color-text-muted)' }}>Price: </span><span style={{ color: 'var(--color-accent-gold)', fontWeight: 'var(--font-semibold)' }}>€{Number(inlineProperty.price).toLocaleString()}</span></div>}
                        </div>
                        <div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)' }}>Specs</div>
                          {inlineProperty.bedrooms != null && <div><span style={{ color: 'var(--color-text-muted)' }}>Beds: </span>{inlineProperty.bedrooms}</div>}
                          {inlineProperty.bathrooms != null && <div><span style={{ color: 'var(--color-text-muted)' }}>Baths: </span>{inlineProperty.bathrooms}</div>}
                          {inlineProperty.area != null && <div><span style={{ color: 'var(--color-text-muted)' }}>Area: </span>{inlineProperty.area} m²</div>}
                          {inlineProperty.yearBuilt && <div><span style={{ color: 'var(--color-text-muted)' }}>Year: </span>{inlineProperty.yearBuilt}</div>}
                        </div>
                        {inlineProperty.agent && (
                          <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)' }}>Agent</div>
                            <div>{inlineProperty.agent.firstName} {inlineProperty.agent.lastName}</div>
                            {inlineProperty.agent.email && <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{inlineProperty.agent.email}</div>}
                          </div>
                        )}
                      </div>

                      {inlineProperty.description && (
                        <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                          <div style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: '4px' }}>Description</div>
                          <p style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{inlineProperty.description}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Contacts / Relatives */}
      {owner.contacts && owner.contacts.length > 0 && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={secTitle}>Contacts &amp; Relatives ({owner.contacts.length})</h3>
          {owner.contacts.map(c => (
            <div key={c.id} style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div>
                  <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{c.firstName} {c.lastName}</span>
                  <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{c.relationship}</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {c.isEmergency && <span style={badge('var(--color-error)')}>Emergency</span>}
                  {c.isPrimary && <span style={badge('var(--color-accent-gold)')}>Primary</span>}
                </div>
              </div>
              {c.phone && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>📞 <a href={`tel:${c.phone}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{c.phone}</a>{c.alternatePhone && ` · ${c.alternatePhone}`}</div>}
              {c.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>✉️ <a href={`mailto:${c.email}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{c.email}</a></div>}
              {c.notes && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>{c.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const secTitle = { fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' };
const actionBtn = (color) => ({ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: `1px solid ${color}`, background: 'transparent', color, cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' });
const badge = (color) => ({ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color, border: `1px solid ${color}`, borderRadius: 'var(--radius-xs)', padding: '1px 6px' });

export default OwnerDetail;
