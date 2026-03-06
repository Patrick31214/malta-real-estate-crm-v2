import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

const StatCard = ({ icon, label, value, sub, color = 'var(--color-accent-gold)' }) => (
  <div
    className="glass"
    style={{
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
    }}
  >
    <div style={{ fontSize: '24px' }}>{icon}</div>
    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color, fontFamily: 'var(--font-heading)' }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-medium)' }}>
      {label}
    </div>
    {sub && (
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
        {sub}
      </div>
    )}
  </div>
);

const BranchStats = ({ branchId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    api.get(`/branches/${branchId}/stats`)
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [branchId]);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--space-4)' }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="glass" style={{ height: 100, borderRadius: 'var(--radius-md)', opacity: 0.5 }} />
      ))}
    </div>
  );

  if (!stats) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      <StatCard icon="🧑‍💼" label="Agents" value={stats.agentCount} />
      <StatCard icon="🏘" label="Total Properties" value={stats.totalProperties} />
      <StatCard icon="📋" label="Listed" value={stats.listedProperties} color="var(--color-primary)" />
      <StatCard icon="✅" label="Sold" value={stats.soldProperties} color="var(--color-success)" />
      <StatCard icon="🔑" label="Rented" value={stats.rentedProperties} color="var(--color-accent-gold)" />
      <StatCard icon="👥" label="Clients" value={stats.clientCount} />
      <StatCard
        icon="📅"
        label="This Month"
        value={stats.propertiesThisMonth}
        sub="new properties"
        color="var(--color-primary)"
      />
      <StatCard
        icon="🆕"
        label="New Clients"
        value={stats.clientsThisMonth}
        sub="this month"
        color="var(--color-success)"
      />
    </div>
  );
};

export default BranchStats;
