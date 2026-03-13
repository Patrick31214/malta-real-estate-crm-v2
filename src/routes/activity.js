'use strict';

const express = require('express');
const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const noopLimiter = (_req, _res, next) => next();
const { ActivityLog, User, sequelize } = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = isDev ? noopLimiter : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);
router.use(authenticate);
router.use(requirePermission('activity_view'));

const USER_ATTRS = ['id', 'firstName', 'lastName', 'email', 'role', 'profileImage'];

const VALID_ACTIONS = [
  'create', 'update', 'delete', 'view', 'login', 'logout',
  'export', 'import', 'approve', 'reject', 'assign', 'status_change',
  'upload', 'download', 'share', 'comment',
];

const VALID_SEVERITIES = ['info', 'warning', 'critical'];

const VALID_ENTITY_TYPES = [
  'property', 'client', 'owner', 'inquiry', 'user', 'branch',
  'document', 'event', 'service', 'announcement', 'settings',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhere(query, currentUser) {
  const {
    userId, action, entityType, severity,
    dateFrom, dateTo, search,
  } = query;

  const where = {};

  // Agents can only see their own activity
  if (currentUser.role === 'agent') {
    where.userId = currentUser.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (action && VALID_ACTIONS.includes(action)) where.action = action;
  if (entityType && VALID_ENTITY_TYPES.includes(entityType)) where.entityType = entityType;
  if (severity && VALID_SEVERITIES.includes(severity)) where.severity = severity;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = to;
    }
  }

  if (search) {
    where.description = { [Op.iLike]: `%${search}%` };
  }

  return where;
}

// ── GET /api/activity/stats ────────────────────────────────────────────────────
router.get('/stats', authorize('admin', 'manager'), async (req, res) => {
  try {
    const now = new Date();

    const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart   = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, weekCount, monthCount, criticalCount] = await Promise.all([
      ActivityLog.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
      ActivityLog.count({ where: { createdAt: { [Op.gte]: weekStart  } } }),
      ActivityLog.count({ where: { createdAt: { [Op.gte]: monthStart } } }),
      ActivityLog.count({ where: { severity: 'critical' } }),
    ]);

    // Most active users (top 5 in last 30 days)
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
    const mostActiveRaw = await sequelize.query(
      `SELECT "userId", COUNT(*) AS cnt
       FROM activity_logs
       WHERE "createdAt" >= :from AND "userId" IS NOT NULL
       GROUP BY "userId"
       ORDER BY cnt DESC
       LIMIT 5`,
      { replacements: { from: thirtyDaysAgo }, type: QueryTypes.SELECT }
    );
    const userIds = mostActiveRaw.map(r => r.userId);
    const users   = userIds.length
      ? await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: USER_ATTRS })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const mostActiveUsers = mostActiveRaw.map(r => ({
      user: userMap[r.userId] || null,
      count: parseInt(r.cnt, 10),
    })).filter(r => r.user);

    // Most common actions
    const actionBreakdown = await sequelize.query(
      `SELECT "action", COUNT(*) AS cnt
       FROM activity_logs
       WHERE "createdAt" >= :from
       GROUP BY "action"
       ORDER BY cnt DESC`,
      { replacements: { from: monthStart }, type: QueryTypes.SELECT }
    );

    // Actions by entity type
    const entityBreakdown = await sequelize.query(
      `SELECT "entityType", COUNT(*) AS cnt
       FROM activity_logs
       WHERE "createdAt" >= :from AND "entityType" IS NOT NULL
       GROUP BY "entityType"
       ORDER BY cnt DESC`,
      { replacements: { from: monthStart }, type: QueryTypes.SELECT }
    );

    res.json({
      todayCount,
      weekCount,
      monthCount,
      criticalCount,
      mostActiveUsers,
      actionBreakdown: actionBreakdown.map(r => ({ action: r.action, count: parseInt(r.cnt, 10) })),
      entityBreakdown: entityBreakdown.map(r => ({ entityType: r.entityType, count: parseInt(r.cnt, 10) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/activity/user/:userId ─────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  // Agents can only see their own activity
  if (req.user.role === 'agent' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset   = (pageNum - 1) * limitNum;

    const user = await User.findByPk(userId, { attributes: USER_ATTRS });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { count, rows } = await ActivityLog.findAndCountAll({
      where:   { userId },
      include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
      order:   [['createdAt', 'DESC']],
      limit:   limitNum,
      offset,
    });

    // Summary stats for this user
    const now = new Date();
    const [todayCount, weekCount, criticalCount] = await Promise.all([
      ActivityLog.count({ where: { userId, createdAt: { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } }),
      ActivityLog.count({ where: { userId, createdAt: { [Op.gte]: new Date(new Date().setDate(now.getDate() - 7)) } } }),
      ActivityLog.count({ where: { userId, severity: 'critical' } }),
    ]);

    res.json({
      user,
      logs: rows,
      stats: { todayCount, weekCount, criticalCount, total: count },
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/activity/entity/:entityType/:entityId ────────────────────────────
router.get('/entity/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;

  // Agents cannot browse entity-level logs of other agents
  if (req.user.role === 'agent') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset   = (pageNum - 1) * limitNum;

    const { count, rows } = await ActivityLog.findAndCountAll({
      where:   { entityType, entityId },
      include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
      order:   [['createdAt', 'DESC']],
      limit:   limitNum,
      offset,
    });

    res.json({
      logs: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/activity ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 50,
      sortBy = 'createdAt', sortOrder = 'DESC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset   = (pageNum - 1) * limitNum;

    const validSortBy    = ['createdAt', 'action', 'entityType', 'severity'].includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const where = buildWhere(req.query, req.user);

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
      order:   [[validSortBy, validSortOrder]],
      limit:   limitNum,
      offset,
    });

    res.json({
      logs: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
