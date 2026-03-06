import React, { useState } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { AGENT_PERMISSION_CATEGORIES } from '../../../constants/agentPermissions';

const getInitials = (a) => `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

const sectionTitle = {
  fontSize: 'var(--text-base)',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-3)',
  marginTop: 0,
};

const DetailRow = ({ label, value }) => value != null && value !== '' ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light, rgba(255,255,255,0.06))' }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
  </div>
) : null;

export default function AgentDetail({ agent: initial, onEdit, onClose, onRefresh }) {
  const { showSuccess, showError } = useToast();
  const [agent, setAgent] = useState(initial);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const permMap = {};
  (agent.UserPermissions ?? []).forEach(p => { permMap[p.feature] = p.isEnabled; });

  const enabledCount = Object.values(permMap).filter(Boolean).length;

  const statusInfo = () => {
    if (agent.isBlocked) return { label: 'Blocked', color: 'var(--color-error, #dc3545)', bg: 'rgba(220,53,69,0.15)' };
    if (!agent.isActive) return { label: 'Inactive', color: 'var(--color-text-muted)', bg: 'rgba(255,255,255,0.06)' };
    if (agent.approvalStatus === 'pending') return { label: 'Pending Approval', color: 'var(--color-accent-gold)', bg: 'rgba(255,193,7,0.15)' };
    if (agent.approvalStatus === 'rejected') return { label: 'Rejected', color: 'var(--color-error, #dc3545)', bg: 'rgba(220,53,69,0.15)' };
    return { label: 'Active', color: 'var(--color-success, #28a745)', bg: 'rgba(40,167,69,0.15)' };
  };
  const st = statusInfo();

  const doApprove = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/agents/${agent.id}/approve`);
      setAgent(prev => ({ ...prev, approvalStatus: 'approved', approvedBy: data.approvedBy, approvedAt: data.approvedAt }));
      showSuccess('Agent approved');
      onRefresh?.();
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed to approve'); }
    finally { setBusy(false); }
  };

  const doReject = async () => {
    setBusy(true);
    try {
      await api.patch(`/agents/${agent.id}/reject`);
      setAgent(prev => ({ ...prev, approvalStatus: 'rejected' }));
      showSuccess('Agent rejected');
      onRefresh?.();
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed to reject'); }
    finally { setBusy(false); }
  };

  const doUnblock = async () => {
    setBusy(true);
    try {
      await api.patch(`/agents/${agent.id}/unblock`);
      setAgent(prev => ({ ...prev, isBlocked: false, blockedAt: null, blockedReason: null }));
      showSuccess('Agent unblocked');
      onRefresh?.();
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed to unblock'); }
    finally { setBusy(false); }
  };

  const doBlock = async () => {
    setBusy(true);
    try {
      await api.patch(`/agents/${agent.id}/block`, { blockedReason: blockReason || null });
      setAgent(prev => ({ ...prev, isBlocked: true, blockedReason: blockReason || null }));
      setBlockModalOpen(false);
      setBlockReason('');
      showSuccess('Agent blocked');
      onRefresh?.();
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed to block'); }
    finally { setBusy(false); }
  };

  const doResetPw = async () => {
    if (!newPassword.trim()) return showError('Enter a new password');
    setBusy(true);
    try {
      await api.patch(`/agents/${agent.id}/reset-password`, { newPassword });
      setPwModalOpen(false);
      setNewPassword('');
      showSuccess('Password reset successfully');
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed to reset password'); }
    finally { setBusy(false); }
  };

  const doChangeEmail = async () => {
    if (!newEmail.trim()) return showError('Enter a new email');
    setBusy(true);
    try {
      await api.patch(`/agents/${agent.id}/email`, { newEmail });
      setAgent(prev => ({ ...prev, email: newEmail }));
      setEmailModalOpen(false);
      setNewEmail('');
      showSuccess('Email updated');
    } catch (err) { showError(err.response?.data?.error || err.message || 'Failed to update email'); }
    finally { setBusy(false); }
  };

  const inputStyle = { width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', boxSizing: 'border-box' };
  const btnPrimary = { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)' };
  const btnSecondary = { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)' };

  const Modal = ({ title, onClose: closeModal, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>{title}</h3>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );

  const roleBadgeStyle = {
    admin:   { background: 'rgba(220,53,69,0.15)', color: 'var(--color-error, #dc3545)' },
    manager: { background: 'rgba(255,193,7,0.15)', color: 'var(--color-accent-gold)' },
    agent:   { background: 'rgba(13,110,253,0.15)', color: 'var(--color-primary, #0d6efd)' },
  };
  const roleStyle = roleBadgeStyle[agent.role] ?? roleBadgeStyle.agent;

  return (
    <div>
      {/* ── Hero Header ── */}
      <div style={{ padding: 'var(--space-6) var(--space-6) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {agent.profileImage
            ? <img src={agent.profileImage} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-accent-gold)' }} />
            : <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--color-accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 32, border: '3px solid var(--color-accent-gold)' }}>{getInitials(agent)}</div>
          }
        </div>
        {/* Name + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{agent.firstName} {agent.lastName}</h2>
          {agent.jobTitle && <div style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>{agent.jobTitle}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <span style={{ ...roleStyle, padding: '3px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>{agent.role}</span>
            <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
              {st.label}
            </span>
            {agent.Branch?.name && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>🏢 {agent.Branch.name}</span>}
            {agent.commissionRate != null && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>💰 {agent.commissionRate}%</span>}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>🔑 {enabledCount} permissions</span>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <button onClick={() => onEdit(agent)} style={btnPrimary}>✏️ Edit</button>
            {agent.isBlocked
              ? <button disabled={busy} onClick={doUnblock} style={{ ...btnSecondary, color: 'var(--color-success, #28a745)', borderColor: 'var(--color-success, #28a745)' }}>🔓 Unblock</button>
              : <button disabled={busy} onClick={() => setBlockModalOpen(true)} style={{ ...btnSecondary, color: 'var(--color-error, #dc3545)', borderColor: 'var(--color-error, #dc3545)' }}>🚫 Block</button>
            }
            {agent.approvalStatus === 'pending' && <>
              <button disabled={busy} onClick={doApprove} style={{ ...btnSecondary, color: 'var(--color-success, #28a745)', borderColor: 'var(--color-success, #28a745)' }}>✅ Approve</button>
              <button disabled={busy} onClick={doReject}  style={{ ...btnSecondary, color: 'var(--color-error, #dc3545)', borderColor: 'var(--color-error, #dc3545)' }}>❌ Reject</button>
            </>}
            <button onClick={() => setPwModalOpen(true)} style={btnSecondary}>🔑 Reset Password</button>
            <button onClick={() => setEmailModalOpen(true)} style={btnSecondary}>✉️ Change Email</button>
          </div>
        </div>
        <button onClick={onClose} style={{ ...btnSecondary, flexShrink: 0, alignSelf: 'flex-start' }}>✕ Close</button>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-4)' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Personal Information */}
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>👤 Personal Information</h3>
            <DetailRow label="Nationality" value={agent.nationality} />
            <DetailRow label="Date of Birth" value={agent.dateOfBirth ? new Date(agent.dateOfBirth).toLocaleDateString() : null} />
            <DetailRow label="Address" value={agent.address} />
            {agent.specializations?.length > 0 && (
              <div style={{ paddingTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specializations</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {agent.specializations.map(s => <span key={s} style={{ background: 'var(--color-surface-hover, rgba(255,255,255,0.06))', borderRadius: 'var(--radius-sm)', padding: '3px 8px', fontSize: 'var(--text-xs)' }}>{s}</span>)}
                </div>
              </div>
            )}
            {agent.languages?.length > 0 && (
              <div style={{ paddingTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Languages</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {agent.languages.map(l => <span key={l} style={{ background: 'var(--color-surface-hover, rgba(255,255,255,0.06))', borderRadius: 'var(--radius-sm)', padding: '3px 8px', fontSize: 'var(--text-xs)' }}>{l}</span>)}
                </div>
              </div>
            )}
            {agent.bio && (
              <div style={{ paddingTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{agent.bio}</p>
              </div>
            )}
          </div>

          {/* Professional Details */}
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>💼 Professional Details</h3>
            <DetailRow label="Job Title" value={agent.jobTitle} />
            <DetailRow label="Branch" value={agent.Branch?.name} />
            <DetailRow label="License Number" value={agent.licenseNumber} />
            <DetailRow label="Commission Rate" value={agent.commissionRate != null ? `${agent.commissionRate}%` : null} />
            <DetailRow label="Start Date" value={agent.startDate ? new Date(agent.startDate).toLocaleDateString() : null} />
            <DetailRow label="EIRE License Expiry" value={agent.eireLicenseExpiry ? new Date(agent.eireLicenseExpiry).toLocaleDateString() : null} />
          </div>

          {/* Documents */}
          {(agent.passportImage || agent.idCardImage || agent.contractFile) && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={sectionTitle}>📁 Documents</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                {agent.passportImage && <a href={agent.passportImage} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>📄 Passport</a>}
                {agent.idCardImage   && <a href={agent.idCardImage}   target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>🪪 ID Card</a>}
                {agent.contractFile  && <a href={agent.contractFile}  target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>📋 Contract</a>}
              </div>
            </div>
          )}

        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Contact Info */}
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>📞 Contact Information</h3>
            <DetailRow label="Email" value={agent.email} />
            <DetailRow label="Phone" value={agent.phone} />
          </div>

          {/* Emergency Contact */}
          {(agent.emergencyContact || agent.emergencyPhone) && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={sectionTitle}>🆘 Emergency Contact</h3>
              <DetailRow label="Name" value={agent.emergencyContact} />
              <DetailRow label="Phone" value={agent.emergencyPhone} />
            </div>
          )}

          {/* Account Status */}
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>🔒 Account Status</h3>
            <DetailRow label="Role" value={agent.role?.charAt(0).toUpperCase() + agent.role?.slice(1)} />
            <DetailRow label="Approval Status" value={agent.approvalStatus?.charAt(0).toUpperCase() + agent.approvalStatus?.slice(1)} />
            <DetailRow label="Active" value={agent.isActive ? 'Yes' : 'No'} />
            {agent.isBlocked && <DetailRow label="Blocked Reason" value={agent.blockedReason} />}
            <DetailRow label="Member Since" value={agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : null} />
          </div>

          {/* Activity Log */}
          {agent.ActivityLogs?.length > 0 && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={sectionTitle}>📋 Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {agent.ActivityLogs.slice(0, 10).map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-hover, rgba(255,255,255,0.04))', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{log.action || log.description}</span>
                    <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: 8 }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Full-width Permissions ── */}
      <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
        <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ ...sectionTitle, marginBottom: 'var(--space-4)' }}>🔑 Feature Permissions <span style={{ color: 'var(--color-accent-gold)', fontWeight: 400, fontSize: 'var(--text-sm)' }}>({enabledCount} enabled)</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {AGENT_PERMISSION_CATEGORIES.map(cat => {
              const enabled = cat.permissions.filter(p => permMap[p.key]);
              return (
                <div key={cat.id} className="glass" style={{ borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>{cat.icon} {cat.label} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({enabled.length}/{cat.permissions.length})</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {cat.permissions.map(p => (
                      <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{p.label}</span>
                        <span style={{ fontWeight: 700, color: permMap[p.key] ? 'var(--color-success, #28a745)' : 'var(--color-text-muted)' }}>{permMap[p.key] ? '✓' : '✗'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Block modal */}
      {blockModalOpen && (
        <Modal title="Block Agent" onClose={() => { setBlockModalOpen(false); setBlockReason(''); }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 0 }}>This will prevent the agent from logging in.</p>
          <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Reason (optional)</label>
          <textarea value={blockReason} onChange={e => setBlockReason(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Reason for blocking..." />
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
            <button onClick={() => { setBlockModalOpen(false); setBlockReason(''); }} style={btnSecondary}>Cancel</button>
            <button disabled={busy} onClick={doBlock} style={{ ...btnPrimary, background: 'var(--color-error, #dc3545)', color: '#fff' }}>Block Agent</button>
          </div>
        </Modal>
      )}

      {/* Reset Password modal */}
      {pwModalOpen && (
        <Modal title="Reset Password" onClose={() => { setPwModalOpen(false); setNewPassword(''); }}>
          <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="Enter new password" />
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
            <button onClick={() => { setPwModalOpen(false); setNewPassword(''); }} style={btnSecondary}>Cancel</button>
            <button disabled={busy} onClick={doResetPw} style={btnPrimary}>Reset Password</button>
          </div>
        </Modal>
      )}

      {/* Change Email modal */}
      {emailModalOpen && (
        <Modal title="Change Email" onClose={() => { setEmailModalOpen(false); setNewEmail(''); }}>
          <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>New Email</label>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} placeholder="Enter new email" />
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
            <button onClick={() => { setEmailModalOpen(false); setNewEmail(''); }} style={btnSecondary}>Cancel</button>
            <button disabled={busy} onClick={doChangeEmail} style={btnPrimary}>Change Email</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
