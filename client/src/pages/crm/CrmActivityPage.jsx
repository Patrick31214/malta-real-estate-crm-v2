import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
  create:        { icon: '➕', label: 'Create',        color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  update:        { icon: '✏️', label: 'Update',        color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  delete:        { icon: '🗑️', label: 'Delete',        color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  view:          { icon: '👁️', label: 'View',          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  login:         { icon: '🔐', label: 'Login',         color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  logout:        { icon: '🚪', label: 'Logout',        color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  export:        { icon: '📤', label: 'Export',        color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  import:        { icon: '📥', label: 'Import',        color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  approve:       { icon: '✅', label: 'Approve',       color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  reject:        { icon: '❌', label: 'Reject',        color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  assign:        { icon: '👤', label: 'Assign',        color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  status_change: { icon: '🔄', label: 'Status Change', color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  upload:        { icon: '⬆️', label: 'Upload',        color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  download:      { icon: '⬇️', label: 'Download',      color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  share:         { icon: '🔗', label: 'Share',         color: '#e879f9', bg: 'rgba(232,121,249,0.12)' },
  comment:       { icon: '💬', label: 'Comment',       color: '#a3e635', bg: 'rgba(163,230,53,0.12)' },
};

const ENTITY_ICON = {
  property:     '🏠',
  client:       '👥',
  owner:        '🏢',
  inquiry:      '📩',
  user:         '🧑‍💼',
  branch:       '🏛️',
  document:     '📄',
  event:        '📅',
  service:      '🛠️',
  announcement: '📢',
  settings:     '⚙️',
};

const SEVERITY_CONFIG = {
  info:     { color: '#60a5fa', label: 'Info',     dot: '#3b82f6' },
  warning:  { color: '#fbbf24', label: 'Warning',  dot: '#f59e0b' },
  critical: { color: '#f87171', label: 'Critical', dot: '#ef4444' },
};

const ACTIONS = [
  'create','update','delete','view','login','logout',
  'export','import','approve','reject','assign','status_change',
  'upload','download','share','comment',
];
const ENTITY_TYPES = [
  'property','client','owner','inquiry','user','branch',
  'document','event','service','announcement','settings',
];
const SEVERITIES = ['info','warning','critical'];

// ─── Styles ───────────────────────────────────────────────────────────────────

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

const btnActive = {
  ...btnGhost,
  background: 'rgba(212,175,55,0.15)',
  color: 'var(--color-accent-gold)',
  border: '1px solid rgba(212,175,55,0.4)',
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function absoluteTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function groupByDate(logs) {
  const groups = {};
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  for (const log of logs) {
    const d = new Date(log.createdAt); d.setHours(0,0,0,0);
    let key;
    if (d.getTime() === today.getTime())         key = 'Today';
    else if (d.getTime() === yesterday.getTime()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }
  return groups;
}

function userInitials(u) {
  if (!u) return '?';
  return `${(u.firstName||'')[0]||''}${(u.lastName||'')[0]||''}`.toUpperCase();
}
function userName(u) {
  if (!u) return 'Unknown';
  return `${u.firstName||''} ${u.lastName||''}`.trim() || u.email || 'Unknown';
}

function exportCSV(filename, logs) {
  const hdrs = ['Time','User','Action','Entity Type','Entity Name','Description','Severity','IP'];
  const rows = logs.map(l => [
    absoluteTime(l.createdAt), userName(l.user), l.action,
    l.entityType||'', l.entityName||'', l.description||'',
    l.severity||'info', l.ipAddress||'',
  ]);
  const lines = [hdrs.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color='var(--color-accent-gold)', sub }) {
  return (
    <div style={{ ...glass, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 160px', minWidth: 0 }}>
      <div style={{ fontSize: '1.6rem' }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</div>}
    </div>
  );
}

function UserAvatar({ user, size=32 }) {
  if (user?.profileImage) {
    return <img src={user.profileImage} alt={userName(user)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size*0.35, fontWeight: 700, color: 'var(--color-accent-gold)', flexShrink: 0 }}>
      {userInitials(user)}
    </div>
  );
}

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || { icon: '•', label: action, color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function EntityBadge({ entityType }) {
  if (!entityType) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
      {ENTITY_ICON[entityType] || '📁'} {entityType}
    </span>
  );
}

function SeverityDot({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  return <span title={cfg.label} style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />;
}

function TimelineEntry({ log, onUserClick, onEntityClick }) {
  const [hovered, setHovered] = useState(false);
  const cfg = ACTION_CONFIG[log.action] || { icon: '•', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
  const isCrit = log.severity === 'critical';

  return (
    <div
      style={{ display: 'flex', gap: 12, padding: '10px 0', borderLeft: isCrit ? '2px solid rgba(239,68,68,0.5)' : undefined, paddingLeft: isCrit ? 12 : 0, background: isCrit ? 'rgba(239,68,68,0.03)' : undefined, borderRadius: isCrit ? 8 : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, zIndex: 1 }}>
          {cfg.icon}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <button onClick={() => log.user && onUserClick(log.user)} style={{ background: 'none', border: 'none', cursor: log.user ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
            <UserAvatar user={log.user} size={20} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: log.user ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{userName(log.user)}</span>
          </button>
          <ActionBadge action={log.action} />
          {log.entityType && <EntityBadge entityType={log.entityType} />}
          <SeverityDot severity={log.severity} />
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          {log.description || `${log.action} on ${log.entityType || 'resource'}`}
          {log.entityName && (
            <button onClick={() => log.entityType && log.entityId && onEntityClick(log.entityType, log.entityId, log.entityName)} style={{ background: 'none', border: 'none', cursor: log.entityId ? 'pointer' : 'default', color: 'var(--color-accent-gold)', fontWeight: 600, padding: '0 0 0 4px', fontSize: 'inherit' }}>
              {log.entityName}
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }} title={absoluteTime(log.createdAt)}>
          {hovered ? absoluteTime(log.createdAt) : relativeTime(log.createdAt)}
          {log.ipAddress && <span style={{ marginLeft: 8 }}>· {log.ipAddress}</span>}
        </div>
      </div>
    </div>
  );
}

function TableRow({ log, onUserClick, onEntityClick }) {
  const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }} title={absoluteTime(log.createdAt)}>{relativeTime(log.createdAt)}</td>
      <td style={{ padding: '10px 12px' }}>
        <button onClick={() => log.user && onUserClick(log.user)} style={{ background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:0 }}>
          <UserAvatar user={log.user} size={22} />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{userName(log.user)}</span>
        </button>
      </td>
      <td style={{ padding: '10px 12px' }}><ActionBadge action={log.action} /></td>
      <td style={{ padding: '10px 12px' }}><EntityBadge entityType={log.entityType} /></td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 300 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {log.description}
          {log.entityName && <span style={{ color: 'var(--color-accent-gold)', fontWeight: 600, marginLeft: 4 }}>{log.entityName}</span>}
        </div>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,color:sev.color }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:sev.dot,display:'inline-block' }} />
          {sev.label}
        </span>
      </td>
    </tr>
  );
}

function UserDrilldown({ user, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get(`/activity/user/${user.id}`)
      .then(r => setData(r.data))
      .catch(e => showError(e.response?.data?.error || 'Failed to load user activity'))
      .finally(() => setLoading(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ ...glass,width:'100%',maxWidth:480,height:'100vh',overflowY:'auto',padding:24,borderRadius:'16px 0 0 16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <UserAvatar user={user} size={40} />
            <div>
              <div style={{ fontWeight:700,color:'var(--color-text-primary)' }}>{userName(user)}</div>
              <div style={{ fontSize:12,color:'var(--color-text-muted)' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ ...btnGhost,padding:'6px 12px' }}>✕</button>
        </div>
        {loading ? (
          <div style={{ color:'var(--color-text-muted)',textAlign:'center',padding:40 }}>Loading…</div>
        ) : data ? (
          <>
            <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap' }}>
              {[
                { label:'Today',     v: data.stats?.todayCount    ?? 0 },
                { label:'This Week', v: data.stats?.weekCount     ?? 0 },
                { label:'Critical',  v: data.stats?.criticalCount ?? 0, color:'#f87171' },
                { label:'Total',     v: data.stats?.total         ?? 0 },
              ].map(s => (
                <div key={s.label} style={{ ...glass,padding:'10px 16px',flex:'1 1 90px',textAlign:'center' }}>
                  <div style={{ fontSize:20,fontWeight:800,color:s.color||'var(--color-accent-gold)' }}>{s.v}</div>
                  <div style={{ fontSize:11,color:'var(--color-text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
              {(data.logs||[]).map(log => (
                <div key={log.id} style={{ padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                    <ActionBadge action={log.action} />
                    {log.entityType && <EntityBadge entityType={log.entityType} />}
                    <SeverityDot severity={log.severity} />
                  </div>
                  <div style={{ fontSize:12,color:'var(--color-text-secondary)' }}>{log.description}</div>
                  <div style={{ fontSize:11,color:'var(--color-text-muted)',marginTop:2 }}>{relativeTime(log.createdAt)}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function EntityDrilldown({ entityType, entityId, entityName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    if (!entityType || !entityId) return;
    setLoading(true);
    api.get(`/activity/entity/${entityType}/${entityId}`)
      .then(r => setData(r.data))
      .catch(e => showError(e.response?.data?.error || 'Failed to load entity activity'))
      .finally(() => setLoading(false));
  }, [entityType, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ ...glass,width:'100%',maxWidth:480,height:'100vh',overflowY:'auto',padding:24,borderRadius:'16px 0 0 16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:700,color:'var(--color-text-primary)',display:'flex',alignItems:'center',gap:8 }}>
              {ENTITY_ICON[entityType]||'📁'} {entityName}
            </div>
            <div style={{ fontSize:12,color:'var(--color-text-muted)' }}>{entityType} · full change history</div>
          </div>
          <button onClick={onClose} style={{ ...btnGhost,padding:'6px 12px' }}>✕</button>
        </div>
        {loading ? (
          <div style={{ color:'var(--color-text-muted)',textAlign:'center',padding:40 }}>Loading…</div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
            {(data?.logs||[]).length === 0 && <div style={{ color:'var(--color-text-muted)',textAlign:'center',padding:40 }}>No activity found</div>}
            {(data?.logs||[]).map(log => (
              <div key={log.id} style={{ padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                  <UserAvatar user={log.user} size={18} />
                  <span style={{ fontSize:12,color:'var(--color-text-secondary)',fontWeight:600 }}>{userName(log.user)}</span>
                  <ActionBadge action={log.action} />
                  <SeverityDot severity={log.severity} />
                </div>
                <div style={{ fontSize:12,color:'var(--color-text-secondary)' }}>{log.description}</div>
                <div style={{ fontSize:11,color:'var(--color-text-muted)',marginTop:2 }}>{absoluteTime(log.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CrmActivityPage() {
  const { user } = useAuth();
  const { showError } = useToast();
  usePageTimeTracker('activity_log', { entityType: 'activity' });

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const [logs, setLogs]             = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [statsLoad, setStatsLoad]   = useState(true);
  const [viewMode, setViewMode]     = useState('timeline');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [newCount, setNewCount]     = useState(0);
  const lastTopId                   = useRef(null);

  const [filterAction, setFilterAction]         = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterUserId, setFilterUserId]         = useState('');
  const [filterSeverity, setFilterSeverity]     = useState('');
  const [filterDateFrom, setFilterDateFrom]     = useState('');
  const [filterDateTo, setFilterDateTo]         = useState('');
  const [search, setSearch]                     = useState('');
  const [searchInput, setSearchInput]           = useState('');

  const [userPanel, setUserPanel]     = useState(null);
  const [entityPanel, setEntityPanel] = useState(null);
  const [users, setUsers]             = useState([]);

  const fetchLogs = useCallback(async (pg = 1, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 50 });
      if (filterAction)     params.set('action',     filterAction);
      if (filterEntityType) params.set('entityType', filterEntityType);
      if (filterUserId)     params.set('userId',     filterUserId);
      if (filterSeverity)   params.set('severity',   filterSeverity);
      if (filterDateFrom)   params.set('dateFrom',   filterDateFrom);
      if (filterDateTo)     params.set('dateTo',     filterDateTo);
      if (search)           params.set('search',     search);

      const { data } = await api.get(`/activity?${params}`);
      setLogs(prev => {
        const next = reset || pg === 1 ? data.logs : [...prev, ...data.logs];
        if (next.length > 0 && (!lastTopId.current || reset)) lastTopId.current = next[0].id;
        return next;
      });
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterEntityType, filterUserId, filterSeverity, filterDateFrom, filterDateTo, search, showError]);

  const fetchStats = useCallback(async () => {
    if (!isAdminOrManager) return;
    setStatsLoad(true);
    try {
      const { data } = await api.get('/activity/stats');
      setStats(data);
    } catch {
      // supplementary — fail silently
    } finally {
      setStatsLoad(false);
    }
  }, [isAdminOrManager]);

  const fetchUsers = useCallback(async () => {
    if (!isAdminOrManager) return;
    try {
      const { data } = await api.get('/users');
      setUsers(data.users || data || []);
    } catch {
      // non-critical
    }
  }, [isAdminOrManager]);

  const pollNew = useCallback(async () => {
    if (!lastTopId.current) return;
    try {
      const { data } = await api.get('/activity?page=1&limit=1');
      if (data.logs?.length > 0 && data.logs[0].id !== lastTopId.current) {
        setNewCount(c => c + 1);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchLogs(1, true); fetchStats(); fetchUsers(); }, [fetchLogs, fetchStats, fetchUsers]);

  useEffect(() => {
    const t = setInterval(pollNew, 30000);
    return () => clearInterval(t);
  }, [pollNew]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  const handleClearFilters = () => {
    setFilterAction(''); setFilterEntityType(''); setFilterUserId('');
    setFilterSeverity(''); setFilterDateFrom(''); setFilterDateTo('');
    setSearch(''); setSearchInput('');
  };

  const handleRefresh = () => {
    setNewCount(0);
    lastTopId.current = null;
    fetchLogs(1, true);
    fetchStats();
  };

  const mostActiveUser = stats?.mostActiveUsers?.[0];
  const grouped = groupByDate(logs);

  const hasFilters = filterAction || filterEntityType || filterUserId || filterSeverity || filterDateFrom || filterDateTo || search;

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0,fontSize:'var(--text-2xl)',fontWeight:800,color:'var(--color-text-primary)',fontFamily:'var(--font-heading)',display:'flex',alignItems:'center',gap:10 }}>
            🕐 Activity Log
          </h1>
          <p style={{ margin:'4px 0 0',color:'var(--color-text-secondary)',fontSize:'var(--text-sm)' }}>
            Complete audit trail of all CRM actions
          </p>
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <button style={viewMode==='timeline' ? btnActive : btnGhost} onClick={() => setViewMode('timeline')}>⏱ Timeline</button>
          <button style={viewMode==='table' ? btnActive : btnGhost} onClick={() => setViewMode('table')}>📋 Table</button>
          {viewMode==='table' && (
            <button style={btnGold} onClick={() => exportCSV(`activity-log-${new Date().toISOString().slice(0,10)}.csv`, logs)}>
              ⬇ Export CSV
            </button>
          )}
          <button style={btnGhost} onClick={handleRefresh} title="Refresh">🔄</button>
        </div>
      </div>

      {/* New activities banner */}
      {newCount > 0 && (
        <div onClick={handleRefresh} style={{ ...glass,padding:'10px 20px',marginBottom:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,borderColor:'rgba(212,175,55,0.4)',background:'rgba(212,175,55,0.08)' }}>
          <span style={{ color:'var(--color-accent-gold)',fontWeight:700 }}>⬆ New activities available — click to refresh</span>
        </div>
      )}

      {/* Stats bar */}
      {isAdminOrManager && (
        <div style={{ display:'flex',gap:16,marginBottom:24,flexWrap:'wrap' }}>
          <StatCard icon="⚡" label="Actions Today"     value={statsLoad ? '…' : (stats?.todayCount ?? 0)} />
          <StatCard icon="📅" label="Actions This Week" value={statsLoad ? '…' : (stats?.weekCount  ?? 0)} color="#60a5fa" />
          <StatCard
            icon="🏆"
            label="Most Active User"
            value={mostActiveUser ? userName(mostActiveUser.user) : (statsLoad ? '…' : '—')}
            color="#4ade80"
            sub={mostActiveUser ? `${mostActiveUser.count} actions (30d)` : undefined}
          />
          <StatCard icon="🚨" label="Critical Actions" value={statsLoad ? '…' : (stats?.criticalCount ?? 0)} color="#f87171" />
        </div>
      )}

      {/* Filters */}
      <div style={{ ...glass,padding:'16px 20px',marginBottom:20 }}>
        <div style={{ display:'flex',gap:10,flexWrap:'wrap',alignItems:'center' }}>
          <form onSubmit={handleSearch} style={{ display:'flex',gap:6 }}>
            <input
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search descriptions…"
              style={{ padding:'7px 12px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'var(--color-text-primary)',fontSize:'var(--text-sm)',width:200 }}
            />
            <button type="submit" style={btnGold}>🔍</button>
          </form>

          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ padding:'7px 10px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'var(--color-text-secondary)',fontSize:'var(--text-sm)' }}>
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{ACTION_CONFIG[a]?.label||a}</option>)}
          </select>

          <select value={filterEntityType} onChange={e => setFilterEntityType(e.target.value)} style={{ padding:'7px 10px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'var(--color-text-secondary)',fontSize:'var(--text-sm)' }}>
            <option value="">All Entities</option>
            {ENTITY_TYPES.map(t => <option key={t} value={t}>{ENTITY_ICON[t]} {t}</option>)}
          </select>

          {isAdminOrManager && (
            <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)} style={{ padding:'7px 10px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'var(--color-text-secondary)',fontSize:'var(--text-sm)' }}>
              <option value="">All Users</option>
              {users.map(u => <option key={u.id} value={u.id}>{userName(u)}</option>)}
            </select>
          )}

          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ padding:'7px 10px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'var(--color-text-secondary)',fontSize:'var(--text-sm)' }}>
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
          </select>

          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ padding:'7px 10px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'var(--color-text-secondary)',fontSize:'var(--text-sm)' }} />
          <span style={{ color:'var(--color-text-muted)',fontSize:12 }}>to</span>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ padding:'7px 10px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'var(--color-text-secondary)',fontSize:'var(--text-sm)' }} />

          {hasFilters && <button onClick={handleClearFilters} style={btnGhost}>✕ Clear</button>}
        </div>
        {total > 0 && <div style={{ marginTop:10,fontSize:12,color:'var(--color-text-muted)' }}>Showing {logs.length.toLocaleString()} of {total.toLocaleString()} activities</div>}
      </div>

      {/* Content */}
      {loading && logs.length === 0 ? (
        <div style={{ textAlign:'center',padding:60,color:'var(--color-text-muted)' }}>Loading activity log…</div>
      ) : logs.length === 0 ? (
        <div style={{ ...glass,padding:'60px 24px',textAlign:'center' }}>
          <div style={{ fontSize:'3rem',marginBottom:12 }}>🕐</div>
          <div style={{ color:'var(--color-text-muted)',fontSize:'var(--text-sm)' }}>No activity found matching your filters.</div>
          <button onClick={handleClearFilters} style={{ ...btnGhost,marginTop:16 }}>Clear filters</button>
        </div>
      ) : viewMode === 'timeline' ? (

        <div style={{ ...glass,padding:'20px 24px' }}>
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date} style={{ marginBottom:24 }}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'var(--color-accent-gold)',letterSpacing:1,textTransform:'uppercase',whiteSpace:'nowrap' }}>{date}</div>
                <div style={{ flex:1,height:1,background:'rgba(212,175,55,0.15)' }} />
                <div style={{ fontSize:11,color:'var(--color-text-muted)' }}>{entries.length} activities</div>
              </div>
              <div style={{ position:'relative',paddingLeft:16 }}>
                <div style={{ position:'absolute',left:15,top:8,bottom:8,width:1,background:'rgba(212,175,55,0.12)' }} />
                <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                  {entries.map(log => (
                    <TimelineEntry
                      key={log.id}
                      log={log}
                      onUserClick={setUserPanel}
                      onEntityClick={(et, eid, en) => setEntityPanel({ entityType:et, entityId:eid, entityName:en })}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
          {page < totalPages && (
            <div style={{ textAlign:'center',marginTop:16 }}>
              <button onClick={() => fetchLogs(page+1, false)} style={btnGhost} disabled={loading}>
                {loading ? 'Loading…' : `Load more (${total - logs.length} remaining)`}
              </button>
            </div>
          )}
        </div>

      ) : (

        <div style={{ ...glass,overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(212,175,55,0.15)' }}>
                  {['Time','User','Action','Entity','Description','Severity'].map(h => (
                    <th key={h} style={{ padding:'12px',textAlign:'left',fontSize:11,fontWeight:700,color:'var(--color-text-muted)',textTransform:'uppercase',letterSpacing:1,whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <TableRow
                    key={log.id}
                    log={log}
                    onUserClick={setUserPanel}
                    onEntityClick={(et, eid, en) => setEntityPanel({ entityType:et, entityId:eid, entityName:en })}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {page < totalPages && (
            <div style={{ textAlign:'center',padding:'16px 24px' }}>
              <button onClick={() => fetchLogs(page+1, false)} style={btnGhost} disabled={loading}>
                {loading ? 'Loading…' : `Load more (${total - logs.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drilldown panels */}
      {userPanel && <UserDrilldown user={userPanel} onClose={() => setUserPanel(null)} />}
      {entityPanel && (
        <EntityDrilldown
          entityType={entityPanel.entityType}
          entityId={entityPanel.entityId}
          entityName={entityPanel.entityName}
          onClose={() => setEntityPanel(null)}
        />
      )}
    </div>
  );
}
