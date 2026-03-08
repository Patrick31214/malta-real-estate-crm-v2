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

const ACTIVITY_LABELS = {
  login: '🔑 Logged in',
  logout: '🚪 Logged out',
  session_end: '⏹ Session ended',
  session_heartbeat: '💓 Heartbeat',
  password_change: '🔒 Changed password',
  client_list: '📋 Viewed clients list',
  client_view: '👤 Viewed client',
  client_create: '➕ Created client',
  client_update: '✏️ Updated client',
  client_delete: '🗑️ Deleted client',
  client_match_view: '🔍 Viewed client matches',
  client_match_recalc: '🔄 Recalculated matches',
  owner_list: '📋 Viewed owners list',
  owner_view: '🏢 Viewed owner',
  owner_create: '➕ Created owner',
  owner_update: '✏️ Updated owner',
  owner_delete: '🗑️ Deleted owner',
  owner_contact_add: '➕ Added owner contact',
  owner_contact_edit: '✏️ Edited owner contact',
  property_list: '📋 Viewed properties list',
  property_view: '🏠 Viewed property',
  property_create: '➕ Created property',
  property_update: '✏️ Updated property',
  property_delete: '🗑️ Deleted property',
  property_feature: '⭐ Toggled featured',
  property_status_change: '🔄 Changed property status',
  property_image_upload: '🖼️ Uploaded images',
  property_share: '🔗 Shared property',
  inquiry_list: '📋 Viewed inquiries list',
  inquiry_view: '📧 Viewed inquiry',
  inquiry_create: '➕ Created inquiry',
  inquiry_assign: '👤 Assigned inquiry',
  inquiry_resolve: '✅ Resolved inquiry',
  inquiry_status_change: '🔄 Changed inquiry status',
  inquiry_delete: '🗑️ Deleted inquiry',
  document_upload: '📎 Uploaded document',
  document_view: '👁️ Viewed document',
  document_delete: '🗑️ Deleted document',
  chat_message_send: '💬 Sent message',
  chat_channel_view: '💬 Viewed chat channel',
  chat_channel_create: '➕ Created chat channel',
  announcement_view: '📢 Viewed announcement',
  announcement_create: '➕ Created announcement',
  announcement_read: '✓ Marked announcement read',
  branch_view: '🏢 Viewed branch',
  branch_create: '➕ Created branch',
  branch_update: '✏️ Updated branch',
  agent_list: '👥 Viewed agents list',
  agent_view: '👤 Viewed agent',
  agent_create: '➕ Created agent',
  agent_update: '✏️ Updated agent',
  agent_delete: '🗑️ Deleted agent',
  agent_block: '🚫 Blocked agent',
  agent_unblock: '✅ Unblocked agent',
  notification_view: '🔔 Viewed notifications',
  notification_read: '✓ Read notification',
  notification_read_all: '✓ Marked all notifications read',
  page_view: '🌐 Page view',
};

/* ── Style helpers ──────────────────────────────────────────────────────────── */

const sectionTitle = {
  fontSize: 'var(--text-base)',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-3)',
  marginTop: 0,
  fontFamily: 'var(--font-heading)',
};

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function StatCard({ label, value, icon, tooltip }) {
  return (
    <div
      className="glass"
      title={tooltip}
      style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-accent-gold)', lineHeight: 1 }}>{value ?? 0}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light, rgba(255,255,255,0.06))' }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0, marginRight: 'var(--space-4)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
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
          <div style={{ width: 56, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[labelKey]}</div>
          <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(d[valueKey] / max) * 100}%`, height: '100%', background: color, borderRadius: 4, minWidth: d[valueKey] > 0 ? 4 : 0, transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ width: 32, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityFeedRow({ row }) {
  const label = ACTIVITY_LABELS[row.metricType] || row.metricType;
  const time = new Date(row.createdAt).toLocaleString();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      padding: 'var(--space-2) 0',
      borderBottom: '1px solid var(--color-border-light, rgba(255,255,255,0.06))',
    }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{time}</span>
    </div>
  );
}

function SectionCard({ title, children, style }) {
  return (
    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', ...style }}>
      <h4 style={{ ...sectionTitle, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{title}</h4>
      {children}
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
  const [period, setPeriod]           = useState(initialPeriod);
  const [metrics, setMetrics]         = useState(null);
  const [activityLog, setActivityLog] = useState(null);
  const [sessions, setSessions]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [logPage, setLogPage]         = useState(1);
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

  return (
    <div>
      {/* ── Period selector ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {PERIOD_OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => { setPeriod(o.key); setLogPage(1); }}
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
        <button
          onClick={loadMetrics}
          style={{
            padding: '5px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            marginLeft: 'auto',
          }}
          title="Refresh metrics"
        >
          🔄 Refresh
        </button>
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
          {/* ── Portfolio stat cards ───────────────────────────────────────── */}
          <h4 style={{ ...sectionTitle, marginBottom: 'var(--space-3)' }}>📊 Portfolio Overview</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <StatCard icon="🏡" label="Properties Assigned" value={s.totalPropertiesAssigned} tooltip="Total properties assigned to this agent (all time)" />
            <StatCard icon="📋" label="Active Listings"     value={s.activeListings}          tooltip="Properties currently listed for sale/rent" />
            <StatCard icon="👤" label="Clients Assigned"    value={s.totalClientsAssigned}    tooltip="Total clients assigned to this agent (all time)" />
            <StatCard icon="💶" label="Revenue (EUR)"       value={s.totalRevenue != null ? `€${s.totalRevenue.toLocaleString()}` : 0} tooltip="Combined value of sold/rented EUR properties" />
          </div>

          {/* ── Activity summary cards ─────────────────────────────────────── */}
          <h4 style={{ ...sectionTitle, marginBottom: 'var(--space-3)' }}>⚡ Activity Summary ({PERIOD_OPTIONS.find(p => p.key === period)?.label})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <StatCard icon="🔑" label="Logins"          value={s.totalLogins}         tooltip="Number of times the agent logged in" />
            <StatCard icon="⏱️" label="Session Hours"   value={s.totalSessionHours}   tooltip="Total hours in active sessions" />
            <StatCard icon="⚡" label="Total Actions"   value={s.totalActions}         tooltip="All tracked actions in this period" />
            <StatCard icon="🌐" label="Page Views"      value={s.pageViews}            tooltip="Frontend page navigations" />
            <StatCard icon="👥" label="Clients Created" value={s.clientsCreated}       tooltip="New client records created" />
            <StatCard icon="👀" label="Clients Viewed"  value={s.clientsViewed}        tooltip="Client detail pages opened" />
            <StatCard icon="🏠" label="Props Created"   value={s.propertiesCreated}    tooltip="New properties listed" />
            <StatCard icon="👁️" label="Props Viewed"   value={s.propertiesViewed}     tooltip="Property detail pages opened" />
            <StatCard icon="✏️" label="Props Updated"   value={s.propertiesUpdated}    tooltip="Property records edited" />
            <StatCard icon="📧" label="Inquiries Resolved" value={s.inquiriesResolved} tooltip="Inquiries marked as resolved" />
            <StatCard icon="📎" label="Docs Uploaded"   value={s.documentsUploaded}    tooltip="Documents uploaded" />
            <StatCard icon="💬" label="Messages Sent"   value={s.chatMessagesSent}     tooltip="Chat messages sent" />
          </div>

          {/* ── Activity charts ─────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <SectionCard title="📅 Daily Activity (last 14 days)">
              <BarChart data={(metrics.timeline || []).slice(-14)} labelKey="date" valueKey="count" />
            </SectionCard>

            <SectionCard title="🕐 Activity by Hour">
              <BarChart data={metrics.activityByHour || []} labelKey="hour" valueKey="count" color="var(--color-info, #0dcaf0)" />
            </SectionCard>

            <SectionCard title="👥 Client Activity">
              <BarChart
                data={[
                  { label: 'List',    count: s.clientsListed   || 0 },
                  { label: 'View',    count: s.clientsViewed   || 0 },
                  { label: 'Create',  count: s.clientsCreated  || 0 },
                  { label: 'Update',  count: s.clientsUpdated  || 0 },
                  { label: 'Delete',  count: s.clientsDeleted  || 0 },
                  { label: 'Matches', count: s.clientMatchViews || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-success, #28a745)"
              />
            </SectionCard>

            <SectionCard title="🏠 Property Activity">
              <BarChart
                data={[
                  { label: 'List',     count: s.propertiesListed      || 0 },
                  { label: 'View',     count: s.propertiesViewed      || 0 },
                  { label: 'Create',   count: s.propertiesCreated     || 0 },
                  { label: 'Update',   count: s.propertiesUpdated     || 0 },
                  { label: 'Delete',   count: s.propertiesDeleted     || 0 },
                  { label: 'Featured', count: s.propertiesFeatured    || 0 },
                  { label: 'Status ∆', count: s.propertyStatusChanges || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-warning, #ffc107)"
              />
            </SectionCard>

            <SectionCard title="🏢 Owner Activity">
              <BarChart
                data={[
                  { label: 'List',         count: s.ownersListed       || 0 },
                  { label: 'View',         count: s.ownersViewed       || 0 },
                  { label: 'Create',       count: s.ownersCreated      || 0 },
                  { label: 'Update',       count: s.ownersUpdated      || 0 },
                  { label: 'Delete',       count: s.ownersDeleted      || 0 },
                  { label: 'Contact +',    count: s.ownerContactsAdded || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-error, #dc3545)"
              />
            </SectionCard>

            <SectionCard title="📧 Inquiry Activity">
              <BarChart
                data={[
                  { label: 'List',     count: s.inquiriesListed   || 0 },
                  { label: 'View',     count: s.inquiriesViewed   || 0 },
                  { label: 'Create',   count: s.inquiriesCreated  || 0 },
                  { label: 'Assign',   count: s.inquiriesAssigned || 0 },
                  { label: 'Resolve',  count: s.inquiriesResolved || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-primary, #0d6efd)"
              />
            </SectionCard>

            <SectionCard title="📎 Document Activity">
              <BarChart
                data={[
                  { label: 'Upload', count: s.documentsUploaded || 0 },
                  { label: 'View',   count: s.documentsViewed   || 0 },
                  { label: 'Delete', count: s.documentsDeleted  || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-accent-gold)"
              />
            </SectionCard>

            <SectionCard title="💬 Chat Activity">
              <BarChart
                data={[
                  { label: 'Msgs Sent',  count: s.chatMessagesSent    || 0 },
                  { label: 'Channels',   count: s.chatChannelsViewed  || 0 },
                  { label: 'New Channel',count: s.chatChannelsCreated || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-success, #28a745)"
              />
            </SectionCard>

            <SectionCard title="📢 Announcement Activity">
              <BarChart
                data={[
                  { label: 'Viewed',  count: s.announcementsViewed  || 0 },
                  { label: 'Created', count: s.announcementsCreated || 0 },
                  { label: 'Read ✓',  count: s.announcementsRead    || 0 },
                ]}
                labelKey="label" valueKey="count" color="var(--color-info, #0dcaf0)"
              />
            </SectionCard>

            {metrics.activityByType && Object.keys(metrics.activityByType).length > 0 && (
              <SectionCard title="📊 Activity by Category">
                <BarChart
                  data={Object.entries(metrics.activityByType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, count]) => ({ label, count }))}
                  labelKey="label" valueKey="count" color="var(--color-accent-gold)"
                />
              </SectionCard>
            )}
          </div>

          {/* ── Session details ──────────────────────────────────────────────── */}
          <SectionCard title="🔑 Session Details" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 'var(--space-3)' }}>
              <DetailRow label="Total Logins"         value={s.totalLogins} />
              <DetailRow label="Avg Session Duration" value={s.avgSessionMinutes ? `${s.avgSessionMinutes} min` : null} />
              <DetailRow label="Total Session Hours"  value={s.totalSessionHours ? `${s.totalSessionHours}h` : null} />
              <DetailRow label="Last Login"           value={s.lastLoginAt  ? new Date(s.lastLoginAt).toLocaleString()  : null} />
              <DetailRow label="Last Logout"          value={s.lastLogoutAt ? new Date(s.lastLogoutAt).toLocaleString() : null} />
              <DetailRow label="Password Changes"     value={s.passwordChanges || null} />
            </div>

            {/* Session history table */}
            {sessions?.sessions?.length > 0 && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>RECENT SESSIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sessions.sessions.slice(0, 10).map((sess, i) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--color-border-light, rgba(255,255,255,0.04))' }}>
                      <span style={{ flexShrink: 0 }}>
                        {sess.loginAt ? new Date(sess.loginAt).toLocaleString() : '—'}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                      <span style={{ flexShrink: 0 }}>
                        {sess.endAt ? new Date(sess.endAt).toLocaleString() : 'active'}
                      </span>
                      {sess.duration != null && (
                        <span style={{ color: 'var(--color-accent-gold)', flexShrink: 0 }}>
                          {Math.round(sess.duration / 60)} min
                        </span>
                      )}
                      {sess.ipAddress && (
                        <span style={{ color: 'var(--color-text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
                          {sess.ipAddress}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Additional stats ─────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <SectionCard title="🏢 Branch & Agent Actions">
              <DetailRow label="Branches Viewed"  value={s.branchesViewed  || null} />
              <DetailRow label="Branches Created" value={s.branchesCreated || null} />
              <DetailRow label="Branches Updated" value={s.branchesUpdated || null} />
              <DetailRow label="Agents Viewed"    value={s.agentsViewed    || null} />
              <DetailRow label="Agents Listed"    value={s.agentsListed    || null} />
            </SectionCard>

            <SectionCard title="🔔 Notification Activity">
              <DetailRow label="Notifications Viewed" value={s.notificationsViewed || null} />
              <DetailRow label="Notifications Read"   value={s.notificationsRead   || null} />
            </SectionCard>
          </div>

          {/* ── Recent Activity Feed ─────────────────────────────────────────── */}
          <SectionCard title="📜 Recent Activity Feed">
            {activityLog?.rows?.length > 0 ? (
              <>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {activityLog.rows.map(row => (
                    <ActivityFeedRow key={row.id} row={row} />
                  ))}
                </div>
                {/* Pagination */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
                  <button
                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                    disabled={logPage <= 1}
                    style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', opacity: logPage <= 1 ? 0.4 : 1 }}
                  >
                    ‹ Prev
                  </button>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    Page {logPage} · {activityLog.total} total events
                  </span>
                  <button
                    onClick={() => setLogPage(p => p + 1)}
                    disabled={logPage * 30 >= activityLog.total}
                    style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', opacity: logPage * 30 >= activityLog.total ? 0.4 : 1 }}
                  >
                    Next ›
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No activity recorded in this period.</div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

export default AgentMetricsPanel;
