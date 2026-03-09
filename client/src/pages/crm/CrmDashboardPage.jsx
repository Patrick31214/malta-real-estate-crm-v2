import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';
import AnnouncementBanner from '../../components/crm/announcements/AnnouncementBanner';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'This Week' },
  { value: 'month',   label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year',    label: 'This Year' },
  { value: 'all',     label: 'All Time' },
];

// ─── Style helpers ────────────────────────────────────────────────────────────

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(212,175,55,0.12)',
  borderRadius: '16px',
  padding: '24px',
};

const glassStrong = {
  ...glass,
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(212,175,55,0.2)',
};

const goldText = { color: 'var(--color-accent-gold)', fontWeight: 700 };
const headingStyle = { fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' };

// ─── Utility Functions ────────────────────────────────────────────────────────

function fmtNum(n) {
  if (n == null) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString();
}

function fmtEUR(n) {
  if (!n) return '€0';
  if (n >= 1000000) return `€${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000)    return `€${(n / 1000).toFixed(0)}K`;
  return `€${parseFloat(n).toLocaleString('en-MT', { maximumFractionDigits: 0 })}`;
}

function fmtBytes(b) {
  if (!b) return '0 B';
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(0)} KB`;
  return `${b} B`;
}

function capitalize(s) {
  if (!s) return '';
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function objToArray(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => ({ key, value: parseInt(value, 10) || 0 }))
    .sort((a, b) => b.value - a.value);
}

// ─── Pure CSS/SVG Chart Components ───────────────────────────────────────────

function HBar({ label, value, maxValue, color = 'var(--color-accent-gold)', height = 22 }) {
  const pct = maxValue > 0 ? Math.min(Math.round((value / maxValue) * 100), 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 130, flexShrink: 0, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {capitalize(label)}
      </div>
      <div style={{ flex: 1, height, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
          borderRadius: 4, minWidth: value > 0 ? 3 : 0,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ width: 40, flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', textAlign: 'right' }}>
        {fmtNum(value)}
      </div>
    </div>
  );
}

function HBarChart({ data, color }) {
  if (!data || !data.length) return <EmptyState />;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {data.slice(0, 12).map((d, i) => (
        <HBar key={i} label={d.key} value={d.value} maxValue={max} color={color} />
      ))}
    </div>
  );
}

function BarChart({ data, dateKey = 'date', valueKey = 'count', color = '#d4af37', height = 120 }) {
  if (!data || !data.length) return <EmptyState />;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, overflowX: 'auto', paddingBottom: 4 }}>
      {data.map((d, i) => {
        const h = Math.max(Math.round(((d[valueKey] || 0) / max) * (height - 24)), 0);
        const label = d[dateKey] ? String(d[dateKey]).slice(5) : i;
        return (
          <div key={i} title={`${d[dateKey]}: ${d[valueKey]}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 28px', minWidth: 28 }}>
            <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginBottom: 2 }}>{d[valueKey] || 0}</div>
            <div style={{ width: '100%', maxWidth: 36, background: 'rgba(255,255,255,0.06)', borderRadius: '3px 3px 0 0', height: height - 24, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ width: '100%', height: h, background: `linear-gradient(180deg, ${color} 0%, ${color}80 100%)`, borderRadius: '3px 3px 0 0', minHeight: h > 0 ? 3 : 0, transition: 'height 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 3, whiteSpace: 'nowrap' }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ segments, size = 100, thickness = 18 }) {
  if (!segments || !segments.length) return <EmptyState />;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);
  if (total === 0) return <EmptyState />;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = circumference * pct;
          const gap = circumference - dash;
          const rot = (offset / total) * 360 - 90;
          offset += seg.value;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color || `hsl(${i * 47}, 65%, 55%)`}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rot} ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          );
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight="bold" fill="var(--color-text-primary)">{total > 999 ? fmtNum(total) : total}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color || `hsl(${i * 47}, 65%, 55%)`, flexShrink: 0 }} />
            <span style={{ color: 'var(--color-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capitalize(seg.label || seg.key)}</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GaugeChart({ pct = 0, label = '', color = '#d4af37', size = 100 }) {
  const radius = 40;
  const cx = size / 2, cy = 58;
  const circumference = Math.PI * radius;
  const filled = (pct / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={70} viewBox={`0 0 ${size} 70`}>
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} strokeLinecap="round" />
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={18} fontWeight="bold" fill={color}>{pct}%</text>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>{label}</div>
    </div>
  );
}

function FunnelChart({ stages }) {
  if (!stages || !stages.length) return <EmptyState />;
  const max = Math.max(...stages.map(s => s.value), 1);
  const colors = ['#d4af37', '#60a5fa', '#4ade80', '#fb923c', '#a78bfa', '#f472b6'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      {stages.map((s, i) => {
        const widthPct = Math.max(20, Math.round((s.value / max) * 100));
        return (
          <div key={i} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: `${widthPct}%`, minWidth: 80,
              background: `${colors[i % colors.length]}22`,
              border: `1px solid ${colors[i % colors.length]}55`,
              borderRadius: 6, padding: '7px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'width 0.5s ease',
            }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{capitalize(s.label)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors[i % colors.length] }}>{fmtNum(s.value)}</span>
            </div>
            {i < stages.length - 1 && (
              <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `8px solid rgba(255,255,255,0.1)`, marginTop: 2 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Sparkline({ data, valueKey = 'count', color = '#d4af37', width = 120, height = 40 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d[valueKey] || 0);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} />
    </svg>
  );
}

function Skeleton({ height = 24, width = '100%', borderRadius = 6 }) {
  return (
    <div style={{
      height, width, borderRadius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

function EmptyState({ label = 'No data available' }) {
  return <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-muted)', fontSize: 12 }}>{label}</div>;
}

// ─── Section Container ────────────────────────────────────────────────────────

function Section({ id, icon, title, children, loading }) {
  return (
    <div id={id} style={{ ...glass, marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderBottom: '1px solid rgba(212,175,55,0.12)', paddingBottom: 14 }}>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
        <h2 style={{ ...headingStyle, margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</h2>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={36} />
          <Skeleton height={28} width="80%" />
          <Skeleton height={28} width="60%" />
          <Skeleton height={100} />
        </div>
      ) : children}
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</h3>
      {children}
    </div>
  );
}

function Grid({ cols = 2, gap = 16, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 4 ? '160px' : cols === 3 ? '200px' : '260px'}, 1fr))`, gap }}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, color = 'var(--color-accent-gold)', icon }) {
  return (
    <div style={{ ...glassStrong, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {icon && <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color, ...headingStyle }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</div>}
    </div>
  );
}

function Table({ headers, rows, emptyLabel = 'No data' }) {
  if (!rows || !rows.length) return <EmptyState label={emptyLabel} />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '9px 12px', textAlign: ci === 0 ? 'left' : 'right', color: 'var(--color-text-primary)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ label, color = 'rgba(212,175,55,0.15)', textColor = 'var(--color-accent-gold)' }) {
  return (
    <span style={{ background: color, color: textColor, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  );
}

const STATUS_COLORS = {
  listed:        '#4ade80',
  draft:         '#9ca3af',
  under_offer:   '#fbbf24',
  sold:          '#f87171',
  rented:        '#60a5fa',
  withdrawn:     '#6b7280',
  active:        '#4ade80',
  inactive:      '#9ca3af',
  prospect:      '#60a5fa',
  converted:     '#d4af37',
  new:           '#60a5fa',
  open:          '#fbbf24',
  assigned:      '#a78bfa',
  in_progress:   '#fb923c',
  resolved:      '#4ade80',
  closed:        '#9ca3af',
  spam:          '#f87171',
  compliant:     '#4ade80',
  non_compliant: '#f87171',
  pending:       '#fbbf24',
  expired:       '#6b7280',
  completed:     '#4ade80',
  not_started:   '#9ca3af',
};

function statusColor(s) { return STATUS_COLORS[s] || '#9ca3af'; }

// ─── KPI Executive Summary ────────────────────────────────────────────────────

function ExecutiveSummary({ m, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={110} borderRadius={16} />)}
      </div>
    );
  }
  const ov = m?.overview || {};
  const comp = m?.compliance || {};
  const train = m?.training?.progress || {};
  const kpis = [
    { icon: '🏠', label: 'Total Properties', value: fmtNum(ov.totalProperties), sub: `${m?.properties?.byStatus?.listed || 0} listed · ${m?.properties?.byStatus?.sold || 0} sold`, color: '#d4af37' },
    { icon: '👥', label: 'Total Clients', value: fmtNum(ov.totalClients), sub: `${m?.clients?.vipCount || 0} VIP`, color: '#60a5fa' },
    { icon: '💰', label: 'Portfolio Value', value: fmtEUR(m?.financial?.totalPortfolioValue), sub: `${fmtEUR(m?.financial?.totalSalesValue)} sold`, color: '#4ade80' },
    { icon: '📩', label: 'Total Inquiries', value: fmtNum(ov.totalInquiries), sub: `${m?.inquiries?.byStatus?.new || 0} new · ${m?.inquiries?.openUrgent || 0} urgent`, color: m?.inquiries?.openUrgent > 0 ? '#f87171' : '#fb923c' },
    { icon: '🏢', label: 'Active Agents', value: fmtNum(ov.totalAgents), sub: `${ov.totalBranches} branches`, color: '#a78bfa' },
    { icon: '🌿', label: 'Active Branches', value: fmtNum(m?.branches?.active || ov.totalBranches), sub: `${ov.totalBranches} total`, color: '#34d399' },
    { icon: '✅', label: 'Compliance Rate', value: `${comp.complianceRate || 0}%`, sub: `${comp.overdue || 0} overdue`, color: (comp.complianceRate || 0) >= 80 ? '#4ade80' : '#f87171' },
    { icon: '🎓', label: 'Training Completion', value: `${train.completionRate || 0}%`, sub: `${train.completed || 0} completed`, color: '#fbbf24' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16 }}>
      {kpis.map((k, i) => (
        <MetricCard key={i} icon={k.icon} label={k.label} value={k.value} sub={k.sub} color={k.color} />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function CrmDashboardPage() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [period, setPeriod] = useState('month');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  usePageTimeTracker('dashboard', { entityType: 'dashboard' });

  const loadMetrics = useCallback(async (p, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/dashboard/metrics', { params: { period: p } });
      setMetrics(res.data);
    } catch (err) {
      showError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => { loadMetrics(period); }, [period, loadMetrics]);

  const m = metrics || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-section { animation: fadeInUp 0.4s ease; }
      `}</style>

      <AnnouncementBanner />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ ...headingStyle, margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Executive Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
            {getGreeting()}, {user?.firstName || user?.name || 'there'}! · {m.generatedAt ? new Date(m.generatedAt).toLocaleString('en-MT') : 'Loading...'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                aria-pressed={period === opt.value}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: period === opt.value ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.07)',
                  color: period === opt.value ? '#000' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadMetrics(period, true)}
            disabled={refreshing}
            aria-label="Refresh dashboard metrics"
            aria-busy={refreshing}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-secondary)', border: '1px solid rgba(212,175,55,0.2)',
            }}>
            {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <ExecutiveSummary m={m} loading={loading} />

      {/* Quick Actions */}
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { icon: '🏠', label: 'Add Property', link: '/crm/properties' },
          { icon: '👤', label: 'New Client', link: '/crm/clients' },
          { icon: '💬', label: 'Send Message', link: '/crm/chat' },
          { icon: '📊', label: 'View Reports', link: '/crm/reports' },
        ].map((action, i) => (
          <a key={i} href={action.link} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', padding: '1.25rem 1rem',
            background: 'var(--glass-surface-subtle, rgba(255,255,255,0.04))',
            border: '1px solid rgba(166,125,26,0.15)',
            borderRadius: '14px', textDecoration: 'none',
            color: 'var(--color-text-secondary, rgba(245,240,232,0.7))',
            fontSize: '0.82rem', fontWeight: '500', textAlign: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'; e.currentTarget.style.background = 'rgba(212,175,55,0.06)'; e.currentTarget.style.color = '#D4AF37'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(166,125,26,0.15)'; e.currentTarget.style.background = 'var(--glass-surface-subtle, rgba(255,255,255,0.04))'; e.currentTarget.style.color = 'var(--color-text-secondary, rgba(245,240,232,0.7))'; }}
          >
            <span style={{ fontSize: '1.6rem' }}>{action.icon}</span>
            <span>{action.label}</span>
          </a>
        ))}
      </div>

      {/* 2. Financial Overview */}
      <Section id="financial" icon="💰" title="Financial Overview" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Portfolio Value" value={fmtEUR(m.financial?.totalPortfolioValue)} color="#d4af37" />
          <MetricCard label="Total Sales Value" value={fmtEUR(m.financial?.totalSalesValue)} color="#4ade80" />
          <MetricCard label="Total Rental Value" value={fmtEUR(m.financial?.totalRentalValue)} color="#60a5fa" />
          <MetricCard label="Avg Sale Price" value={fmtEUR(m.financial?.avgSalePrice)} color="#fbbf24" />
        </Grid>

        <SubSection title="Price Distribution">
          {m.properties?.priceDistribution && (
            <HBarChart
              data={[
                { key: 'Under €100K',    value: m.properties.priceDistribution.under100k || 0 },
                { key: '€100K – €300K',  value: m.properties.priceDistribution['100k_300k'] || 0 },
                { key: '€300K – €600K',  value: m.properties.priceDistribution['300k_600k'] || 0 },
                { key: '€600K – €1M',    value: m.properties.priceDistribution['600k_1m'] || 0 },
                { key: 'Over €1M',       value: m.properties.priceDistribution.over1m || 0 },
              ]}
              color="#d4af37"
            />
          )}
        </SubSection>

        <SubSection title="Top Deals by Value">
          <Table
            headers={['Property', 'Type', 'Status', 'Price']}
            rows={(m.financial?.topDealsByValue || []).map(d => [
              d.title || d.locality || '—',
              capitalize(d.type),
              <Badge key={d.id} label={capitalize(d.status)} color={`${statusColor(d.status)}22`} textColor={statusColor(d.status)} />,
              fmtEUR(d.price),
            ])}
          />
        </SubSection>
      </Section>

      {/* 3. Properties Analytics */}
      <Section id="properties" icon="🏠" title="Properties Analytics" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Properties" value={fmtNum(m.overview?.totalProperties)} color="#d4af37" />
          <MetricCard label="New This Period" value={fmtNum(m.properties?.newThisPeriod)} color="#60a5fa" />
          <MetricCard label="Sold This Period" value={fmtNum(m.properties?.soldThisPeriod)} color="#4ade80" />
          <MetricCard label="Rented This Period" value={fmtNum(m.properties?.rentedThisPeriod)} color="#fbbf24" />
        </Grid>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div>
            <SubSection title="By Status">
              {m.properties?.byStatus && (
                <DonutChart
                  segments={objToArray(m.properties.byStatus).map((d, i) => ({
                    key: d.key, label: d.key, value: d.value,
                    color: statusColor(d.key),
                  }))}
                />
              )}
            </SubSection>
          </div>
          <div>
            <SubSection title="By Listing Type">
              {m.properties?.byListingType && (
                <DonutChart
                  segments={objToArray(m.properties.byListingType).map((d, i) => ({
                    key: d.key, label: d.key, value: d.value,
                    color: ['#d4af37', '#60a5fa', '#4ade80', '#f472b6'][i % 4],
                  }))}
                />
              )}
            </SubSection>
          </div>
        </div>

        <SubSection title="By Property Type">
          <HBarChart data={objToArray(m.properties?.byType || {})} color="#d4af37" />
        </SubSection>

        <SubSection title="Top Localities">
          <HBarChart data={objToArray(m.properties?.byLocality || {}).slice(0, 10)} color="#a78bfa" />
        </SubSection>

        <SubSection title="New Properties Timeline">
          <BarChart data={m.properties?.timeline || []} color="#d4af37" />
        </SubSection>
      </Section>

      {/* 4. Client & Matching Analytics */}
      <Section id="clients" icon="👥" title="Client & Matching Analytics" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Clients" value={fmtNum(m.overview?.totalClients)} color="#60a5fa" />
          <MetricCard label="VIP Clients" value={fmtNum(m.clients?.vipCount)} color="#d4af37" />
          <MetricCard label="New This Period" value={fmtNum(m.clients?.newThisPeriod)} color="#4ade80" />
          <MetricCard label="Conversion Rate" value={`${m.clients?.conversionRate || 0}%`} color="#fbbf24" />
        </Grid>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div>
            <SubSection title="By Status">
              {m.clients?.byStatus && (
                <DonutChart segments={objToArray(m.clients.byStatus).map(d => ({ ...d, label: d.key, color: statusColor(d.key) }))} />
              )}
            </SubSection>
          </div>
          <div>
            <SubSection title="Conversion Rate">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GaugeChart pct={m.clients?.conversionRate || 0} label="Client Conversion" color="#d4af37" size={120} />
              </div>
            </SubSection>
          </div>
        </div>

        <SubSection title="Budget Distribution">
          {m.clients?.budgetDistribution && (
            <HBarChart
              data={[
                { key: 'Under €100K',   value: m.clients.budgetDistribution.under100k || 0 },
                { key: '€100K–€300K',   value: m.clients.budgetDistribution['100k_300k'] || 0 },
                { key: '€300K–€600K',   value: m.clients.budgetDistribution['300k_600k'] || 0 },
                { key: '€600K–€1M',     value: m.clients.budgetDistribution['600k_1m'] || 0 },
                { key: 'Over €1M',      value: m.clients.budgetDistribution.over1m || 0 },
              ]}
              color="#60a5fa"
            />
          )}
        </SubSection>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <SubSection title="By Urgency">
            <HBarChart data={objToArray(m.clients?.byUrgency || {})} color="#fb923c" />
          </SubSection>
          <SubSection title="By Referral Source">
            <HBarChart data={objToArray(m.clients?.byReferralSource || {})} color="#34d399" />
          </SubSection>
        </div>

        <SubSection title="Client-Property Matches">
          <Grid cols={4}>
            <MetricCard label="Total Matches" value={fmtNum(m.clientMatches?.total)} color="#d4af37" />
            <MetricCard label="Avg Match Score" value={`${m.clientMatches?.avgMatchScore || 0}%`} color="#60a5fa" />
            <MetricCard label="Interested" value={fmtNum(m.clientMatches?.interestedCount)} color="#4ade80" />
            <MetricCard label="Viewings Scheduled" value={fmtNum(m.clientMatches?.viewingsScheduled)} color="#fbbf24" />
          </Grid>
          {m.clientMatches?.byStatus && (
            <div style={{ marginTop: 12 }}>
              <HBarChart data={objToArray(m.clientMatches.byStatus)} color="#a78bfa" />
            </div>
          )}
        </SubSection>

        <SubSection title="New Clients Timeline">
          <BarChart data={m.clients?.timeline || []} color="#60a5fa" />
        </SubSection>
      </Section>

      {/* 5. Inquiry & Lead Pipeline */}
      <Section id="inquiries" icon="📩" title="Inquiry & Lead Pipeline" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Inquiries" value={fmtNum(m.overview?.totalInquiries)} color="#fb923c" />
          <MetricCard label="New This Period" value={fmtNum(m.inquiries?.newThisPeriod)} color="#60a5fa" />
          <MetricCard label="Resolved This Period" value={fmtNum(m.inquiries?.resolvedThisPeriod)} color="#4ade80" />
          <MetricCard label="Open Urgent" value={fmtNum(m.inquiries?.openUrgent)} color={(m.inquiries?.openUrgent || 0) > 0 ? '#f87171' : '#9ca3af'} />
        </Grid>

        {(m.inquiries?.avgResolutionTimeHours || 0) > 0 && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(212,175,55,0.08)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            ⏱ Avg resolution time: <strong style={{ color: 'var(--color-text-primary)' }}>{m.inquiries?.avgResolutionTimeHours}h</strong>
          </div>
        )}

        <SubSection title="Inquiry Funnel">
          <FunnelChart stages={[
            { label: 'New',         value: m.inquiries?.byStatus?.new || 0 },
            { label: 'Open',        value: m.inquiries?.byStatus?.open || 0 },
            { label: 'Assigned',    value: m.inquiries?.byStatus?.assigned || 0 },
            { label: 'In Progress', value: m.inquiries?.byStatus?.in_progress || 0 },
            { label: 'Resolved',    value: m.inquiries?.byStatus?.resolved || 0 },
          ].filter(s => s.value > 0)} />
        </SubSection>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <SubSection title="By Type">
            <HBarChart data={objToArray(m.inquiries?.byType || {})} color="#fb923c" />
          </SubSection>
          <SubSection title="By Priority">
            {m.inquiries?.byPriority && (
              <DonutChart segments={[
                { key: 'urgent', label: 'Urgent', value: m.inquiries.byPriority.urgent || 0, color: '#f87171' },
                { key: 'high',   label: 'High',   value: m.inquiries.byPriority.high   || 0, color: '#fb923c' },
                { key: 'medium', label: 'Medium', value: m.inquiries.byPriority.medium || 0, color: '#fbbf24' },
                { key: 'low',    label: 'Low',    value: m.inquiries.byPriority.low    || 0, color: '#4ade80' },
              ].filter(s => s.value > 0)} />
            )}
          </SubSection>
        </div>

        <SubSection title="By Source">
          <HBarChart data={objToArray(m.inquiries?.bySource || {})} color="#a78bfa" />
        </SubSection>

        <SubSection title="Inquiry Timeline">
          <BarChart data={m.inquiries?.timeline || []} color="#fb923c" />
        </SubSection>
      </Section>

      {/* 6. Agent & Team Performance */}
      <Section id="agents" icon="👔" title="Agent & Team Performance" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Agents" value={fmtNum(m.agents?.total || m.overview?.totalAgents)} color="#a78bfa" />
          <MetricCard label="Active Agents" value={fmtNum(m.agents?.active)} color="#4ade80" />
          <MetricCard label="Recent Logins (7d)" value={fmtNum(m.agents?.recentLogins)} color="#60a5fa" />
          <MetricCard label="Total Owners" value={fmtNum(m.overview?.totalOwners)} color="#fbbf24" />
        </Grid>

        <SubSection title="Top Agents by Properties Listed">
          <Table
            headers={['#', 'Agent', 'Properties']}
            rows={(m.agents?.topByProperties || []).slice(0, 10).map((a, i) => [
              <Badge key={i} label={`#${i + 1}`} color="rgba(212,175,55,0.1)" />,
              a.name || a.agentId,
              fmtNum(a.count),
            ])}
          />
        </SubSection>

        <SubSection title="Top Agents by Clients">
          <Table
            headers={['#', 'Agent', 'Clients']}
            rows={(m.agents?.topByClients || []).slice(0, 10).map((a, i) => [
              <Badge key={i} label={`#${i + 1}`} color="rgba(96,165,250,0.1)" textColor="#60a5fa" />,
              a.name || a.agentId,
              fmtNum(a.count),
            ])}
          />
        </SubSection>

        <SubSection title="Agents by Branch">
          <HBarChart data={(m.agents?.byBranch || []).map(b => ({ key: b.name || b.branchId, value: b.count }))} color="#a78bfa" />
        </SubSection>
      </Section>

      {/* 7. Branch Performance */}
      <Section id="branches" icon="🏢" title="Branch Performance" loading={loading}>
        <Grid cols={2}>
          <MetricCard label="Total Branches" value={fmtNum(m.overview?.totalBranches)} color="#34d399" />
          <MetricCard label="Active Branches" value={fmtNum(m.branches?.active)} color="#4ade80" />
        </Grid>
        <SubSection title="Branch Comparison">
          <Table
            headers={['Branch', 'Properties', 'Clients', 'Agents', 'Inquiries']}
            rows={(m.branches?.performance || []).map(b => [
              <span key={b.branchId} style={{ fontWeight: 600 }}>{b.name}</span>,
              fmtNum(b.properties),
              fmtNum(b.clients),
              fmtNum(b.agents),
              fmtNum(b.inquiries),
            ])}
            emptyLabel="No branch data"
          />
        </SubSection>
      </Section>

      {/* 8. Communication & Chat */}
      <Section id="chat" icon="💬" title="Communication & Chat Metrics" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Channels" value={fmtNum(m.chat?.totalChannels)} color="#60a5fa" />
          <MetricCard label="Active Channels" value={fmtNum(m.chat?.activeChannels)} color="#4ade80" />
          <MetricCard label="Total Messages" value={fmtNum(m.chat?.totalMessages)} color="#d4af37" />
          <MetricCard label="Messages This Period" value={fmtNum(m.chat?.messagesThisPeriod)} color="#fbbf24" />
        </Grid>
        <SubSection title="Messages by Day">
          <BarChart data={m.chat?.messagesByDay || []} color="#60a5fa" />
        </SubSection>
        <SubSection title="Notifications">
          <Grid cols={3}>
            <MetricCard label="Total Notifications" value={fmtNum(m.notifications?.total)} color="#d4af37" />
            <MetricCard label="Unread" value={fmtNum(m.notifications?.unread)} color={m.notifications?.unread > 0 ? '#f87171' : '#4ade80'} />
            <MetricCard label="This Period" value={fmtNum(m.notifications?.thisPeriod)} color="#60a5fa" />
          </Grid>
          <div style={{ marginTop: 12 }}>
            <HBarChart data={objToArray(m.notifications?.byType || {})} color="#a78bfa" />
          </div>
        </SubSection>
      </Section>

      {/* 9. Documents & Files */}
      <Section id="documents" icon="📄" title="Documents & Files" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Documents" value={fmtNum(m.overview?.totalDocuments)} color="#fbbf24" />
          <MetricCard label="Uploaded This Period" value={fmtNum(m.documents?.uploadedThisPeriod)} color="#4ade80" />
          <MetricCard label="Total Files" value={fmtNum(m.files?.total)} color="#60a5fa" />
          <MetricCard label="Storage Used" value={fmtBytes(m.files?.totalStorageBytes)} color="#a78bfa" />
        </Grid>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <SubSection title="Documents by Category">
            <HBarChart data={objToArray(m.documents?.byCategory || {})} color="#fbbf24" />
          </SubSection>
          <SubSection title="Files by Category">
            <HBarChart data={objToArray(m.files?.byCategory || {})} color="#60a5fa" />
          </SubSection>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
          <MetricCard label="Folders" value={fmtNum(m.files?.totalFolders)} color="#34d399" />
          <MetricCard label="Files Uploaded This Period" value={fmtNum(m.files?.uploadedThisPeriod)} color="#4ade80" />
        </div>
      </Section>

      {/* 10. Compliance & Risk */}
      <Section id="compliance" icon="⚖️" title="Compliance & Risk" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Items" value={fmtNum(m.compliance?.total)} color="#d4af37" />
          <MetricCard label="Compliance Rate" value={`${m.compliance?.complianceRate || 0}%`} color={(m.compliance?.complianceRate || 0) >= 80 ? '#4ade80' : '#f87171'} />
          <MetricCard label="Overdue" value={fmtNum(m.compliance?.overdue)} color={m.compliance?.overdue > 0 ? '#f87171' : '#4ade80'} />
          <MetricCard label="Due Soon (7d)" value={fmtNum(m.compliance?.dueSoon)} color={m.compliance?.dueSoon > 0 ? '#fbbf24' : '#4ade80'} />
        </Grid>

        {(m.compliance?.overdue || 0) > 0 && (
          <div role="alert" style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, fontSize: 13, color: '#f87171', fontWeight: 600 }}>
            ⚠️ {m.compliance.overdue} compliance item{m.compliance.overdue !== 1 ? 's' : ''} are overdue and require immediate attention.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
          <GaugeChart pct={m.compliance?.complianceRate || 0} label="Overall Compliance Rate" color={(m.compliance?.complianceRate || 0) >= 80 ? '#4ade80' : '#f87171'} size={140} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
          <SubSection title="By Status">
            <HBarChart data={objToArray(m.compliance?.byStatus || {}).map(d => ({ ...d, color: statusColor(d.key) }))} color="#4ade80" />
          </SubSection>
          <SubSection title="By Priority">
            <HBarChart data={objToArray(m.compliance?.byPriority || {})} color="#fbbf24" />
          </SubSection>
        </div>
      </Section>

      {/* 11. Training & Development */}
      <Section id="training" icon="🎓" title="Training & Development" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Courses" value={fmtNum(m.training?.totalCourses)} color="#fbbf24" />
          <MetricCard label="Published" value={fmtNum(m.training?.publishedCourses)} color="#4ade80" />
          <MetricCard label="Required" value={fmtNum(m.training?.requiredCourses)} color="#f87171" />
          <MetricCard label="Completion Rate" value={`${m.training?.progress?.completionRate || 0}%`} color="#d4af37" />
        </Grid>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <GaugeChart pct={m.training?.progress?.completionRate || 0} label="Training Completion Rate" color="#fbbf24" size={140} />
        </div>

        <SubSection title="Enrollment Status">
          {m.training?.progress && (
            <DonutChart segments={[
              { key: 'completed',   label: 'Completed',   value: m.training.progress.completed   || 0, color: '#4ade80' },
              { key: 'in_progress', label: 'In Progress', value: m.training.progress.inProgress  || 0, color: '#fbbf24' },
              { key: 'not_started', label: 'Not Started', value: m.training.progress.notStarted  || 0, color: '#9ca3af' },
            ].filter(s => s.value > 0)} />
          )}
        </SubSection>

        <Grid cols={2} gap={12}>
          <MetricCard label="Avg Progress" value={`${m.training?.progress?.avgProgress || 0}%`} color="#60a5fa" />
          <MetricCard label="Avg Score" value={`${m.training?.progress?.avgScore || 0}%`} color="#a78bfa" />
        </Grid>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
          <SubSection title="By Category">
            <HBarChart data={objToArray(m.training?.byCategory || {})} color="#fbbf24" />
          </SubSection>
          <SubSection title="By Difficulty">
            <HBarChart data={objToArray(m.training?.byDifficulty || {})} color="#60a5fa" />
          </SubSection>
        </div>
      </Section>

      {/* 12. Events & Calendar */}
      <Section id="events" icon="📅" title="Events & Calendar" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Events" value={fmtNum(m.events?.total)} color="#34d399" />
          <MetricCard label="Upcoming" value={fmtNum(m.events?.upcoming)} color="#60a5fa" />
          <MetricCard label="This Month" value={fmtNum(m.events?.thisMonth)} color="#d4af37" />
          <MetricCard label="Announcements" value={fmtNum(m.announcements?.total)} color="#fbbf24" />
        </Grid>
        <SubSection title="Events by Type">
          <HBarChart data={objToArray(m.events?.byType || {})} color="#34d399" />
        </SubSection>
        <SubSection title="Announcements">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>By Type</div>
              <HBarChart data={objToArray(m.announcements?.byType || {})} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>By Priority</div>
              {m.announcements?.byPriority && (
                <DonutChart segments={[
                  { key: 'urgent',    label: 'Urgent',    value: m.announcements.byPriority.urgent   || 0, color: '#f87171' },
                  { key: 'important', label: 'Important', value: m.announcements.byPriority.important || 0, color: '#fb923c' },
                  { key: 'normal',    label: 'Normal',    value: m.announcements.byPriority.normal    || 0, color: '#4ade80' },
                  { key: 'low',       label: 'Low',       value: m.announcements.byPriority.low       || 0, color: '#9ca3af' },
                ].filter(s => s.value > 0)} />
              )}
            </div>
          </div>
        </SubSection>
      </Section>

      {/* 13. Services & Contacts */}
      <Section id="services" icon="🛠" title="Services & Contacts" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Total Services" value={fmtNum(m.services?.total)} color="#34d399" />
          <MetricCard label="Active Services" value={fmtNum(m.services?.active)} color="#4ade80" />
          <MetricCard label="Featured Services" value={fmtNum(m.services?.featured)} color="#d4af37" />
          <MetricCard label="Active Contacts" value={fmtNum(m.contacts?.active)} color="#60a5fa" />
        </Grid>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <SubSection title="Services by Category">
            <HBarChart data={objToArray(m.services?.byCategory || {})} color="#34d399" />
          </SubSection>
          <SubSection title="Contacts by Category">
            <HBarChart data={objToArray(m.contacts?.byCategory || {})} color="#60a5fa" />
          </SubSection>
        </div>
      </Section>

      {/* 14. Website & Digital Metrics */}
      <Section id="website" icon="🌐" title="Website & Digital Metrics" loading={loading}>
        <Grid cols={4}>
          <MetricCard label="Page Views" value={fmtNum(m.website?.totalPageViews)} color="#d4af37" />
          <MetricCard label="Unique Sessions" value={fmtNum(m.website?.uniqueSessions)} color="#60a5fa" />
          <MetricCard label="Avg Session Duration" value={m.website?.avgSessionDuration ? `${m.website.avgSessionDuration}s` : '—'} color="#4ade80" />
          <MetricCard label="Property Views" value={fmtNum(m.website?.propertyViews)} color="#fbbf24" />
        </Grid>
        <Grid cols={4} gap={12}>
          <MetricCard label="Click Events" value={fmtNum(m.website?.clickEvents)} color="#a78bfa" />
          <MetricCard label="Form Submissions" value={fmtNum(m.website?.formSubmissions)} color="#fb923c" />
          <MetricCard label="Chatbot Interactions" value={fmtNum(m.website?.chatbotInteractions)} color="#34d399" />
          <MetricCard label="Property Shares" value={fmtNum(m.website?.propertyShares)} color="#60a5fa" />
        </Grid>
        <Grid cols={3} gap={12}>
          <MetricCard label="Search Events" value={fmtNum(m.website?.searchEvents)} color="#d4af37" />
          <MetricCard label="Login Attempts" value={fmtNum(m.website?.loginAttempts)} color="#fbbf24" />
          <MetricCard label="Registrations" value={fmtNum(m.website?.registrations)} color="#4ade80" />
        </Grid>
        <SubSection title="Page Views by Day">
          <BarChart data={m.website?.viewsByDay || []} color="#d4af37" />
        </SubSection>
        <SubSection title="Top Pages Visited">
          <Table
            headers={['Page', 'Views']}
            rows={(m.website?.topPages || []).map(p => [
              <span key={p.page} style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.page}</span>,
              fmtNum(p.views),
            ])}
            emptyLabel="No page view data"
          />
        </SubSection>
      </Section>

      {/* 15. Activity & Audit Log */}
      <Section id="activity" icon="📊" title="Activity & Audit Log" loading={loading}>
        <Grid cols={3}>
          <MetricCard label="Total Actions Tracked" value={fmtNum(m.activity?.totalActions)} color="#d4af37" />
          <MetricCard label="Action Types" value={fmtNum(Object.keys(m.activity?.byMetricType || {}).length)} color="#60a5fa" />
          <MetricCard label="Entity Types" value={fmtNum(Object.keys(m.activity?.byEntityType || {}).length)} color="#4ade80" />
        </Grid>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <SubSection title="By Action Type">
            <HBarChart data={objToArray(m.activity?.byMetricType || {})} color="#d4af37" />
          </SubSection>
          <SubSection title="By Entity Type">
            <HBarChart data={objToArray(m.activity?.byEntityType || {})} color="#60a5fa" />
          </SubSection>
        </div>
        <SubSection title="Activity by Day">
          <BarChart data={m.activity?.activityByDay || []} color="#d4af37" />
        </SubSection>
        <SubSection title="Most Active Users">
          <Table
            headers={['#', 'User', 'Role', 'Actions']}
            rows={(m.activity?.mostActiveUsers || []).map((u, i) => [
              <Badge key={i} label={`#${i + 1}`} color="rgba(212,175,55,0.1)" />,
              u.name || u.userId,
              <Badge key={`r${i}`} label={capitalize(u.role)} color="rgba(255,255,255,0.08)" textColor="var(--color-text-secondary)" />,
              fmtNum(u.count),
            ])}
            emptyLabel="No activity data"
          />
        </SubSection>
        <SubSection title="Recent Actions">
          {(m.activity?.recentActions || []).length === 0 ? (
            <EmptyState label="No recent actions" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(m.activity?.recentActions || []).slice(0, 10).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{a.createdAt ? new Date(a.createdAt).toLocaleString('en-MT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span>
                  <Badge label={capitalize(a.metricType || 'unknown')} color="rgba(212,175,55,0.1)" />
                  {a.entityType && <span style={{ color: 'var(--color-text-muted)' }}>{capitalize(a.entityType)}</span>}
                  {a.pageUrl && <span style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{a.pageUrl}</span>}
                </div>
              ))}
            </div>
          )}
        </SubSection>
      </Section>

      {/* Footer note */}
      <div style={{ textAlign: 'center', padding: '16px 0 8px', color: 'var(--color-text-muted)', fontSize: 12 }}>
        Dashboard data last refreshed at {m.generatedAt ? new Date(m.generatedAt).toLocaleString('en-MT') : '—'} · Period: {PERIOD_OPTIONS.find(p => p.value === period)?.label}
      </div>
    </div>
  );
}

