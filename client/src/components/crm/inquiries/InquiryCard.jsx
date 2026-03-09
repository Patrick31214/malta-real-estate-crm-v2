import React from 'react';

const TYPE_ICONS = {
  property: '🏠',
  work_with_us: '💼',
  affiliate: '🤝',
  general: '📩',
  viewing: '👁',
  valuation: '💰',
};

const STATUS_CONFIGS = {
  new:               { label: 'New',               color: '#3B82F6' },
  open:              { label: 'Open',              color: '#22C55E' },
  assigned:          { label: 'Assigned',          color: '#F97316' },
  in_progress:       { label: 'In Progress',       color: '#F59E0B' },
  viewing_scheduled: { label: 'Viewing Scheduled', color: '#A855F7' },
  resolved:          { label: 'Resolved',          color: '#10B981' },
  closed:            { label: 'Closed',            color: '#6B7280' },
  spam:              { label: 'Spam',              color: '#EF4444' },
};

const PRIORITY_CONFIGS = {
  urgent: { label: 'Urgent', color: '#EF4444' },
  high:   { label: 'High',   color: '#F59E0B' },
  medium: { label: 'Medium', color: '#3B82F6' },
  low:    { label: 'Low',    color: '#6B7280' },
};

const getInitials = (firstName, lastName) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();

const avatarColors = [
  '#9C8367', '#5C7A9C', '#6B8F6B', '#C49A45', '#A85C5C', '#876F55', '#5C4A35',
];

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const InquiryCard = React.memo(({ inquiry, onView, onEdit, canEdit }) => {
  const status   = STATUS_CONFIGS[inquiry.status]   || { label: inquiry.status,   color: 'var(--color-text-muted)' };
  const priority = PRIORITY_CONFIGS[inquiry.priority] || { label: inquiry.priority, color: 'var(--color-text-muted)' };
  const initials    = getInitials(inquiry.firstName, inquiry.lastName);
  const avatarColor = getAvatarColor(`${inquiry.firstName}${inquiry.lastName}`);
  const typeIcon    = TYPE_ICONS[inquiry.type] || '📩';
  const typeLabel   = (inquiry.type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="glass" style={cardStyle}>
      {/* Header */}
      <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        {/* Avatar */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
          background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-base)',
          fontFamily: 'var(--font-heading)',
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)',
            color: 'var(--color-text-primary)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {inquiry.firstName} {inquiry.lastName}
          </h3>
          {inquiry.email && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ✉ {inquiry.email}
            </div>
          )}
          {inquiry.phone && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              📞 {inquiry.phone}
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
      </div>

      {/* Body */}
      <div style={{ padding: '0 var(--space-4) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {/* Type + Priority */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={tagStyle}>
            {typeIcon} {typeLabel}
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
            color: priority.color, background: 'var(--color-surface-glass)',
            border: `1px solid ${priority.color}`,
            whiteSpace: 'nowrap',
          }}>
            {priority.label}
          </span>
        </div>

        {/* Source */}
        {inquiry.source && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Source</span>
            <span style={tagStyle}>{inquiry.source.replace(/_/g, ' ')}</span>
          </div>
        )}

        {/* Assigned agent */}
        {inquiry.assignedTo && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Assigned to</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>
              👤 {inquiry.assignedTo.firstName} {inquiry.assignedTo.lastName}
            </span>
          </div>
        )}

        {/* Property */}
        {inquiry.Property && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🏠 {inquiry.Property.title || inquiry.Property.referenceNumber}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex', gap: 'var(--space-2)',
      }}>
        <button onClick={() => onView(inquiry)} style={btnStyle('#5C7A9C')}>👁 View</button>
        {canEdit && <button onClick={() => onEdit(inquiry)} style={btnStyle('var(--color-primary)')}>✏️ Edit</button>}
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

InquiryCard.displayName = 'InquiryCard';

export { STATUS_CONFIGS, PRIORITY_CONFIGS, TYPE_ICONS };
export default InquiryCard;
