import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo,
} from 'react';
import api from '../../../services/api';
import { useToast } from '../../ui/Toast';

/* ── Constants ───────────────────────────────────────────────────────────── */

const PERIOD_OPTIONS = [
  { key: 'day',   label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'all',   label: 'All Time' },
];

const SECTIONS = [
  { key: 'properties',    icon: '🏠', label: 'Properties',    color: 'var(--color-warning)' },
  { key: 'clients',       icon: '👤', label: 'Clients',       color: 'var(--color-success)' },
  { key: 'owners',        icon: '🏢', label: 'Owners',        color: 'var(--color-error)' },
  { key: 'contacts',      icon: '📩', label: 'Inquiries',     color: 'var(--color-info)' },
  { key: 'chat',          icon: '💬', label: 'Chat',          color: 'var(--color-success)' },
  { key: 'announcements', icon: '📢', label: 'Announcements', color: 'var(--color-info)' },
  { key: 'branches',      icon: '🌿', label: 'Branches',      color: 'var(--color-accent-gold)' },
  { key: 'agents',        icon: '🧑‍💼', label: 'Agents',        color: 'var(--color-primary)' },
  { key: 'documents',     icon: '📄', label: 'Documents',     color: 'var(--color-warning)' },
  { key: 'notifications', icon: '🔔', label: 'Notifications', color: 'var(--color-error)' },
];

const SECTION_SUMMARY_ROWS = {
  properties:    s => [{ label: 'Viewed', v: s.totalViewed||0 }, { label: 'Created', v: s.totalCreated||0 }, { label: 'Updated', v: s.totalUpdated||0 }, { label: 'Status Changes', v: s.totalStatusChanges||0 }],
  clients:       s => [{ label: 'Viewed', v: s.totalViewed||0 }, { label: 'Created', v: s.totalCreated||0 }, { label: 'Updated', v: s.totalUpdated||0 }],
  owners:        s => [{ label: 'Viewed', v: s.totalViewed||0 }, { label: 'Created', v: s.totalCreated||0 }, { label: 'Contacts Added', v: s.totalContactsAdded||0 }],
  contacts:      s => [{ label: 'Viewed', v: s.totalViewed||0 }, { label: 'Assigned', v: s.totalAssigned||0 }, { label: 'Resolved', v: s.totalResolved||0 }],
  chat:          s => [{ label: 'Messages Sent', v: s.totalMessagesSent||0 }, { label: 'Channels Viewed', v: s.totalChannelsViewed||0 }],
  announcements: s => [{ label: 'Viewed', v: s.totalViewed||0 }, { label: 'Created', v: s.totalCreated||0 }, { label: 'Read', v: s.totalRead||0 }],
  branches:      s => [{ label: 'Viewed', v: s.totalViewed||0 }, { label: 'Created', v: s.totalCreated||0 }, { label: 'Updated', v: s.totalUpdated||0 }],
  agents:        s => [{ label: 'Viewed', v: s.totalViewed||0 }, { label: 'Created', v: s.totalCreated||0 }, { label: 'Updated', v: s.totalUpdated||0 }],
  documents:     s => [{ label: 'Uploaded', v: s.totalUploaded||0 }, { label: 'Viewed', v: s.totalViewed||0 }, { label: 'Deleted', v: s.totalDeleted||0 }],
  notifications: s => [{ label: 'Viewed', v: s.totalViewed||0 }, { label: 'Read', v: s.totalRead||0 }, { label: 'Read All', v: s.totalReadAll||0 }],
};

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
  login: 'Logged in', logout: 'Logged out', session_end: 'Session ended',
  client_view: 'Viewed client', client_create: 'Created client', client_update: 'Updated client', client_delete: 'Deleted client', client_match_view: 'Viewed matches', client_match_recalc: 'Recalculated matches',
  owner_view: 'Viewed owner', owner_create: 'Created owner', owner_update: 'Updated owner', owner_delete: 'Deleted owner', owner_contact_add: 'Added contact', owner_contact_edit: 'Edited contact',
  property_view: 'Viewed property', property_create: 'Created property', property_update: 'Updated property', property_delete: 'Deleted property', property_feature: 'Toggled featured', property_status_change: 'Changed status', property_image_upload: 'Uploaded images', property_share: 'Shared property',
  inquiry_view: 'Viewed inquiry', inquiry_create: 'Created inquiry', inquiry_assign: 'Assigned inquiry', inquiry_resolve: 'Resolved inquiry', inquiry_status_change: 'Changed status', inquiry_delete: 'Deleted inquiry',
  document_upload: 'Uploaded document', document_view: 'Viewed document', document_delete: 'Deleted document',
  chat_message_send: 'Sent message', chat_channel_view: 'Viewed channel', chat_channel_create: 'Created channel',
  announcement_view: 'Viewed announcement', announcement_create: 'Created announcement', announcement_read: 'Marked read',
  branch_view: 'Viewed branch', branch_create: 'Created branch', branch_update: 'Updated branch',
  agent_view: 'Viewed agent', agent_create: 'Created agent', agent_update: 'Updated agent', agent_delete: 'Deleted agent', agent_block: 'Blocked agent', agent_unblock: 'Unblocked agent',
  notification_view: 'Viewed notifications', notification_read: 'Read notification', notification_read_all: 'Marked all read',
  page_view: 'Page view', page_time: 'Time on page',
};

const ACTION_BADGE_COLOR = (metricType) => {
  const t = metricType || '';
  if (t.endsWith('_create') || t.endsWith('_upload')) return 'var(--color-success)';
  if (t.endsWith('_delete')) return 'var(--color-error)';
  if (t.endsWith('_update') || t.endsWith('_edit')) return 'var(--color-warning)';
  if (t.endsWith('_view') || t.endsWith('_list')) return 'var(--color-info)';
  if (t.includes('status_change') || t.includes('feature') || t.includes('resolve') || t.includes('assign')) return 'var(--color-accent-gold)';
  return 'rgba(156,131,103,0.7)';
};

/* ── Utility functions ───────────────────────────────────────────────────── */

const fmtDuration = (secs) => {
  if (!secs && secs !== 0) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
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

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* ── Shared style snippets ───────────────────────────────────────────────── */

const pill = (active) => ({
  padding: '5px 14px',
  minHeight: 36,
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${active ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
  background: active ? 'var(--color-accent-gold)' : 'transparent',
  color: active ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s',
  display: 'inline-flex',
  alignItems: 'center',
});

const badge = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  padding: '2px 8px',
  borderRadius: 20,
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  background: color + '22',
  color: color,
  border: `1px solid ${color}44`,
  whiteSpace: 'nowrap',
});

const sectionTitle = {
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 'var(--space-3)',
};

const glassCard = {
  background: 'var(--color-surface-glass)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
};

/* ── Skeleton loader ─────────────────────────────────────────────────────── */
function Skeleton({ h = 18, w = '100%', style = {} }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 'var(--radius-xs)',
      background: 'linear-gradient(90deg, var(--color-surface-glass) 25%, var(--color-surface-glass-hover) 50%, var(--color-surface-glass) 75%)',
      backgroundSize: '200% 100%',
      animation: 'amp-shimmer 1.4s infinite',
      ...style,
    }} />
  );
}

/* ── KPI stat card ───────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub }) {
  return (
    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-accent-gold)', lineHeight: 1.1 }}>{value ?? 0}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

/* ── CSS bar chart (pure, no library) ───────────────────────────────────── */
function BarChart({ data, labelKey, valueKey, color }) {
  const barColor = color || 'var(--color-accent-gold)';
  if (!data || data.length === 0) return <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3) 0' }}>No data</div>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 56, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[labelKey]}</div>
          <div style={{ flex: 1, height: 14, background: 'rgba(156,131,103,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(d[valueKey] / max) * 100}%`, height: '100%', background: barColor, borderRadius: 4, minWidth: d[valueKey] > 0 ? 4 : 0, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ width: 28, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0, textAlign: 'right' }}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Section summary card in overview grid ───────────────────────────────── */
function SectionCard({ section, summaryData, loading, onClick }) {
  const rows = SECTION_SUMMARY_ROWS[section.key];
  const summary = summaryData?.summary || null;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="glass"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered ? `0 0 0 2px ${section.color}66, var(--shadow-md)` : 'var(--shadow-sm)',
        borderColor: hovered ? `${section.color}55` : 'var(--color-border)',
        minHeight: 110,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 20 }}>{section.icon}</span>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{section.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: section.color, fontWeight: 600 }}>Drill-down →</span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton h={12} />
          <Skeleton h={12} w="80%" />
          <Skeleton h={12} w="60%" />
        </div>
      ) : summary && rows ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rows(summary).slice(0, 3).map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{r.label}</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: r.v > 0 ? section.color : 'var(--color-text-muted)' }}>{r.v}</span>
            </div>
          ))}
          {summary.totalInteractions > 0 && (
            <div style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Total: {summary.totalInteractions} interactions
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No data for period</div>
      )}
    </div>
  );
}

/* ── Session card ────────────────────────────────────────────────────────── */
function SessionCard({ sess }) {
  return (
    <div style={{ ...glassCard, marginBottom: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sess.loginAt ? fmtTime(sess.loginAt) : '—'} → {sess.endAt ? fmtTime(sess.endAt) : 'active'}
        </span>
        {sess.duration && <span style={badge('var(--color-accent-gold)')}>{fmtDuration(sess.duration)}</span>}
        {sess.ipAddress && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{sess.ipAddress}</span>}
      </div>
    </div>
  );
}

/* ── Action feed row ─────────────────────────────────────────────────────── */
const ActionFeedItem = memo(function ActionFeedItem({ row }) {
  const icon = METRIC_ICONS[row.metricType] || '•';
  const label = METRIC_LABELS[row.metricType] || row.metricType;
  const color = ACTION_BADGE_COLOR(row.metricType);
  const meta = row.metadata || {};

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <span style={badge(color)}>{icon} {label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {row.entityLabel && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.entityLabel}
          </div>
        )}
        {meta.field === 'status' && meta.previousValue && meta.newValue && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Changed status: {meta.previousValue} <span aria-label="to">→</span> {meta.newValue}
          </div>
        )}
        {meta.field === 'isAvailable' && meta.previousValue !== undefined && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Availability: {meta.previousValue ? 'Available' : 'Unavailable'} <span aria-label="to">→</span> {meta.newValue ? 'Available' : 'Unavailable'}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div title={fmtTime(row.createdAt)} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', cursor: 'default' }}>{fmtTimeAgo(row.createdAt)}</div>
        {row.duration != null && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>{fmtDuration(row.duration)}</div>}
        {row.ipAddress && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', opacity: 0.7 }}>{row.ipAddress}</div>}
      </div>
    </div>
  );
});

/* ── Expandable entity row ───────────────────────────────────────────────── */
const EntityRow = memo(function EntityRow({ entity, columns, isMobile }) {
  const [expanded, setExpanded] = useState(false);

  if (isMobile) {
    return (
      <div style={{ background: 'var(--color-surface-glass-subtle)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', marginBottom: 'var(--space-2)', border: '1px solid var(--color-border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6, cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.entityLabel || entity.entityId}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {columns.filter(c => c.key !== 'entity').map(col => (
            <div key={col.key} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>{col.label}: </span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{col.render ? col.render(entity) : (entity[col.key] ?? '—')}</span>
            </div>
          ))}
        </div>
        {expanded && entity.actions && entity.actions.length > 0 && (
          <div style={{ marginTop: 8, borderTop: '1px solid var(--color-border-light)', paddingTop: 8 }}>
            {entity.actions.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', padding: '3px 0', color: 'var(--color-text-secondary)' }}>
                <span>{METRIC_ICONS[a.metricType] || '•'} {METRIC_LABELS[a.metricType] || a.metricType}</span>
                <span style={{ color: 'var(--color-accent-gold)', fontWeight: 600 }}>{a.count}x</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', background: expanded ? 'var(--color-surface-glass-subtle)' : 'transparent', transition: 'background 0.15s' }}
      >
        {columns.map(col => (
          <td key={col.key} style={{ padding: '8px 10px', fontSize: 'var(--text-xs)', verticalAlign: 'middle', ...(col.style || {}) }}>
            {col.render ? col.render(entity) : (entity[col.key] ?? '—')}
          </td>
        ))}
      </tr>
      {expanded && (
        <tr style={{ background: 'var(--color-surface-glass-subtle)' }}>
          <td colSpan={columns.length} style={{ padding: '8px 16px 12px' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action History</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(entity.actions || []).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-glass)', padding: '3px 8px', borderRadius: 20 }}>
                  {METRIC_ICONS[a.metricType] || '•'} {METRIC_LABELS[a.metricType] || a.metricType}: <strong style={{ color: 'var(--color-accent-gold)' }}>{a.count}x</strong>
                  {a.lastAt && <span style={{ color: 'var(--color-text-muted)' }}> · {fmtTimeAgo(a.lastAt)}</span>}
                </div>
              ))}
            </div>
            {entity.actions?.some(a => a.details?.length > 0) && (
              <div style={{ marginTop: 8 }}>
                {entity.actions.filter(a => a.details?.length > 0).map((a, i) => (
                  <div key={i}>
                    {a.details.map((d, j) => (
                      <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: '2px 0' }}>
                        {d.field === 'status' && `Status: ${d.previousValue} to ${d.newValue}`}
                        {d.field === 'isAvailable' && `Availability: ${d.previousValue ? 'Available' : 'Unavailable'} to ${d.newValue ? 'Available' : 'Unavailable'}`}
                        {d.at && ` (${fmtTime(d.at)})`}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
});

/* ── Section Drill-Down view ─────────────────────────────────────────────── */
function SectionDrillDown({ agentId, section, period, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('totalInteractions');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { showError } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (!agentId || !section) return;
    setLoading(true);
    api.get(`/agents/${agentId}/metrics/section/${section.key}`, { params: { period } })
      .then(r => setData(r.data))
      .catch(err => showError(err.response?.data?.error || `Failed to load ${section.label} metrics`))
      .finally(() => setLoading(false));
  }, [agentId, section, period, showError]);

  const sortedEntities = useMemo(() => {
    if (!data?.entityBreakdown) return [];
    let items = [...data.entityBreakdown];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(e => (e.entityLabel || '').toLowerCase().includes(q));
    }
    items.sort((a, b) => {
      let av = a[sortKey] ?? 0;
      let bv = b[sortKey] ?? 0;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [data, debouncedSearch, sortKey, sortDir]);

  const handleSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return key; }
      setSortDir('desc'); return key;
    });
  }, []);

  const s = data?.summary || {};
  const timeSpent = s.timeSpent || {};

  const cols = useMemo(() => [
    { key: 'entity', label: 'Entity', style: { maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      render: e => <span title={e.entityLabel} style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{e.entityLabel || e.entityId || '—'}</span> },
    { key: 'totalInteractions', label: 'Total', style: { textAlign: 'center', color: 'var(--color-accent-gold)', fontWeight: 700 },
      render: e => <strong style={{ color: 'var(--color-accent-gold)' }}>{e.totalInteractions}</strong> },
    { key: 'timeSpent', label: 'Time', style: { textAlign: 'center', color: 'var(--color-text-secondary)' },
      render: e => fmtDuration(e.timeSpent) },
    { key: 'lastAt', label: 'Last Action', style: { whiteSpace: 'nowrap', color: 'var(--color-text-muted)' },
      render: e => <span title={fmtTime(e.lastAt)}>{fmtTimeAgo(e.lastAt)}</span> },
    { key: 'expand', label: '', style: { width: 24, textAlign: 'center', color: 'var(--color-text-muted)' },
      render: () => '…' },
  ], []);

  const SortIcon = ({ col }) => sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div>
      {/* Back button + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...pill(false), gap: 6 }}>
          ← Back to Overview
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 24 }}>{section.icon}</span>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{section.label} Metrics</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1,2,3].map(i => <Skeleton key={i} h={60} />)}
        </div>
      ) : !data ? (
        <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-4)' }}>No data available.</div>
      ) : (
        <>
          {/* Summary KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: section.color }}>{s.totalInteractions || 0}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total Actions</div>
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-accent-gold)' }}>{fmtDuration(timeSpent.totalSeconds)}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Time Spent</div>
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-info)' }}>{timeSpent.visits || 0}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Visits</div>
            </div>
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-success)' }}>{sortedEntities.length}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Unique Entities</div>
            </div>
          </div>

          {/* Section-specific summary stats */}
          {SECTION_SUMMARY_ROWS[section.key] && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              {SECTION_SUMMARY_ROWS[section.key](s).map((r, i) => (
                <div key={i} style={{ ...glassCard, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: '1 1 140px' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: r.v > 0 ? section.color : 'var(--color-text-muted)' }}>{r.v}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{r.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity timeline */}
          {data.timeline && data.timeline.length > 0 && (
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
              <div style={sectionTitle}>📅 Daily Activity</div>
              <BarChart data={data.timeline.slice(-21)} labelKey="date" valueKey="total" color={section.color} />
            </div>
          )}

          {/* Entity Breakdown */}
          <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={sectionTitle}>📊 Entity Breakdown</div>
              <input
                type="search"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  marginLeft: 'auto', padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface-glass)',
                  color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)', minHeight: 36,
                  outline: 'none', width: isMobile ? '100%' : 180,
                }}
              />
            </div>

            {sortedEntities.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3) 0' }}>
                {debouncedSearch ? 'No entities match your search.' : 'No entity-specific data for this period.'}
              </div>
            ) : isMobile ? (
              <div>
                {sortedEntities.slice(0, 50).map((entity, i) => (
                  <EntityRow key={entity.entityId || i} entity={entity} columns={cols} isMobile />
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="amp-entity-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {[
                        { key: 'entity', label: 'Entity' },
                        { key: 'totalInteractions', label: 'Total' },
                        { key: 'timeSpent', label: 'Time Spent' },
                        { key: 'lastAt', label: 'Last Action' },
                        { key: 'expand', label: '' },
                      ].map(h => (
                        <th
                          key={h.key}
                          onClick={h.key !== 'expand' ? () => handleSort(h.key) : undefined}
                          style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', cursor: h.key !== 'expand' ? 'pointer' : 'default', userSelect: 'none' }}
                        >
                          {h.label}<SortIcon col={h.key} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntities.slice(0, 100).map((entity, i) => (
                      <EntityRow key={entity.entityId || i} entity={entity} columns={cols} isMobile={false} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Actions Feed */}
          {data.recentActions && data.recentActions.length > 0 && (
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
              <div style={sectionTitle}>📜 Recent Actions</div>
              {data.recentActions.map((row, i) => (
                <ActionFeedItem key={row.id || i} row={row} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Overview ────────────────────────────────────────────────────────────── */

function Overview({ agentId, period, metrics, sessions, loading, sectionSummaries, sectionSummaryLoading, onSectionClick }) {
  const [sessionsExpanded, setSessionsExpanded] = useState(false);
  const s = metrics?.summary || {};

  return (
    <div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px,100%),1fr))', gap: 'var(--space-3)' }}>
            {[1,2,3,4].map(i => <Skeleton key={i} h={80} />)}
          </div>
          <Skeleton h={160} />
        </div>
      ) : metrics && (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <KpiCard icon="⚡" label="Total Actions" value={s.totalActions} sub={PERIOD_OPTIONS.find(p => p.key === period)?.label} />
            <KpiCard icon="⏱️" label="Session Hours" value={s.totalSessionHours} sub={s.avgSessionMinutes ? `avg ${s.avgSessionMinutes}m` : null} />
            <KpiCard icon="🔑" label="Logins" value={s.totalLogins} sub={s.lastLoginAt ? fmtTimeAgo(s.lastLoginAt) : null} />
            <KpiCard icon="🏡" label="Properties" value={s.totalPropertiesAssigned} sub={`${s.activeListings || 0} active`} />
            <KpiCard icon="👤" label="Clients" value={s.totalClientsAssigned} />
            <KpiCard icon="💶" label="Revenue" value={s.totalRevenue != null ? `€${Number(s.totalRevenue).toLocaleString()}` : '€0'} />
          </div>

          {/* Activity chart */}
          {metrics.timeline && metrics.timeline.length > 0 && (
            <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
              <div style={sectionTitle}>📅 Daily Activity (last 14 days)</div>
              <BarChart data={(metrics.timeline || []).slice(-14)} labelKey="date" valueKey="count" />
            </div>
          )}

          {/* Section cards grid */}
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div style={sectionTitle}>Sections — Click to Drill Down</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            {SECTIONS.map(sec => (
              <SectionCard
                key={sec.key}
                section={sec}
                summaryData={sectionSummaries[sec.key]}
                loading={sectionSummaryLoading}
                onClick={() => onSectionClick(sec)}
              />
            ))}
          </div>

          {/* Session history (collapsible) */}
          <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
            <div
              onClick={() => setSessionsExpanded(e => !e)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={sectionTitle}>🔑 Session History</div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{sessionsExpanded ? '▲ Collapse' : '▼ Expand'}</span>
            </div>
            {sessionsExpanded && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px,100%),1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
                  {[
                    { label: 'Total Logins', value: s.totalLogins || 0 },
                    { label: 'Session Hours', value: `${s.totalSessionHours || 0}h` },
                    { label: 'Avg Session', value: `${s.avgSessionMinutes || 0}m` },
                    { label: 'Last Login', value: s.lastLoginAt ? fmtTimeAgo(s.lastLoginAt) : '—' },
                  ].map(({ label, value }, i) => (
                    <div key={i} style={glassCard}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{label}</div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-accent-gold)' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {sessions?.sessions?.length > 0 && (
                  <div>
                    {sessions.sessions.slice(0, 15).map((sess, i) => <SessionCard key={i} sess={sess} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Global style injection ──────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @keyframes amp-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

/* ── Main component ──────────────────────────────────────────────────────── */

/**
 * AgentMetricsPanel — section-based drill-down analytics dashboard.
 *
 * @param {string} agentId         - UUID of the agent.
 * @param {string} [initialPeriod] - Default period ('month').
 */
function AgentMetricsPanel({ agentId, initialPeriod = 'month' }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [view, setView] = useState('overview'); // 'overview' | 'section'
  const [activeSection, setActiveSection] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sectionSummaries, setSectionSummaries] = useState({});
  const [sectionSummaryLoading, setSectionSummaryLoading] = useState(false);
  const { showError } = useToast();

  // Load overview metrics + sessions
  const loadOverview = useCallback(() => {
    if (!agentId) return;
    setLoading(true);
    Promise.all([
      api.get(`/agents/${agentId}/metrics`, { params: { period } }),
      api.get(`/agents/${agentId}/metrics/sessions`, { params: { period } }),
    ])
      .then(([mRes, sRes]) => {
        setMetrics(mRes.data);
        setSessions(sRes.data);
      })
      .catch(err => showError(err.response?.data?.error || 'Failed to load metrics'))
      .finally(() => setLoading(false));
  }, [agentId, period, showError]);

  // Lazily pre-fetch section summaries so section cards show counts
  const loadSectionSummaries = useCallback(() => {
    if (!agentId) return;
    setSectionSummaryLoading(true);
    const requests = SECTIONS.map(sec =>
      api.get(`/agents/${agentId}/metrics/section/${sec.key}`, { params: { period } })
        .then(r => ({ key: sec.key, data: r.data }))
        .catch(() => ({ key: sec.key, data: null }))
    );
    Promise.all(requests).then(results => {
      const map = {};
      for (const r of results) map[r.key] = r.data;
      setSectionSummaries(map);
      setSectionSummaryLoading(false);
    });
  }, [agentId, period]);

  useEffect(() => {
    loadOverview();
    loadSectionSummaries();
  }, [loadOverview, loadSectionSummaries]);

  const handleSectionClick = useCallback((section) => {
    setActiveSection(section);
    setView('section');
  }, []);

  const handleBack = useCallback(() => {
    setView('overview');
    setActiveSection(null);
  }, []);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    if (view === 'section') setView('overview'); // return to overview on period change
    setActiveSection(null);
  };

  return (
    <div>
      <style>{GLOBAL_STYLES}</style>

      {/* Period selector + refresh */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        {PERIOD_OPTIONS.map(o => (
          <button key={o.key} onClick={() => handlePeriodChange(o.key)} aria-pressed={period === o.key} style={pill(period === o.key)}>
            {o.label}
          </button>
        ))}
        <button
          onClick={() => { loadOverview(); loadSectionSummaries(); }}
          style={{ ...pill(false), marginLeft: 'auto' }}
          title="Refresh metrics"
        >
          🔄 Refresh
        </button>
      </div>

      {view === 'overview' && (
        <Overview
          agentId={agentId}
          period={period}
          metrics={metrics}
          sessions={sessions}
          loading={loading}
          sectionSummaries={sectionSummaries}
          sectionSummaryLoading={sectionSummaryLoading}
          onSectionClick={handleSectionClick}
        />
      )}

      {view === 'section' && activeSection && (
        <SectionDrillDown
          agentId={agentId}
          section={activeSection}
          period={period}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

export default AgentMetricsPanel;
