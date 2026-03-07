import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';

const PERIOD_OPTIONS = [
  { key: 'day',   label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'all',   label: 'All Time' },
];

function StatCard({ icon, label, value, color = 'var(--color-accent-gold)' }) {
  return (
    <div className="glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value ?? 0}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{label}</div>
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
          <div style={{ width: 48, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[labelKey]}</div>
          <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(d[valueKey] / max) * 100}%`, height: '100%', background: color, borderRadius: 4, minWidth: d[valueKey] > 0 ? 4 : 0, transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ width: 28, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

const BranchAgentDrilldown = ({ agent, onClose }) => {
  const [period, setPeriod] = useState('month');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    if (!agent?.id) return;
    setLoading(true);
    api.get(`/agents/${agent.id}/metrics`, { params: { period } })
      .then(res => setMetrics(res.data))
      .catch(err => showError(err.response?.data?.error || 'Failed to load agent metrics'))
      .finally(() => setLoading(false));
  }, [agent?.id, period, showError]);

  if (!agent) return null;

  const s = metrics?.summary || {};
  const initials = `${agent.firstName?.[0] || ''}${agent.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 0 }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{ width: '100%', maxWidth: 520, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.25s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          {agent.profileImage
            ? <img src={agent.profileImage} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--color-accent-gold)' }} />
            : (
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent-gold), #b8860b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
            )
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
              {agent.firstName} {agent.lastName}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {agent.role} {agent.jobTitle ? `· ${agent.jobTitle}` : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close agent drilldown"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', flexShrink: 0 }}
          >
            ✕ Close
          </button>
        </div>

        {/* Period selector */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', flexShrink: 0 }}>
          {PERIOD_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setPeriod(o.key)}
              aria-pressed={period === o.key}
              style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: period === o.key ? 'var(--color-accent-gold)' : 'transparent', color: period === o.key ? '#000' : 'var(--color-text-secondary)', fontWeight: period === o.key ? 700 : 400, cursor: 'pointer', fontSize: 'var(--text-xs)' }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Metrics content */}
        <div style={{ padding: 'var(--space-5)', flex: 1 }}>
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="glass" style={{ height: 80, borderRadius: 'var(--radius-md)', opacity: 0.4 }} />)}
            </div>
          )}

          {!loading && metrics && (
            <>
              {/* Stat grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <StatCard icon="🔑" label="Logins"           value={s.totalLogins} />
                <StatCard icon="⏱️" label="Session Hrs"      value={s.totalSessionHours} color="#9b59b6" />
                <StatCard icon="⚡" label="Total Actions"    value={s.totalActions} />
                <StatCard icon="👥" label="Clients Created"  value={s.clientsCreated} color="var(--color-success)" />
                <StatCard icon="🏠" label="Properties"       value={s.propertiesCreated} color="var(--color-primary)" />
                <StatCard icon="📧" label="Inquiries Res."   value={s.inquiriesResolved} color="var(--color-error)" />
              </div>

              {/* Charts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', marginTop: 0 }}>📅 Daily Activity</h4>
                  <BarChart data={(metrics.timeline || []).slice(-14)} labelKey="date" valueKey="count" />
                </div>
                <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', marginTop: 0 }}>🕐 Activity by Hour</h4>
                  <BarChart data={metrics.activityByHour || []} labelKey="hour" valueKey="count" color="var(--color-primary)" />
                </div>
              </div>

              {/* Session info */}
              {(s.avgSessionMinutes || s.lastLoginAt) && (
                <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', marginTop: 0 }}>🔑 Session Details</h4>
                  {s.avgSessionMinutes > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Avg Session</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{s.avgSessionMinutes} min</span>
                    </div>
                  )}
                  {s.lastLoginAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Last Login</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{new Date(s.lastLoginAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!loading && !metrics && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
              <div style={{ fontSize: 32, marginBottom: 'var(--space-2)' }}>📊</div>
              <p>No metrics data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchAgentDrilldown;
