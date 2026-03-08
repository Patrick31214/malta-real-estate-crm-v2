import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';

/* ── Constants ─────────────────────────────────────────────────────────────── */

const PERIOD_OPTIONS = [
  { key: 'day',   label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'all',   label: 'All Time' },
];

const METRIC_ICONS = {
  login: '🔑', logout: '🚪', session_end: '⏹', session_heartbeat: '💓',
  password_change: '🔒',
  client_list: '📋', client_view: '👤', client_create: '➕', client_update: '✏️', client_delete: '🗑️', client_match_view: '🔍', client_match_recalc: '🔄',
  owner_list: '📋', owner_view: '🏢', owner_create: '➕', owner_update: '✏️', owner_delete: '🗑️', owner_contact_add: '➕', owner_contact_edit: '✏️',
  property_list: '📋', property_view: '🏠', property_create: '➕', property_update: '✏️', property_delete: '🗑️', property_feature: '⭐', property_status_change: '🔄', property_image_upload: '🖼️', property_share: '🔗',
  inquiry_list: '📋', inquiry_view: '📧', inquiry_create: '➕', inquiry_assign: '👤', inquiry_resolve: '✅', inquiry_status_change: '🔄', inquiry_delete: '🗑️',
  document_upload: '📎', document_view: '👁️', document_delete: '🗑️',
  chat_message_send: '💬', chat_channel_view: '💬', chat_channel_create: '➕',
  announcement_view: '📢', announcement_create: '➕', announcement_read: '✓',
  branch_view: '🏢', branch_create: '➕', branch_update: '✏️',
  agent_list: '👥', agent_view: '👤', agent_create: '➕', agent_update: '✏️', agent_delete: '🗑️', agent_block: '🚫', agent_unblock: '✅',
  notification_view: '🔔', notification_read: '✓', notification_read_all: '✓',
  page_view: '🌐', page_time: '⏱️',
};

const METRIC_LABELS = {
  login: 'Logged in', logout: 'Logged out', session_end: 'Session ended', session_heartbeat: 'Heartbeat',
  password_change: 'Changed password',
  client_list: 'Clients list', client_view: 'Viewed client', client_create: 'Created client', client_update: 'Updated client', client_delete: 'Deleted client', client_match_view: 'Viewed matches', client_match_recalc: 'Recalculated matches',
  owner_list: 'Owners list', owner_view: 'Viewed owner', owner_create: 'Created owner', owner_update: 'Updated owner', owner_delete: 'Deleted owner', owner_contact_add: 'Added contact', owner_contact_edit: 'Edited contact',
  property_list: 'Properties list', property_view: 'Viewed property', property_create: 'Created property', property_update: 'Updated property', property_delete: 'Deleted property', property_feature: 'Toggled featured', property_status_change: 'Changed status', property_image_upload: 'Uploaded images', property_share: 'Shared property',
  inquiry_list: 'Inquiries list', inquiry_view: 'Viewed inquiry', inquiry_create: 'Created inquiry', inquiry_assign: 'Assigned inquiry', inquiry_resolve: 'Resolved inquiry', inquiry_status_change: 'Changed status', inquiry_delete: 'Deleted inquiry',
  document_upload: 'Uploaded document', document_view: 'Viewed document', document_delete: 'Deleted document',
  chat_message_send: 'Sent message', chat_channel_view: 'Viewed channel', chat_channel_create: 'Created channel',
  announcement_view: 'Viewed announcement', announcement_create: 'Created announcement', announcement_read: 'Marked read',
  branch_view: 'Viewed branch', branch_create: 'Created branch', branch_update: 'Updated branch',
  agent_list: 'Agents list', agent_view: 'Viewed agent', agent_create: 'Created agent', agent_update: 'Updated agent', agent_delete: 'Deleted agent', agent_block: 'Blocked agent', agent_unblock: 'Unblocked agent',
  notification_view: 'Viewed notifications', notification_read: 'Read notification', notification_read_all: 'Marked all read',
  page_view: 'Page view', page_time: 'Time on page',
};

const BADGE_COLORS = {
  create: 'var(--color-success, #28a745)',
  view:   'var(--color-info, #0dcaf0)',
  update: 'var(--color-warning, #ffc107)',
  delete: 'var(--color-danger, #dc3545)',
  login:  'var(--color-accent-gold, #d4a017)',
  logout: 'var(--color-text-muted)',
  list:   'rgba(255,255,255,0.5)',
  time:   'var(--color-accent-gold, #d4a017)',
};

const ENTITY_FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'property',     label: '🏠 Properties' },
  { key: 'client',       label: '👤 Clients' },
  { key: 'owner',        label: '🏢 Owners' },
  { key: 'inquiry',      label: '📧 Inquiries' },
  { key: 'chat',         label: '💬 Chat' },
  { key: 'document',     label: '📎 Docs' },
  { key: 'announcement', label: '📢 Announcements' },
  { key: 'page_time',    label: '⏱️ Page Time' },
];

const ENTITY_TYPE_ICONS = {
  property: '🏠', client: '👤', owner: '🏢', inquiry: '📧',
  agent: '👥', branch: '🏛️', chat: '💬', announcement: '📢', document: '📎',
};

/* ── Utility functions ──────────────────────────────────────────────────────── */

const fmtDuration = (secs) => {
  if (!secs && secs !== 0) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtTimeAgo = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getBadgeColor = (metricType) => {
  const action = metricType ? metricType.split('_').pop() : '';
  return BADGE_COLORS[action] || 'rgba(255,255,255,0.3)';
};

const getActionLabel = (metricType) => METRIC_LABELS[metricType] || metricType;
const getActionIcon  = (metricType) => METRIC_ICONS[metricType]  || '•';

/* ── Style helpers ──────────────────────────────────────────────────────────── */

const cardBase = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
};

const sectionTitleStyle = {
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-3)',
  marginTop: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const makeBadge = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 8px',
  borderRadius: 20,
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  background: color + '22',
  color: color,
  border: `1px solid ${color}44`,
  whiteSpace: 'nowrap',
});

const makePill = (active) => ({
  padding: '4px 12px',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${active ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.12)'}`,
  background: active ? 'var(--color-accent-gold)' : 'transparent',
  color: active ? '#000' : 'var(--color-text-secondary)',
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  whiteSpace: 'nowrap',
});

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-accent-gold)', lineHeight: 1.1 }}>{value ?? 0}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4, wordBreak: 'break-word' }}>{label}</div>
      {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

function ActivityCard({ title, color, rows }) {
  return (
    <div style={cardBase}>
      <div style={sectionTitleStyle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(({ label, value }, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{label}</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: value > 0 ? color : 'var(--color-text-muted)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageTimesTable({ breakdown }) {
  if (!breakdown || !breakdown.length) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No page-time data recorded yet.</div>;
  }
  const formatSection = (sectionName) => sectionName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Section', 'Total Time', 'Visits', 'Avg/Visit'].map(h => (
              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {breakdown.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '7px 8px', color: 'var(--color-text-primary)', fontWeight: 500 }}>{formatSection(row.section)}</td>
              <td style={{ padding: '7px 8px', color: 'var(--color-accent-gold)', fontWeight: 700 }}>{fmtDuration(row.totalSeconds)}</td>
              <td style={{ padding: '7px 8px', color: 'var(--color-text-secondary)' }}>{row.visits}</td>
              <td style={{ padding: '7px 8px', color: 'var(--color-text-muted)' }}>{fmtDuration(row.avgSeconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopViewedList({ entities }) {
  if (!entities || !entities.length) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No entity views recorded yet.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {entities.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', width: 20, textAlign: 'center', flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{ENTITY_TYPE_ICONS[e.entityType] || '•'}</span>
          <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.entityLabel || e.entityId || '—'}</span>
          <span style={{ ...makeBadge('var(--color-accent-gold)'), flexShrink: 0 }}>{e.viewCount}x</span>
        </div>
      ))}
    </div>
  );
}

function ActivityFeedRow({ row }) {
  const icon     = getActionIcon(row.metricType);
  const label    = getActionLabel(row.metricType);
  const color    = getBadgeColor(row.metricType);
  const time     = fmtTime(row.createdAt);
  const timeAgo  = fmtTimeAgo(row.createdAt);

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td style={{ padding: '7px 8px', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
        <span title={time}>{timeAgo}</span>
      </td>
      <td style={{ padding: '7px 8px' }}>
        <span style={makeBadge(color)}>{icon} {label}</span>
      </td>
      <td style={{ padding: '7px 8px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {row.entityLabel ? (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>
            {ENTITY_TYPE_ICONS[row.entityType] || ''} {row.entityLabel}
          </span>
        ) : row.pageUrl ? (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{row.pageUrl}</span>
        ) : null}
      </td>
      <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
        {row.duration != null && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>{fmtDuration(row.duration)}</span>
        )}
      </td>
    </tr>
  );
}

function SessionCard({ sess }) {
  const loginTime = sess.loginAt ? fmtTime(sess.loginAt) : '—';
  const endTime   = sess.endAt   ? fmtTime(sess.endAt)   : 'active';
  const dur       = sess.duration ? fmtDuration(sess.duration) : null;

  return (
    <div style={{ ...cardBase, marginBottom: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {loginTime} → {endTime}
        </span>
        {dur && <span style={{ ...makeBadge('var(--color-accent-gold)'), flexShrink: 0 }}>{dur}</span>}
        {sess.ipAddress && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{sess.ipAddress}</span>
        )}
      </div>
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, color }) {
  const barColor = color || 'var(--color-accent-gold)';
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3) 0' }}>No data</div>;
  }
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 56, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[labelKey]}</div>
          <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(d[valueKey] / max) * 100}%`, height: '100%', background: barColor, borderRadius: 4, minWidth: d[valueKey] > 0 ? 4 : 0, transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ width: 28, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0, textAlign: 'right' }}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */

/**
 * AgentMetricsPanel — comprehensive performance dashboard for a single agent.
 *
 * @param {string} agentId         - UUID of the agent whose metrics to display.
 * @param {string} [initialPeriod] - Default time period ('month').
 */
function AgentMetricsPanel({ agentId, initialPeriod = 'month' }) {
  const [period, setPeriod]             = useState(initialPeriod);
  const [metrics, setMetrics]           = useState(null);
  const [activityLog, setActivityLog]   = useState(null);
  const [sessions, setSessions]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [logPage, setLogPage]           = useState(1);
  const [entityFilter, setEntityFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const { showError } = useToast();

  const loadMetrics = useCallback(() => {
    if (!agentId) return;
    setLoading(true);
    Promise.all([
      api.get(`/agents/${agentId}/metrics`, { params: { period } }),
      api.get(`/agents/${agentId}/metrics/activity-log`, { params: { period, page: logPage, limit: 30 } }),
      api.get(`/agents/${agentId}/metrics/sessions`, { params: { period } }),
    ])
      .then(([mRes, aRes, sRes]) => {
        setMetrics(mRes.data);
        setActivityLog(aRes.data);
        setSessions(sRes.data);
      })
      .catch(err => showError(err.response?.data?.error || 'Failed to load metrics'))
      .finally(() => setLoading(false));
  }, [agentId, period, logPage, showError]);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const s = metrics?.summary || {};

  const filteredRows = (activityLog?.rows || []).filter(row => {
    if (entityFilter === 'page_time') return row.metricType === 'page_time';
    if (entityFilter !== 'all' && row.entityType !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (row.entityLabel || '').toLowerCase().includes(q) ||
        (row.metricType  || '').toLowerCase().includes(q) ||
        (row.pageUrl     || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* ── Period selector ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        {PERIOD_OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => { setPeriod(o.key); setLogPage(1); }}
            aria-pressed={period === o.key}
            style={makePill(period === o.key)}
          >
            {o.label}
          </button>
        ))}
        <button
          onClick={loadMetrics}
          style={{ ...makePill(false), marginLeft: 'auto' }}
          title="Refresh metrics"
        >
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>Loading metrics…</div>
      )}

      {!loading && !metrics && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>No metrics data available for this period.</div>
      )}

      {!loading && metrics && (
        <>
          {/* ── Summary Header ───────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <StatCard icon="⚡" label="Total Actions"  value={s.totalActions}         sub={PERIOD_OPTIONS.find(p => p.key === period)?.label} />
            <StatCard icon="⏱️" label="Session Hours"  value={s.totalSessionHours}    sub={s.avgSessionMinutes ? `avg ${s.avgSessionMinutes}m` : null} />
            <StatCard icon="🔑" label="Logins"         value={s.totalLogins}          sub={s.lastLoginAt ? fmtTimeAgo(s.lastLoginAt) : null} />
            <StatCard icon="🏡" label="Properties"     value={s.totalPropertiesAssigned} sub={`${s.activeListings || 0} active`} />
            <StatCard icon="👤" label="Clients"        value={s.totalClientsAssigned} />
            <StatCard icon="💶" label="Revenue (EUR)"  value={s.totalRevenue != null ? `\u20AC${Number(s.totalRevenue).toLocaleString()}` : '\u20AC0'} />
          </div>

          {/* ── Activity Summary Cards ───────────────────────────────────────── */}
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-3)' }}>
              Activity Summary — {PERIOD_OPTIONS.find(p => p.key === period)?.label}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(190px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <ActivityCard title="🏠 Properties" color="var(--color-warning, #ffc107)" rows={[
              { label: 'Viewed',  value: s.propertiesViewed  || 0 },
              { label: 'Created', value: s.propertiesCreated || 0 },
              { label: 'Updated', value: s.propertiesUpdated || 0 },
              { label: 'Deleted', value: s.propertiesDeleted || 0 },
            ]} />
            <ActivityCard title="👤 Clients" color="var(--color-success, #28a745)" rows={[
              { label: 'Viewed',  value: s.clientsViewed  || 0 },
              { label: 'Created', value: s.clientsCreated || 0 },
              { label: 'Updated', value: s.clientsUpdated || 0 },
              { label: 'Deleted', value: s.clientsDeleted || 0 },
            ]} />
            <ActivityCard title="🏢 Owners" color="var(--color-danger, #dc3545)" rows={[
              { label: 'Viewed',  value: s.ownersViewed  || 0 },
              { label: 'Created', value: s.ownersCreated || 0 },
              { label: 'Updated', value: s.ownersUpdated || 0 },
              { label: 'Deleted', value: s.ownersDeleted || 0 },
            ]} />
            <ActivityCard title="📧 Inquiries" color="var(--color-info, #0dcaf0)" rows={[
              { label: 'Viewed',   value: s.inquiriesViewed   || 0 },
              { label: 'Assigned', value: s.inquiriesAssigned || 0 },
              { label: 'Resolved', value: s.inquiriesResolved || 0 },
            ]} />
            <ActivityCard title="💬 Chat" color="var(--color-success, #28a745)" rows={[
              { label: 'Messages Sent',   value: s.chatMessagesSent   || 0 },
              { label: 'Channels Viewed', value: s.chatChannelsViewed || 0 },
            ]} />
            <ActivityCard title="📎 Documents" color="var(--color-accent-gold)" rows={[
              { label: 'Uploaded', value: s.documentsUploaded || 0 },
              { label: 'Viewed',   value: s.documentsViewed   || 0 },
              { label: 'Deleted',  value: s.documentsDeleted  || 0 },
            ]} />
            <ActivityCard title="📢 Announcements" color="var(--color-info, #0dcaf0)" rows={[
              { label: 'Viewed',  value: s.announcementsViewed  || 0 },
              { label: 'Created', value: s.announcementsCreated || 0 },
              { label: 'Read',    value: s.announcementsRead    || 0 },
            ]} />
          </div>

          {/* ── Page Time Breakdown + Top Viewed (responsive 2-col) ──────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <div style={sectionTitleStyle}>⏱️ Time on Page</div>
              <PageTimesTable breakdown={metrics.pageTimeBreakdown} />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <div style={sectionTitleStyle}>🔝 Top Viewed Entities</div>
              <TopViewedList entities={metrics.topViewedEntities} />
            </div>
          </div>

          {/* ── Charts ──────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ ...sectionTitleStyle, marginBottom: 'var(--space-3)' }}>📅 Daily Activity</div>
              <BarChart data={(metrics.timeline || []).slice(-14)} labelKey="date" valueKey="count" />
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ ...sectionTitleStyle, marginBottom: 'var(--space-3)' }}>🕐 Activity by Hour</div>
              <BarChart data={metrics.activityByHour || []} labelKey="hour" valueKey="count" color="var(--color-info, #0dcaf0)" />
            </div>
            {metrics.activityByType && Object.keys(metrics.activityByType).length > 0 && (
              <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ ...sectionTitleStyle, marginBottom: 'var(--space-3)' }}>📊 By Category</div>
                <BarChart
                  data={Object.entries(metrics.activityByType).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))}
                  labelKey="label"
                  valueKey="count"
                  color="var(--color-accent-gold)"
                />
              </div>
            )}
          </div>

          {/* ── Activity Feed ────────────────────────────────────────────────── */}
          <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
            <div style={sectionTitleStyle}>📜 Activity Feed</div>

            {/* Filter pills + search */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
              {ENTITY_FILTERS.map(f => (
                <button key={f.key} onClick={() => { setEntityFilter(f.key); setLogPage(1); }} style={makePill(entityFilter === f.key)}>
                  {f.label}
                </button>
              ))}
              <input
                type="search"
                placeholder="Search entity…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-xs)',
                  width: 180,
                  outline: 'none',
                }}
              />
            </div>

            {filteredRows.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Time', 'Action', 'Entity', 'Duration'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(row => <ActivityFeedRow key={row.id} row={row} />)}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3) 0' }}>No matching activity.</div>
            )}

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
              <button
                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                disabled={logPage <= 1}
                style={{ ...makePill(false), opacity: logPage <= 1 ? 0.4 : 1 }}
              >
                Prev
              </button>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Page {logPage} of {Math.max(1, Math.ceil((activityLog?.total || 0) / (activityLog?.limit || 30)))} · {activityLog?.total ?? 0} total
              </span>
              <button
                onClick={() => setLogPage(p => p + 1)}
                disabled={logPage * (activityLog?.limit || 30) >= (activityLog?.total || 0)}
                style={{ ...makePill(false), opacity: logPage * (activityLog?.limit || 30) >= (activityLog?.total || 0) ? 0.4 : 1 }}
              >
                Next
              </button>
            </div>
          </div>

          {/* ── Session History ──────────────────────────────────────────────── */}
          <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
            <div style={sectionTitleStyle}>🔑 Session History</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={cardBase}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total Logins</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-accent-gold)' }}>{s.totalLogins || 0}</div>
              </div>
              <div style={cardBase}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Session Hours</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-accent-gold)' }}>{s.totalSessionHours || 0}h</div>
              </div>
              <div style={cardBase}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Avg Session</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-accent-gold)' }}>{s.avgSessionMinutes || 0}m</div>
              </div>
              <div style={cardBase}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Last Login</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.lastLoginAt ? fmtTimeAgo(s.lastLoginAt) : '—'}</div>
                {s.lastLoginAt && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{fmtTime(s.lastLoginAt)}</div>}
              </div>
            </div>

            {sessions?.sessions?.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recent Sessions
                </div>
                {sessions.sessions.slice(0, 15).map((sess, i) => (
                  <SessionCard key={i} sess={sess} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AgentMetricsPanel;
