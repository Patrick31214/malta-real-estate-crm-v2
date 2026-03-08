'use strict';

const express = require('express');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');
const { AgentMetric, User, Property, Client } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const isDev = process.env.NODE_ENV !== 'production';
const serverError = (err, fallback) => ({ error: isDev ? (err.message || fallback) : fallback });

const getIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
const getUa = (req) =>
  (req.headers['user-agent'] || '').slice(0, 500) || null;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
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

    res.json({ summary, timeline, activityByHour, activityByType });
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
      attributes: ['id', 'metricType', 'entityType', 'entityId', 'metadata', 'pageUrl', 'sessionId', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    res.json({
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      rows: rows.map(r => ({
        id:         r.id,
        metricType: r.metricType,
        entityType: r.entityType,
        entityId:   r.entityId,
        metadata:   r.metadata,
        pageUrl:    r.pageUrl,
        sessionId:  r.sessionId,
        createdAt:  r.createdAt,
      })),
    });
  } catch (err) {
    console.error('GET /agents/:id/metrics/activity-log error:', err.message);
    res.status(500).json(serverError(err, 'Failed to load activity log'));
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
