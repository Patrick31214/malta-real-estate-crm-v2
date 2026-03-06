import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import BranchStats from './BranchStats';
import BranchAgents from './BranchAgents';
import BranchProperties from './BranchProperties';
import BranchClients from './BranchClients';

const TABS = [
  { key: 'overview',   label: '📊 Overview' },
  { key: 'agents',     label: '🧑‍💼 Agents' },
  { key: 'properties', label: '🏘 Properties' },
  { key: 'clients',    label: '👥 Clients' },
];

const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
};

const BranchDetail = ({ branch, onEdit, onClose, canEdit, canDelete, onDelete }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!branch) return null;

  const canManage = ['admin', 'manager'].includes(user?.role);
  const location  = [branch.locality, branch.city, branch.country].filter(Boolean).join(', ') || '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-5) var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          gap: 'var(--space-4)',
          alignItems: 'flex-start',
          background: branch.coverImage
            ? `linear-gradient(to right, var(--color-surface-glass) 60%, transparent), url(${branch.coverImage}) center/cover no-repeat`
            : 'var(--color-surface-glass)',
        }}
      >
        {/* Logo / initials */}
        {branch.logo
          ? <img src={branch.logo} alt={branch.name} style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }} />
          : (
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--color-accent-gold), #b8860b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: '#fff', flexShrink: 0,
            }}>
              {getInitials(branch.name)}
            </div>
          )
        }

        {/* Name & meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', margin: 0 }}>
              {branch.name}
            </h2>
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
              padding: '2px 10px', borderRadius: '999px',
              background: branch.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
              color: branch.isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
            }}>
              {branch.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            📍 {location}
          </div>
          {branch.manager && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', marginTop: '4px' }}>
              👤 Manager: {branch.manager.firstName} {branch.manager.lastName}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, marginLeft: 'auto' }}>
          {canEdit && (
            <button onClick={() => onEdit(branch)} style={actionBtn('var(--color-primary)')}>
              ✏️ Edit
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(branch)} style={actionBtn('var(--color-error)')}>
              🗑 Deactivate
            </button>
          )}
          <button onClick={onClose} style={actionBtn('var(--color-text-muted)')}>
            ✕ Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: 'var(--space-3) var(--space-5)',
              border: 'none',
              background: 'transparent',
              color: activeTab === t.key ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === t.key ? 'var(--font-semibold)' : 'var(--font-normal)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              borderBottom: activeTab === t.key ? '2px solid var(--color-accent-gold)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'color var(--transition-fast)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1 }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Stats */}
            <section>
              <h3 style={sectionTitle}>Performance Metrics</h3>
              <BranchStats branchId={branch.id} />
            </section>

            {/* Branch info */}
            <section>
              <h3 style={sectionTitle}>Branch Information</h3>
              <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                <InfoRow label="Name"        value={branch.name} />
                <InfoRow label="Address"     value={branch.address} />
                <InfoRow label="City"        value={branch.city} />
                <InfoRow label="Locality"    value={branch.locality} />
                <InfoRow label="Country"     value={branch.country} />
                <InfoRow label="Phone"       value={branch.phone} />
                <InfoRow label="Email"       value={branch.email} />
                {branch.latitude  && <InfoRow label="Latitude"    value={String(branch.latitude)} />}
                {branch.longitude && <InfoRow label="Longitude"   value={String(branch.longitude)} />}
                {branch.createdAt && (
                  <InfoRow
                    label="Created"
                    value={new Date(branch.createdAt).toLocaleDateString('en-MT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                )}
              </div>
            </section>

            {/* Description */}
            {branch.description && (
              <section>
                <h3 style={sectionTitle}>Description</h3>
                <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  {branch.description}
                </div>
              </section>
            )}

            {/* Map placeholder if coordinates available */}
            {branch.latitude && branch.longitude && (
              <section>
                <h3 style={sectionTitle}>Location</h3>
                <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  📍 {branch.latitude}, {branch.longitude}
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <a
                      href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-accent-gold)', textDecoration: 'underline', fontSize: 'var(--text-xs)' }}
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <BranchAgents branchId={branch.id} canManage={canManage} />
        )}

        {activeTab === 'properties' && (
          <BranchProperties branchId={branch.id} />
        )}

        {activeTab === 'clients' && (
          <BranchClients branchId={branch.id} />
        )}
      </div>
    </div>
  );
};

const actionBtn = (color) => ({
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-xs)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  fontWeight: 'var(--font-medium)',
  transition: 'background var(--transition-fast)',
  whiteSpace: 'nowrap',
});

const sectionTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-4)',
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px solid var(--color-border-light)',
};

export default BranchDetail;
