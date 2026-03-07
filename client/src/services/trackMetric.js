import api from './api';

/**
 * Fire-and-forget metric tracking helper.
 * Sends a metric event to the backend without blocking the UI.
 *
 * @param {string} metricType  - e.g. 'login', 'property_view', 'client_create'
 * @param {string} [entityType] - e.g. 'property', 'client', 'owner'
 * @param {string} [entityId]   - UUID of the related entity
 * @param {object} [metadata]   - Any additional data
 */
export function trackMetric(metricType, entityType, entityId, metadata) {
  api
    .post('/agents/metrics/track', { metricType, entityType, entityId, metadata })
    .catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[trackMetric] failed to track', metricType, err?.message);
      }
    });
}
