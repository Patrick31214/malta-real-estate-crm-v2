import React, { useState } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { AGENT_PERMISSION_CATEGORIES } from '../../../constants/agentPermissions';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 'var(--space-6)' }}>
    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>{title}</h3>
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{value ?? '—'}</div>
  </div>
);

const InfoGrid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
    {children}
  </div>
);

const getInitials = (a) => `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

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

  const statusLabel = () => {
    if (agent.isBlocked) return { label: 'Blocked', color: 'var(--color-error, #dc3545)' };
    if (!agent.isActive) return { label: 'Inactive', color: 'var(--color-text-muted)' };
    if (agent.approvalStatus === 'pending') return { label: 'Pending Approval', color: 'var(--color-accent-gold)' };
    if (agent.approvalStatus === 'rejected') return { label: 'Rejected', color: 'var(--color-error, #dc3545)' };
    return { label: 'Active', color: 'var(--color-success, #28a745)' };
  };
  const st = statusLabel();

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
  const btnPrimary = { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)' };
  const btnSecondary = { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)' };

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

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <div style={{ flexShrink: 0 }}>
          {agent.profileImage
            ? <img src={agent.profileImage} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28 }}>{getInitials(agent)}</div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{agent.firstName} {agent.lastName}</h2>
          {agent.jobTitle && <div style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>{agent.jobTitle}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,193,7,0.15)', color: 'var(--color-accent-gold)', fontWeight: 700, fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>{agent.role}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
              <span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span>
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>🔑 {enabledCount} permissions</span>
            {agent.Branch?.name && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>🏢 {agent.Branch.name}</span>}
            {agent.commissionRate != null && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>💰 {agent.commissionRate}%</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ ...btnSecondary, flexShrink: 0 }}>✕ Close</button>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        <button onClick={() => onEdit(agent)} style={btnPrimary}>✏️ Edit</button>
        {agent.isBlocked
          ? <button disabled={busy} onClick={doUnblock} style={{ ...btnSecondary, color: 'var(--color-success, #28a745)', borderColor: 'var(--color-success, #28a745)' }}>🔓 Unblock</button>
          : <button disabled={busy} onClick={() => setBlockModalOpen(true)} style={{ ...btnSecondary, color: 'var(--color-error, #dc3545)', borderColor: 'var(--color-error, #dc3545)' }}>🚫 Block</button>
        }
        {agent.approvalStatus === 'pending' && <>
          <button disabled={busy} onClick={doApprove} style={{ ...btnSecondary, color: 'var(--color-success, #28a745)', borderColor: 'var(--color-success, #28a745)' }}>✅ Approve</button>
          <button disabled={busy} onClick={doReject}  style={{ ...btnSecondary, color: 'var(--color-error, #dc3545)',   borderColor: 'var(--color-error, #dc3545)' }}>❌ Reject</button>
        </>}
        <button onClick={() => setPwModalOpen(true)} style={btnSecondary}>🔑 Reset Password</button>
        <button onClick={() => setEmailModalOpen(true)} style={btnSecondary}>✉️ Change Email</button>
      </div>

      {/* Personal Info */}
      <Section title="Personal Information">
        <InfoGrid>
          <Field label="Email" value={agent.email} />
          <Field label="Phone" value={agent.phone} />
          <Field label="Nationality" value={agent.nationality} />
          <Field label="Date of Birth" value={agent.dateOfBirth ? new Date(agent.dateOfBirth).toLocaleDateString() : null} />
          <Field label="Address" value={agent.address} />
          <Field label="Emergency Contact" value={agent.emergencyContact} />
          <Field label="Emergency Phone" value={agent.emergencyPhone} />
        </InfoGrid>
      </Section>

      {/* Professional Details */}
      <Section title="Professional Details">
        <InfoGrid>
          <Field label="Role" value={agent.role} />
          <Field label="Job Title" value={agent.jobTitle} />
          <Field label="Branch" value={agent.Branch?.name} />
          <Field label="License Number" value={agent.licenseNumber} />
          <Field label="Commission Rate" value={agent.commissionRate != null ? `${agent.commissionRate}%` : null} />
          <Field label="Start Date" value={agent.startDate ? new Date(agent.startDate).toLocaleDateString() : null} />
          <Field label="EIRE License Expiry" value={agent.eireLicenseExpiry ? new Date(agent.eireLicenseExpiry).toLocaleDateString() : null} />
          <Field label="Approval Status" value={agent.approvalStatus} />
        </InfoGrid>
        {agent.specializations?.length > 0 && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specializations</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {agent.specializations.map(s => <span key={s} style={{ background: 'var(--color-surface-hover, rgba(255,255,255,0.06))', borderRadius: 'var(--radius-sm)', padding: '3px 8px', fontSize: 'var(--text-xs)' }}>{s}</span>)}
            </div>
          </div>
        )}
        {agent.languages?.length > 0 && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Languages</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {agent.languages.map(l => <span key={l} style={{ background: 'var(--color-surface-hover, rgba(255,255,255,0.06))', borderRadius: 'var(--radius-sm)', padding: '3px 8px', fontSize: 'var(--text-xs)' }}>{l}</span>)}
            </div>
          </div>
        )}
        {agent.bio && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</div>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{agent.bio}</p>
          </div>
        )}
      </Section>

      {/* Documents */}
      {(agent.passportImage || agent.idCardImage || agent.contractFile) && (
        <Section title="Documents">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            {agent.passportImage && <a href={agent.passportImage} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>📄 Passport</a>}
            {agent.idCardImage   && <a href={agent.idCardImage}   target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>🪪 ID Card</a>}
            {agent.contractFile  && <a href={agent.contractFile}  target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>📋 Contract</a>}
          </div>
        </Section>
      )}

      {/* Permissions */}
      <Section title="Feature Permissions">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
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
      </Section>

      {/* Activity Logs */}
      {agent.ActivityLogs?.length > 0 && (
        <Section title="Recent Activity">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {agent.ActivityLogs.slice(0, 10).map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-hover, rgba(255,255,255,0.04))', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{log.action || log.description}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

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
