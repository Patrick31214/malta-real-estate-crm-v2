import React from 'react';
import { CategoryBadge } from './ContactTable';

const DetailRow = ({ label, value }) => value != null && value !== '' ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
  </div>
) : null;

const getInitials = (c) => `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase();

const ContactDetail = ({ contact, onEdit, onToggleActive, onDelete, onClose, canEdit, canDelete }) => {
  if (!contact) return null;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: '#fff',
        }}>
          {getInitials(contact)}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>
              {contact.firstName} {contact.lastName}
            </h1>
            {contact.category && <CategoryBadge category={contact.category} />}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
              color: contact.isActive ? 'var(--color-success)' : 'var(--color-error)',
            }}>
              <span style={{
                display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                background: contact.isActive ? 'var(--color-success)' : 'var(--color-error)',
              }} />
              {contact.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {contact.role && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              {contact.role}{contact.company ? ` · ${contact.company}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        {canEdit && (
          <button onClick={() => onEdit(contact)} style={actionBtn('var(--color-primary)')}>✏️ Edit</button>
        )}
        {canEdit && (
          <button onClick={() => onToggleActive(contact)} style={actionBtn(contact.isActive ? 'var(--color-success)' : 'var(--color-text-muted)')}>
            {contact.isActive ? '✓ Active' : '○ Inactive'}
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(contact)} style={actionBtn('var(--color-error)')}>🗑 Delete</button>
        )}
        <button onClick={onClose} style={actionBtn('var(--color-text-secondary)')}>✕ Close</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Contact Info */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={sectionTitle}>Contact Information</h3>
          <DetailRow
            label="Email"
            value={contact.email
              ? <a href={`mailto:${contact.email}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{contact.email}</a>
              : null}
          />
          <DetailRow
            label="Phone"
            value={contact.phone
              ? <a href={`tel:${contact.phone}`} style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}>{contact.phone}</a>
              : null}
          />
          <DetailRow label="Company" value={contact.company} />
          <DetailRow label="Role" value={contact.role} />
          <DetailRow label="Category" value={contact.category ? contact.category.charAt(0).toUpperCase() + contact.category.slice(1) : null} />
        </div>

        {/* Timestamps */}
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={sectionTitle}>Record Info</h3>
          <DetailRow label="Created" value={contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : null} />
          <DetailRow label="Updated" value={contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString() : null} />
          <DetailRow label="Status" value={contact.isActive ? 'Active' : 'Inactive'} />
        </div>
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
          <h3 style={sectionTitle}>Notes</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap', margin: 0 }}>
            {contact.notes}
          </p>
        </div>
      )}
    </div>
  );
};

const sectionTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-base)',
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-3)',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-2)',
};

const actionBtn = (color) => ({
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  transition: 'all var(--transition-fast)',
});

export default ContactDetail;
