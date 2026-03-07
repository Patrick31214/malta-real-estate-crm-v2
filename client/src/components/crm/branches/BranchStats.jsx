import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';

const PERIOD_OPTIONS = [
  { key: 'day',   label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'all',   label: 'All Time' },
];

const AGENT_COLORS = [
  'var(--color-accent-gold)',
  'var(--color-primary)',
  'var(--color-success)',
  '#9b59b6',
  '#e67e22',
  '#1abc9c',
  '#e74c3c',
  '#3498db',
];

function StatCard({ icon, label, value, sub, color = 'var(--color-accent-gold)' }) {
  return (
    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', animation: 'fadeInUp 0.3s ease' }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value ?? 0}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, color = 'var(--color-accent-gold)' }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3) 0' }}>No data</div>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 52, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[labelKey]}</div>
          <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(d[valueKey] / max) * 100}%`, height: '100%', background: color, borderRadius: 4, minWidth: d[valueKey] > 0 ? 4 : 0, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ width: 28, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

function AgentComparisonBar({ agents, metricKey, label, color }) {
  if (!agents || agents.length === 0) return null;
  const max = Math.max(...agents.map(a => a.metrics?.[metricKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {agents.map((a, i) => {
        const val = a.metrics?.[metricKey] || 0;
        const initials = `${a.firstName?.[0] || ''}${a.lastName?.[0] || ''}`;
        return (
          <div key={a.agentId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: a.profileImage ? 'transparent' : AGENT_COLORS[i % AGENT_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', border: `2px solid ${a.isActive ? AGENT_COLORS[i % AGENT_COLORS.length] : 'var(--color-text-muted)'}`, overflow: 'hidden' }}>
              {a.profileImage ? <img src={a.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div style={{ width: 80, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.firstName} {a.lastName}</div>
            <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(val / max) * 100}%`, height: '100%', background: color, borderRadius: 4, minWidth: val > 0 ? 4 : 0, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ width: 28, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{val}</div>
          </div>
        );
      })}
    </div>
  );
}

const sectionTitle = {
  fontSize: 'var(--text-sm)',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-3)',
  marginTop: 0,
  fontFamily: 'var(--font-heading)',
};

const BranchStats = ({ branchId }) => {
  const [period, setPeriod] = useState('month');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  const load = useCallback(() => {
    if (!branchId) return;
    setLoading(true);
    api.get(`/branches/${branchId}/metrics`, { params: { period } })
      .then(r => setMetrics(r.data))
      .catch(err => showError(err.response?.data?.error || 'Failed to load branch metrics'))
      .finally(() => setLoading(false));
  }, [branchId, period, showError]);

  useEffect(() => { load(); }, [load]);

  const s = metrics?.branchSummary || {};
  const agents = metrics?.agentBreakdown || [];
  const topP = metrics?.topPerformers || {};
  const avgSession = s.totalLogins > 0 ? Math.round((s.totalSessionHours / s.totalLogins) * 60) : 0;

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {PERIOD_OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => setPeriod(o.key)}
            aria-pressed={period === o.key}
            style={{ padding: '5px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: period === o.key ? 'var(--color-accent-gold)' : 'transparent', color: period === o.key ? '#000' : 'var(--color-text-secondary)', fontWeight: period === o.key ? 700 : 400, cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 0.15s' }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="glass" style={{ height: 100, borderRadius: 'var(--radius-md)', opacity: 0.4 }} />
          ))}
        </div>
      )}

      {!loading && metrics && (
        <>
          {/* Top 8 stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <StatCard icon="🧑‍💼" label="Total Agents"       value={`${s.activeAgents || 0}/${s.totalAgents || 0}`} sub="active / total" />
            <StatCard icon="🔑" label="Total Logins"         value={s.totalLogins} />
            <StatCard icon="⏱️" label="Total Hours"          value={s.totalSessionHours} />
            <StatCard icon="⚡" label="Total Actions"        value={s.totalActions} />
            <StatCard icon="👥" label="Clients Created"      value={s.clientsCreated} color="var(--color-success)" />
            <StatCard icon="🏠" label="Properties Listed"    value={s.propertiesCreated} color="var(--color-primary)" />
            <StatCard icon="📧" label="Inquiries Resolved"   value={s.inquiriesResolved} color="var(--color-error)" />
            <StatCard icon="📊" label="Avg Session"          value={avgSession ? `${avgSession}m` : '—'} sub="per login" color="#9b59b6" />
          </div>

          {/* Agent Performance Comparison */}
          {agents.length > 0 && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
              <h4 style={sectionTitle}>📊 Agent Performance Comparison</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 8 }}>⚡ Total Actions</div>
                  <AgentComparisonBar agents={agents} metricKey="totalActions" color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 8 }}>👥 Clients Managed</div>
                  <AgentComparisonBar agents={agents} metricKey="clientsCreated" color="var(--color-success)" />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 8 }}>🏠 Properties Listed</div>
                  <AgentComparisonBar agents={agents} metricKey="propertiesCreated" color="var(--color-accent-gold)" />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 8 }}>⏱️ Session Hours</div>
                  <AgentComparisonBar agents={agents} metricKey="totalSessionHours" color="#9b59b6" />
                </div>
              </div>
            </div>
          )}

          {/* Charts grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={sectionTitle}>📅 Daily Activity</h4>
              <BarChart data={(metrics.timeline || []).slice(-14)} labelKey="date" valueKey="count" />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={sectionTitle}>🕐 Activity by Hour</h4>
              <BarChart data={metrics.activityByHour || []} labelKey="hour" valueKey="count" color="var(--color-primary)" />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={sectionTitle}>👥 Client Activity</h4>
              <BarChart
                data={[
                  { label: 'Viewed', count: s.clientsViewed || 0 },
                  { label: 'Created', count: s.clientsCreated || 0 },
                  { label: 'Updated', count: s.clientsUpdated || 0 },
                  { label: 'Deleted', count: s.clientsDeleted || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-success)"
              />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={sectionTitle}>🏠 Property Activity</h4>
              <BarChart
                data={[
                  { label: 'Viewed', count: s.propertiesViewed || 0 },
                  { label: 'Created', count: s.propertiesCreated || 0 },
                  { label: 'Updated', count: s.propertiesUpdated || 0 },
                  { label: 'Deleted', count: s.propertiesDeleted || 0 },
                  { label: 'Featured', count: s.propertiesFeatured || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-accent-gold)"
              />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={sectionTitle}>🏢 Owner Activity</h4>
              <BarChart
                data={[
                  { label: 'Viewed', count: s.ownersViewed || 0 },
                  { label: 'Created', count: s.ownersCreated || 0 },
                  { label: 'Updated', count: s.ownersUpdated || 0 },
                  { label: 'Deleted', count: s.ownersDeleted || 0 },
                ]}
                labelKey="label" valueKey="count" color="#e74c3c"
              />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={sectionTitle}>📧 Inquiry Activity</h4>
              <BarChart
                data={[
                  { label: 'Viewed', count: s.inquiriesViewed || 0 },
                  { label: 'Assigned', count: s.inquiriesAssigned || 0 },
                  { label: 'Resolved', count: s.inquiriesResolved || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-primary)"
              />
            </div>
            {metrics.activityByType && Object.keys(metrics.activityByType).length > 0 && (
              <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={sectionTitle}>📊 Activity by Entity Type</h4>
                <BarChart
                  data={Object.entries(metrics.activityByType).map(([label, count]) => ({ label, count }))}
                  labelKey="label" valueKey="count" color="var(--color-accent-gold)"
                />
              </div>
            )}
          </div>

          {/* Top Performers */}
          {Object.keys(topP).length > 0 && (
            <div className="glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
              <h4 style={sectionTitle}>🏆 Top Performers</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
                {topP.mostActions && (
                  <div className="glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>🏆</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>Most Actions</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-accent-gold)', marginTop: 2 }}>{topP.mostActions.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{topP.mostActions.count} actions</div>
                  </div>
                )}
                {topP.mostClients && (
                  <div className="glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>👥</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>Most Clients</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success)', marginTop: 2 }}>{topP.mostClients.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{topP.mostClients.count} clients</div>
                  </div>
                )}
                {topP.mostProperties && (
                  <div className="glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>🏠</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>Most Properties</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>{topP.mostProperties.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{topP.mostProperties.count} properties</div>
                  </div>
                )}
                {topP.mostLogins && (
                  <div className="glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>🔑</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>Most Logins</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-accent-gold)', marginTop: 2 }}>{topP.mostLogins.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{topP.mostLogins.count} logins</div>
                  </div>
                )}
                {topP.longestSession && (
                  <div className="glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>⏱️</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>Longest Session</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#9b59b6', marginTop: 2 }}>{topP.longestSession.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{topP.longestSession.hours}h</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !metrics && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📊</div>
          <p>No metrics data available for this period.</p>
        </div>
      )}
    </div>
  );
};

export default BranchStats;
