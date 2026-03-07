'use strict';

const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { AgentMetric, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const isDev = process.env.NODE_ENV !== 'production';
const serverError = (err, fallback) => ({ error: isDev ? (err.message || fallback) : fallback });

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

/* ── GET /api/agents/:id/metrics ─────────────────────────────────────────── */
router.get('/:id/metrics', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const periodWhere = getPeriodWhere(period, startDate, endDate);

    const [allRows, sessionRows] = await Promise.all([
      AgentMetric.findAll({
        where: { userId: req.params.id, ...periodWhere },
        attributes: ['metricType', 'metadata', 'createdAt'],
        order: [['createdAt', 'ASC']],
      }),
      AgentMetric.findAll({
        where: { userId: req.params.id, metricType: { [Op.in]: ['login', 'logout', 'session_duration'] } },
        attributes: ['metricType', 'metadata', 'createdAt'],
        order: [['createdAt', 'ASC']],
      }),
    ]);

    // Aggregate session hours from session_duration events
    const sessionDurationRows = sessionRows.filter(r => r.metricType === 'session_duration');
    const totalSessionSeconds = sessionDurationRows.reduce((acc, r) => acc + (r.metadata?.duration || 0), 0);
    const totalSessionHours   = Math.round((totalSessionSeconds / 3600) * 10) / 10;
    const avgSessionMinutes   = sessionDurationRows.length
      ? Math.round(totalSessionSeconds / sessionDurationRows.length / 60)
      : 0;

    // Get last login/logout from all-time session rows (not filtered by period)
    const lastLoginRow  = [...sessionRows].filter(r => r.metricType === 'login').pop();
    const lastLogoutRow = [...sessionRows].filter(r => r.metricType === 'logout').pop();

    const summary = {
      totalLogins:          countByType(allRows, 'login'),
      totalSessionHours,
      avgSessionMinutes,
      lastLoginAt:          lastLoginRow?.createdAt  ?? null,
      lastLogoutAt:         lastLogoutRow?.createdAt ?? null,
      totalActions:         allRows.length,
      clientsCreated:       countByType(allRows, 'client_create'),
      clientsViewed:        countByType(allRows, 'client_view'),
      clientsUpdated:       countByType(allRows, 'client_update'),
      clientsDeleted:       countByType(allRows, 'client_delete'),
      ownersCreated:        countByType(allRows, 'owner_create'),
      ownersViewed:         countByType(allRows, 'owner_view'),
      ownersUpdated:        countByType(allRows, 'owner_update'),
      ownersDeleted:        countByType(allRows, 'owner_delete'),
      propertiesCreated:    countByType(allRows, 'property_create'),
      propertiesViewed:     countByType(allRows, 'property_view'),
      propertiesUpdated:    countByType(allRows, 'property_update'),
      propertiesDeleted:    countByType(allRows, 'property_delete'),
      propertiesFeatured:   countByType(allRows, 'property_feature'),
      inquiriesViewed:      countByType(allRows, 'inquiry_view'),
      inquiriesAssigned:    countByType(allRows, 'inquiry_assign'),
      inquiriesResolved:    countByType(allRows, 'inquiry_resolve'),
    };

    // Build timeline (daily buckets)
    const timelineMap = {};
    for (const row of allRows) {
      const day = row.createdAt.toISOString().slice(0, 10);
      if (!timelineMap[day]) timelineMap[day] = { date: day, count: 0, byType: {} };
      timelineMap[day].count++;
      timelineMap[day].byType[row.metricType] = (timelineMap[day].byType[row.metricType] || 0) + 1;
    }
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Activity by hour (0-23 buckets)
    const activityByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const row of allRows) {
      const h = new Date(row.createdAt).getHours();
      activityByHour[h].count++;
    }

    // Activity breakdown by entity type
    const activityByType = {};
    for (const row of allRows) {
      const t = row.metricType.split('_')[0]; // 'client', 'property', etc.
      activityByType[t] = (activityByType[t] || 0) + 1;
    }

    res.json({ summary, timeline, activityByHour, activityByType });
  } catch (err) {
    console.error('GET /agents/:id/metrics error:', err.message);
    res.status(500).json(serverError(err, 'Failed to load agent metrics'));
  }
});

/* ── POST /api/agents/metrics/track ─────────────────────────────────────── */
router.post('/metrics/track', authenticate, async (req, res) => {
  try {
    const { metricType, entityType, entityId, metadata } = req.body;
    if (!metricType) return res.status(422).json({ error: 'metricType is required' });

    setImmediate(async () => {
      try {
        await AgentMetric.create({
          userId: req.user.id,
          metricType,
          entityType:  entityType  || null,
          entityId:    entityId    || null,
          metadata:    metadata    || null,
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

module.exports = router;
