import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { AGENT_PERMISSION_CATEGORIES } from '../../../constants/agentPermissions';

const getInitials = (a) => `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

const DetailRow = ({ label, value }) => value != null && value !== '' ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
  </div>
) : null;

const RoleBadge = ({ role }) => {
  const colors = {
    admin:   { bg: 'rgba(220,53,69,0.15)',  color: 'var(--color-error)' },
    manager: { bg: 'rgba(255,193,7,0.15)',  color: 'var(--color-accent-gold)' },
    agent:   { bg: 'rgba(13,110,253,0.15)', color: 'var(--color-primary)' },
  };
  const c = colors[role] || colors.agent;
  return (
    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', padding: '4px 14px', borderRadius: '999px', background: c.bg, color: c.color, textTransform: 'capitalize' }}>
      {role}
    </span>
  );
};

const secTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-4)',
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px solid var(--color-border-light)',
};

const AgentDetail = ({ agent, onEdit, onClose, canEdit, canDelete, onDelete, onBlock, onUnblock, onRefresh }) => {
  const { showError, showSuccess } = useToast();
  const [blockModal, setBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [resetPassModal, setResetPassModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changeEmailModal, setChangeEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [localApproval, setLocalApproval] = useState(agent?.approvalStatus);

  useEffect(() => {
    setLocalApproval(agent?.approvalStatus);
  }, [agent?.approvalStatus]);

  if (!agent) return null;

  // Build permission map from UserPermissions array
  const permMap = {};
  (agent.UserPermissions || []).forEach(p => { permMap[p.feature] = p.isEnabled; });

  const handleBlock = async () => {
    try {
      await api.patch(`/agents/${agent.id}/block`, { blockedReason: blockReason });
      showSuccess('Agent blocked');
      setBlockModal(false);
      onBlock && onBlock({ ...agent, isBlocked: true, blockedReason: blockReason });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to block agent');
    }
  };

  const handleUnblock = async () => {
    try {
      await api.patch(`/agents/${agent.id}/unblock`);
      showSuccess('Agent unblocked');
      onUnblock && onUnblock({ ...agent, isBlocked: false });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to unblock agent');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) return showError('Password must be at least 8 characters');
    try {
      await api.patch(`/agents/${agent.id}/password`, { newPassword });
      showSuccess('Password reset successfully');
      setResetPassModal(false);
      setNewPassword('');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.includes('@')) return showError('Valid email required');
    try {
      await api.patch(`/agents/${agent.id}/email`, { newEmail });
      showSuccess('Email updated');
      setChangeEmailModal(false);
      setNewEmail('');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update email');
    }
  };

  const handleApprove = async () => {
    try {
      await api.patch(`/agents/${agent.id}/approve`);
      showSuccess('Agent approved');
      setLocalApproval('approved');
      onRefresh && onRefresh({ ...agent, approvalStatus: 'approved', isActive: true });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to approve agent');
    }
  };

  const handleReject = async () => {
    try {
      await api.patch(`/agents/${agent.id}/reject`);
      showSuccess('Agent rejected');
      setLocalApproval('rejected');
      onRefresh && onRefresh({ ...agent, approvalStatus: 'rejected', isActive: false });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to reject agent');
    }
  };

  const inputStyle = {
    width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)',
    color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {agent.profileImage
          ? <img src={agent.profileImage} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: '#fff' }}>{getInitials(agent)}</div>
        }
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>{agent.firstName} {agent.lastName}</h1>
            <RoleBadge role={agent.role} />
            {agent.jobTitle && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'var(--color-surface-glass)', padding: '2px 10px', borderRadius: '999px', border: '1px solid var(--color-border-light)' }}>{agent.jobTitle}</span>
            )}
            {agent.approvalStatus === 'pending' && (
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#ffc107', padding: '2px 10px', borderRadius: '999px', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.5)' }}>⏳ Pending Approval</span>
            )}
            {agent.approvalStatus === 'rejected' && (
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-error)', padding: '2px 10px', borderRadius: '999px', background: 'rgba(220,53,69,0.1)', border: '1px solid var(--color-error)' }}>✕ Rejected</span>
            )}
            {agent.isBlocked
              ? <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-error)', padding: '2px 10px', borderRadius: '999px', background: 'rgba(220,53,69,0.1)', border: '1px solid var(--color-error)' }}>🚫 Blocked</span>
              : agent.isActive
                ? <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-success)' }}>● Active</span>
                : <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-muted)' }}>● Inactive</span>
            }
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {agent.email && <span>✉️ {agent.email}</span>}
            {agent.phone && <span>📞 {agent.phone}</span>}
            {agent.Branch && <span>🏢 {agent.Branch.name}</span>}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Properties', value: agent.Properties?.length ?? 0, icon: '🏠' },
          { label: 'Permissions', value: (agent.UserPermissions || []).filter(p => p.isEnabled).length, icon: '🔑' },
          { label: 'Commission', value: agent.commissionRate != null ? `${parseFloat(agent.commissionRate).toFixed(1)}%` : '—', icon: '💰' },
          { label: 'Branch', value: agent.Branch?.name || '—', icon: '🏢' },
        ].map(stat => (
          <div key={stat.label} className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-1)' }}>{stat.icon}</div>
            <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)' }}>{stat.value}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        {canEdit && <button onClick={() => onEdit(agent)} style={actionBtn('var(--color-primary)')}>✏️ Edit</button>}
        {canEdit && (agent.isBlocked
          ? <button onClick={handleUnblock} style={actionBtn('var(--color-success)')}>🔓 Unblock</button>
          : <button onClick={() => setBlockModal(true)} style={actionBtn('var(--color-warning, #f59e0b)')}>🚫 Block</button>
        )}
        {canEdit && localApproval === 'pending' && (
          <>
            <button onClick={handleApprove} style={actionBtn('var(--color-success)')}>✅ Approve</button>
            <button onClick={handleReject} style={actionBtn('var(--color-error)')}>✕ Reject</button>
          </>
        )}
        {canEdit && localApproval === 'rejected' && (
          <button onClick={handleApprove} style={actionBtn('var(--color-success)')}>✅ Approve</button>
        )}
        {canEdit && <button onClick={() => setResetPassModal(true)} style={actionBtn('var(--color-accent-gold)')}>🔑 Reset Password</button>}
        {canEdit && <button onClick={() => setChangeEmailModal(true)} style={actionBtn('var(--color-accent-gold)')}>✉️ Change Email</button>}
        {canDelete && <button onClick={() => onDelete(agent)} style={actionBtn('var(--color-error)')}>🗑 Delete</button>}
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={secTitle}>👤 Personal Information</h3>
          <DetailRow label="Email" value={agent.email} />
          <DetailRow label="Phone" value={agent.phone} />
          <DetailRow label="Date of Birth" value={agent.dateOfBirth ? new Date(agent.dateOfBirth).toLocaleDateString() : null} />
          <DetailRow label="Nationality" value={agent.nationality} />
          <DetailRow label="Address" value={agent.address} />
          <DetailRow label="Emergency Contact" value={agent.emergencyContact} />
          <DetailRow label="Emergency Phone" value={agent.emergencyPhone} />
        </div>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={secTitle}>💼 Professional Details</h3>
          <DetailRow label="Job Title" value={agent.jobTitle} />
          <DetailRow label="License #" value={agent.licenseNumber} />
          <DetailRow label="License Expiry" value={agent.eireLicenseExpiry ? new Date(agent.eireLicenseExpiry).toLocaleDateString() : null} />
          <DetailRow label="Commission" value={agent.commissionRate != null ? `${parseFloat(agent.commissionRate).toFixed(2)}%` : null} />
          <DetailRow label="Start Date" value={agent.startDate ? new Date(agent.startDate).toLocaleDateString() : null} />
          <DetailRow label="Created" value={agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : null} />
          <DetailRow label="Last Login" value={agent.lastLoginAt ? new Date(agent.lastLoginAt).toLocaleDateString() : null} />
          {agent.isBlocked && <DetailRow label="Blocked At" value={agent.blockedAt ? new Date(agent.blockedAt).toLocaleDateString() : null} />}
          {agent.isBlocked && agent.blockedReason && <DetailRow label="Block Reason" value={agent.blockedReason} />}
        </div>
      </div>

      {/* Specializations & Languages */}
      {((agent.specializations?.length > 0) || (agent.languages?.length > 0)) && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={secTitle}>🌟 Skills & Languages</h3>
          {agent.specializations?.length > 0 && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', marginBottom: 'var(--space-2)' }}>Specializations</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {agent.specializations.map((s, i) => (
                  <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', color: 'var(--color-accent-gold)' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {agent.languages?.length > 0 && (
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', marginBottom: 'var(--space-2)' }}>Languages</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {agent.languages.map((l, i) => (
                  <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '4px 12px', borderRadius: '999px', background: 'var(--color-surface-glass)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>🌐 {l}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bio */}
      {agent.bio && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={secTitle}>📝 Bio</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap', margin: 0 }}>{agent.bio}</p>
        </div>
      )}

      {/* Documents */}
      {(agent.passportImage || agent.idCardImage || agent.contractFile) && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={secTitle}>📄 Documents</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            {agent.passportImage && (
              <div style={{ textAlign: 'center' }}>
                <img src={agent.passportImage} alt="Passport" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-1)' }} />
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Passport</div>
                <a href={agent.passportImage} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>Download</a>
              </div>
            )}
            {agent.idCardImage && (
              <div style={{ textAlign: 'center' }}>
                <img src={agent.idCardImage} alt="ID Card" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-1)' }} />
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>ID Card</div>
                <a href={agent.idCardImage} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>Download</a>
              </div>
            )}
            {agent.contractFile && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, background: 'var(--color-surface-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: 'var(--space-1)' }}>📄</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Contract</div>
                <a href={agent.contractFile} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>Download</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions */}
      <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
        <h3 style={secTitle}>🔑 Feature Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
          {AGENT_PERMISSION_CATEGORIES.map(cat => {
            const catPerms = cat.permissions.map(p => ({ ...p, enabled: permMap[p.key] === true }));
            const enabledCount = catPerms.filter(p => p.enabled).length;
            return (
              <div key={cat.id} style={{ background: 'var(--color-surface-glass)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                  {cat.icon} {cat.label}
                  <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>({enabledCount}/{cat.permissions.length})</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {catPerms.map(p => (
                    <span key={p.key} style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                      background: p.enabled ? 'rgba(32,201,151,0.1)' : 'rgba(108,117,125,0.08)',
                      color: p.enabled ? 'var(--color-success)' : 'var(--color-text-muted)',
                      border: `1px solid ${p.enabled ? 'rgba(32,201,151,0.3)' : 'transparent'}`,
                    }}>
                      {p.enabled ? '✓' : '✗'} {p.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {agent.ActivityLogs?.length > 0 && (
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <h3 style={secTitle}>📋 Recent Activity</h3>
          {agent.ActivityLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{log.action} {log.entityType && `— ${log.entityType}`}</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{new Date(log.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Block Modal */}
      {blockModal && (
        <div style={modalOverlay}>
          <div className="glass" style={modalBox}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>Block Agent</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Block <strong>{agent.firstName} {agent.lastName}</strong>? They will not be able to log in.
            </p>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Reason (optional)</label>
              <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)} style={inputStyle} placeholder="Reason for blocking..." />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setBlockModal(false)} style={actionBtn('var(--color-border)')}>Cancel</button>
              <button type="button" onClick={handleBlock} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-error)', color: '#fff', fontWeight: 'var(--font-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Block Agent</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassModal && (
        <div style={modalOverlay}>
          <div className="glass" style={modalBox}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>Reset Password</h3>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} minLength={8} placeholder="Min. 8 characters" />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setResetPassModal(false); setNewPassword(''); }} style={actionBtn('var(--color-border)')}>Cancel</button>
              <button type="button" onClick={handleResetPassword} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#1a1000', fontWeight: 'var(--font-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {changeEmailModal && (
        <div style={modalOverlay}>
          <div className="glass" style={modalBox}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>Change Login Email</h3>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>New Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} placeholder="new@email.com" />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setChangeEmailModal(false); setNewEmail(''); }} style={actionBtn('var(--color-border)')}>Cancel</button>
              <button type="button" onClick={handleChangeEmail} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#1a1000', fontWeight: 'var(--font-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Update Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const actionBtn = (color) => ({
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color: color === 'var(--color-border)' ? 'var(--color-text-secondary)' : color,
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
});

const inputStyle = {
  width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)',
  color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', boxSizing: 'border-box',
};

const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
};

const modalBox = {
  padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)',
  minWidth: '320px', maxWidth: '480px', width: '90%',
};

export default AgentDetail;
