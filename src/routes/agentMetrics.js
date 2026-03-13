'use strict';

const express = require('express');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const {
  AgentMetric, User, Property, Client,
  Owner, Inquiry, Branch, ChatChannel, Announcement, Document,
} = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const serverError = (err, fallback) => ({ error: isDev ? (err.message || fallback) : fallback });

const getIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
const getUa = (req) =>
  (req.headers['user-agent'] || '').slice(0, 500) || null;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
router.use(apiLimiter);

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const getPeriodWhere = (period, startDate, endDate) => {
  if (startDate && endDate) {
    return { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] } };
  }
  const now = new Date();
  if (period === 'day') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { createdAt: { [Op.gte]: start } };
  }
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0);
    return { createdAt: { [Op.gte]: start } };
  }
  if (period === 'month') {
    const start = new Date(now); start.setDate(now.getDate() - 30); start.setHours(0, 0, 0, 0);
    return { createdAt: { [Op.gte]: start } };
  }
  if (period === 'year') {
    const start = new Date(now); start.setFullYear(now.getFullYear() - 1); start.setHours(0, 0, 0, 0);
    return { createdAt: { [Op.gte]: start } };
  }
  return {}; // 'all'
};

const countByType = (rows, type) => rows.filter(r => r.metricType === type).length;

/* ── Entity resolution helpers ──────────────────────────────────────────────
 * Batch-fetch entities by type and build a label for each.
 * Returns a Map keyed by entityId for fast lookup.                           */

/**
 * Build a human-readable label for a metric row.
 * @param {string} entityType
 * @param {object|null} entity  — resolved entity (or null if not found)
 * @returns {string}
 */
const buildEntityLabel = (entityType, entity) => {
  if (!entity) return null;
  switch (entityType) {
    case 'property': {
      const beds = entity.bedrooms ? `${entity.bedrooms}-bed ` : '';
      const type = entity.type || 'Property';
      const loc  = entity.locality ? ` in ${entity.locality}` : '';
      const ref  = entity.referenceNumber ? ` (${entity.referenceNumber})` : '';
      return `${beds}${type}${loc}${ref}`.trim();
    }
    case 'client':
      return [entity.firstName, entity.lastName].filter(Boolean).join(' ')
        + (entity.email ? ` (${entity.email})` : '');
    case 'owner':
      return [entity.firstName, entity.lastName].filter(Boolean).join(' ')
        + (entity.referenceNumber ? ` (${entity.referenceNumber})` : entity.phone ? ` (${entity.phone})` : '');
    case 'inquiry':
      return [entity.firstName, entity.lastName].filter(Boolean).join(' ')
        + (entity.type ? ` (${entity.type}/${entity.status || 'unknown'})` : '');
    case 'agent':
      return [entity.firstName, entity.lastName].filter(Boolean).join(' ')
        + (entity.email ? ` (${entity.email})` : '');
    case 'branch':
      return entity.name + (entity.city ? `, ${entity.city}` : '');
    case 'chat':
      return entity.name + (entity.type ? ` (${entity.type})` : '');
    case 'announcement':
      return entity.title + (entity.priority ? ` (${entity.priority})` : '');
    case 'document':
      return entity.name + (entity.category ? ` (${entity.category})` : '');
    default:
      return null;
  }
};

/**
 * Batch-fetch entities for a list of metric rows.
 * Returns a Map<`${entityType}:${entityId}`, entityDetails>
 *
 * @param {Array} rows — array of metric rows with entityType/entityId
 * @returns {Promise<Map>}
 */
async function batchFetchEntities(rows) {
  // Group ids by entity type
  const byType = {};
  for (const r of rows) {
    if (!r.entityType || !r.entityId) continue;
    if (!byType[r.entityType]) byType[r.entityType] = new Set();
    byType[r.entityType].add(r.entityId);
  }

  const result = new Map();
  const TYPE_CONFIG = {
    property:     { model: Property,     attrs: ['id', 'title', 'locality', 'referenceNumber', 'type', 'price', 'status', 'bedrooms'] },
    client:       { model: Client,       attrs: ['id', 'firstName', 'lastName', 'email', 'phone', 'status'] },
    owner:        { model: Owner,        attrs: ['id', 'firstName', 'lastName', 'phone', 'referenceNumber'] },
    inquiry:      { model: Inquiry,      attrs: ['id', 'firstName', 'lastName', 'type', 'status', 'priority'] },
    agent:        { model: User,         attrs: ['id', 'firstName', 'lastName', 'email', 'role'] },
    branch:       { model: Branch,       attrs: ['id', 'name', 'city', 'locality'] },
    chat:         { model: ChatChannel,  attrs: ['id', 'name', 'type'] },
    announcement: { model: Announcement, attrs: ['id', 'title', 'type', 'priority'] },
    document:     { model: Document,     attrs: ['id', 'name', 'fileName', 'category'] },
  };

  await Promise.all(
    Object.entries(byType).map(async ([entityType, ids]) => {
      const cfg = TYPE_CONFIG[entityType];
      if (!cfg) return;
      try {
        const entities = await cfg.model.findAll({
          where: { id: { [Op.in]: [...ids] } },
          attributes: cfg.attrs,
        });
        for (const e of entities) {
          result.set(`${entityType}:${e.id}`, e);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[batchFetchEntities] failed to fetch entityType=${entityType}:`, err.message);
        }
        // Skip silently — entity type may not be available
      }
    })
  );
  return result;
}

/**
 * Extract plain entity details object (without id) from a Sequelize instance or plain object.
 */
const toEntityDetails = (entity) => {
  if (!entity) return null;
  const plain = entity.toJSON ? entity.toJSON() : { ...entity };
  const { id: _id, ...rest } = plain; // eslint-disable-line no-unused-vars
  return rest;
};

/**
 * Enrich a raw metric row with entity details and label.
 */
const enrichRow = (r, entityMap) => {
  const key = r.entityType && r.entityId ? `${r.entityType}:${r.entityId}` : null;
  const entity = key ? (entityMap.get(key) || null) : null;
  const entityDetails = toEntityDetails(entity);
  const entityLabel = buildEntityLabel(r.entityType, entityDetails);
  return {
    id:            r.id,
    metricType:    r.metricType,
    entityType:    r.entityType,
    entityId:      r.entityId,
    entityLabel,
    entityDetails: entityDetails || null,
    metadata:      r.metadata,
    pageUrl:       r.pageUrl,
    sessionId:     r.sessionId,
    duration:      r.duration != null ? r.duration : undefined,
    createdAt:     r.createdAt,
  };
};

/* ── POST /api/agents/metrics/track ─────────────────────────────────────────
   Defined BEFORE parameterised routes to avoid /:id matching "metrics" for GETs.
   Since this is POST and /:id/metrics is GET there is no method-level conflict,
   but keeping specific string routes first is cleaner and future-proof.          */
router.post('/metrics/track', authenticate, async (req, res) => {
  try {
    const { metricType, entityType, entityId, metadata, sessionId, pageUrl, duration } = req.body;
    if (!metricType) return res.status(422).json({ error: 'metricType is required' });

    const ipAddress = getIp(req);
    const userAgent = getUa(req);
    const sid = sessionId || req.headers['x-session-id'] || null;

    setImmediate(async () => {
      try {
        await AgentMetric.create({
          userId:     req.user.id,
          metricType,
          entityType: entityType  || null,
          entityId:   entityId    || null,
          metadata:   metadata    || null,
          ipAddress,
          userAgent,
          sessionId:  sid,
          pageUrl:    pageUrl     || null,
          duration:   duration != null ? parseInt(duration, 10) : null,
        });
      } catch (e) {
        console.error('metrics track background error:', e.message);
      }
    });

    res.status(202).json({ ok: true });
  } catch (err) {
    console.error('POST /agents/metrics/track error:', err.message);
    res.status(500).json(serverError(err, 'Failed to track metric'));
  }
});

/* ── POST /api/agents/metrics/session-end ───────────────────────────────────
   Called by the frontend when a session ends (tab close / logout).             */
router.post('/metrics/session-end', authenticate, async (req, res) => {
  try {
    const { sessionId, duration } = req.body;

    setImmediate(async () => {
      try {
        await AgentMetric.create({
          userId:     req.user.id,
          metricType: 'session_end',
          entityType: null,
          entityId:   null,
          metadata:   null,
          sessionId:  sessionId || null,
          duration:   duration != null ? parseInt(duration, 10) : null,
          ipAddress:  getIp(req),
          userAgent:  getUa(req),
        });
      } catch (e) {
        console.error('session-end background error:', e.message);
      }
    });

    res.status(202).json({ ok: true });
  } catch (err) {
    console.error('POST /agents/metrics/session-end error:', err.message);
    res.status(500).json(serverError(err, 'Failed to record session end'));
  }
});

/* ── POST /api/agents/metrics/page-time ─────────────────────────────────────
   Called by the frontend when the user navigates away from a page/section.
   Records how many seconds the agent spent on a given section.               */
router.post('/metrics/page-time', authenticate, async (req, res) => {
  try {
    const { page, section, duration, sessionId, entityType, entityId, metadata } = req.body;
    if (!section && !page) return res.status(422).json({ error: 'page or section is required' });
    if (duration == null || isNaN(parseInt(duration, 10))) {
      return res.status(422).json({ error: 'duration is required and must be a number' });
    }

    const sid = sessionId || req.headers['x-session-id'] || null;
    const ipAddress = getIp(req);
    const userAgent = getUa(req);

    setImmediate(async () => {
      try {
        await AgentMetric.create({
          userId:     req.user.id,
          metricType: 'page_time',
          entityType: entityType || null,
          entityId:   entityId   || null,
          metadata:   { ...(metadata || {}), section: section || null, page: page || null },
          ipAddress,
          userAgent,
          sessionId:  sid,
          pageUrl:    page || null,
          duration:   parseInt(duration, 10),
        });
      } catch (e) {
        console.error('page-time background error:', e.message);
      }
    });

    res.status(202).json({ ok: true });
  } catch (err) {
    console.error('POST /agents/metrics/page-time error:', err.message);
    res.status(500).json(serverError(err, 'Failed to record page time'));
  }
});

/* ── GET /api/agents/:id/metrics ─────────────────────────────────────────── */
router.get('/:id/metrics', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const periodWhere = getPeriodWhere(period, startDate, endDate);

    const [allRows, allSessionRows, totalProperties, activeListings, totalClients, soldRentedProps] = await Promise.all([
      // Period-filtered rows for activity summaries
      AgentMetric.findAll({
        where: { userId: req.params.id, ...periodWhere },
        attributes: ['metricType', 'entityType', 'entityId', 'metadata', 'sessionId', 'createdAt'],
        order: [['createdAt', 'ASC']],
      }),
      // All-time session rows for last-login/logout (period-independent)
      AgentMetric.findAll({
        where: {
          userId: req.params.id,
          metricType: { [Op.in]: ['login', 'logout', 'session_end', 'session_heartbeat'] },
        },
        attributes: ['metricType', 'metadata', 'sessionId', 'duration', 'createdAt'],
        order: [['createdAt', 'ASC']],
      }),
      Property.count({ where: { agentId: req.params.id } }),
      Property.count({ where: { agentId: req.params.id, status: 'listed' } }),
      // Fix: Client model has no paranoid/deletedAt — use plain count
      Client.count({ where: { agentId: req.params.id } }),
      Property.findAll({
        where: { agentId: req.params.id, status: { [Op.in]: ['sold', 'rented'] } },
        attributes: ['price', 'currency'],
      }),
    ]);

    // Aggregate session duration from session_end events (duration field) within period
    const sessionEndRows = allRows.filter(r => r.metricType === 'session_end' && r.duration != null);
    const totalSessionSeconds = sessionEndRows.reduce((acc, r) => acc + (r.duration || 0), 0);
    const totalSessionHours   = Math.round((totalSessionSeconds / 3600) * 10) / 10;
    const avgSessionMinutes   = sessionEndRows.length
      ? Math.round(totalSessionSeconds / sessionEndRows.length / 60)
      : 0;

    // Last login/logout from all-time session rows (not period-filtered)
    const lastLoginRow  = [...allSessionRows].filter(r => r.metricType === 'login').pop();
    const lastLogoutRow = [...allSessionRows].filter(r => r.metricType === 'logout' || r.metricType === 'session_end').pop();

    // Revenue: sum only EUR properties (other currencies are excluded to keep consistent)
    const totalRevenue = soldRentedProps
      .filter(p => !p.currency || p.currency === 'EUR')
      .reduce((acc, p) => acc + parseFloat(p.price || 0), 0);

    const summary = {
      // Session
      totalLogins:            countByType(allRows, 'login'),
      totalSessionHours,
      avgSessionMinutes,
      lastLoginAt:            lastLoginRow?.createdAt  ?? null,
      lastLogoutAt:           lastLogoutRow?.createdAt ?? null,
      // Global
      totalActions:           allRows.length,
      // Clients
      clientsCreated:         countByType(allRows, 'client_create'),
      clientsListed:          countByType(allRows, 'client_list'),
      clientsViewed:          countByType(allRows, 'client_view'),
      clientsUpdated:         countByType(allRows, 'client_update'),
      clientsDeleted:         countByType(allRows, 'client_delete'),
      clientMatchViews:       countByType(allRows, 'client_match_view'),
      // Owners
      ownersCreated:          countByType(allRows, 'owner_create'),
      ownersListed:           countByType(allRows, 'owner_list'),
      ownersViewed:           countByType(allRows, 'owner_view'),
      ownersUpdated:          countByType(allRows, 'owner_update'),
      ownersDeleted:          countByType(allRows, 'owner_delete'),
      ownerContactsAdded:     countByType(allRows, 'owner_contact_add'),
      // Properties
      propertiesCreated:      countByType(allRows, 'property_create'),
      propertiesListed:       countByType(allRows, 'property_list'),
      propertiesViewed:       countByType(allRows, 'property_view'),
      propertiesUpdated:      countByType(allRows, 'property_update'),
      propertiesDeleted:      countByType(allRows, 'property_delete'),
      propertiesFeatured:     countByType(allRows, 'property_feature'),
      propertyStatusChanges:  countByType(allRows, 'property_status_change'),
      propertyImageUploads:   countByType(allRows, 'property_image_upload'),
      // Inquiries
      inquiriesListed:        countByType(allRows, 'inquiry_list'),
      inquiriesViewed:        countByType(allRows, 'inquiry_view'),
      inquiriesCreated:       countByType(allRows, 'inquiry_create'),
      inquiriesAssigned:      countByType(allRows, 'inquiry_assign'),
      inquiriesResolved:      countByType(allRows, 'inquiry_resolve'),
      // Documents
      documentsUploaded:      countByType(allRows, 'document_upload'),
      documentsViewed:        countByType(allRows, 'document_view'),
      documentsDeleted:       countByType(allRows, 'document_delete'),
      // Chat
      chatMessagesSent:       countByType(allRows, 'chat_message_send'),
      chatChannelsViewed:     countByType(allRows, 'chat_channel_view'),
      chatChannelsCreated:    countByType(allRows, 'chat_channel_create'),
      // Announcements
      announcementsViewed:    countByType(allRows, 'announcement_view'),
      announcementsCreated:   countByType(allRows, 'announcement_create'),
      announcementsRead:      countByType(allRows, 'announcement_read'),
      // Branches
      branchesViewed:         countByType(allRows, 'branch_view'),
      branchesCreated:        countByType(allRows, 'branch_create'),
      branchesUpdated:        countByType(allRows, 'branch_update'),
      // Agents
      agentsListed:           countByType(allRows, 'agent_list'),
      agentsViewed:           countByType(allRows, 'agent_view'),
      // Notifications
      notificationsViewed:    countByType(allRows, 'notification_view'),
      notificationsRead:      countByType(allRows, 'notification_read') + countByType(allRows, 'notification_read_all'),
      // Page views
      pageViews:              countByType(allRows, 'page_view'),
      // Password changes
      passwordChanges:        countByType(allRows, 'password_change'),
      // Real DB aggregates (not period-filtered — these are total assignments)
      totalPropertiesAssigned: totalProperties,
      activeListings,
      totalClientsAssigned:    totalClients,
      totalRevenue:            Math.round(totalRevenue * 100) / 100,
    };

    // Daily timeline (buckets)
    const timelineMap = {};
    for (const row of allRows) {
      const day = row.createdAt.toISOString().slice(0, 10);
      if (!timelineMap[day]) timelineMap[day] = { date: day, count: 0, byType: {} };
      timelineMap[day].count++;
      timelineMap[day].byType[row.metricType] = (timelineMap[day].byType[row.metricType] || 0) + 1;
    }
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Activity by hour (0–23)
    const activityByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const row of allRows) {
      activityByHour[new Date(row.createdAt).getHours()].count++;
    }

    // Activity breakdown by top-level category
    const activityByType = {};
    for (const row of allRows) {
      const cat = row.metricType.split('_')[0];
      activityByType[cat] = (activityByType[cat] || 0) + 1;
    }

    // Page-time breakdown by section
    const pageTimeMap = {};
    for (const row of allRows) {
      if (row.metricType !== 'page_time') continue;
      const meta = row.metadata || {};
      const section = meta.section || row.pageUrl || 'unknown';
      if (!pageTimeMap[section]) pageTimeMap[section] = { section, totalSeconds: 0, visits: 0 };
      pageTimeMap[section].totalSeconds += row.duration || 0;
      pageTimeMap[section].visits += 1;
    }
    const pageTimeBreakdown = Object.values(pageTimeMap)
      .map(s => ({ ...s, avgSeconds: s.visits > 0 ? Math.round(s.totalSeconds / s.visits) : 0 }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    // Top 10 most-viewed entities (view events only)
    const VIEW_TYPES = new Set(['property_view', 'client_view', 'owner_view', 'inquiry_view', 'agent_view', 'branch_view', 'chat_channel_view', 'announcement_view', 'document_view']);
    const entityViewMap = {};
    for (const row of allRows) {
      if (!VIEW_TYPES.has(row.metricType) || !row.entityId || !row.entityType) continue;
      const key = `${row.entityType}:${row.entityId}`;
      if (!entityViewMap[key]) entityViewMap[key] = { entityType: row.entityType, entityId: row.entityId, viewCount: 0 };
      entityViewMap[key].viewCount += 1;
    }
    const topViewedRaw = Object.values(entityViewMap).sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);

    // Resolve entity labels for top viewed entities
    const topEntityMap = await batchFetchEntities(topViewedRaw);
    const topViewedEntities = topViewedRaw.map(e => {
      const entity = topEntityMap.get(`${e.entityType}:${e.entityId}`);
      const entityDetails = toEntityDetails(entity);
      return {
        entityType:  e.entityType,
        entityId:    e.entityId,
        entityLabel: buildEntityLabel(e.entityType, entityDetails),
        viewCount:   e.viewCount,
      };
    });

    // Recent activity — last 20 rows, enriched (fetch separately to avoid interfering with allRows)
    const recentRawRows = await AgentMetric.findAll({
      where: { userId: req.params.id },
      attributes: ['id', 'metricType', 'entityType', 'entityId', 'metadata', 'pageUrl', 'sessionId', 'duration', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    const recentEntityMap = await batchFetchEntities(recentRawRows);
    const recentActivity = recentRawRows.map(r => enrichRow(r, recentEntityMap));

    res.json({ summary, timeline, activityByHour, activityByType, pageTimeBreakdown, topViewedEntities, recentActivity });
  } catch (err) {
    console.error('GET /agents/:id/metrics error:', err.message);
    res.status(500).json(serverError(err, 'Failed to load agent metrics'));
  }
});

/* ── GET /api/agents/:id/metrics/activity-log ───────────────────────────────
   Returns a paginated, human-readable activity feed for the agent.            */
router.get('/:id/metrics/activity-log', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { period = 'month', startDate, endDate, page = 1, limit = 50 } = req.query;
    const periodWhere = getPeriodWhere(period, startDate, endDate);
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await AgentMetric.findAndCountAll({
      where: { userId: req.params.id, ...periodWhere },
      attributes: ['id', 'metricType', 'entityType', 'entityId', 'metadata', 'pageUrl', 'sessionId', 'duration', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    // Batch-fetch entity details for all rows in this page
    const entityMap = await batchFetchEntities(rows);

    res.json({
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      rows: rows.map(r => enrichRow(r, entityMap)),
    });
  } catch (err) {
    console.error('GET /agents/:id/metrics/activity-log error:', err.message);
    res.status(500).json(serverError(err, 'Failed to load activity log'));
  }
});

/* ── GET /api/agents/:id/metrics/section/:section ───────────────────────────
   Returns hyper-detailed, section-specific metrics for a single agent.
   :section must be one of the SECTION_CONFIG keys below.                      */

const SECTION_CONFIG = {
  properties:    { prefix: 'property',     entityType: 'property' },
  clients:       { prefix: 'client',       entityType: 'client' },
  owners:        { prefix: 'owner',        entityType: 'owner' },
  contacts:      { prefix: 'inquiry',      entityType: 'inquiry' },
  chat:          { prefix: 'chat',         entityType: 'chat' },
  announcements: { prefix: 'announcement', entityType: 'announcement' },
  branches:      { prefix: 'branch',       entityType: 'branch' },
  agents:        { prefix: 'agent',        entityType: 'agent' },
  documents:     { prefix: 'document',     entityType: 'document' },
  notifications: { prefix: 'notification', entityType: 'notification' },
};

function buildSectionSummary(section, rows) {
  const c = (type) => rows.filter(r => r.metricType === type).length;
  const pageTimeRows = rows.filter(r => r.metricType === 'page_time');
  const totalPageSeconds = pageTimeRows.reduce((acc, r) => acc + (r.duration || 0), 0);
  const timeSpent = {
    totalSeconds: totalPageSeconds,
    visits: pageTimeRows.length,
    avgSecondsPerVisit: pageTimeRows.length > 0 ? Math.round(totalPageSeconds / pageTimeRows.length) : 0,
  };
  const base = { totalInteractions: rows.length, timeSpent };

  switch (section) {
    case 'properties':
      return { ...base, totalViewed: c('property_view'), totalCreated: c('property_create'), totalUpdated: c('property_update'), totalDeleted: c('property_delete'), totalStatusChanges: c('property_status_change'), totalFeatureToggles: c('property_feature'), totalImageUploads: c('property_image_upload') };
    case 'clients':
      return { ...base, totalViewed: c('client_view'), totalCreated: c('client_create'), totalUpdated: c('client_update'), totalDeleted: c('client_delete'), totalMatchViews: c('client_match_view'), totalMatchRecalcs: c('client_match_recalc') };
    case 'owners':
      return { ...base, totalViewed: c('owner_view'), totalCreated: c('owner_create'), totalUpdated: c('owner_update'), totalDeleted: c('owner_delete'), totalContactsAdded: c('owner_contact_add'), totalContactsEdited: c('owner_contact_edit') };
    case 'contacts':
      return { ...base, totalViewed: c('inquiry_view'), totalCreated: c('inquiry_create'), totalStatusChanges: c('inquiry_status_change'), totalAssigned: c('inquiry_assign'), totalResolved: c('inquiry_resolve'), totalDeleted: c('inquiry_delete') };
    case 'chat':
      return { ...base, totalMessagesSent: c('chat_message_send'), totalChannelsViewed: c('chat_channel_view'), totalChannelsCreated: c('chat_channel_create') };
    case 'announcements':
      return { ...base, totalViewed: c('announcement_view'), totalCreated: c('announcement_create'), totalRead: c('announcement_read') };
    case 'branches':
      return { ...base, totalViewed: c('branch_view'), totalCreated: c('branch_create'), totalUpdated: c('branch_update') };
    case 'agents':
      return { ...base, totalViewed: c('agent_view'), totalCreated: c('agent_create'), totalUpdated: c('agent_update'), totalDeleted: c('agent_delete'), totalBlocked: c('agent_block'), totalUnblocked: c('agent_unblock') };
    case 'documents':
      return { ...base, totalUploaded: c('document_upload'), totalViewed: c('document_view'), totalDeleted: c('document_delete') };
    case 'notifications':
      return { ...base, totalViewed: c('notification_view'), totalRead: c('notification_read'), totalReadAll: c('notification_read_all') };
    default:
      return base;
  }
}

router.get('/:id/metrics/section/:section', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { id, section } = req.params;
    const { period = 'month', startDate, endDate } = req.query;

    const cfg = SECTION_CONFIG[section];
    if (!cfg) return res.status(400).json({ error: `Unknown section: ${section}. Must be one of: ${Object.keys(SECTION_CONFIG).join(', ')}` });

    const periodWhere = getPeriodWhere(period, startDate, endDate);
    const prefixPattern = `${cfg.prefix}_%`;

    // Fetch all rows for this section within the period
    const rows = await AgentMetric.findAll({
      where: {
        userId: id,
        metricType: { [Op.like]: prefixPattern },
        ...periodWhere,
      },
      attributes: ['id', 'metricType', 'entityType', 'entityId', 'metadata', 'pageUrl', 'sessionId', 'duration', 'createdAt', 'ipAddress', 'userAgent'],
      order: [['createdAt', 'ASC']],
    });

    // Summary
    const summary = buildSectionSummary(section, rows);

    // Entity breakdown — group by entityId
    const entityGroups = {};
    for (const row of rows) {
      if (!row.entityId) continue;
      const key = row.entityId;
      if (!entityGroups[key]) {
        entityGroups[key] = {
          entityId: key,
          entityType: row.entityType || cfg.entityType,
          actionMap: {},
          totalInteractions: 0,
          timeSpent: 0,
          firstAt: row.createdAt,
          lastAt: row.createdAt,
        };
      }
      const grp = entityGroups[key];
      if (!grp.actionMap[row.metricType]) {
        grp.actionMap[row.metricType] = { count: 0, lastAt: null, details: [] };
      }
      grp.actionMap[row.metricType].count++;
      grp.actionMap[row.metricType].lastAt = row.createdAt;
      grp.totalInteractions++;
      if (row.duration) grp.timeSpent += row.duration;
      if (row.createdAt > grp.lastAt) grp.lastAt = row.createdAt;
      // Capture metadata details for status/availability change rows
      if (row.metadata && (row.metricType.includes('status_change') || row.metricType.includes('feature'))) {
        grp.actionMap[row.metricType].details.push({ ...row.metadata, at: row.createdAt });
      }
    }

    // Batch-fetch entity labels
    const entityGroupList = Object.values(entityGroups);
    const entityMap = await batchFetchEntities(entityGroupList.map(g => ({ entityType: g.entityType, entityId: g.entityId })));

    const entityBreakdown = entityGroupList.map(grp => {
      const entity = entityMap.get(`${grp.entityType}:${grp.entityId}`);
      const entityDetails = toEntityDetails(entity);
      const entityLabel = buildEntityLabel(grp.entityType, entityDetails);
      return {
        entityId: grp.entityId,
        entityLabel: entityLabel || grp.entityId,
        entityDetails: entityDetails || null,
        actions: Object.entries(grp.actionMap).map(([metricType, data]) => ({
          metricType,
          count: data.count,
          lastAt: data.lastAt,
          ...(data.details.length > 0 ? { details: data.details } : {}),
        })),
        totalInteractions: grp.totalInteractions,
        timeSpent: grp.timeSpent,
        lastAt: grp.lastAt,
      };
    }).sort((a, b) => b.totalInteractions - a.totalInteractions);

    // Timeline — group by date
    const timelineMap = {};
    for (const row of rows) {
      const day = row.createdAt.toISOString().slice(0, 10);
      if (!timelineMap[day]) timelineMap[day] = { date: day, total: 0 };
      timelineMap[day].total++;
      // also track sub-type counts
      const short = row.metricType.slice(cfg.prefix.length + 1); // e.g. 'view', 'create'
      timelineMap[day][short] = (timelineMap[day][short] || 0) + 1;
    }
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Recent actions — last 30 enriched
    const recentRaw = [...rows].reverse().slice(0, 30);
    const recentEntityMap = await batchFetchEntities(recentRaw);
    const recentActions = recentRaw.map(r => {
      const enriched = enrichRow(r, recentEntityMap);
      return { ...enriched, ipAddress: r.ipAddress || null };
    });

    res.json({ summary, entityBreakdown, timeline, recentActions });
  } catch (err) {
    console.error(`GET /agents/:id/metrics/section/:section error:`, err.message);
    res.status(500).json(serverError(err, 'Failed to load section metrics'));
  }
});

/* ── GET /api/agents/:id/metrics/sessions ───────────────────────────────────
   Returns a period-filtered list of login sessions with duration pairs.       */
router.get('/:id/metrics/sessions', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const periodWhere = getPeriodWhere(period, startDate, endDate);

    const rows = await AgentMetric.findAll({
      where: {
        userId: req.params.id,
        metricType: { [Op.in]: ['login', 'logout', 'session_end', 'session_heartbeat'] },
        ...periodWhere,
      },
      attributes: ['metricType', 'sessionId', 'duration', 'ipAddress', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    // Group by sessionId; build pairs of login → end
    const sessions = {};
    for (const row of rows) {
      const sid = row.sessionId || `legacy_${row.createdAt.toISOString()}`;
      if (!sessions[sid]) sessions[sid] = { sessionId: sid, loginAt: null, endAt: null, duration: null, ipAddress: null };
      if (row.metricType === 'login') {
        sessions[sid].loginAt   = row.createdAt;
        sessions[sid].ipAddress = row.ipAddress;
      }
      if (row.metricType === 'logout' || row.metricType === 'session_end') {
        sessions[sid].endAt    = row.createdAt;
        sessions[sid].duration = row.duration;
      }
    }

    res.json({ sessions: Object.values(sessions).sort((a, b) => new Date(b.loginAt) - new Date(a.loginAt)) });
  } catch (err) {
    console.error('GET /agents/:id/metrics/sessions error:', err.message);
    res.status(500).json(serverError(err, 'Failed to load sessions'));
  }
});

module.exports = router;
