import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AnnouncementBanner from '../../components/crm/announcements/AnnouncementBanner';
import api from '../../services/api';
import '../../styles/chat.css';

const StatCard = ({ label, value, icon }) => (
  <div
    className="glass"
    style={{
      padding: 'var(--space-6)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
    }}
  >
    <span style={{ fontSize: '2rem' }} aria-hidden="true">{icon}</span>
    <div>
      <div style={{
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--font-bold)',
        fontFamily: 'var(--font-heading)',
        color: 'var(--color-text-primary)',
      }}>{value}</div>
      <div style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        marginTop: 'var(--space-1)',
      }}>{label}</div>
    </div>
  </div>
);

const CrmDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ properties: null, clients: null, owners: null, agents: null });
  const [recentProperties, setRecentProperties] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const safeGet = async (fn) => { try { return await fn(); } catch { return null; } };

      const [propRes, clientRes, ownerRes, userRes, recentRes] = await Promise.all([
        safeGet(() => api.get('/properties', { params: { limit: 1, isAvailable: true } })),
        safeGet(() => api.get('/clients', { params: { limit: 1 } })),
        safeGet(() => api.get('/owners', { params: { limit: 1 } })),
        safeGet(() => api.get('/users', { params: { role: 'agent' } })),
        safeGet(() => api.get('/properties', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' } })),
      ]);

      setStats({
        properties: propRes?.data?.pagination?.total ?? '—',
        clients:    clientRes?.data?.pagination?.total ?? '—',
        owners:     ownerRes?.data?.pagination?.total ?? '—',
        agents:     userRes?.data?.users?.length ?? '—',
      });
      setRecentProperties(recentRes?.data?.properties ?? []);
    };

    fetchStats();
  }, []);

  const fmt = (val, currency = 'EUR') => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-MT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
  };

  const STATUS_COLOURS = {
    listed:      { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' },
    draft:       { bg: 'rgba(156,163,175,0.15)', color: '#6b7280' },
    under_offer: { bg: 'rgba(234,179,8,0.12)',   color: '#ca8a04' },
    sold:        { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
    rented:      { bg: 'rgba(59,130,246,0.12)',  color: '#2563eb' },
    withdrawn:   { bg: 'rgba(156,163,175,0.15)', color: '#6b7280' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <AnnouncementBanner />
      {/* Welcome heading */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          marginBottom: 'var(--space-1)',
        }}>
          Welcome back{user ? `, ${user.firstName}` : ''}
        </h2>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
        }}>
          Here's what's happening at Golden Key Realty today.
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        <StatCard icon="🏠" label="Active Properties" value={stats.properties ?? '…'} />
        <StatCard icon="👥" label="Total Clients"     value={stats.clients    ?? '…'} />
        <StatCard icon="🏡" label="Owners"            value={stats.owners     ?? '…'} />
        <StatCard icon="🏢" label="Agents"            value={stats.agents     ?? '…'} />
      </div>

      {/* Recent Properties */}
      <div className="glass" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-4)',
        }}>
          Recent Properties
        </h3>
        {recentProperties.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No properties found.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {recentProperties.map(p => {
              const sc = STATUS_COLOURS[p.status] ?? { bg: 'rgba(156,163,175,0.15)', color: '#6b7280' };
              return (
                <li key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      to="/crm/properties"
                      style={{
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.title}
                    </Link>
                    {p.locality && (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{p.locality}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {fmt(p.price, p.currency || 'EUR')}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    padding: '2px var(--space-2)',
                    borderRadius: 'var(--radius-full)',
                    background: sc.bg,
                    color: sc.color,
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}>
                    {(p.status ?? '').replace('_', ' ')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Overview card */}
      <div
        className="glass-strong"
        style={{
          padding: 'var(--space-10)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          textAlign: 'center',
          minHeight: '280px',
        }}
      >
        <span style={{ fontSize: '3rem' }} aria-hidden="true">📊</span>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-tight)',
        }}>
          Analytics &amp; Insights
        </h3>
        <p style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-secondary)',
          maxWidth: '400px',
          lineHeight: 'var(--leading-relaxed)',
        }}>
          Detailed analytics and performance dashboards are coming soon.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-5)',
          background: 'rgba(139, 105, 20, 0.10)',
          border: '1px solid rgba(139, 105, 20, 0.20)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--color-accent-gold)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          letterSpacing: 'var(--tracking-wide)',
        }}>
          ✦ Coming Soon
        </div>
      </div>
    </div>
  );
};

export default CrmDashboardPage;
