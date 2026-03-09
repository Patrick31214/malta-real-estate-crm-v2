'use strict';

/**
 * Fire-and-forget activity logger.
 * Call this from any route to record an immutable audit-trail entry.
 * All failures are swallowed so they never affect the main request.
 */

const VALID_ACTIONS = new Set([
  'create', 'update', 'delete', 'view', 'login', 'logout',
  'export', 'import', 'approve', 'reject', 'assign', 'status_change',
  'upload', 'download', 'share', 'comment',
]);

const VALID_SEVERITIES = new Set(['info', 'warning', 'critical']);

/**
 * @param {object} params
 * @param {string}  params.userId       - UUID of the acting user
 * @param {string}  params.action       - one of VALID_ACTIONS
 * @param {string}  [params.entityType] - 'property' | 'client' | 'owner' | ...
 * @param {string}  [params.entityId]   - UUID of the affected entity
 * @param {string}  [params.entityName] - human-readable label for the entity
 * @param {string}  [params.description]- human-readable activity description
 * @param {object}  [params.metadata]   - { changes: {field:{old,new}}, ... }
 * @param {string}  [params.ipAddress]
 * @param {string}  [params.userAgent]
 * @param {string}  [params.severity]   - 'info' | 'warning' | 'critical'
 */
async function logActivity({
  userId,
  action,
  entityType = null,
  entityId   = null,
  entityName = null,
  description = null,
  metadata   = null,
  ipAddress  = null,
  userAgent  = null,
  severity   = 'info',
}) {
  // Validate required fields quietly
  if (!userId || !action) return;
  if (!VALID_ACTIONS.has(action)) return;
  if (!VALID_SEVERITIES.has(severity)) severity = 'info';

  try {
    // Lazy-require to avoid circular dependency issues during startup
    const { ActivityLog } = require('../models');
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      entityName,
      description,
      metadata,
      ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
      userAgent:  userAgent  ? String(userAgent).slice(0, 500) : null,
      severity,
    });
  } catch (err) {
    // Non-critical — log to console but never throw
    console.error('[activityLogger] insert error:', err.message);
  }
}

/**
 * Convenience helper: extract IP from request.
 */
function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
}

/**
 * Convenience helper: extract User-Agent from request.
 */
function getUa(req) {
  return (req.headers['user-agent'] || '').slice(0, 500) || null;
}

module.exports = { logActivity, getIp, getUa };
