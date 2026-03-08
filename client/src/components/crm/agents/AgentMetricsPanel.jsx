import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';

const PERIOD_OPTIONS = [
  { key: 'day',   label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'all',   label: 'All Time' },
];

const sectionTitle = {
  fontSize: 'var(--text-base)',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-3)',
  marginTop: 0,
  fontFamily: 'var(--font-heading)',
};

const DetailRow = ({ label, value }) => value != null && value !== '' ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light, rgba(255,255,255,0.06))' }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
  </div>
) : null;

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

/**
 * AgentMetricsPanel — displays a full performance dashboard for a single agent.
 *
 * @param {string}  agentId  - UUID of the agent whose metrics to display.
 * @param {string}  [initialPeriod='month'] - Default time period to load.
 */
function AgentMetricsPanel({ agentId, initialPeriod = 'month' }) {
  const [period, setPeriod] = useState(initialPeriod);
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
      {/* Period selector */}
      <div className="agent-metrics-period-pills" style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {PERIOD_OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => setPeriod(o.key)}
            aria-pressed={period === o.key}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: period === o.key ? 'var(--color-accent-gold)' : 'transparent',
              color: period === o.key ? '#000' : 'var(--color-text-secondary)',
              fontWeight: period === o.key ? 700 : 400,
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>
          Loading metrics…
        </div>
      )}

      {!loading && !metrics && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>
          No metrics data available for this period.
        </div>
      )}

      {!loading && metrics && (
        <>
          {/* Summary stat cards */}
          <div
            className="agent-metrics-stats"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
          >
            <StatCard icon="🏡" label="Properties Assigned" value={s.totalPropertiesAssigned} />
            <StatCard icon="📋" label="Active Listings"     value={s.activeListings} />
            <StatCard icon="👤" label="Clients Assigned"    value={s.totalClientsAssigned} />
            <StatCard icon="💶" label="Revenue (EUR)"       value={s.totalRevenue != null ? `€${s.totalRevenue.toLocaleString()}` : 0} />
            <StatCard icon="🔑" label="Total Logins"        value={s.totalLogins} />
            <StatCard icon="⏱️" label="Session Hours"       value={s.totalSessionHours} />
            <StatCard icon="⚡" label="Total Actions"       value={s.totalActions} />
            <StatCard icon="👥" label="Clients Created"     value={s.clientsCreated} />
            <StatCard icon="👀" label="Clients Viewed"      value={s.clientsViewed} />
            <StatCard icon="🏠" label="Props Created"       value={s.propertiesCreated} />
            <StatCard icon="👁️" label="Props Viewed"       value={s.propertiesViewed} />
            <StatCard icon="📧" label="Inquiries Resolved"  value={s.inquiriesResolved} />
          </div>

          {/* Activity charts */}
          <div
            className="agent-metrics-charts"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 'var(--space-4)' }}
          >
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>📅 Daily Activity (last 14 days)</h4>
              <BarChart data={(metrics.timeline || []).slice(-14)} labelKey="date" valueKey="count" />
            </div>

            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>🕐 Activity by Hour</h4>
              <div className="agent-metrics-chart-scroll">
                <BarChart data={metrics.activityByHour || []} labelKey="hour" valueKey="count" color="var(--color-info, #0dcaf0)" />
              </div>
            </div>

            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>👥 Client Activity</h4>
              <BarChart
                data={[
                  { label: 'View',   count: s.clientsViewed  || 0 },
                  { label: 'Create', count: s.clientsCreated || 0 },
                  { label: 'Edit',   count: s.clientsUpdated || 0 },
                  { label: 'Delete', count: s.clientsDeleted || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-success, #28a745)"
              />
            </div>

            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>🏠 Property Activity</h4>
              <BarChart
                data={[
                  { label: 'View',     count: s.propertiesViewed    || 0 },
                  { label: 'Create',   count: s.propertiesCreated   || 0 },
                  { label: 'Edit',     count: s.propertiesUpdated   || 0 },
                  { label: 'Delete',   count: s.propertiesDeleted   || 0 },
                  { label: 'Featured', count: s.propertiesFeatured  || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-warning, #ffc107)"
              />
            </div>

            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>🏢 Owner Activity</h4>
              <BarChart
                data={[
                  { label: 'View',   count: s.ownersViewed   || 0 },
                  { label: 'Create', count: s.ownersCreated  || 0 },
                  { label: 'Edit',   count: s.ownersUpdated  || 0 },
                  { label: 'Delete', count: s.ownersDeleted  || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-error, #dc3545)"
              />
            </div>

            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>📧 Inquiry Activity</h4>
              <BarChart
                data={[
                  { label: 'Viewed',   count: s.inquiriesViewed    || 0 },
                  { label: 'Assigned', count: s.inquiriesAssigned  || 0 },
                  { label: 'Resolved', count: s.inquiriesResolved  || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-primary, #0d6efd)"
              />
            </div>

            {metrics.activityByType && Object.keys(metrics.activityByType).length > 0 && (
              <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>📊 Activity by Entity Type</h4>
                <BarChart
                  data={Object.entries(metrics.activityByType).map(([label, count]) => ({ label, count }))}
                  labelKey="label" valueKey="count" color="var(--color-accent-gold)"
                />
              </div>
            )}
          </div>

          {/* Session details */}
          <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
            <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>🔑 Session Details</h4>
            <div
              className="agent-metrics-session"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 'var(--space-3)' }}
            >
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

export default AgentMetricsPanel;
