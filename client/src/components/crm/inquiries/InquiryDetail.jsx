import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { STATUS_CONFIGS, PRIORITY_CONFIGS } from './InquiryCard';

const STATUSES = [
  { value: 'new',               label: 'New' },
  { value: 'open',              label: 'Open' },
  { value: 'assigned',          label: 'Assigned' },
  { value: 'in_progress',       label: 'In Progress' },
  { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
  { value: 'resolved',          label: 'Resolved' },
  { value: 'closed',            label: 'Closed' },
  { value: 'spam',              label: 'Spam' },
];

const InquiryDetail = ({ inquiry: initial, onEdit, onDelete, onClose, onStatusChange, canEdit, canDelete }) => {
  const { showError, showSuccess } = useToast();
  const [inquiry, setInquiry] = useState(initial);
  const [agents, setAgents] = useState([]);
  const [assigningTo, setAssigningTo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState(initial?.adminNotes || '');

  useEffect(() => {
    if (initial?.id) {
      api.get(`/inquiries/${initial.id}`)
        .then(r => { setInquiry(r.data); setAdminNotes(r.data.adminNotes || ''); })
        .catch(() => {});
    }
    api.get('/agents', { params: { limit: 200, status: 'active' } })
      .then(r => setAgents(r.data.agents || r.data.users || []))
      .catch(() => {});
  }, [initial?.id]);

  if (!inquiry) return null;

  const status   = STATUS_CONFIGS[inquiry.status]     || { label: inquiry.status,   color: 'var(--color-text-muted)' };
  const priority = PRIORITY_CONFIGS[inquiry.priority] || { label: inquiry.priority, color: 'var(--color-text-muted)' };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.put(`/inquiries/${inquiry.id}`, { status: newStatus });
      setInquiry(i => ({ ...i, status: res.data.status }));
      if (onStatusChange) onStatusChange(inquiry, res.data.status);
      showSuccess('Status updated');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleAssign = async () => {
    if (!assigningTo) return;
    setAssigning(true);
    try {
      const res = await api.post(`/inquiries/${inquiry.id}/assign`, { assignedToId: assigningTo });
      setInquiry(res.data);
      showSuccess('Inquiry assigned');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to assign inquiry');
    } finally {
      setAssigning(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await api.put(`/inquiries/${inquiry.id}`, { adminNotes });
      setInquiry(i => ({ ...i, adminNotes: res.data.adminNotes }));
      showSuccess('Notes saved');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const typeLabel = (inquiry.type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
            {inquiry.firstName} {inquiry.lastName}
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={badgeStyle(status.color)}>{status.label}</span>
            <span style={badgeStyle(priority.color)}>{priority.label}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{typeLabel}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {canEdit && (
            <button onClick={() => onEdit(inquiry)} style={actionBtnStyle('var(--color-primary)')}>✏️ Edit</button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(inquiry)} style={actionBtnStyle('var(--color-error)')}>🗑 Delete</button>
          )}
          <button onClick={onClose} style={actionBtnStyle('var(--color-text-muted)')}>✕ Close</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        {/* Contact Info */}
        <div className="glass" style={sectionStyle}>
          <h3 style={sectionTitle}>Contact Info</h3>
          <DetailRow label="Email"  value={inquiry.email  || '—'} />
          <DetailRow label="Phone"  value={inquiry.phone  || '—'} />
          <DetailRow label="Source" value={inquiry.source ? inquiry.source.replace(/_/g, ' ') : '—'} />
          <DetailRow label="Created" value={inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : '—'} />
        </div>

        {/* Assignment */}
        <div className="glass" style={sectionStyle}>
          <h3 style={sectionTitle}>Assignment</h3>
          {inquiry.assignedTo ? (
            <DetailRow label="Assigned to" value={`${inquiry.assignedTo.firstName} ${inquiry.assignedTo.lastName}`} />
          ) : (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>Not assigned</p>
          )}
          {inquiry.assignedAt && (
            <DetailRow label="Assigned at" value={new Date(inquiry.assignedAt).toLocaleDateString()} />
          )}
          {canEdit && (
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
              <select
                value={assigningTo}
                onChange={e => setAssigningTo(e.target.value)}
                style={{ ...selectStyle, flex: 1 }}
              >
                <option value="">— Select agent —</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                ))}
              </select>
              <button onClick={handleAssign} disabled={assigning || !assigningTo} style={saveBtnStyle}>
                {assigning ? '…' : 'Assign'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Buttons */}
      {canEdit && (
        <div className="glass" style={{ ...sectionStyle, marginTop: 'var(--space-5)' }}>
          <h3 style={sectionTitle}>Change Status</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {STATUSES.map(s => {
              const isActive = inquiry.status === s.value;
              const cfg = STATUS_CONFIGS[s.value] || {};
              return (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${cfg.color || 'var(--color-border)'}`,
                    background: isActive ? (cfg.color || 'var(--color-border)') : 'transparent',
                    color: isActive ? '#fff' : (cfg.color || 'var(--color-text-muted)'),
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Message */}
      {inquiry.message && (
        <div className="glass" style={{ ...sectionStyle, marginTop: 'var(--space-5)' }}>
          <h3 style={sectionTitle}>Message</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {inquiry.message}
          </p>
        </div>
      )}

      {/* Linked Property */}
      {inquiry.Property && (
        <div className="glass" style={{ ...sectionStyle, marginTop: 'var(--space-5)' }}>
          <h3 style={sectionTitle}>Linked Property</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                {inquiry.Property.title || inquiry.Property.referenceNumber}
              </div>
              {inquiry.Property.locality && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>📍 {inquiry.Property.locality}</div>
              )}
            </div>
            {inquiry.Property.price && (
              <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)' }}>
                {inquiry.Property.currency || '€'}{Number(inquiry.Property.price).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Admin Notes */}
      <div className="glass" style={{ ...sectionStyle, marginTop: 'var(--space-5)' }}>
        <h3 style={sectionTitle}>Admin Notes</h3>
        <textarea
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
          rows={4}
          readOnly={!canEdit}
          style={{ ...textareaStyle, background: canEdit ? 'var(--color-surface-glass)' : 'transparent' }}
          placeholder={canEdit ? 'Add internal notes…' : 'No notes'}
        />
        {canEdit && (
          <button onClick={handleSaveNotes} disabled={savingNotes} style={{ ...saveBtnStyle, marginTop: 'var(--space-2)' }}>
            {savingNotes ? 'Saving…' : 'Save Notes'}
          </button>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{label}</span>
    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </span>
  </div>
);

const badgeStyle = (color) => ({
  padding: '2px 10px', borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
  color, background: 'var(--color-surface-glass)',
  border: `1px solid ${color}`,
  whiteSpace: 'nowrap',
});

const sectionStyle = {
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-lg)',
};

const sectionTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--space-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const actionBtnStyle = (color) => ({
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  whiteSpace: 'nowrap',
});

const selectStyle = {
  padding: 'var(--space-2)',
  background: 'var(--color-surface-glass)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
};

const textareaStyle = {
  width: '100%',
  padding: 'var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  boxSizing: 'border-box',
  resize: 'vertical',
  outline: 'none',
};

const saveBtnStyle = {
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-accent-gold)',
  background: 'var(--color-accent-gold)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  whiteSpace: 'nowrap',
};

export default InquiryDetail;
