'use strict';

/**
 * metricsTracker middleware
 *
 * Automatically records AgentMetric events for authenticated users
 * based on the HTTP method + route path. Fires after the response
 * is sent (non-blocking) using res.on('finish').
 *
 * Login and logout are tracked directly in src/routes/auth.js since
 * req.user is not available on those unauthenticated routes.
 */

const { AgentMetric } = require('../models');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Route rules: more specific rules (longer paths, sub-resources) come first
 * so they match before shorter parameterized patterns.
 *
 * Each rule has:
 *   method     — HTTP method
 *   path       — RegExp tested against the full request path
 *   metricType — the metric type to record
 *   entityType — type label (e.g. 'client', 'property')
 *   idGroup    — capture group index (1-based) for entity UUID, or null
 */
const ROUTE_RULES = [
  // ── Clients ────────────────────────────────────────────────────────────────
  { method: 'GET',    path: /^\/api\/clients\/([^/]+)\/matches(?:\/|$)/, metricType: 'client_match_view',   entityType: 'client',    idGroup: 1 },
  { method: 'POST',   path: /^\/api\/clients\/([^/]+)\/matches(?:\/|$)/, metricType: 'client_match_recalc', entityType: 'client',    idGroup: 1 },
  { method: 'GET',    path: /^\/api\/clients\/?$/,                        metricType: 'client_list',         entityType: 'client',    idGroup: null },
  { method: 'GET',    path: /^\/api\/clients\/([^/]+)$/,                  metricType: 'client_view',         entityType: 'client',    idGroup: 1 },
  { method: 'POST',   path: /^\/api\/clients\/?$/,                        metricType: 'client_create',       entityType: 'client',    idGroup: null },
  { method: 'PUT',    path: /^\/api\/clients\/([^/]+)$/,                  metricType: 'client_update',       entityType: 'client',    idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/clients\/([^/]+)$/,                  metricType: 'client_update',       entityType: 'client',    idGroup: 1 },
  { method: 'DELETE', path: /^\/api\/clients\/([^/]+)$/,                  metricType: 'client_delete',       entityType: 'client',    idGroup: 1 },

  // ── Owners ─────────────────────────────────────────────────────────────────
  { method: 'POST',   path: /^\/api\/owners\/([^/]+)\/contacts(?:\/|$)/,  metricType: 'owner_contact_add',   entityType: 'owner',     idGroup: 1 },
  { method: 'PUT',    path: /^\/api\/owners\/([^/]+)\/contacts(?:\/|$)/,  metricType: 'owner_contact_edit',  entityType: 'owner',     idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/owners\/([^/]+)\/contacts(?:\/|$)/,  metricType: 'owner_contact_edit',  entityType: 'owner',     idGroup: 1 },
  { method: 'GET',    path: /^\/api\/owners\/?$/,                          metricType: 'owner_list',          entityType: 'owner',     idGroup: null },
  { method: 'GET',    path: /^\/api\/owners\/([^/]+)$/,                    metricType: 'owner_view',          entityType: 'owner',     idGroup: 1 },
  { method: 'POST',   path: /^\/api\/owners\/?$/,                          metricType: 'owner_create',        entityType: 'owner',     idGroup: null },
  { method: 'PUT',    path: /^\/api\/owners\/([^/]+)$/,                    metricType: 'owner_update',        entityType: 'owner',     idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/owners\/([^/]+)$/,                    metricType: 'owner_update',        entityType: 'owner',     idGroup: 1 },
  { method: 'DELETE', path: /^\/api\/owners\/([^/]+)$/,                    metricType: 'owner_delete',        entityType: 'owner',     idGroup: 1 },

  // ── Properties ─────────────────────────────────────────────────────────────
  { method: 'PATCH',  path: /^\/api\/properties\/([^/]+)\/feature(?:\/|$)/, metricType: 'property_feature',       entityType: 'property', idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/properties\/([^/]+)\/status(?:\/|$)/,  metricType: 'property_status_change', entityType: 'property', idGroup: 1 },
  { method: 'POST',   path: /^\/api\/properties\/([^/]+)\/images(?:\/|$)/,  metricType: 'property_image_upload',  entityType: 'property', idGroup: 1 },
  { method: 'GET',    path: /^\/api\/properties\/?$/,                        metricType: 'property_list',          entityType: 'property', idGroup: null },
  { method: 'GET',    path: /^\/api\/properties\/([^/]+)$/,                  metricType: 'property_view',          entityType: 'property', idGroup: 1 },
  { method: 'POST',   path: /^\/api\/properties\/?$/,                        metricType: 'property_create',        entityType: 'property', idGroup: null },
  { method: 'PUT',    path: /^\/api\/properties\/([^/]+)$/,                  metricType: 'property_update',        entityType: 'property', idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/properties\/([^/]+)$/,                  metricType: 'property_update',        entityType: 'property', idGroup: 1 },
  { method: 'DELETE', path: /^\/api\/properties\/([^/]+)$/,                  metricType: 'property_delete',        entityType: 'property', idGroup: 1 },

  // ── Inquiries / Contacts ───────────────────────────────────────────────────
  { method: 'PATCH',  path: /^\/api\/contacts\/([^/]+)\/assign(?:\/|$)/,   metricType: 'inquiry_assign',       entityType: 'inquiry',  idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/contacts\/([^/]+)\/resolve(?:\/|$)/,  metricType: 'inquiry_resolve',      entityType: 'inquiry',  idGroup: 1 },
  { method: 'GET',    path: /^\/api\/contacts\/?$/,                          metricType: 'inquiry_list',         entityType: 'inquiry',  idGroup: null },
  { method: 'GET',    path: /^\/api\/contacts\/([^/]+)$/,                    metricType: 'inquiry_view',         entityType: 'inquiry',  idGroup: 1 },
  { method: 'POST',   path: /^\/api\/contacts\/?$/,                          metricType: 'inquiry_create',       entityType: 'inquiry',  idGroup: null },
  { method: 'PATCH',  path: /^\/api\/contacts\/([^/]+)$/,                    metricType: 'inquiry_status_change', entityType: 'inquiry', idGroup: 1 },
  { method: 'DELETE', path: /^\/api\/contacts\/([^/]+)$/,                    metricType: 'inquiry_delete',       entityType: 'inquiry',  idGroup: 1 },

  // ── Documents (nested under any resource, e.g. /api/agents/:id/documents) ──
  { method: 'POST',   path: /\/documents(?:\/|$)/,                           metricType: 'document_upload',      entityType: 'document', idGroup: null },
  { method: 'GET',    path: /\/documents\/([^/]+)$/,                         metricType: 'document_view',        entityType: 'document', idGroup: 1 },
  { method: 'DELETE', path: /\/documents\/([^/]+)$/,                         metricType: 'document_delete',      entityType: 'document', idGroup: 1 },

  // ── Chat ───────────────────────────────────────────────────────────────────
  { method: 'POST',   path: /^\/api\/chat\/channels\/([^/]+)\/messages(?:\/|$)/, metricType: 'chat_message_send',   entityType: 'chat', idGroup: 1 },
  { method: 'GET',    path: /^\/api\/chat\/channels\/([^/]+)(?:\/messages)?$/,   metricType: 'chat_channel_view',   entityType: 'chat', idGroup: 1 },
  { method: 'GET',    path: /^\/api\/chat\/channels\/?$/,                         metricType: 'chat_channel_view',   entityType: 'chat', idGroup: null },
  { method: 'POST',   path: /^\/api\/chat\/channels\/?$/,                         metricType: 'chat_channel_create', entityType: 'chat', idGroup: null },

  // ── Announcements ──────────────────────────────────────────────────────────
  { method: 'POST',   path: /^\/api\/announcements\/([^/]+)\/read(?:\/|$)/,  metricType: 'announcement_read',    entityType: 'announcement', idGroup: 1 },
  { method: 'GET',    path: /^\/api\/announcements\/?$/,                       metricType: 'announcement_view',    entityType: 'announcement', idGroup: null },
  { method: 'GET',    path: /^\/api\/announcements\/([^/]+)$/,                 metricType: 'announcement_view',    entityType: 'announcement', idGroup: 1 },
  { method: 'POST',   path: /^\/api\/announcements\/?$/,                       metricType: 'announcement_create',  entityType: 'announcement', idGroup: null },

  // ── Branches ───────────────────────────────────────────────────────────────
  { method: 'GET',    path: /^\/api\/branches\/?$/,                            metricType: 'branch_view',          entityType: 'branch', idGroup: null },
  { method: 'GET',    path: /^\/api\/branches\/([^/]+)$/,                      metricType: 'branch_view',          entityType: 'branch', idGroup: 1 },
  { method: 'POST',   path: /^\/api\/branches\/?$/,                            metricType: 'branch_create',        entityType: 'branch', idGroup: null },
  { method: 'PUT',    path: /^\/api\/branches\/([^/]+)$/,                      metricType: 'branch_update',        entityType: 'branch', idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/branches\/([^/]+)$/,                      metricType: 'branch_update',        entityType: 'branch', idGroup: 1 },

  // ── Agents ─────────────────────────────────────────────────────────────────
  { method: 'PATCH',  path: /^\/api\/agents\/([^/]+)\/block(?:\/|$)/,         metricType: 'agent_block',          entityType: 'agent', idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/agents\/([^/]+)\/unblock(?:\/|$)/,       metricType: 'agent_unblock',        entityType: 'agent', idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/agents\/([^/]+)\/approve(?:\/|$)/,       metricType: 'agent_view',           entityType: 'agent', idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/agents\/([^/]+)\/reject(?:\/|$)/,        metricType: 'agent_view',           entityType: 'agent', idGroup: 1 },
  { method: 'GET',    path: /^\/api\/agents\/?$/,                               metricType: 'agent_list',           entityType: 'agent', idGroup: null },
  { method: 'GET',    path: /^\/api\/agents\/([^/]+)$/,                         metricType: 'agent_view',           entityType: 'agent', idGroup: 1 },
  { method: 'POST',   path: /^\/api\/agents\/?$/,                               metricType: 'agent_create',         entityType: 'agent', idGroup: null },
  { method: 'PUT',    path: /^\/api\/agents\/([^/]+)$/,                         metricType: 'agent_update',         entityType: 'agent', idGroup: 1 },
  { method: 'PATCH',  path: /^\/api\/agents\/([^/]+)$/,                         metricType: 'agent_update',         entityType: 'agent', idGroup: 1 },
  { method: 'DELETE', path: /^\/api\/agents\/([^/]+)$/,                         metricType: 'agent_delete',         entityType: 'agent', idGroup: 1 },

  // ── Notifications ──────────────────────────────────────────────────────────
  { method: 'PATCH',  path: /^\/api\/notifications\/read-all(?:\/|$)/,         metricType: 'notification_read_all', entityType: 'notification', idGroup: null },
  { method: 'PATCH',  path: /^\/api\/notifications\/([^/]+)\/read(?:\/|$)/,    metricType: 'notification_read',     entityType: 'notification', idGroup: 1 },
  { method: 'GET',    path: /^\/api\/notifications(?:\/|$)/,                    metricType: 'notification_view',     entityType: 'notification', idGroup: null },

  // ── Auth: password change ───────────────────────────────────────────────────
  { method: 'PUT',    path: /^\/api\/auth\/change-password(?:\/|$)/,           metricType: 'password_change',      entityType: null,    idGroup: null },
];

/**
 * Extract the client IP, honouring common reverse-proxy headers.
 */
const getIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.ip ||
  null;

/**
 * Build safe metadata for create/update operations.
 * Strips sensitive fields (password, token, etc.) from req.body.
 */
const buildMetadata = (req, metricType) => {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutating.includes(req.method)) return null;
  if (!req.body || typeof req.body !== 'object') return null;

  const SENSITIVE = new Set(['password', 'newPassword', 'currentPassword', 'token', 'secret']);
  const safe = {};
  for (const [k, v] of Object.entries(req.body)) {
    if (SENSITIVE.has(k)) continue;
    if (typeof v === 'string' && v.length > 500) {
      safe[k] = v.slice(0, 500) + '…';
    } else {
      safe[k] = v;
    }
  }
  return Object.keys(safe).length > 0 ? safe : null;
};

const metricsTracker = (req, res, next) => {
  res.on('finish', () => {
    try {
      // Only track authenticated users
      if (!req.user?.id) return;
      // Only track successful responses (2xx)
      if (res.statusCode < 200 || res.statusCode >= 300) return;

      const method = req.method;
      const path = req.originalUrl?.split('?')[0] || req.path || '';

      for (const rule of ROUTE_RULES) {
        if (rule.method !== method) continue;

        const match = rule.path.exec(path);
        if (!match) continue;

        const entityId = rule.idGroup ? (match[rule.idGroup] || null) : null;
        const sessionId = req.headers['x-session-id'] || null;
        const ipAddress = getIp(req);
        const userAgent = (req.headers['user-agent'] || '').slice(0, 500) || null;
        const metadata = buildMetadata(req, rule.metricType);

        setImmediate(async () => {
          try {
            await AgentMetric.create({
              userId:     req.user.id,
              metricType: rule.metricType,
              entityType: rule.entityType || null,
              entityId:   entityId || null,
              metadata,
              ipAddress,
              userAgent,
              sessionId,
            });
            if (isDev) {
              console.log('[metricsTracker]', rule.metricType, req.user.email);
            }
          } catch (e) {
            console.error('[metricsTracker] insert error:', e.message);
          }
        });

        break; // only record the first matching rule
      }
    } catch (e) {
      console.error('[metricsTracker] error:', e.message);
    }
  });

  next();
};

module.exports = metricsTracker;
