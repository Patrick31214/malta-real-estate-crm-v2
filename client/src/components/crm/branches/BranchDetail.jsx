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
  { key: 'info',       label: 'ℹ️ Branch Info' },
];

const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
};

const sectionTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-base)',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-3)',
  marginTop: 0,
};

const heroGradient = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)';

const BranchDetail = ({ branch, onEdit, onClose, canEdit, canDelete, onDelete }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!branch) return null;

  const canManage = ['admin', 'manager'].includes(user?.role);
  const location  = [branch.locality, branch.city, branch.country].filter(Boolean).join(', ') || '—';

  const statusStyle = branch.isActive
    ? { bg: 'rgba(34,197,94,0.2)', color: 'var(--color-success)' }
    : { bg: 'rgba(107,114,128,0.2)', color: 'var(--color-text-muted)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* HERO BANNER */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden', flexShrink: 0, background: branch.coverImage ? `url(${branch.coverImage}) center/cover no-repeat` : heroGradient }}>
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.72) 100%)' }} />

        {/* Status badge — top left */}
        <div style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-5)', zIndex: 2 }}>
          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 'var(--text-xs)', backdropFilter: 'blur(8px)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle.color, display: 'inline-block' }} />
            {branch.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Actions — top right */}
        <div style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-5)', zIndex: 2, display: 'flex', gap: 'var(--space-2)' }}>
          {canEdit && (
            <button onClick={() => onEdit(branch)} style={heroBtn('var(--color-accent-gold)')}>✏️ Edit</button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(branch)} style={heroBtn('var(--color-error)')}>🗑 Deactivate</button>
          )}
          <button onClick={onClose} aria-label="Close branch detail" style={heroBtn('rgba(255,255,255,0.6)')}>✕ Close</button>
        </div>

        {/* Initials if no cover image */}
        {!branch.coverImage && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', zIndex: 2 }}>
            <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', background: 'rgba(255,193,7,0.15)', border: '2px solid rgba(255,193,7,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'var(--color-accent-gold)' }}>
              {getInitials(branch.name)}
            </div>
          </div>
        )}

        {/* Bottom info overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'var(--space-4) var(--space-5)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                {branch.name}
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-sm)' }}>📍 {location}</span>
                {branch.manager && (
                  <span style={{ color: 'rgba(255,193,7,0.9)', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    👤 {branch.manager.firstName} {branch.manager.lastName}
                  </span>
                )}
              </div>
            </div>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.35)', borderRadius: '999px', padding: '4px 12px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-accent-gold)' }}>
                🧑‍💼 {branch.agentCount ?? 0} agent{(branch.agentCount ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto', flexShrink: 0, background: 'var(--color-surface-glass)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: 'var(--space-3) var(--space-5)',
              border: 'none',
              background: 'transparent',
              color: activeTab === t.key ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === t.key ? 700 : 400,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              borderBottom: activeTab === t.key ? '2px solid var(--color-accent-gold)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1, minHeight: 0 }}>

        {/* Overview tab — BranchStats metrics dashboard */}
        {activeTab === 'overview' && (
          <BranchStats branchId={branch.id} />
        )}

        {/* Agents tab */}
        {activeTab === 'agents' && (
          <BranchAgents branchId={branch.id} canManage={canManage} />
        )}

        {/* Properties tab */}
        {activeTab === 'properties' && (
          <BranchProperties branchId={branch.id} />
        )}

        {/* Clients tab */}
        {activeTab === 'clients' && (
          <BranchClients branchId={branch.id} />
        )}

        {/* Branch Info tab */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Contact information */}
            <section>
              <h3 style={sectionTitle}>📞 Contact Information</h3>
              <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                <InfoRow label="Name"      value={branch.name} />
                <InfoRow label="Address"   value={branch.address} />
                <InfoRow label="City"      value={branch.city} />
                <InfoRow label="Locality"  value={branch.locality} />
                <InfoRow label="Country"   value={branch.country} />
                <InfoRow label="Phone"     value={branch.phone} />
                <InfoRow label="Email"     value={branch.email} />
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
                <h3 style={sectionTitle}>📝 Description</h3>
                <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  {branch.description}
                </div>
              </section>
            )}

            {/* Manager */}
            {branch.manager && (
              <section>
                <h3 style={sectionTitle}>👤 Branch Manager</h3>
                <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  {branch.manager.profileImage
                    ? <img src={branch.manager.profileImage} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    : (
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent-gold), #b8860b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {getInitials(`${branch.manager.firstName} ${branch.manager.lastName}`)}
                      </div>
                    )
                  }
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{branch.manager.firstName} {branch.manager.lastName}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>{branch.manager.email}</div>
                  </div>
                </div>
              </section>
            )}

            {/* Location */}
            {(branch.latitude || branch.longitude) && (
              <section>
                <h3 style={sectionTitle}>📍 Location</h3>
                <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                  <InfoRow label="Latitude"  value={branch.latitude  ? String(branch.latitude)  : null} />
                  <InfoRow label="Longitude" value={branch.longitude ? String(branch.longitude) : null} />
                  <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
                    <a
                      href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-accent-gold)', textDecoration: 'underline', fontSize: 'var(--text-sm)' }}
                    >
                      🗺️ Open in Google Maps
                    </a>
                  </div>
                </div>
              </section>
            )}

            {/* Configuration */}
            <section>
              <h3 style={sectionTitle}>⚙️ Configuration</h3>
              <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Branch Status</span>
                  <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 700, background: branch.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)', color: branch.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    {branch.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const heroBtn = (color) => ({
  padding: '5px 12px',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color === 'rgba(255,255,255,0.6)' ? 'rgba(255,255,255,0.3)' : color}`,
  background: 'rgba(0,0,0,0.4)',
  color: color,
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  backdropFilter: 'blur(8px)',
  whiteSpace: 'nowrap',
});

export default BranchDetail;
