import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { AGENT_PERMISSION_CATEGORIES } from '../../../constants/agentPermissions';

const getInitials = (a) => `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

const DetailRow = ({ label, value }) => value != null && value !== '' ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light, rgba(255,255,255,0.06))' }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
  </div>
) : null;

const Chip = ({ label, color = 'var(--color-accent-gold)', bg = 'rgba(255,193,7,0.12)', border = 'rgba(255,193,7,0.25)' }) => (
  <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap' }}>
    {label}
  </span>
);

const sectionTitle = {
  fontSize: 'var(--text-base)',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-3)',
  marginTop: 0,
  fontFamily: 'var(--font-heading)',
};

const PERIOD_OPTIONS = [
  { key: 'day',   label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'all',   label: 'All Time' },
];

function BarChart({ data, labelKey, valueKey, color = 'var(--color-accent-gold)' }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3) 0' }}>No data</div>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 48, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[labelKey]}</div>
          <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(d[valueKey] / max) * 100}%`, height: '100%', background: color, borderRadius: 4, minWidth: d[valueKey] > 0 ? 4 : 0, transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ width: 28, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-accent-gold)', lineHeight: 1 }}>{value ?? 0}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function MetricsSection({ agentId }) {
  const [period, setPeriod] = useState('month');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    if (!agentId) return;
    setLoading(true);
    api.get(`/agents/${agentId}/metrics`, { params: { period } })
      .then(res => setMetrics(res.data))
      .catch(err => showError(err.response?.data?.error || 'Failed to load metrics'))
      .finally(() => setLoading(false));
  }, [agentId, period, showError]);

  const s = metrics?.summary || {};

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {PERIOD_OPTIONS.map(o => (
          <button key={o.key} onClick={() => setPeriod(o.key)} aria-pressed={period === o.key} style={{ padding: '5px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: period === o.key ? 'var(--color-accent-gold)' : 'transparent', color: period === o.key ? '#000' : 'var(--color-text-secondary)', fontWeight: period === o.key ? 700 : 400, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
            {o.label}
          </button>
        ))}
      </div>
      {loading && <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>Loading metrics…</div>}
      {!loading && metrics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <StatCard icon="🔑" label="Total Logins"        value={s.totalLogins} />
            <StatCard icon="⏱️" label="Session Hours"       value={s.totalSessionHours} />
            <StatCard icon="⚡" label="Total Actions"       value={s.totalActions} />
            <StatCard icon="👥" label="Clients Created"     value={s.clientsCreated} />
            <StatCard icon="👀" label="Clients Viewed"      value={s.clientsViewed} />
            <StatCard icon="🏠" label="Props Created"       value={s.propertiesCreated} />
            <StatCard icon="👁️" label="Props Viewed"       value={s.propertiesViewed} />
            <StatCard icon="📧" label="Inquiries Resolved"  value={s.inquiriesResolved} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>📅 Daily Activity (last 14 days)</h4>
              <BarChart data={(metrics.timeline || []).slice(-14)} labelKey="date" valueKey="count" />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>🕐 Activity by Hour</h4>
              <BarChart data={metrics.activityByHour || []} labelKey="hour" valueKey="count" color="var(--color-info, #0dcaf0)" />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>👥 Client Activity</h4>
              <BarChart data={[{ label: 'View', count: s.clientsViewed || 0 }, { label: 'Create', count: s.clientsCreated || 0 }, { label: 'Edit', count: s.clientsUpdated || 0 }, { label: 'Delete', count: s.clientsDeleted || 0 }]} labelKey="label" valueKey="count" color="var(--color-success, #28a745)" />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>🏠 Property Activity</h4>
              <BarChart data={[{ label: 'View', count: s.propertiesViewed || 0 }, { label: 'Create', count: s.propertiesCreated || 0 }, { label: 'Edit', count: s.propertiesUpdated || 0 }, { label: 'Delete', count: s.propertiesDeleted || 0 }, { label: 'Featured', count: s.propertiesFeatured || 0 }]} labelKey="label" valueKey="count" color="var(--color-warning, #ffc107)" />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>🏢 Owner Activity</h4>
              <BarChart data={[{ label: 'View', count: s.ownersViewed || 0 }, { label: 'Create', count: s.ownersCreated || 0 }, { label: 'Edit', count: s.ownersUpdated || 0 }, { label: 'Delete', count: s.ownersDeleted || 0 }]} labelKey="label" valueKey="count" color="var(--color-error, #dc3545)" />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>📧 Inquiry Activity</h4>
              <BarChart data={[{ label: 'Viewed', count: s.inquiriesViewed || 0 }, { label: 'Assigned', count: s.inquiriesAssigned || 0 }, { label: 'Resolved', count: s.inquiriesResolved || 0 }]} labelKey="label" valueKey="count" color="var(--color-primary, #0d6efd)" />
            </div>
            {metrics.activityByType && Object.keys(metrics.activityByType).length > 0 && (
              <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>📊 Activity by Entity Type</h4>
                <BarChart data={Object.entries(metrics.activityByType).map(([label, count]) => ({ label, count }))} labelKey="label" valueKey="count" color="var(--color-accent-gold)" />
              </div>
            )}
          </div>
          <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
            <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>🔑 Session Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <DetailRow label="Avg Session Duration" value={s.avgSessionMinutes ? `${s.avgSessionMinutes} min` : null} />
              <DetailRow label="Last Login"  value={s.lastLoginAt  ? new Date(s.lastLoginAt).toLocaleString()  : null} />
              <DetailRow label="Last Logout" value={s.lastLogoutAt ? new Date(s.lastLogoutAt).toLocaleString() : null} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AgentDetail({ agent: initial, onEdit, onClose, onRefresh }) {
  const { showSuccess, showError } = useToast();
  const [agent, setAgent]                   = useState(initial);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason]       = useState('');
  const [pwModalOpen, setPwModalOpen]       = useState(false);
  const [newPassword, setNewPassword]       = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail]             = useState('');
  const [busy, setBusy]                     = useState(false);
  const [showMetrics, setShowMetrics]       = useState(false);

  const permMap = {};
  (agent.UserPermissions ?? []).forEach(p => { permMap[p.feature] = p.isEnabled; });
  const enabledCount = Object.values(permMap).filter(Boolean).length;

  const statusInfo = () => {
    if (agent.isBlocked)                         return { label: 'Blocked',          color: 'var(--color-error, #dc3545)',    bg: 'rgba(220,53,69,0.15)' };
    if (!agent.isActive)                         return { label: 'Inactive',         color: 'var(--color-text-muted)',        bg: 'rgba(255,255,255,0.06)' };
    if (agent.approvalStatus === 'pending')      return { label: 'Pending Approval', color: 'var(--color-accent-gold)',       bg: 'rgba(255,193,7,0.15)' };
    if (agent.approvalStatus === 'rejected')     return { label: 'Rejected',         color: 'var(--color-error, #dc3545)',    bg: 'rgba(220,53,69,0.15)' };
    return                                              { label: 'Active',           color: 'var(--color-success, #28a745)', bg: 'rgba(40,167,69,0.15)' };
  };
  const st = statusInfo();

  const roleBadgeStyles = {
    admin:   { background: 'rgba(220,53,69,0.15)',  color: 'var(--color-error, #dc3545)' },
    manager: { background: 'rgba(255,193,7,0.15)',  color: 'var(--color-accent-gold)' },
    agent:   { background: 'rgba(13,110,253,0.15)', color: 'var(--color-primary, #0d6efd)' },
  };
  const roleStyle = roleBadgeStyles[agent.role] ?? roleBadgeStyles.agent;

  const doApprove     = async () => { setBusy(true); try { const { data } = await api.patch(`/agents/${agent.id}/approve`); setAgent(p => ({ ...p, approvalStatus: 'approved', approvedBy: data.approvedBy, approvedAt: data.approvedAt })); showSuccess('Agent approved'); onRefresh?.(); } catch (e) { showError(e.response?.data?.error || e.message); } finally { setBusy(false); } };
  const doReject      = async () => { setBusy(true); try { await api.patch(`/agents/${agent.id}/reject`); setAgent(p => ({ ...p, approvalStatus: 'rejected' })); showSuccess('Agent rejected'); onRefresh?.(); } catch (e) { showError(e.response?.data?.error || e.message); } finally { setBusy(false); } };
  const doUnblock     = async () => { setBusy(true); try { await api.patch(`/agents/${agent.id}/unblock`); setAgent(p => ({ ...p, isBlocked: false, blockedAt: null, blockedReason: null })); showSuccess('Agent unblocked'); onRefresh?.(); } catch (e) { showError(e.response?.data?.error || e.message); } finally { setBusy(false); } };
  const doBlock       = async () => { setBusy(true); try { await api.patch(`/agents/${agent.id}/block`, { blockedReason: blockReason || null }); setAgent(p => ({ ...p, isBlocked: true, blockedReason: blockReason || null })); setBlockModalOpen(false); setBlockReason(''); showSuccess('Agent blocked'); onRefresh?.(); } catch (e) { showError(e.response?.data?.error || e.message); } finally { setBusy(false); } };
  const doResetPw     = async () => { if (!newPassword.trim()) return showError('Enter a new password'); setBusy(true); try { await api.patch(`/agents/${agent.id}/reset-password`, { newPassword }); setPwModalOpen(false); setNewPassword(''); showSuccess('Password reset'); } catch (e) { showError(e.response?.data?.error || e.message); } finally { setBusy(false); } };
  const doChangeEmail = async () => { if (!newEmail.trim()) return showError('Enter a new email'); setBusy(true); try { await api.patch(`/agents/${agent.id}/email`, { newEmail }); setAgent(p => ({ ...p, email: newEmail })); setEmailModalOpen(false); setNewEmail(''); showSuccess('Email updated'); } catch (e) { showError(e.response?.data?.error || e.message); } finally { setBusy(false); } };

  const inputStyle   = { width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-glass, rgba(0,0,0,0.3))', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', boxSizing: 'border-box' };
  const btnPrimary   = { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent-gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)' };
  const btnSecondary = { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)' };

  const Modal = ({ title, onClose: closeModal, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>{title}</h3>
          <button onClick={closeModal} aria-label="Close dialog" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 20 }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );

  const heroGradient = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)';

  return (
    <div>
      {/* HERO BANNER */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', background: agent.profileImage ? `url(${agent.profileImage}) center/cover no-repeat` : heroGradient }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.7) 100%)' }} />
        <div style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-5)', zIndex: 2 }}>
          <span style={{ background: st.bg, color: st.color, padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(8px)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
            {st.label}
          </span>
        </div>
        <div style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-5)', zIndex: 2, display: 'flex', gap: 'var(--space-2)' }}>
          <span style={{ ...roleStyle, padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'capitalize', backdropFilter: 'blur(8px)' }}>{agent.role}</span>
          <button onClick={onClose} aria-label="Close agent detail" style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-xs)', backdropFilter: 'blur(8px)' }}>x Close</button>
        </div>
        {!agent.profileImage && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', width: 90, height: 90, borderRadius: '50%', background: 'var(--color-accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 36, border: '4px solid rgba(255,255,255,0.3)', zIndex: 2 }}>
            {getInitials(agent)}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'var(--space-4) var(--space-5)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 2 }}>
          <h2 style={{ margin: '0 0 2px', fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>{agent.firstName} {agent.lastName}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            {agent.jobTitle && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-sm)' }}>{agent.jobTitle}</span>}
            {agent.Branch?.name && <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'var(--text-sm)' }}>Branch: {agent.Branch.name}{agent.Branch.city ? `, ${agent.Branch.city}` : ''}</span>}
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        <button onClick={() => onEdit(agent)} style={btnPrimary}>Edit</button>
        {agent.isBlocked
          ? <button disabled={busy} onClick={doUnblock} style={{ ...btnSecondary, color: 'var(--color-success, #28a745)', borderColor: 'var(--color-success, #28a745)' }}>Unblock</button>
          : <button disabled={busy} onClick={() => setBlockModalOpen(true)} style={{ ...btnSecondary, color: 'var(--color-error, #dc3545)', borderColor: 'var(--color-error, #dc3545)' }}>Block</button>
        }
        {agent.approvalStatus === 'pending' && (
          <>
            <button disabled={busy} onClick={doApprove} style={{ ...btnSecondary, color: 'var(--color-success, #28a745)', borderColor: 'var(--color-success, #28a745)' }}>Approve</button>
            <button disabled={busy} onClick={doReject}  style={{ ...btnSecondary, color: 'var(--color-error, #dc3545)', borderColor: 'var(--color-error, #dc3545)' }}>Reject</button>
          </>
        )}
        <button onClick={() => setPwModalOpen(true)}    style={btnSecondary}>Reset Password</button>
        <button onClick={() => setEmailModalOpen(true)} style={btnSecondary}>Change Email</button>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setShowMetrics(v => !v)} style={btnSecondary}>
            {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
          </button>
        </div>
      </div>

      {/* TWO-COLUMN GRID */}
      <div style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-4)' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Personal Information</h3>
            <DetailRow label="Nationality"       value={agent.nationality} />
            <DetailRow label="Date of Birth"     value={agent.dateOfBirth   ? new Date(agent.dateOfBirth).toLocaleDateString()   : null} />
            <DetailRow label="Address"           value={agent.address} />
            <DetailRow label="Emergency Contact" value={agent.emergencyContact} />
            <DetailRow label="Emergency Phone"   value={agent.emergencyPhone} />
          </div>
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Professional Details</h3>
            <DetailRow label="Job Title"       value={agent.jobTitle} />
            <DetailRow label="License Number"  value={agent.licenseNumber} />
            <DetailRow label="Commission Rate" value={agent.commissionRate != null ? `${agent.commissionRate}%` : null} />
            <DetailRow label="Start Date"      value={agent.startDate         ? new Date(agent.startDate).toLocaleDateString()         : null} />
            <DetailRow label="License Expiry"  value={agent.eireLicenseExpiry ? new Date(agent.eireLicenseExpiry).toLocaleDateString() : null} />
            {agent.Branch && (
              <>
                <DetailRow label="Branch"   value={agent.Branch.name} />
                <DetailRow label="City"     value={agent.Branch.city} />
                <DetailRow label="Locality" value={agent.Branch.locality} />
              </>
            )}
            <DetailRow label="Approval Status" value={agent.approvalStatus ? agent.approvalStatus.charAt(0).toUpperCase() + agent.approvalStatus.slice(1) : null} />
          </div>
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Contact Information</h3>
            <DetailRow label="Email" value={agent.email} />
            <DetailRow label="Phone" value={agent.phone} />
          </div>
          {agent.bio && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={sectionTitle}>Bio</h3>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{agent.bio}</p>
            </div>
          )}
          {(agent.passportImage || agent.idCardImage || agent.contractFile || (Array.isArray(agent.otherDocuments) && agent.otherDocuments.length > 0)) && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={sectionTitle}>Documents</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                {agent.passportImage && <a href={agent.passportImage} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Passport</a>}
                {agent.idCardImage   && <a href={agent.idCardImage}   target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>ID Card</a>}
                {agent.contractFile  && <a href={agent.contractFile}  target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Contract</a>}
                {Array.isArray(agent.otherDocuments) && agent.otherDocuments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Document {i + 1}</a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Specializations</h3>
            {agent.specializations?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {agent.specializations.map(s => <Chip key={s} label={s} />)}
              </div>
            ) : (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>None listed</span>
            )}
          </div>
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Languages</h3>
            {agent.languages?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {agent.languages.map(l => <Chip key={l} label={l} color="var(--color-info, #0dcaf0)" bg="rgba(13,202,240,0.1)" border="rgba(13,202,240,0.25)" />)}
              </div>
            ) : (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>None listed</span>
            )}
          </div>
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={sectionTitle}>Permissions ({enabledCount} enabled)</h3>
            <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
              {AGENT_PERMISSION_CATEGORIES.map(cat => {
                const enabled = cat.permissions.filter(p => permMap[p.key]);
                return (
                  <div key={cat.id} style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      {cat.icon} {cat.label} ({enabled.length}/{cat.permissions.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {cat.permissions.map(p => (
                        <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', padding: '2px 0' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{p.label}</span>
                          <span style={{ fontWeight: 700, color: permMap[p.key] ? 'var(--color-success, #28a745)' : 'var(--color-text-muted)' }}>
                            {permMap[p.key] ? 'Yes' : 'No'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {agent.Properties?.length > 0 && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={sectionTitle}>Assigned Properties ({agent.Properties.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 200, overflowY: 'auto' }}>
                {agent.Properties.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-hover, rgba(255,255,255,0.04))', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || p.referenceNumber || p.id}</span>
                    {p.status && <span style={{ flexShrink: 0, marginLeft: 8, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{p.status}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {agent.ActivityLogs?.length > 0 && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={sectionTitle}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 240, overflowY: 'auto' }}>
                {agent.ActivityLogs.slice(0, 20).map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-hover, rgba(255,255,255,0.04))', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.action || log.description}</span>
                    <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: 8 }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* METRICS SECTION */}
      {showMetrics && (
        <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
          <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ ...sectionTitle, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Performance Metrics and Analytics</h3>
            <MetricsSection agentId={agent.id} />
          </div>
        </div>
      )}

      {/* MODALS */}
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
