'use strict';

/**
 * metricsTracker middleware
 *
 * Automatically records AgentMetric events for authenticated users
 * based on the HTTP method + route path. Fires after the response
 * is sent (non-blocking) using res.on('finish').
 */

const { AgentMetric } = require('../models');

// Map (method, pathPattern) → metricType
// pathPattern is a simple string prefix match
const ROUTE_METRIC_MAP = [
  // Auth
  { method: 'POST',   prefix: '/api/auth/login',   metricType: 'login',            entityType: null },
  { method: 'POST',   prefix: '/api/auth/logout',  metricType: 'logout',           entityType: null },

  // Clients
  { method: 'GET',    prefix: '/api/clients/',      metricType: 'client_view',      entityType: 'client' },
  { method: 'POST',   prefix: '/api/clients',       metricType: 'client_create',    entityType: 'client',  exact: true },
  { method: 'PUT',    prefix: '/api/clients/',      metricType: 'client_update',    entityType: 'client' },
  { method: 'PATCH',  prefix: '/api/clients/',      metricType: 'client_update',    entityType: 'client' },
  { method: 'DELETE', prefix: '/api/clients/',      metricType: 'client_delete',    entityType: 'client' },

  // Owners
  { method: 'GET',    prefix: '/api/owners/',       metricType: 'owner_view',       entityType: 'owner' },
  { method: 'POST',   prefix: '/api/owners',        metricType: 'owner_create',     entityType: 'owner',   exact: true },
  { method: 'PUT',    prefix: '/api/owners/',       metricType: 'owner_update',     entityType: 'owner' },
  { method: 'PATCH',  prefix: '/api/owners/',       metricType: 'owner_update',     entityType: 'owner' },
  { method: 'DELETE', prefix: '/api/owners/',       metricType: 'owner_delete',     entityType: 'owner' },

  // Properties
  { method: 'GET',    prefix: '/api/properties/',   metricType: 'property_view',    entityType: 'property' },
  { method: 'POST',   prefix: '/api/properties',    metricType: 'property_create',  entityType: 'property', exact: true },
  { method: 'PUT',    prefix: '/api/properties/',   metricType: 'property_update',  entityType: 'property' },
  { method: 'PATCH',  prefix: '/api/properties/',   metricType: 'property_update',  entityType: 'property' },
  { method: 'DELETE', prefix: '/api/properties/',   metricType: 'property_delete',  entityType: 'property' },

  // Inquiries
  { method: 'GET',    prefix: '/api/contacts/',     metricType: 'inquiry_view',     entityType: 'inquiry' },
  { method: 'POST',   prefix: '/api/contacts',      metricType: 'inquiry_view',     entityType: 'inquiry',  exact: true },
  { method: 'PATCH',  prefix: '/api/contacts/',     metricType: 'inquiry_assign',   entityType: 'inquiry' },
];

/**
 * Extract a UUID-like entity ID from the path segment after the prefix.
 * E.g. /api/clients/abc-123/... → 'abc-123'
 */
const extractEntityId = (path, prefix) => {
  const rest = path.slice(prefix.length);
  const segment = rest.split('/')[0];
  // Basic UUID check (or any non-empty segment)
  return segment && segment.length > 0 ? segment : null;
};

const metricsTracker = (req, res, next) => {
  // Only track for authenticated users
  res.on('finish', () => {
    try {
      if (!req.user) return;
      // Only track successful responses (2xx)
      if (res.statusCode < 200 || res.statusCode >= 300) return;

      const method = req.method;
      const path   = req.path || req.url || '';

      for (const rule of ROUTE_METRIC_MAP) {
        if (rule.method !== method) continue;

        if (rule.exact) {
          if (path !== rule.prefix && path !== rule.prefix.replace(/\/$/, '')) continue;
        } else {
          if (!path.startsWith(rule.prefix)) continue;
        }

        const entityId = rule.exact ? null : extractEntityId(path, rule.prefix);

        // Special handling: feature toggle → property_feature
        let metricType = rule.metricType;
        if (method === 'PATCH' && path.startsWith('/api/properties/') && path.includes('/feature')) {
          metricType = 'property_feature';
        }
        if (method === 'PATCH' && path.startsWith('/api/contacts/') && path.includes('/resolve')) {
          metricType = 'inquiry_resolve';
        }
        if (method === 'PATCH' && path.startsWith('/api/contacts/') && path.includes('/assign')) {
          metricType = 'inquiry_assign';
        }

        setImmediate(async () => {
          try {
            await AgentMetric.create({
              userId:     req.user.id,
              metricType,
              entityType: rule.entityType || null,
              entityId:   entityId || null,
              metadata:   null,
            });
          } catch (e) {
            // Non-blocking — never crash the request
            console.error('[metricsTracker] insert error:', e.message);
          }
        });

        break; // only record first matching rule
      }
    } catch (e) {
      console.error('[metricsTracker] error:', e.message);
    }
  });

  next();
};

module.exports = metricsTracker;
