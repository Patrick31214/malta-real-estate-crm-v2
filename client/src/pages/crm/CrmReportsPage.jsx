import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'This Week' },
  { value: 'month',   label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year',    label: 'This Year' },
  { value: '',        label: 'All Time' },
];

const TREND_TABS = [
  { key: 'properties', label: '🏠 Properties' },
  { key: 'clients',    label: '👥 Clients' },
  { key: 'inquiries',  label: '💬 Inquiries' },
];

const PROPERTY_TYPE_LABELS = {
  apartment: 'Apartment', penthouse: 'Penthouse', villa: 'Villa',
  house: 'House', maisonette: 'Maisonette', townhouse: 'Townhouse',
  palazzo: 'Palazzo', farmhouse: 'Farmhouse', commercial: 'Commercial',
  office: 'Office', garage: 'Garage', land: 'Land', other: 'Other',
};

const LISTING_TYPE_LABELS = {
  sale: 'For Sale', long_let: 'Long Let', short_let: 'Short Let', both: 'Sale & Let',
};

const LISTING_TYPE_COLORS = {
  sale: '#d4af37', long_let: '#60a5fa', short_let: '#4ade80', both: '#f472b6',
};

const URGENCY_LABELS = {
  immediate: 'Immediate', within_month: 'Within 1 Month',
  within_3months: 'Within 3 Months', within_6months: 'Within 6 Months',
  flexible: 'Flexible',
};

const LOOKING_FOR_LABELS = {
  sale: 'To Buy', long_let: 'Long Let', short_let: 'Short Let', both: 'Buy or Rent',
};

const MEDAL = ['🥇', '🥈', '🥉'];

// ─── Style helpers ────────────────────────────────────────────────────────────

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(212,175,55,0.15)',
  borderRadius: '16px',
};

const btnGold = {
  padding: '8px 18px', borderRadius: '8px',
  background: 'var(--color-accent-gold)', color: '#000',
  border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700,
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const btnGhost = {
  padding: '7px 14px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)',
  border: '1px solid rgba(212,175,55,0.2)', cursor: 'pointer', fontSize: 'var(--text-sm)',
};

// ─── Utility functions ────────────────────────────────────────────────────────

function formatEUR(value) {
  const n = parseFloat(value || 0);
  if (n >= 1000000) return `€${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000)    return `€${(n / 1000).toFixed(0)}K`;
  return `€${n.toLocaleString('en-MT', { minimumFractionDigits: 0 })}`;
}

function formatMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleString('en-MT', { month: 'short', year: '2-digit' });
}

function exportCSV(filename, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TrendArrow({ pct }) {
  if (pct === 0 || pct === null || pct === undefined) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
  const up = pct > 0;
  return (
    <span style={{ color: up ? '#4ade80' : '#f87171', fontSize: 12, fontWeight: 700 }}>
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, pct, sub, color = 'var(--color-accent-gold)' }) {
  return (
    <div style={{ ...glass, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '1.7rem', lineHeight: 1 }}>{icon}</div>
        <TrendArrow pct={pct} />
      </div>
      <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color, fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function HBarChart({ data, keyField, valueField, labelFn, maxValue, color = 'var(--color-accent-gold)' }) {
  if (!data || !data.length) return <EmptyState label="No data available" />;
  const max = maxValue || Math.max(...data.map(d => d[valueField] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((item, i) => {
        const pct = Math.round(((item[valueField] || 0) / max) * 100);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 120, flexShrink: 0, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right', textTransform: 'capitalize' }}>
              {labelFn ? labelFn(item[keyField]) : item[keyField]}
            </div>
            <div style={{ flex: 1, height: 22, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                borderRadius: 4, minWidth: item[valueField] > 0 ? 4 : 0,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ width: 36, flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', textAlign: 'right' }}>
              {item[valueField]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BarChart12({ data, valueKey, color = '#d4af37' }) {
  if (!data || !data.length) return <EmptyState label="No trend data" />;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, overflowX: 'auto', paddingBottom: 4 }}>
      {data.map((d, i) => {
        const h = Math.max(Math.round(((d[valueKey] || 0) / max) * 100), d[valueKey] > 0 ? 4 : 0);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 36px', minWidth: 36 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600 }}>
              {d[valueKey] || 0}
            </div>
            <div style={{ width: '100%', maxWidth: 40, background: 'rgba(255,255,255,0.06)', borderRadius: '4px 4px 0 0', height: 100, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%', height: `${h}%`,
                background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`,
                borderRadius: '4px 4px 0 0', minHeight: d[valueKey] > 0 ? 4 : 0,
                transition: 'height 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 4, whiteSpace: 'nowrap' }}>
              {formatMonth(d.month)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutSegments({ data, labelFn, colorFn }) {
  if (!data || !data.length) return <EmptyState label="No data" />;
  const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d, i) => {
        const pct = Math.round((d.count / total) * 100);
        const color = colorFn ? colorFn(d) : 'var(--color-accent-gold)';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
              {labelFn ? labelFn(d) : d.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', width: 40, textAlign: 'right' }}>
                {d.count} <span style={{ color: '#6b7280', fontWeight: 400 }}>({pct}%)</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ label = 'No data' }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
      {label}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80, width: '100%' }}>
      <div style={{
        width: 32, height: 32, border: '3px solid rgba(212,175,55,0.2)',
        borderTop: '3px solid var(--color-accent-gold)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CrmReportsPage() {
  usePageTimeTracker('reports_page', { entityType: 'report' });
  const { user } = useAuth();
  const { showError } = useToast();

  const [period, setPeriod]         = useState('month');
  const [overview, setOverview]     = useState(null);
  const [properties, setProperties] = useState(null);
  const [agents, setAgents]         = useState(null);
  const [clients, setClients]       = useState(null);
  const [trends, setTrends]         = useState(null);
  const [trendTab, setTrendTab]     = useState('properties');
  const [loading, setLoading]       = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = period ? { period } : {};
      const [ov, pr, ag, cl, tr] = await Promise.all([
        api.get('/reports/overview',    { params }),
        api.get('/reports/properties',  { params }),
        api.get('/reports/agents',      { params }),
        api.get('/reports/clients',     { params }),
        api.get('/reports/trends'),
      ]);
      setOverview(ov.data);
      setProperties(pr.data);
      setAgents(ag.data);
      setClients(cl.data);
      setTrends(tr.data);
    } catch (err) {
      showError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  }, [period, showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── CSV exports ────────────────────────────────────────────────────────────

  const exportAgents = () => {
    if (!agents) return;
    exportCSV('agents-performance.csv',
      ['Rank', 'Name', 'Role', 'Branch', 'Properties', 'Clients', 'Inquiries', 'Activity Score'],
      agents.map((a, i) => [
        i + 1, `${a.firstName} ${a.lastName}`, a.role, a.branch || '',
        a.properties, a.clients, a.inquiries, a.activityScore,
      ])
    );
  };

  const exportProperties = () => {
    if (!properties) return;
    exportCSV('property-analytics.csv',
      ['Type', 'Count', 'Avg Price (EUR)'],
      (properties.avgPriceByType || []).map(r => [
        PROPERTY_TYPE_LABELS[r.type] || r.type, r.count, parseFloat(r.avgPrice).toFixed(2),
      ])
    );
  };

  const exportClients = () => {
    if (!clients) return;
    exportCSV('client-analytics.csv',
      ['Looking For', 'Count'],
      (clients.byLookingFor || []).map(r => [
        LOOKING_FOR_LABELS[r.lookingFor] || r.lookingFor, r.count,
      ])
    );
  };

  const exportTrends = () => {
    if (!trends) return;
    exportCSV('monthly-trends.csv',
      ['Month', 'Properties', 'Clients', 'Inquiries'],
      trends.map(r => [r.month, r.properties, r.clients, r.inquiries])
    );
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const ov = overview;
  const pv = properties;
  const ag = agents || [];
  const cl = clients;
  const tr = trends || [];

  const maxAgentScore = ag.length ? Math.max(...ag.map(a => a.activityScore), 1) : 1;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .reports-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .reports-grid-3 { grid-template-columns: 1fr !important; }
          .reports-grid-2 { grid-template-columns: 1fr !important; }
          .reports-table-wrap { overflow-x: auto; }
        }
        @media (max-width: 480px) {
          .reports-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
          📈 Analytics &amp; Reports
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Business intelligence dashboard for your Malta real estate CRM
        </p>
      </div>

      {/* ── Period filter bar ── */}
      <div style={{ ...glass, padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: 4 }}>Period:</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              style={{
                padding: '5px 14px', borderRadius: 999,
                border: '1px solid',
                borderColor: period === opt.value ? 'var(--color-accent-gold)' : 'rgba(212,175,55,0.2)',
                background: period === opt.value ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: period === opt.value ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
                cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={fetchAll} style={{ ...btnGhost, fontSize: 12 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading && <Spinner />}

      {/* ── Executive summary cards ── */}
      {ov && (
        <div className="reports-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <SummaryCard
            icon="🏠"
            label="Total Properties"
            value={ov.totals.properties.toLocaleString()}
            pct={ov.vsLastMonth.properties}
            sub={`${ov.newThisMonth.properties} added this month`}
          />
          <SummaryCard
            icon="👥"
            label="Total Clients"
            value={ov.totals.clients.toLocaleString()}
            pct={ov.vsLastMonth.clients}
            sub={`${ov.newThisMonth.clients} added this month`}
            color="#60a5fa"
          />
          <SummaryCard
            icon="🏢"
            label="Total Owners"
            value={ov.totals.owners.toLocaleString()}
            sub="Registered property owners"
            color="#a78bfa"
          />
          <SummaryCard
            icon="💬"
            label="Total Inquiries"
            value={ov.totals.inquiries.toLocaleString()}
            pct={ov.vsLastMonth.inquiries}
            sub={`${ov.newThisMonth.inquiries} this month`}
            color="#4ade80"
          />
        </div>
      )}

      {/* ── Property Status Overview ── */}
      {ov && (
        <div className="reports-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div style={{ ...glass, padding: 20 }}>
            <SectionHeader title="🏠 Properties by Status" />
            <DonutSegments
              data={Object.entries(ov.propertiesByStatus || {}).map(([k, v]) => ({ label: k, count: v }))}
              labelFn={d => d.label.replace(/_/g, ' ')}
              colorFn={d => {
                const c = { draft: '#6b7280', listed: '#4ade80', under_offer: '#fbbf24', sold: '#d4af37', rented: '#60a5fa', withdrawn: '#f87171' };
                return c[d.label] || '#9ca3af';
              }}
            />
          </div>
          <div style={{ ...glass, padding: 20 }}>
            <SectionHeader title="💬 Inquiries by Status" />
            <DonutSegments
              data={Object.entries(ov.inquiriesByStatus || {}).map(([k, v]) => ({ label: k, count: v }))}
              labelFn={d => d.label.replace(/_/g, ' ')}
              colorFn={d => {
                const c = { new: '#d4af37', open: '#60a5fa', assigned: '#a78bfa', in_progress: '#fbbf24', viewing_scheduled: '#4ade80', resolved: '#10b981', closed: '#6b7280', spam: '#f87171' };
                return c[d.label] || '#9ca3af';
              }}
            />
          </div>
        </div>
      )}

      {/* ── Property Analytics ── */}
      {pv && (
        <div style={{ marginBottom: 32 }}>
          <SectionHeader title="🏗️ Property Analytics">
            <button onClick={exportProperties} style={btnGold}>⬇ Export CSV</button>
          </SectionHeader>
          <div className="reports-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            {/* By Type */}
            <div style={{ ...glass, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                By Property Type
              </h3>
              <HBarChart
                data={pv.byType}
                keyField="type"
                valueField="count"
                labelFn={t => PROPERTY_TYPE_LABELS[t] || t}
              />
            </div>
            {/* By Locality */}
            <div style={{ ...glass, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Top 10 Localities
              </h3>
              <HBarChart
                data={pv.byLocality}
                keyField="locality"
                valueField="count"
                color="#60a5fa"
              />
            </div>
            {/* Listing Distribution */}
            <div style={{ ...glass, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Listing Type Distribution
              </h3>
              <DonutSegments
                data={pv.byListingType}
                labelFn={d => LISTING_TYPE_LABELS[d.listingType] || d.listingType}
                colorFn={d => LISTING_TYPE_COLORS[d.listingType] || '#9ca3af'}
              />
            </div>
          </div>

          <div className="reports-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Price Range Distribution */}
            <div style={{ ...glass, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Price Range Distribution
              </h3>
              {pv.priceRanges && (
                <HBarChart
                  data={[
                    { label: '< €100K',          count: pv.priceRanges.under100k },
                    { label: '€100K – €200K',    count: pv.priceRanges['100k_200k'] },
                    { label: '€200K – €500K',    count: pv.priceRanges['200k_500k'] },
                    { label: '€500K – €1M',      count: pv.priceRanges['500k_1m'] },
                    { label: '> €1M',            count: pv.priceRanges.over1m },
                  ]}
                  keyField="label"
                  valueField="count"
                  color="#a78bfa"
                />
              )}
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(212,175,55,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                ⏱ Avg. time on market: <strong style={{ color: 'var(--color-accent-gold)' }}>{pv.avgDaysOnMarket} days</strong>
              </div>
            </div>

            {/* Avg Price by Type */}
            <div style={{ ...glass, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Average Price by Type
              </h3>
              <div className="reports-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Type', 'Count', 'Avg Price'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(pv.avgPriceByType || []).sort((a, b) => b.count - a.count).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '7px 8px', color: 'var(--color-text-primary)', textTransform: 'capitalize', fontWeight: 600 }}>
                          {PROPERTY_TYPE_LABELS[r.type] || r.type}
                        </td>
                        <td style={{ padding: '7px 8px', color: 'var(--color-text-secondary)' }}>{r.count}</td>
                        <td style={{ padding: '7px 8px', color: 'var(--color-accent-gold)', fontWeight: 700 }}>
                          {formatEUR(r.avgPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Agent Performance ── */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="🏆 Agent Performance">
          <button onClick={exportAgents} style={btnGold}>⬇ Export CSV</button>
        </SectionHeader>
        <div style={{ ...glass, padding: 20 }}>
          {ag.length === 0 ? (
            <EmptyState label="No agent data for this period" />
          ) : (
            <div className="reports-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Rank', 'Agent', 'Role', 'Branch', 'Properties', 'Clients', 'Inquiries', 'Activity Score', 'Relative'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(212,175,55,0.12)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ag.map((a, i) => {
                    const barPct = Math.round((a.activityScore / maxAgentScore) * 100);
                    const isTop3 = i < 3;
                    return (
                      <tr key={a.agentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isTop3 ? 'rgba(212,175,55,0.04)' : 'transparent' }}>
                        <td style={{ padding: '9px 10px', fontWeight: 700, fontSize: 16 }}>
                          {i < 3 ? MEDAL[i] : <span style={{ color: 'var(--color-text-muted)' }}>{i + 1}</span>}
                        </td>
                        <td style={{ padding: '9px 10px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                          {a.firstName} {a.lastName}
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                            background: a.role === 'manager' ? 'rgba(234,179,8,0.14)' : 'rgba(59,130,246,0.14)',
                            color: a.role === 'manager' ? '#fbbf24' : '#60a5fa',
                          }}>
                            {a.role}
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{a.branch || '—'}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-primary)' }}>{a.properties}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-primary)' }}>{a.clients}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-primary)' }}>{a.inquiries}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 800, color: 'var(--color-accent-gold)' }}>{a.activityScore}</td>
                        <td style={{ padding: '9px 10px', minWidth: 80 }}>
                          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${barPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-accent-gold) 0%, #b8860b 100%)', borderRadius: 4, transition: 'width 0.4s' }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Client Insights ── */}
      {cl && (
        <div style={{ marginBottom: 32 }}>
          <SectionHeader title="👥 Client Insights">
            <button onClick={exportClients} style={btnGold}>⬇ Export CSV</button>
          </SectionHeader>
          <div className="reports-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {/* Looking For */}
            <div style={{ ...glass, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Looking For
              </h3>
              <DonutSegments
                data={cl.byLookingFor}
                labelFn={d => LOOKING_FOR_LABELS[d.lookingFor] || d.lookingFor}
                colorFn={(_, i) => ['#d4af37', '#60a5fa', '#4ade80', '#f472b6'][i % 4]}
              />
            </div>
            {/* Urgency */}
            <div style={{ ...glass, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Urgency Breakdown
              </h3>
              <DonutSegments
                data={cl.byUrgency}
                labelFn={d => URGENCY_LABELS[d.urgency] || d.urgency}
                colorFn={(d) => {
                  const c = { immediate: '#f87171', within_month: '#fbbf24', within_3months: '#fb923c', within_6months: '#60a5fa', flexible: '#4ade80' };
                  return c[d.urgency] || '#9ca3af';
                }}
              />
            </div>
            {/* Budget Distribution */}
            <div style={{ ...glass, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Budget Distribution
              </h3>
              {cl.budgetRanges && (
                <HBarChart
                  data={[
                    { label: '< €100K',          count: cl.budgetRanges.under100k },
                    { label: '€100K – €300K',    count: cl.budgetRanges['100k_300k'] },
                    { label: '€300K – €600K',    count: cl.budgetRanges['300k_600k'] },
                    { label: '€600K – €1M',      count: cl.budgetRanges['600k_1m'] },
                    { label: '> €1M',            count: cl.budgetRanges.over1m },
                  ]}
                  keyField="label"
                  valueField="count"
                  color="#4ade80"
                />
              )}
            </div>
          </div>

          {/* Top Preferred Localities */}
          {cl.topLocalities && cl.topLocalities.length > 0 && (
            <div style={{ ...glass, padding: 20, marginTop: 16 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Top Client Preferred Localities
              </h3>
              <HBarChart
                data={cl.topLocalities}
                keyField="locality"
                valueField="count"
                color="#f472b6"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Monthly Trends ── */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="📊 Monthly Trends (Last 12 Months)">
          <button onClick={exportTrends} style={btnGold}>⬇ Export CSV</button>
        </SectionHeader>
        <div style={{ ...glass, padding: 20 }}>
          {/* Tab selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {TREND_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setTrendTab(tab.key)}
                style={{
                  padding: '6px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600,
                  border: '1px solid',
                  borderColor: trendTab === tab.key ? 'var(--color-accent-gold)' : 'rgba(212,175,55,0.2)',
                  background: trendTab === tab.key ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: trendTab === tab.key ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <BarChart12
            data={tr}
            valueKey={trendTab}
            color={trendTab === 'properties' ? '#d4af37' : trendTab === 'clients' ? '#60a5fa' : '#4ade80'}
          />
        </div>
      </div>
    </div>
  );
}

