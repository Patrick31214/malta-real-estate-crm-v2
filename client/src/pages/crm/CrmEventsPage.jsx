import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import GlassModal from '../../components/ui/GlassModal';
import Pagination from '../../components/ui/Pagination';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: 'open_house',     label: 'Open House',     icon: '🏠', color: '#d4af37' },
  { value: 'team_meeting',   label: 'Team Meeting',   icon: '👥', color: '#38bdf8' },
  { value: 'training',       label: 'Training',       icon: '📚', color: '#a78bfa' },
  { value: 'networking',     label: 'Networking',     icon: '🤝', color: '#4ade80' },
  { value: 'client_viewing', label: 'Client Viewing', icon: '👁', color: '#fb923c' },
  { value: 'company_event',  label: 'Company Event',  icon: '🎉', color: '#f472b6' },
  { value: 'deadline',       label: 'Deadline',       icon: '⏰', color: '#f87171' },
  { value: 'other',          label: 'Other',          icon: '📌', color: '#9ca3af' },
];

const STATUS_CONFIG = {
  scheduled:   { color: '#38bdf8', bg: 'rgba(14,165,233,0.14)',  border: 'rgba(14,165,233,0.35)',  label: 'Scheduled',   icon: '📅' },
  in_progress: { color: '#fbbf24', bg: 'rgba(234,179,8,0.14)',   border: 'rgba(234,179,8,0.35)',   label: 'In Progress', icon: '🔄' },
  completed:   { color: '#4ade80', bg: 'rgba(34,197,94,0.14)',   border: 'rgba(34,197,94,0.35)',   label: 'Completed',   icon: '✅' },
  cancelled:   { color: '#f87171', bg: 'rgba(239,68,68,0.14)',   border: 'rgba(239,68,68,0.35)',   label: 'Cancelled',   icon: '❌' },
  postponed:   { color: '#9ca3af', bg: 'rgba(107,114,128,0.14)', border: 'rgba(107,114,128,0.3)',  label: 'Postponed',   icon: '⏸️' },
};

const RSVP_CONFIG = {
  pending:   { color: '#9ca3af', bg: 'rgba(107,114,128,0.14)', label: 'Pending',   icon: '⏳' },
  accepted:  { color: '#4ade80', bg: 'rgba(34,197,94,0.14)',   label: 'Accepted',  icon: '✅' },
  declined:  { color: '#f87171', bg: 'rgba(239,68,68,0.14)',   label: 'Declined',  icon: '❌' },
  tentative: { color: '#fbbf24', bg: 'rgba(234,179,8,0.14)',   label: 'Tentative', icon: '❓' },
};

const COLOR_PALETTE = [
  '#d4af37', '#38bdf8', '#a78bfa', '#4ade80', '#fb923c',
  '#f472b6', '#f87171', '#34d399', '#60a5fa', '#e879f9',
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY_FORM = {
  title: '', description: '', type: 'other', status: 'scheduled',
  isAllDay: false, startDate: '', endDate: '', startTime: '', endTime: '',
  location: '', onlineLink: '', maxAttendees: '', color: '#d4af37',
  propertyId: '', branchId: '', notes: '',
  isRecurring: false, recurrencePattern: { frequency: 'weekly', interval: 1, endDate: '' },
  invitees: [],
};

// ─── Style helpers ────────────────────────────────────────────────────────────

const lbl = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-1)' };

const inp = (err) => ({ padding: 'var(--space-2) var(--space-3)', borderRadius: '8px', border: `1px solid ${err ? '#f87171' : 'rgba(212,175,55,0.2)'}`, background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', width: '100%', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' });

const card = { background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', padding: 'var(--space-5)' };

const secTitle = { fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 'var(--space-4)' };

const goldBtn = (disabled) => ({ padding: 'var(--space-2) var(--space-5)', borderRadius: '8px', border: '1px solid var(--color-accent-gold)', background: disabled ? 'rgba(212,175,55,0.3)' : 'var(--color-accent-gold)', color: disabled ? 'rgba(255,255,255,0.5)' : '#0a0a0f', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', opacity: disabled ? 0.7 : 1, transition: 'all 0.2s' });

const ghostBtn = { padding: 'var(--space-2) var(--space-4)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.25)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 0.2s' };

const segBtn = (active, color) => ({ padding: 'var(--space-2) var(--space-3)', borderRadius: '8px', border: `1px solid ${active ? (color || 'var(--color-accent-gold)') : 'rgba(212,175,55,0.15)'}`, background: active ? (color ? `${color}22` : 'rgba(212,175,55,0.12)') : 'transparent', color: active ? (color || 'var(--color-accent-gold)') : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)', transition: 'all 0.15s', whiteSpace: 'nowrap' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MT', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hh = parseInt(h, 10);
  return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
};

const userName = (u) => (u ? `${u.firstName} ${u.lastName}` : '—');

const getTypeInfo = (type) => EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];

// Generate an ICS file for download
const buildICS = (ev) => {
  const pad = (n) => String(n).padStart(2, '0');
  const toICSDate = (dateStr, timeStr) => {
    if (!dateStr) return '';
    if (!timeStr) return dateStr.replace(/-/g, '');
    const [h, m, s = '00'] = timeStr.split(':');
    return `${dateStr.replace(/-/g, '')}T${pad(h)}${pad(m)}${pad(s)}`;
  };
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MaltaCRM//Events//EN',
    'BEGIN:VEVENT',
    `UID:${ev.id}@malta-crm`,
    `SUMMARY:${(ev.title || '').replace(/\n/g, '\\n')}`,
    `DTSTART:${toICSDate(ev.startDate, ev.isAllDay ? null : ev.startTime)}`,
    `DTEND:${toICSDate(ev.endDate || ev.startDate, ev.isAllDay ? null : ev.endTime)}`,
    ev.location ? `LOCATION:${ev.location.replace(/\n/g, '\\n')}` : null,
    ev.description ? `DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}` : null,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  return lines;
};

const downloadICS = (ev) => {
  const content = buildICS(ev);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(ev.title || 'event').replace(/\s+/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Badge components ─────────────────────────────────────────────────────────

const TypeBadge = ({ type }) => {
  const info = getTypeInfo(type);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 9px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: info.color, background: `${info.color}1a`, border: `1px solid ${info.color}44` }}>
      {info.icon} {info.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 9px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const RsvpBadge = ({ status }) => {
  const cfg = RSVP_CONFIG[status] || RSVP_CONFIG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: cfg.color, background: cfg.bg }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── EventCard ────────────────────────────────────────────────────────────────

const EventCard = ({ event, onView, onEdit, onDelete, currentUserId }) => {
  const typeInfo = getTypeInfo(event.type);
  const borderColor = event.color || typeInfo.color;
  const isOrganizer = event.organizerId === currentUserId;
  const myAttendee = event.attendees?.find((a) => a.userId === currentUserId);

  return (
    <div
      onClick={() => onView(event)}
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.12)', borderLeft: `4px solid ${borderColor}`, borderRadius: '14px', padding: 'var(--space-4)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 'var(--space-1)' }}>
            {event.title}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            <TypeBadge type={event.type} />
            <StatusBadge status={event.status} />
            {myAttendee && <RsvpBadge status={myAttendee.rsvpStatus} />}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {isOrganizer && (
            <>
              <button onClick={() => onEdit(event)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }} title="Edit">✏️</button>
              <button onClick={() => onDelete(event)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }} title="Delete">🗑️</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          📅 <span>{fmtDate(event.startDate)}{event.startDate !== event.endDate ? ` → ${fmtDate(event.endDate)}` : ''}</span>
        </div>
        {!event.isAllDay && event.startTime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            🕐 <span>{fmtTime(event.startTime)}{event.endTime ? ` – ${fmtTime(event.endTime)}` : ''}</span>
          </div>
        )}
        {event.isAllDay && <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>🔔 <span>All Day</span></div>}
        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
            📍 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location}</span>
          </div>
        )}
        {event.attendees && event.attendees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            👥 <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── CalendarView ─────────────────────────────────────────────────────────────

const CalendarView = ({ year, month, calendarEvents, onEventClick, onDayClick }) => {
  const today = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = (n) => String(n).padStart(2, '0');

  const eventsForDay = useMemo(() => {
    const map = {};
    calendarEvents.forEach((ev) => {
      const start = ev.startDate;
      const end = ev.endDate || ev.startDate;
      let cur = new Date(start + 'T00:00:00');
      const endDate = new Date(end + 'T00:00:00');
      while (cur <= endDate) {
        const key = cur.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [calendarEvents]);

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} style={{ padding: 'var(--space-2)', textAlign: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{wd}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, idx) => {
          const dateKey = day ? `${year}-${pad(month)}-${pad(day)}` : null;
          const dayEvents = dateKey ? (eventsForDay[dateKey] || []) : [];
          const isToday = dateKey === today;
          const overflow = dayEvents.length > 3;
          const visible = overflow ? dayEvents.slice(0, 2) : dayEvents;

          return (
            <div
              key={idx}
              onClick={() => day && onDayClick && onDayClick(dateKey)}
              style={{ minHeight: '90px', padding: '6px', borderRight: idx % 7 !== 6 ? '1px solid rgba(212,175,55,0.07)' : 'none', borderBottom: '1px solid rgba(212,175,55,0.07)', background: isToday ? 'rgba(212,175,55,0.07)' : 'transparent', cursor: day ? 'pointer' : 'default', transition: 'background 0.15s', display: 'flex', flexDirection: 'column', gap: '3px' }}
            >
              {day && (
                <>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: isToday ? 'var(--font-bold)' : 'var(--font-normal)', color: isToday ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: isToday ? 'rgba(212,175,55,0.2)' : 'transparent', marginBottom: '2px' }}>
                    {day}
                  </div>
                  {visible.map((ev) => {
                    const typeInfo = getTypeInfo(ev.type);
                    const bg = ev.color || typeInfo.color;
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                        style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: `${bg}22`, color: bg, border: `1px solid ${bg}44`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', lineHeight: '16px' }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                  {overflow && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', paddingLeft: '4px', lineHeight: '16px' }}>
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── BoardView ────────────────────────────────────────────────────────────────

const BOARD_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

const BoardView = ({ events, onEventClick, onStatusChange, currentUserId }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
      {BOARD_STATUSES.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const col = events.filter((e) => e.status === status);
        return (
          <div key={status} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{cfg.icon}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: cfg.color }}>{cfg.label}</span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', background: cfg.bg, color: cfg.color, padding: '1px 8px', borderRadius: '999px', fontWeight: 'var(--font-bold)' }}>{col.length}</span>
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minHeight: '80px' }}>
              {col.map((ev) => {
                const typeInfo = getTypeInfo(ev.type);
                const borderColor = ev.color || typeInfo.color;
                const isOrganizer = ev.organizerId === currentUserId;
                return (
                  <div key={ev.id} onClick={() => onEventClick(ev)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderLeft: `3px solid ${borderColor}`, borderRadius: '10px', padding: 'var(--space-3)', cursor: 'pointer', transition: 'background 0.15s', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <TypeBadge type={ev.type} />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>📅 {fmtDate(ev.startDate)}</div>
                    {isOrganizer && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }} onClick={(e) => e.stopPropagation()}>
                        {BOARD_STATUSES.filter((s) => s !== status).map((s) => {
                          const scfg = STATUS_CONFIG[s];
                          return (
                            <button key={s} onClick={() => onStatusChange(ev, s)} style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '6px', border: `1px solid ${scfg.color}44`, background: scfg.bg, color: scfg.color, cursor: 'pointer', lineHeight: '16px' }}>
                              → {scfg.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {col.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', padding: 'var(--space-4)' }}>No events</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── EventDetailModal ─────────────────────────────────────────────────────────

const EventDetailModal = ({ event, onClose, onEdit, onDelete, onRsvp, onStatusChange, currentUserId, userRole }) => {
  if (!event) return null;

  const isOrganizer = event.organizerId === currentUserId;
  const isAdmin = ['admin', 'manager'].includes(userRole);
  const canEditDel = isOrganizer || isAdmin;
  const myAttendee = event.attendees?.find((a) => a.userId === currentUserId);

  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-3)', lineHeight: 1.3 }}>{event.title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <TypeBadge type={event.type} />
          <StatusBadge status={event.status} />
          {myAttendee && <RsvpBadge status={myAttendee.rsvpStatus} />}
        </div>
      </div>

      {/* Date/Time card */}
      <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 160px' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Start</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{fmtDate(event.startDate)}</div>
          {!event.isAllDay && event.startTime && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{fmtTime(event.startTime)}</div>}
          {event.isAllDay && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)' }}>All Day</div>}
        </div>
        {event.endDate && event.endDate !== event.startDate && (
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>End</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{fmtDate(event.endDate)}</div>
            {!event.isAllDay && event.endTime && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{fmtTime(event.endTime)}</div>}
          </div>
        )}
        {!event.isAllDay && event.endDate === event.startDate && event.endTime && (
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>End Time</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{fmtTime(event.endTime)}</div>
          </div>
        )}
        {event.organizer && (
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Organizer</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{userName(event.organizer)}</div>
          </div>
        )}
      </div>

      {/* Location */}
      {(event.location || event.onlineLink) && (
        <div style={card}>
          <div style={secTitle}>Location</div>
          {event.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: event.onlineLink ? 'var(--space-2)' : 0 }}>
              <span>📍</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{event.location}</span>
            </div>
          )}
          {event.onlineLink && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔗</span>
              <a href={event.onlineLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent-gold)', wordBreak: 'break-all' }}>{event.onlineLink}</a>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div style={card}>
          <div style={secTitle}>Description</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{event.description}</p>
        </div>
      )}

      {/* Attendees */}
      {event.attendees && event.attendees.length > 0 && (
        <div style={card}>
          <div style={secTitle}>Attendees ({event.attendees.length}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            {event.attendees.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>👤 {a.user ? userName(a.user) : '—'}</span>
                <RsvpBadge status={a.rsvpStatus} />
              </div>
            ))}
          </div>
          {/* My RSVP buttons */}
          {myAttendee && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', alignSelf: 'center', marginRight: '4px' }}>My RSVP:</span>
              {['accepted', 'tentative', 'declined'].map((rs) => {
                const rcfg = RSVP_CONFIG[rs];
                const active = myAttendee.rsvpStatus === rs;
                return (
                  <button key={rs} onClick={() => onRsvp(event, rs)} style={{ fontSize: 'var(--text-xs)', padding: '3px 10px', borderRadius: '8px', border: `1px solid ${rcfg.color}44`, background: active ? rcfg.bg : 'transparent', color: rcfg.color, cursor: 'pointer', fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)', transition: 'all 0.15s' }}>
                    {rcfg.icon} {rcfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Linked property */}
      {event.property && (
        <div style={{ ...card, background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>🏠 Linked Property</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{event.property.title}</div>
          {event.property.referenceNumber && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Ref: {event.property.referenceNumber}</div>}
        </div>
      )}

      {/* Notes */}
      {event.notes && (
        <div style={card}>
          <div style={secTitle}>Notes</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{event.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', paddingBottom: 'var(--space-2)' }}>
        <button style={ghostBtn} onClick={() => downloadICS(event)} title="Download calendar file">📥 Download .ics</button>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {canEditDel && (
            <>
              <button style={{ ...ghostBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }} onClick={() => onDelete(event)}>Delete</button>
              <button style={goldBtn(false)} onClick={() => onEdit(event)}>Edit Event</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── EventFormModal ───────────────────────────────────────────────────────────

const EventFormModal = ({ initial, onSave, onCancel, users, properties, branches }) => {
  const buildInit = useCallback(() => {
    if (!initial) return { ...EMPTY_FORM };
    return {
      title:            initial.title || '',
      description:      initial.description || '',
      type:             initial.type || 'other',
      status:           initial.status || 'scheduled',
      isAllDay:         initial.isAllDay || false,
      startDate:        initial.startDate || '',
      endDate:          initial.endDate || '',
      startTime:        initial.startTime ? initial.startTime.slice(0, 5) : '',
      endTime:          initial.endTime   ? initial.endTime.slice(0, 5)   : '',
      location:         initial.location || '',
      onlineLink:       initial.onlineLink || '',
      maxAttendees:     initial.maxAttendees != null ? String(initial.maxAttendees) : '',
      color:            initial.color || '#d4af37',
      propertyId:       initial.propertyId || '',
      branchId:         initial.branchId || '',
      notes:            initial.notes || '',
      isRecurring:      initial.isRecurring || false,
      recurrencePattern: initial.recurrencePattern || { frequency: 'weekly', interval: 1, endDate: '' },
      invitees:         initial.attendees?.map((a) => a.userId) || [],
    };
  }, [initial]);

  const [form, setForm] = useState(buildInit);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setRec = (field, value) => setForm((f) => ({ ...f, recurrencePattern: { ...f.recurrencePattern, [field]: value } }));

  const toggleInvitee = (uid) => {
    setForm((f) => {
      const inv = f.invitees.includes(uid) ? f.invitees.filter((x) => x !== uid) : [...f.invitees, uid];
      return { ...f, invitees: inv };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'End date cannot be before start date';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        maxAttendees: form.maxAttendees !== '' ? parseInt(form.maxAttendees, 10) : null,
        propertyId:   form.propertyId || null,
        branchId:     form.branchId   || null,
        startTime:    form.isAllDay ? null : (form.startTime || null),
        endTime:      form.isAllDay ? null : (form.endTime   || null),
        recurrencePattern: form.isRecurring ? form.recurrencePattern : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const row2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Basic Info */}
      <div style={card}>
        <div style={secTitle}>Basic Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={lbl}>Title *</label>
            <input style={inp(errors.title)} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Event title…" />
            {errors.title && <span style={{ fontSize: 'var(--text-xs)', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.title}</span>}
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp(), resize: 'vertical', minHeight: '80px' }} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the event…" />
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Type</label>
              <select style={inp()} value={form.type} onChange={(e) => set('type', e.target.value)}>
                {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div style={card}>
        <div style={secTitle}>Date & Time</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
            <input type="checkbox" checked={form.isAllDay} onChange={(e) => set('isAllDay', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent-gold)' }} />
            All-day event
          </label>
          <div style={row2}>
            <div>
              <label style={lbl}>Start Date *</label>
              <input type="date" style={inp(errors.startDate)} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
              {errors.startDate && <span style={{ fontSize: 'var(--text-xs)', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.startDate}</span>}
            </div>
            <div>
              <label style={lbl}>End Date *</label>
              <input type="date" style={inp(errors.endDate)} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              {errors.endDate && <span style={{ fontSize: 'var(--text-xs)', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.endDate}</span>}
            </div>
          </div>
          {!form.isAllDay && (
            <div style={row2}>
              <div>
                <label style={lbl}>Start Time</label>
                <input type="time" style={inp()} value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>End Time</label>
                <input type="time" style={inp()} value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div style={card}>
        <div style={secTitle}>Location</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={lbl}>Physical Location</label>
            <input style={inp()} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Valletta Conference Centre, Malta" />
          </div>
          <div>
            <label style={lbl}>Online / Meeting Link</label>
            <input style={inp()} value={form.onlineLink} onChange={(e) => set('onlineLink', e.target.value)} placeholder="https://meet.example.com/…" />
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div style={card}>
        <div style={secTitle}>Event Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={row2}>
            <div>
              <label style={lbl}>Max Attendees</label>
              <input type="number" min="1" style={inp()} value={form.maxAttendees} onChange={(e) => set('maxAttendees', e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
          <div>
            <label style={lbl}>Event Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {COLOR_PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => set('color', c)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: form.color === c ? `3px solid white` : '2px solid transparent', cursor: 'pointer', transition: 'border 0.15s', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} title={c} />
              ))}
            </div>
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Linked Property</label>
              <select style={inp()} value={form.propertyId} onChange={(e) => set('propertyId', e.target.value)}>
                <option value="">— None —</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.title}{p.referenceNumber ? ` (${p.referenceNumber})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Branch</label>
              <select style={inp()} value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
                <option value="">— None —</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.city ? `, ${b.city}` : ''}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Team Members */}
      {users.length > 0 && (
        <div style={card}>
          <div style={secTitle}>Invite Team Members</div>
          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingRight: '4px' }}>
            {users.map((u) => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', padding: 'var(--space-2) var(--space-3)', borderRadius: '8px', background: form.invitees.includes(u.id) ? 'rgba(212,175,55,0.07)' : 'transparent', transition: 'background 0.15s' }}>
                <input type="checkbox" checked={form.invitees.includes(u.id)} onChange={() => toggleInvitee(u.id)} style={{ width: '15px', height: '15px', accentColor: 'var(--color-accent-gold)', flexShrink: 0 }} />
                <span>{u.firstName} {u.lastName}</span>
                {u.role && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{u.role}</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Recurring */}
      <div style={card}>
        <div style={secTitle}>Recurring Event</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => set('isRecurring', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent-gold)' }} />
            This is a recurring event
          </label>
          {form.isRecurring && (
            <div style={row2}>
              <div>
                <label style={lbl}>Frequency</label>
                <select style={inp()} value={form.recurrencePattern.frequency} onChange={(e) => setRec('frequency', e.target.value)}>
                  {['daily', 'weekly', 'monthly', 'yearly'].map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Repeat every</label>
                <input type="number" min="1" max="52" style={inp()} value={form.recurrencePattern.interval} onChange={(e) => setRec('interval', parseInt(e.target.value, 10) || 1)} />
              </div>
              <div>
                <label style={lbl}>End Date</label>
                <input type="date" style={inp()} value={form.recurrencePattern.endDate} onChange={(e) => setRec('endDate', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div style={card}>
        <div style={secTitle}>Notes</div>
        <textarea style={{ ...inp(), resize: 'vertical', minHeight: '80px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Additional notes…" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-2)' }}>
        <button type="button" style={ghostBtn} onClick={onCancel}>Cancel</button>
        <button type="submit" style={goldBtn(saving)} disabled={saving}>{saving ? 'Saving…' : (initial ? 'Save Changes' : 'Create Event')}</button>
      </div>
    </form>
  );
};

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

const DeleteConfirmModal = ({ event, onConfirm, onCancel, loading }) => (
  <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', textAlign: 'center' }}>
    <div style={{ fontSize: '2.5rem' }}>🗑️</div>
    <div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>Delete Event</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
        Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>&ldquo;{event?.title}&rdquo;</strong>? This action cannot be undone.
      </p>
    </div>
    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
      <button style={ghostBtn} onClick={onCancel}>Cancel</button>
      <button style={{ ...goldBtn(loading), background: loading ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.9)', border: '1px solid #f87171', color: loading ? 'rgba(255,255,255,0.5)' : '#fff' }} onClick={onConfirm} disabled={loading}>
        {loading ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const CrmEventsPage = () => {
  usePageTimeTracker('events_page');
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const isAdmin = ['admin', 'manager'].includes(user?.role);

  // View state
  const [view,        setView]        = useState('calendar');
  const [calYear,     setCalYear]     = useState(new Date().getFullYear());
  const [calMonth,    setCalMonth]    = useState(new Date().getMonth() + 1);

  // Data
  const [events,         setEvents]         = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [stats,          setStats]          = useState({ totalThisMonth: 0, upcoming: 0, openHouses: 0, myRsvps: 0 });
  const [users,          setUsers]          = useState([]);
  const [properties,     setProperties]     = useState([]);
  const [branches,       setBranches]       = useState([]);
  const [loading,        setLoading]        = useState(true);

  // Filters & pagination
  const [search,       setSearch]       = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(0);
  const [totalItems,   setTotalItems]   = useState(0);

  // Modal state
  const [viewEvent,   setViewEvent]   = useState(null);
  const [editEvent,   setEditEvent]   = useState(null);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const [createDate,  setCreateDate]  = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get('/events/stats');
      setStats(r.data);
    } catch { /* silent */ }
  }, []);

  const fetchCalendar = useCallback(async () => {
    try {
      const r = await api.get(`/events/calendar?year=${calYear}&month=${calMonth}`);
      setCalendarEvents(r.data.events || []);
    } catch { /* silent */ }
  }, [calYear, calMonth]);

  const fetchList = useCallback(async (pageNum = 1, searchVal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      if (searchVal)    params.set('search', searchVal);
      if (filterType)   params.set('type',   filterType);
      if (filterStatus) params.set('status', filterStatus);
      const r = await api.get(`/events?${params}`);
      setEvents(r.data.events || []);
      setPage(r.data.pagination?.page || pageNum);
      setTotalPages(r.data.pagination?.totalPages || 0);
      setTotalItems(r.data.pagination?.total || 0);
    } catch {
      showError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, showError]);

  const fetchSupport = useCallback(async () => {
    try {
      const [agentsR, propsR, branchesR] = await Promise.all([
        api.get('/agents?limit=100'),
        api.get('/properties?limit=100&sortBy=title&sortDir=ASC'),
        api.get('/branches?limit=100'),
      ]);
      setUsers(agentsR.data.agents || agentsR.data.users || agentsR.data || []);
      setProperties(propsR.data.properties || propsR.data || []);
      setBranches(branchesR.data.branches || branchesR.data || []);
    } catch { /* silent */ }
  }, []);

  // Initial load
  useEffect(() => { fetchStats(); fetchSupport(); }, [fetchStats, fetchSupport]);

  // Calendar re-fetch on month change
  useEffect(() => { if (view === 'calendar') fetchCalendar(); }, [view, fetchCalendar]);

  // List/board re-fetch on filter change
  useEffect(() => {
    if (view !== 'calendar') fetchList(1, search);
  }, [filterType, filterStatus, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // List initial load
  useEffect(() => {
    if (view === 'list' || view === 'board') fetchList(1, search);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (view !== 'calendar') fetchList(1, search);
    }, 350);
    return () => clearTimeout(t);
  }, [search, fetchList, view]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleSave = async (formData) => {
    try {
      if (editEvent) {
        const r = await api.put(`/events/${editEvent.id}`, formData);
        const updated = r.data.event || r.data;
        setEvents((prev) => prev.map((e) => (e.id === editEvent.id ? updated : e)));
        setCalendarEvents((prev) => prev.map((e) => (e.id === editEvent.id ? updated : e)));
        if (viewEvent?.id === editEvent.id) setViewEvent(updated);
        showSuccess('Event updated');
      } else {
        const r = await api.post('/events', formData);
        const created = r.data.event || r.data;
        setEvents((prev) => [created, ...prev]);
        showSuccess('Event created');
      }
      setShowForm(false);
      setEditEvent(null);
      setCreateDate('');
      fetchStats();
      if (view === 'calendar') fetchCalendar();
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to save event');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${deleteEvent.id}`);
      setEvents((prev) => prev.filter((e) => e.id !== deleteEvent.id));
      setCalendarEvents((prev) => prev.filter((e) => e.id !== deleteEvent.id));
      if (viewEvent?.id === deleteEvent.id) setViewEvent(null);
      showSuccess('Event deleted');
      setDeleteEvent(null);
      fetchStats();
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleRsvp = async (event, rsvpStatus) => {
    try {
      const r = await api.put(`/events/${event.id}/rsvp`, { rsvpStatus });
      // Refresh the viewed event attendees list
      const updatedEvent = { ...event, attendees: event.attendees ? event.attendees.map((a) => a.userId === user.id ? { ...a, rsvpStatus } : a) : [{ userId: user.id, rsvpStatus, user }] };
      if (viewEvent?.id === event.id) setViewEvent(updatedEvent);
      setEvents((prev) => prev.map((e) => e.id === event.id ? updatedEvent : e));
      showSuccess(`RSVP updated to ${RSVP_CONFIG[rsvpStatus]?.label}`);
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to update RSVP');
    }
  };

  const handleStatusChange = async (event, newStatus) => {
    try {
      const r = await api.put(`/events/${event.id}`, { status: newStatus });
      const updated = r.data.event || r.data;
      setEvents((prev) => prev.map((e) => e.id === event.id ? updated : e));
      setCalendarEvents((prev) => prev.map((e) => e.id === event.id ? updated : e));
      if (viewEvent?.id === event.id) setViewEvent(updated);
      showSuccess('Status updated');
      fetchStats();
    } catch (err) {
      showError(err?.response?.data?.error || 'Failed to update status');
    }
  };

  const openCreate = (dateStr = '') => {
    setEditEvent(null);
    setCreateDate(dateStr);
    const today = dateStr || new Date().toISOString().slice(0, 10);
    setShowForm(true);
  };

  const openEdit = (event) => {
    setEditEvent(event);
    setViewEvent(null);
    setShowForm(true);
  };

  // Calendar month navigation
  const prevMonth = () => {
    if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear((y) => y + 1); setCalMonth(1); }
    else setCalMonth((m) => m + 1);
  };
  const goToday = () => {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth() + 1);
  };

  // EMPTY_FORM with optional pre-filled date
  const formInitial = useMemo(() => {
    if (editEvent) return editEvent;
    if (createDate) return { ...EMPTY_FORM, startDate: createDate, endDate: createDate };
    return null;
  }, [editEvent, createDate]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>📅 Events</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: '4px 0 0' }}>Manage open houses, meetings, trainings, and more</p>
        </div>
        <button style={goldBtn(false)} onClick={() => openCreate()}>+ New Event</button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {[
          { label: 'This Month',    value: stats.totalThisMonth, icon: '📅', color: undefined },
          { label: 'Upcoming',      value: stats.upcoming,       icon: '🔜', color: '#38bdf8'  },
          { label: 'Open Houses',   value: stats.openHouses,     icon: '🏠', color: '#d4af37'  },
          { label: 'Pending RSVPs', value: stats.myRsvps,        icon: '⏳', color: stats.myRsvps > 0 ? '#fbbf24' : undefined },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 140px', minWidth: 0, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${s.color ? `${s.color}44` : 'rgba(212,175,55,0.15)'}`, borderRadius: '16px', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>{s.icon}</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: s.color || 'var(--color-accent-gold)', fontFamily: 'var(--font-heading)' }}>{s.value}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'calendar', label: '🗓 Calendar' },
            { key: 'list',     label: '☰ List'     },
            { key: 'board',    label: '⊞ Board'    },
          ].map((v) => (
            <button key={v.key} style={segBtn(view === v.key)} onClick={() => setView(v.key)}>{v.label}</button>
          ))}
        </div>

        {/* Filter bar for list/board */}
        {view !== 'calendar' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', fontSize: '14px' }}>🔍</span>
              <input style={{ ...inp(), paddingLeft: '32px', width: '200px' }} placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select style={{ ...inp(), width: 'auto', minWidth: '150px' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
            <select style={{ ...inp(), width: 'auto', minWidth: '150px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        )}

        {/* Calendar month nav */}
        {view === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button style={ghostBtn} onClick={prevMonth} title="Previous month">‹</button>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', minWidth: '140px', textAlign: 'center' }}>
              {MONTHS[calMonth - 1]} {calYear}
            </span>
            <button style={ghostBtn} onClick={nextMonth} title="Next month">›</button>
            <button style={segBtn(false)} onClick={goToday}>Today</button>
          </div>
        )}
      </div>

      {/* ── Calendar View ─────────────────────────────────── */}
      {view === 'calendar' && (
        <CalendarView
          year={calYear}
          month={calMonth}
          calendarEvents={calendarEvents}
          onEventClick={(ev) => setViewEvent(ev)}
          onDayClick={(dateStr) => openCreate(dateStr)}
        />
      )}

      {/* ── List View ─────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }} role="status">Loading…</div>
          ) : events.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: 'var(--space-10)' }} role="status">
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>📅</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>No events found</div>
              <button style={goldBtn(false)} onClick={() => openCreate()}>Create Your First Event</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev}
                  onView={(e) => setViewEvent(e)}
                  onEdit={openEdit}
                  onDelete={(e) => setDeleteEvent(e)}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} total={totalItems} onPageChange={(p) => fetchList(p, search)} limit={20} />
          )}
        </>
      )}

      {/* ── Board View ────────────────────────────────────── */}
      {view === 'board' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }} role="status">Loading…</div>
        ) : (
          <BoardView
            events={events}
            onEventClick={(ev) => setViewEvent(ev)}
            onStatusChange={handleStatusChange}
            currentUserId={user?.id}
          />
        )
      )}

      {/* ── Modals ─────────────────────────────────────────── */}

      {/* Event Detail */}
      <GlassModal isOpen={!!viewEvent} onClose={() => setViewEvent(null)} maxWidth="760px">
        {viewEvent && (
          <EventDetailModal
            event={viewEvent}
            onClose={() => setViewEvent(null)}
            onEdit={(ev) => { openEdit(ev); }}
            onDelete={(ev) => { setViewEvent(null); setDeleteEvent(ev); }}
            onRsvp={handleRsvp}
            onStatusChange={handleStatusChange}
            currentUserId={user?.id}
            userRole={user?.role}
          />
        )}
      </GlassModal>

      {/* Create / Edit Form */}
      <GlassModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditEvent(null); setCreateDate(''); }}
        title={editEvent ? 'Edit Event' : 'New Event'}
        maxWidth="720px"
      >
        <EventFormModal
          initial={formInitial}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditEvent(null); setCreateDate(''); }}
          users={users}
          properties={properties}
          branches={branches}
        />
      </GlassModal>

      {/* Delete Confirm */}
      <GlassModal isOpen={!!deleteEvent} onClose={() => setDeleteEvent(null)} title="Confirm Delete" maxWidth="440px">
        {deleteEvent && (
          <DeleteConfirmModal
            event={deleteEvent}
            onConfirm={handleDelete}
            onCancel={() => setDeleteEvent(null)}
            loading={deleting}
          />
        )}
      </GlassModal>
    </div>
  );
};

export default CrmEventsPage;
