import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'directory',   label: '👥 Directory' },
  { key: 'leaderboard', label: '🏆 Leaderboard' },
  { key: 'org-chart',   label: '🌳 Org Chart' },
];

const PERIOD_OPTIONS = [
  { value: 'week',    label: 'This Week' },
  { value: 'month',   label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year',    label: 'This Year' },
];

const ROLE_CONFIG = {
  admin:   { color: '#f87171', bg: 'rgba(239,68,68,0.14)',  border: 'rgba(239,68,68,0.35)',  label: 'Admin'   },
  manager: { color: '#fbbf24', bg: 'rgba(234,179,8,0.14)',  border: 'rgba(234,179,8,0.35)',  label: 'Manager' },
  agent:   { color: '#60a5fa', bg: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.35)', label: 'Agent'   },
};

const SORT_OPTIONS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName',  label: 'Last Name'  },
  { value: 'role',      label: 'Role'       },
  { value: 'createdAt', label: 'Date Joined'},
];

const MEDAL = ['🥇', '🥈', '🥉'];

// ─── Style helpers ────────────────────────────────────────────────────────────

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(212,175,55,0.15)',
  borderRadius: '16px',
};

const lbl = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600,
  color: 'var(--color-text-secondary)', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 4,
};

const inp = {
  padding: '8px 12px', borderRadius: '8px',
  border: '1px solid rgba(212,175,55,0.2)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box',
};

const btnGold = {
  padding: '8px 18px', borderRadius: '8px',
  background: 'var(--color-accent-gold)', color: '#000',
  border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 700,
};

const btnGhost = {
  padding: '7px 14px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)',
  border: '1px solid rgba(212,175,55,0.2)', cursor: 'pointer', fontSize: 'var(--text-sm)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ member, size = 48 }) {
  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase();
  if (member.profileImage) {
    return (
      <img
        src={member.profileImage}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--color-accent-gold) 0%, #b8860b 100%)',
      color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.35, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.agent;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      padding: '2px 8px', borderRadius: '999px', fontSize: 11, fontWeight: 700,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function ActiveDot({ lastLoginAt }) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const isActive = lastLoginAt && new Date(lastLoginAt) >= oneDayAgo;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isActive ? '#4ade80' : '#6b7280',
        boxShadow: isActive ? '0 0 6px #4ade80' : 'none',
        display: 'inline-block',
      }} />
      <span style={{ fontSize: 11, color: isActive ? '#4ade80' : '#6b7280', fontWeight: 600 }}>
        {isActive ? 'Active' : 'Offline'}
      </span>
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = 'var(--color-accent-gold)' }) {
  return (
    <div style={{ ...glass, padding: '20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color, fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{sub}</div>}
    </div>
  );
}

// ─── Member Card (Grid) ───────────────────────────────────────────────────────

function MemberCard({ member, currentUserId, onMessage, onViewProfile }) {
  return (
    <div style={{
      ...glass,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,175,55,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar member={member} size={52} />
          {member.lastLoginAt && new Date(member.lastLoginAt) >= new Date(Date.now() - 24 * 60 * 60 * 1000) && (
            <span style={{
              position: 'absolute', bottom: 2, right: 2, width: 12, height: 12,
              borderRadius: '50%', background: '#4ade80', border: '2px solid #0a0a0a',
              boxShadow: '0 0 6px #4ade80',
            }} />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.firstName} {member.lastName}
            {member.id === currentUserId && (
              <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(212,175,55,0.2)', color: 'var(--color-accent-gold)', padding: '1px 6px', borderRadius: '999px', fontWeight: 700 }}>You</span>
            )}
          </div>
          {member.jobTitle && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.jobTitle}</div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <RoleBadge role={member.role} />
            <ActiveDot lastLoginAt={member.lastLoginAt} />
          </div>
        </div>
      </div>

      {/* Branch */}
      {member.Branch?.name && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          🏢 <span>{member.Branch.name}</span>
        </div>
      )}

      {/* Contact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {member.email && (
          <a href={`mailto:${member.email}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.target.style.color = 'var(--color-accent-gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--color-text-secondary)'}
          >
            ✉️ {member.email}
          </a>
        )}
        {member.phone && (
          <a href={`tel:${member.phone}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => e.target.style.color = 'var(--color-accent-gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--color-text-secondary)'}
          >
            📞 {member.phone}
          </a>
        )}
      </div>

      {/* Specializations */}
      {member.specializations?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {member.specializations.slice(0, 3).map(s => (
            <span key={s} style={{ fontSize: 10, background: 'rgba(212,175,55,0.1)', color: 'var(--color-accent-gold)', border: '1px solid rgba(212,175,55,0.2)', padding: '1px 7px', borderRadius: '999px', fontWeight: 600 }}>
              {s}
            </span>
          ))}
          {member.specializations.length > 3 && (
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>+{member.specializations.length - 3} more</span>
          )}
        </div>
      )}

      {/* Languages */}
      {member.languages?.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          🗣️ {member.languages.join(', ')}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {member.id !== currentUserId && (
          <button onClick={() => onMessage(member)} style={{ ...btnGhost, flex: 1, fontSize: 11, padding: '6px 10px' }}>
            💬 Message
          </button>
        )}
        <button onClick={() => onViewProfile(member)} style={{ ...btnGold, flex: 1, fontSize: 11, padding: '6px 10px' }}>
          View Profile
        </button>
      </div>
    </div>
  );
}

// ─── Member Row (List) ────────────────────────────────────────────────────────

function MemberRow({ member, currentUserId, onMessage, onViewProfile, isLast }) {
  return (
    <tr style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar member={member} size={34} />
            {member.lastLoginAt && new Date(member.lastLoginAt) >= new Date(Date.now() - 24 * 60 * 60 * 1000) && (
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#4ade80', border: '2px solid #0a0a0a' }} />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
              {member.firstName} {member.lastName}
              {member.id === currentUserId && (
                <span style={{ marginLeft: 6, fontSize: 9, background: 'rgba(212,175,55,0.2)', color: 'var(--color-accent-gold)', padding: '1px 5px', borderRadius: '999px', fontWeight: 700 }}>You</span>
              )}
            </div>
            {member.jobTitle && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{member.jobTitle}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}><RoleBadge role={member.role} /></td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{member.Branch?.name || '—'}</td>
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}><ActiveDot lastLoginAt={member.lastLoginAt} /></td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {member.email && <div><a href={`mailto:${member.email}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{member.email}</a></div>}
        {member.phone && <div>{member.phone}</div>}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {member.id !== currentUserId && (
            <button onClick={() => onMessage(member)} style={{ ...btnGhost, padding: '4px 10px', fontSize: 11 }}>💬</button>
          )}
          <button onClick={() => onViewProfile(member)} style={{ ...btnGold, padding: '4px 10px', fontSize: 11 }}>Profile</button>
        </div>
      </td>
    </tr>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function LeaderboardSection({ currentUserId }) {
  const [period, setPeriod] = useState('month');
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/team/leaderboard', { params: { period } });
      setBoard(Array.isArray(data) ? data : []);
    } catch {
      showError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [period, showError]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  const maxScore = board.length ? board[0].score : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PERIOD_OPTIONS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: '7px 16px', borderRadius: '999px', border: '1px solid',
              borderColor: period === p.value ? 'var(--color-accent-gold)' : 'rgba(212,175,55,0.2)',
              background: period === p.value ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: period === p.value ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontSize: 13, fontWeight: period === p.value ? 700 : 400,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Loading leaderboard…</div>
      ) : board.length === 0 ? (
        <div style={{ ...glass, padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏆</div>
          No performance data for this period
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {board.slice(0, 3).map((agent, i) => {
              const medalColors = [
                { bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.4)', text: '#ffd700' },
                { bg: 'rgba(192,192,192,0.12)', border: 'rgba(192,192,192,0.35)', text: '#c0c0c0' },
                { bg: 'rgba(205,127,50,0.12)', border: 'rgba(205,127,50,0.35)', text: '#cd7f32' },
              ];
              const mc = medalColors[i];
              return (
                <div key={agent.userId} style={{ ...glass, background: mc.bg, border: `1px solid ${mc.border}`, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', lineHeight: 1, marginBottom: 8 }}>{MEDAL[i]}</div>
                  <Avatar member={agent} size={48} />
                  <div style={{ marginTop: 8, fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>
                    {agent.firstName} {agent.lastName}
                    {agent.userId === currentUserId && <span style={{ marginLeft: 4, fontSize: 9, background: mc.bg, color: mc.text, padding: '1px 5px', borderRadius: '999px' }}>You</span>}
                  </div>
                  <RoleBadge role={agent.role} />
                  <div style={{ marginTop: 8, fontSize: 'var(--text-2xl)', fontWeight: 800, color: mc.text, fontFamily: 'var(--font-heading)' }}>
                    {agent.score}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>points</div>
                </div>
              );
            })}
          </div>

          {/* Full table */}
          <div style={{ ...glass, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                  {['Rank', 'Agent', 'Properties', 'Clients', 'Viewings', 'Actions', 'Score', 'Bar'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Bar' ? 'left' : 'left', fontSize: 10, fontWeight: 600, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.slice(0, 10).map((agent, i) => {
                  const isCurrentUser = agent.userId === currentUserId;
                  const barPct = maxScore > 0 ? (agent.score / maxScore) * 100 : 0;
                  const barColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--color-accent-gold)';
                  return (
                    <tr key={agent.userId} style={{
                      borderBottom: i < board.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isCurrentUser ? 'rgba(212,175,55,0.06)' : 'transparent',
                    }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: i < 3 ? [' #ffd700', '#c0c0c0', '#cd7f32'][i] : 'var(--color-text-muted)' }}>
                        {i < 3 ? MEDAL[i] : `#${i + 1}`}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar member={agent} size={28} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                              {agent.firstName} {agent.lastName}
                              {isCurrentUser && <span style={{ marginLeft: 4, fontSize: 9, background: 'rgba(212,175,55,0.2)', color: 'var(--color-accent-gold)', padding: '1px 5px', borderRadius: '999px' }}>You</span>}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{agent.branch || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'center', color: 'var(--color-text-secondary)' }}>{agent.propertiesAdded}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'center', color: 'var(--color-text-secondary)' }}>{agent.clientsManaged}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'center', color: 'var(--color-text-secondary)' }}>{agent.viewingsScheduled}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'center', color: 'var(--color-text-secondary)' }}>{agent.totalActions}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: barColor, whiteSpace: 'nowrap' }}>{agent.score}</td>
                      <td style={{ padding: '10px 14px', minWidth: 100 }}>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: 8, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '999px',
                            background: barColor,
                            width: `${barPct}%`,
                            transition: 'width 0.6s ease',
                            boxShadow: `0 0 8px ${barColor}66`,
                          }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Org Chart ────────────────────────────────────────────────────────────────

function OrgChartNode({ member, size = 40 }) {
  const cfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.agent;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ padding: '2px', borderRadius: '50%', border: `2px solid ${cfg.color}`, boxShadow: `0 0 8px ${cfg.color}44` }}>
        <Avatar member={member} size={size} />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 90 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{member.firstName} {member.lastName}</div>
        <RoleBadge role={member.role} />
      </div>
    </div>
  );
}

function BranchNode({ node }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Branch header */}
      <div style={{ ...glass, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', minWidth: 160, justifyContent: 'center' }}
        onClick={() => setCollapsed(c => !c)}
      >
        <span style={{ fontSize: '1rem' }}>🏢</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-accent-gold)' }}>{node.branchName}</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{collapsed ? '▶' : '▼'}</span>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* Connector */}
          <div style={{ width: 2, height: 16, background: 'rgba(212,175,55,0.3)' }} />

          {/* Manager */}
          {node.manager ? (
            <OrgChartNode member={node.manager} size={44} />
          ) : (
            <div style={{ ...glass, padding: '6px 14px', fontSize: 10, color: 'var(--color-text-muted)', borderStyle: 'dashed' }}>No Manager Assigned</div>
          )}

          {/* Connector to agents */}
          {node.agents.length > 0 && (
            <>
              <div style={{ width: 2, height: 12, background: 'rgba(212,175,55,0.3)' }} />
              {/* Horizontal line spanning agents */}
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {node.agents.map(agent => (
                    <OrgChartNode key={agent.id} member={agent} size={36} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OrgChartSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    setLoading(true);
    api.get('/team/org-chart')
      .then(r => setData(r.data))
      .catch(() => showError('Failed to load org chart'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Loading org chart…</div>;
  if (!data) return null;

  return (
    <div style={{ overflowX: 'auto', padding: '16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, minWidth: 600 }}>
        {/* Admins at top */}
        {data.admins?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Leadership</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {data.admins.map(a => <OrgChartNode key={a.id} member={a} size={56} />)}
            </div>
          </div>
        )}

        {/* Connector */}
        {data.admins?.length > 0 && data.branchNodes?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 2, height: 20, background: 'rgba(212,175,55,0.3)' }} />
          </div>
        )}

        {/* Branch label */}
        {data.branchNodes?.length > 0 && (
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Branches</div>
        )}

        {/* Branches */}
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
          {data.branchNodes?.map(node => (
            <BranchNode key={node.branchId} node={node} />
          ))}
        </div>

        {/* Unassigned */}
        {data.unassignedAgents?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unassigned Agents</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {data.unassignedAgents.map(a => <OrgChartNode key={a.id} member={a} size={36} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Birthdays Widget ─────────────────────────────────────────────────────────

function BirthdaysWidget({ birthdays }) {
  if (!birthdays.length) return (
    <div style={{ ...glass, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🎂 Upcoming Birthdays</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>No birthdays in the next 30 days</div>
    </div>
  );

  return (
    <div style={{ ...glass, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🎂 Upcoming Birthdays</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {birthdays.slice(0, 8).map(b => {
          const date = new Date(b.birthdayDate);
          const dateStr = date.toLocaleDateString('en-MT', { day: 'numeric', month: 'short' });
          return (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
              background: b.isToday ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.02)',
              border: b.isToday ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <Avatar member={b} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: b.isToday ? 'var(--color-accent-gold)' : 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.isToday ? '🎉 ' : ''}{b.firstName} {b.lastName}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                  {b.isToday ? 'Today!' : `${dateStr} · in ${b.daysUntil} day${b.daysUntil !== 1 ? 's' : ''}`}
                </div>
              </div>
              <span style={{ fontSize: '1.1rem' }}>🎂</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CrmTeamPage() {
  usePageTimeTracker('team_page', { entityType: 'team' });
  const { user } = useAuth();
  const { showError } = useToast();

  const [activeTab, setActiveTab] = useState('directory');
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Directory filters
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [sortBy, setSortBy] = useState('firstName');
  const [sortDir, setSortDir] = useState('ASC');

  const isAdmin = user?.role === 'admin';

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterRole)   params.role = filterRole;
      if (filterBranch) params.branchId = filterBranch;
      if (filterActive) params.active = filterActive;
      params.sortBy = sortBy;
      params.sortDir = sortDir;

      const { data } = await api.get('/team/members', { params });
      setMembers(data.members || []);
      setTotal(data.total || 0);
    } catch {
      showError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterRole, filterBranch, filterActive, sortBy, sortDir, showError]);

  const fetchOverview = useCallback(async () => {
    try {
      const { data } = await api.get('/team/overview');
      setOverview(data);
    } catch { /* non-critical */ }
  }, []);

  const fetchBirthdays = useCallback(async () => {
    try {
      const { data } = await api.get('/team/birthdays');
      setBirthdays(Array.isArray(data) ? data : []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchOverview();
    fetchBirthdays();
  }, [fetchMembers, fetchOverview, fetchBirthdays]);

  // Get branches from overview
  const branches = overview?.byBranch || [];

  const handleMessage = (member) => {
    // Navigate to chat — open a direct message channel to this user
    window.location.href = `/crm/chat?userId=${member.id}`;
  };

  const handleViewProfile = (member) => {
    window.location.href = `/crm/agents?agentId=${member.id}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 'var(--space-6)' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Team
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {total > 0 ? `${total} team members` : 'Team directory, performance & org chart'}
          </p>
        </div>
        {isAdmin && (
          <a href="/crm/agents" style={{ ...btnGold, textDecoration: 'none', display: 'inline-block' }}>
            + Manage Agents
          </a>
        )}
      </div>

      {/* ── Overview Stats ── */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          <StatCard icon="👥" label="Total Team" value={overview.total} />
          <StatCard icon="🟢" label="Active Today" value={overview.activeNow} color="#4ade80" />
          <StatCard icon="⭐" label="New This Month" value={overview.newThisMonth} color="#60a5fa" />
          <StatCard icon="🔑" label="Admins" value={overview.byRole?.admin ?? 0} color="#f87171" />
          <StatCard icon="🏅" label="Managers" value={overview.byRole?.manager ?? 0} color="#fbbf24" />
          <StatCard icon="🧑‍💼" label="Agents" value={overview.byRole?.agent ?? 0} color="#60a5fa" />
        </div>
      )}

      {/* ── Main Layout: Content + Sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 20, alignItems: 'start' }}
        className="team-layout"
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: activeTab === t.key ? 'var(--color-accent-gold)' : 'transparent',
                  color: activeTab === t.key ? '#000' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Directory Tab ── */}
          {activeTab === 'directory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Controls */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, specialization…"
                  style={{ ...inp, flex: '1 1 220px', minWidth: 200 }}
                />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inp, minWidth: 110 }}>
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                </select>
                <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ ...inp, minWidth: 130 }}>
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.name} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <select value={filterActive} onChange={e => setFilterActive(e.target.value)} style={{ ...inp, minWidth: 110 }}>
                  <option value="">All Status</option>
                  <option value="true">Active Now</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inp, minWidth: 120 }}>
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button
                  onClick={() => setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC')}
                  style={{ ...btnGhost, padding: '8px 12px', fontSize: 12 }}
                  title="Toggle sort direction"
                >
                  {sortDir === 'ASC' ? '↑ ASC' : '↓ DESC'}
                </button>
                {/* View toggle */}
                <button onClick={() => setViewMode('grid')} style={{ ...btnGhost, padding: '8px 12px', background: viewMode === 'grid' ? 'rgba(212,175,55,0.15)' : undefined }} title="Grid view">⊞</button>
                <button onClick={() => setViewMode('list')} style={{ ...btnGhost, padding: '8px 12px', background: viewMode === 'list' ? 'rgba(212,175,55,0.15)' : undefined }} title="List view">☰</button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Loading team members…</div>
              ) : members.length === 0 ? (
                <div style={{ ...glass, padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>👥</div>
                  No team members found
                </div>
              ) : viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {members.map(m => (
                    <MemberCard
                      key={m.id}
                      member={m}
                      currentUserId={user?.id}
                      onMessage={handleMessage}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ ...glass, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                        {['Member', 'Role', 'Branch', 'Status', 'Contact', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        <MemberRow
                          key={m.id}
                          member={m}
                          currentUserId={user?.id}
                          onMessage={handleMessage}
                          onViewProfile={handleViewProfile}
                          isLast={i === members.length - 1}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Leaderboard Tab ── */}
          {activeTab === 'leaderboard' && (
            <LeaderboardSection currentUserId={user?.id} />
          )}

          {/* ── Org Chart Tab ── */}
          {activeTab === 'org-chart' && (
            <div style={{ ...glass, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                🌳 Organisation Chart
              </div>
              <OrgChartSection />
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Birthdays */}
          <BirthdaysWidget birthdays={birthdays} />

          {/* Branch breakdown */}
          {overview?.byBranch?.length > 0 && (
            <div style={{ ...glass, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🏢 By Branch</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overview.byBranch.map(b => (
                  <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>{b.count}</span>
                    <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '999px', background: 'var(--color-accent-gold)', width: `${overview.total > 0 ? (b.count / overview.total) * 100 : 0}%`, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          {isAdmin && (
            <div style={{ ...glass, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>⚡ Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/crm/agents" style={{ ...btnGhost, textDecoration: 'none', textAlign: 'center', fontSize: 12, display: 'block' }}>🧑‍💼 Manage Agents</a>
                <a href="/crm/branches" style={{ ...btnGhost, textDecoration: 'none', textAlign: 'center', fontSize: 12, display: 'block' }}>🏢 Manage Branches</a>
                <a href="/crm/chat" style={{ ...btnGhost, textDecoration: 'none', textAlign: 'center', fontSize: 12, display: 'block' }}>💬 Team Chat</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive: stack sidebar below on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .team-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

