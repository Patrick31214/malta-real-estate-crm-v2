import { useEffect, useRef } from 'react';
import api from '../services/api';
import { getSessionId } from '../services/trackMetric';

/**
 * usePageTimeTracker — tracks how long the user stays on the current page/section.
 *
 * Records a start time on mount. When the component unmounts (navigation away),
 * it calculates the elapsed seconds and POSTs to /api/agents/metrics/page-time.
 *
 * @param {string} section     — Unique section identifier, e.g. 'clients_list', 'property_detail'
 * @param {object} [options]
 * @param {string} [options.page]       — URL/path of the page (defaults to window.location.pathname)
 * @param {string} [options.entityType] — e.g. 'property', 'client'
 * @param {string} [options.entityId]   — UUID of the specific entity (for detail pages)
 * @param {object} [options.metadata]   — Any additional metadata (e.g. active filters)
 * @param {number} [options.minSeconds] — Minimum seconds to bother recording (default: 2)
 */
function usePageTimeTracker(section, options = {}) {
  const {
    page,
    entityType = null,
    entityId = null,
    metadata = null,
    minSeconds = 2,
  } = options;

  // Keep a stable ref so the cleanup closure always sees the latest values
  const optsRef = useRef({ section, page, entityType, entityId, metadata, minSeconds });
  useEffect(() => {
    optsRef.current = { section, page, entityType, entityId, metadata, minSeconds };
  });

  useEffect(() => {
    const startMs = Date.now();

    return () => {
      const { section: s, page: p, entityType: et, entityId: eid, metadata: meta, minSeconds: min } = optsRef.current;
      const duration = Math.round((Date.now() - startMs) / 1000);
      if (duration < min) return; // Don't record very brief visits

      const sessionId = getSessionId();
      const resolvedPage = p || (typeof window !== 'undefined' ? window.location.pathname : null);

      api
        .post('/agents/metrics/page-time', {
          page:       resolvedPage,
          section:    s,
          duration,
          sessionId:  sessionId || undefined,
          entityType: et || undefined,
          entityId:   eid || undefined,
          metadata:   meta || undefined,
        })
        .catch(() => {
          // Fire-and-forget — silently swallow errors
        });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount/unmount
}

export default usePageTimeTracker;
