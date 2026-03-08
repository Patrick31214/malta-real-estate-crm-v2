import api from './api';

/* ── Session management ─────────────────────────────────────────────────────
 * A sessionId is generated on login and stored in sessionStorage so it
 * survives page refreshes within the same tab but is cleared on tab close.
 * Every metric event and API request includes this id via the X-Session-ID
 * header so the backend can group events into sessions.
 */

const SESSION_KEY = 'crm-session-id';
const SESSION_START_KEY = 'crm-session-start';
let heartbeatTimer = null;

const generateId = () =>
  // crypto.randomUUID is available in modern browsers and Node 14.17+.
  // The Math.random fallback is not cryptographically secure but is sufficient
  // for a non-security-critical session identifier used only for metric grouping.
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const getSessionId = () => sessionStorage.getItem(SESSION_KEY);

export const initSession = () => {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = generateId();
    sessionStorage.setItem(SESSION_KEY, sid);
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }
  // Attach to every outgoing axios request
  api.defaults.headers.common['X-Session-ID'] = sid;
  startHeartbeat(sid);
  return sid;
};

export const endSession = () => {
  const sid = sessionStorage.getItem(SESSION_KEY);
  const startMs = parseInt(sessionStorage.getItem(SESSION_START_KEY) || '0', 10);
  const duration = startMs ? Math.round((Date.now() - startMs) / 1000) : null;

  stopHeartbeat();

  if (sid) {
    const payload = JSON.stringify({ sessionId: sid, duration });
    const token = localStorage.getItem('gkr-token');
    if (token) {
      fetch('/api/agents/metrics/session-end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Session-ID': sid,
        },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }

  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_START_KEY);
  delete api.defaults.headers.common['X-Session-ID'];
};

const startHeartbeat = (sid) => {
  stopHeartbeat();
  // Send a heartbeat every 5 minutes to keep the session alive
  heartbeatTimer = setInterval(() => {
    trackMetric('session_heartbeat', null, null, null, sid);
  }, 5 * 60 * 1000);
};

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
};

// Track session end when the user closes / navigates away from the tab
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    endSession();
  });

  // Pause heartbeat when tab is hidden, resume when visible
  document.addEventListener('visibilitychange', () => {
    const sid = getSessionId();
    if (!sid) return;
    if (document.hidden) {
      stopHeartbeat();
    } else {
      startHeartbeat(sid);
    }
  });
}

/* ── Core tracking helper ───────────────────────────────────────────────────
 * Fire-and-forget metric event. Never throws — errors are silently swallowed.
 *
 * @param {string}  metricType  — e.g. 'login', 'property_view'
 * @param {string}  [entityType] — e.g. 'property', 'client'
 * @param {string}  [entityId]   — UUID of the related entity
 * @param {object}  [metadata]   — Any extra data
 * @param {string}  [sid]        — Override sessionId (defaults to current session)
 */
export function trackMetric(metricType, entityType, entityId, metadata, sid) {
  const sessionId = sid || getSessionId();
  api
    .post('/agents/metrics/track', { metricType, entityType, entityId, metadata, sessionId })
    .catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[trackMetric] failed to track', metricType, err?.message);
      }
    });
}

/* ── Page-view helper ───────────────────────────────────────────────────────
 * Call this on every route change from your router.
 *
 * @param {string} url — The page URL/path being viewed
 */
export function trackPageView(url) {
  const sessionId = getSessionId();
  api
    .post('/agents/metrics/track', {
      metricType: 'page_view',
      entityType: null,
      entityId:   null,
      metadata:   null,
      pageUrl:    url,
      sessionId,
    })
    .catch(() => {});
}
