'use strict';

const express = require('express');
const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const rateLimit = require('express-rate-limit');
const { User, Property, Client, Owner, Inquiry, AgentMetric, Branch, sequelize } = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);
router.use(authenticate);
router.use(authorize('admin', 'manager'));
router.use(requirePermission('reports_view'));

function dateRangeWhere(field, from, to) {
  if (from && to) return { [field]: { [Op.between]: [new Date(from), new Date(to)] } };
  if (from)       return { [field]: { [Op.gte]: new Date(from) } };
  if (to)         return { [field]: { [Op.lte]: new Date(to) } };
  return {};
}

function periodBounds(period) {
  const now = new Date();
  switch (period) {
    case 'today':   return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
    case 'week': {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      return { from: d };
    }
    case 'month': {
      const d = new Date(now); d.setDate(d.getDate() - 30);
      return { from: d };
    }
    case 'quarter': {
      const d = new Date(now); d.setDate(d.getDate() - 90);
      return { from: d };
    }
    case 'year': {
      const d = new Date(now); d.setDate(d.getDate() - 365);
      return { from: d };
    }
    default: return {};
  }
}

// ─── GET /api/reports/overview ────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const { from, to, period } = req.query;
    const bounds = from || to ? { from, to } : periodBounds(period);

    const now    = new Date();
    const thisWeekStart   = new Date(now - 7  * 86400000);
    const thisMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd    = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisQuarterStart = new Date(now - 90 * 86400000);

    const [
      totalProperties,
      totalClients,
      totalOwners,
      totalInquiries,
      propertiesByStatus,
      clientsByStatus,
      inquiriesByStatus,
      newPropertiesThisWeek,
      newPropertiesThisMonth,
      newClientsThisMonth,
      newInquiriesThisMonth,
      newPropertiesLastMonth,
      newClientsLastMonth,
      newInquiriesLastMonth,
      newClientsThisWeek,
      newInquiriesThisWeek,
    ] = await Promise.all([
      Property.count(),
      Client.count(),
      Owner.count(),
      Inquiry.count(),
      Property.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Client.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Inquiry.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Property.count({ where: { createdAt: { [Op.gte]: thisWeekStart } } }),
      Property.count({ where: { createdAt: { [Op.gte]: thisMonthStart } } }),
      Client.count({ where: { createdAt: { [Op.gte]: thisMonthStart } } }),
      Inquiry.count({ where: { createdAt: { [Op.gte]: thisMonthStart } } }),
      Property.count({ where: { createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),
      Client.count({ where: { createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),
      Inquiry.count({ where: { createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),
      Client.count({ where: { createdAt: { [Op.gte]: thisWeekStart } } }),
      Inquiry.count({ where: { createdAt: { [Op.gte]: thisWeekStart } } }),
    ]);

    const pctChange = (curr, prev) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    res.json({
      totals: {
        properties: totalProperties,
        clients: totalClients,
        owners: totalOwners,
        inquiries: totalInquiries,
      },
      propertiesByStatus: propertiesByStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
      clientsByStatus: clientsByStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
      inquiriesByStatus: inquiriesByStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
      newThisWeek: {
        properties: newPropertiesThisWeek,
        clients: newClientsThisWeek,
        inquiries: newInquiriesThisWeek,
      },
      newThisMonth: {
        properties: newPropertiesThisMonth,
        clients: newClientsThisMonth,
        inquiries: newInquiriesThisMonth,
      },
      vsLastMonth: {
        properties: pctChange(newPropertiesThisMonth, newPropertiesLastMonth),
        clients: pctChange(newClientsThisMonth, newClientsLastMonth),
        inquiries: pctChange(newInquiriesThisMonth, newInquiriesLastMonth),
      },
    });
  } catch (err) {
    console.error('GET /api/reports/overview error:', err);
    res.status(500).json({ error: 'Failed to load overview report' });
  }
});

// ─── GET /api/reports/properties ─────────────────────────────────────────────
router.get('/properties', async (req, res) => {
  try {
    const { from, to, period } = req.query;
    const bounds = from || to ? { from, to } : periodBounds(period);
    const dateFilter = dateRangeWhere('createdAt', bounds.from, bounds.to);
    const baseWhere  = { ...dateFilter };

    const now = new Date();

    const [
      byType,
      byLocality,
      avgPriceByType,
      byListingType,
      allProperties,
      availableForMarket,
    ] = await Promise.all([
      Property.findAll({
        where: { ...baseWhere, type: { [Op.ne]: null } },
        attributes: ['type', [fn('COUNT', col('id')), 'count']],
        group: ['type'],
        order: [[literal('"count"'), 'DESC']],
        raw: true,
      }),
      Property.findAll({
        where: { ...baseWhere, locality: { [Op.ne]: null } },
        attributes: ['locality', [fn('COUNT', col('id')), 'count']],
        group: ['locality'],
        order: [[literal('"count"'), 'DESC']],
        limit: 10,
        raw: true,
      }),
      Property.findAll({
        where: { ...baseWhere, type: { [Op.ne]: null }, price: { [Op.ne]: null } },
        attributes: ['type', [fn('AVG', col('price')), 'avgPrice'], [fn('COUNT', col('id')), 'count']],
        group: ['type'],
        raw: true,
      }),
      Property.findAll({
        where: { ...baseWhere, listingType: { [Op.ne]: null } },
        attributes: ['listingType', [fn('COUNT', col('id')), 'count']],
        group: ['listingType'],
        raw: true,
      }),
      // For price range distribution
      Property.findAll({
        where: { ...baseWhere, price: { [Op.ne]: null } },
        attributes: ['price'],
        raw: true,
      }),
      // For time on market: available/listed properties
      Property.findAll({
        where: { status: { [Op.in]: ['listed', 'draft'] }, ...dateFilter },
        attributes: ['createdAt'],
        raw: true,
      }),
    ]);

    // Price range distribution
    const priceRanges = {
      under100k: 0,
      '100k_200k': 0,
      '200k_500k': 0,
      '500k_1m': 0,
      over1m: 0,
    };
    for (const p of allProperties) {
      const price = parseFloat(p.price);
      if (price < 100000)               priceRanges.under100k++;
      else if (price < 200000)          priceRanges['100k_200k']++;
      else if (price < 500000)          priceRanges['200k_500k']++;
      else if (price < 1000000)         priceRanges['500k_1m']++;
      else                              priceRanges.over1m++;
    }

    // Average time on market (days)
    let avgDaysOnMarket = 0;
    if (availableForMarket.length > 0) {
      const totalDays = availableForMarket.reduce((sum, p) => {
        return sum + Math.floor((now - new Date(p.createdAt)) / 86400000);
      }, 0);
      avgDaysOnMarket = Math.round(totalDays / availableForMarket.length);
    }

    // Monthly new listings — last 12 months
    const monthlyListings = await sequelize.query(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM "properties"
       WHERE "createdAt" >= NOW() - INTERVAL '12 months'
       GROUP BY month
       ORDER BY month ASC`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      byType: byType.map(r => ({ type: r.type, count: parseInt(r.count, 10) })),
      byLocality: byLocality.map(r => ({ locality: r.locality, count: parseInt(r.count, 10) })),
      avgPriceByType: avgPriceByType.map(r => ({
        type: r.type,
        avgPrice: parseFloat(r.avgPrice || 0).toFixed(2),
        count: parseInt(r.count, 10),
      })),
      byListingType: byListingType.map(r => ({ listingType: r.listingType, count: parseInt(r.count, 10) })),
      priceRanges,
      avgDaysOnMarket,
      monthlyListings: monthlyListings.map(r => ({ month: r.month, count: parseInt(r.count, 10) })),
    });
  } catch (err) {
    console.error('GET /api/reports/properties error:', err);
    res.status(500).json({ error: 'Failed to load property analytics' });
  }
});

// ─── GET /api/reports/agents ──────────────────────────────────────────────────
router.get('/agents', async (req, res) => {
  try {
    const { from, to, period } = req.query;
    const bounds = from || to ? { from, to } : periodBounds(period || 'month');
    const dateFilter = dateRangeWhere('createdAt', bounds.from, bounds.to);

    const agents = await User.findAll({
      where: { role: { [Op.in]: ['agent', 'manager'] }, isBlocked: false },
      attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role', 'branchId'],
      include: [{ model: Branch, attributes: ['id', 'name'] }],
    });

    if (!agents.length) return res.json([]);

    const agentIds = agents.map(a => a.id);

    // Properties per agent
    const propCounts = await Property.findAll({
      where: { agentId: { [Op.in]: agentIds }, ...dateFilter },
      attributes: ['agentId', [fn('COUNT', col('id')), 'count']],
      group: ['agentId'],
      raw: true,
    });

    // Clients per agent
    const clientCounts = await Client.findAll({
      where: { agentId: { [Op.in]: agentIds }, ...dateFilter },
      attributes: ['agentId', [fn('COUNT', col('id')), 'count']],
      group: ['agentId'],
      raw: true,
    });

    // Inquiries per agent (via assignedToId)
    const inquiryCounts = await Inquiry.findAll({
      where: { assignedToId: { [Op.in]: agentIds }, ...dateFilter },
      attributes: ['assignedToId', [fn('COUNT', col('id')), 'count']],
      group: ['assignedToId'],
      raw: true,
    });

    // AgentMetric score per agent
    const SCORE_WEIGHTS = {
      property_create: 10, property_update: 3, property_view: 1,
      client_create: 8, client_update: 3, client_view: 1,
      viewing_schedule: 5, viewing_complete: 8,
      inquiry_create: 5, inquiry_resolve: 10,
      login: 2, page_view: 0.5,
    };

    const metricDateFilter = dateRangeWhere('createdAt', bounds.from, bounds.to);
    const metrics = await AgentMetric.findAll({
      where: { userId: { [Op.in]: agentIds }, ...metricDateFilter },
      attributes: ['userId', 'metricType'],
      raw: true,
    });

    // Build maps
    const propMap   = Object.fromEntries(propCounts.map(r => [r.agentId, parseInt(r.count, 10)]));
    const clientMap = Object.fromEntries(clientCounts.map(r => [r.agentId, parseInt(r.count, 10)]));
    const inquiryMap = Object.fromEntries(inquiryCounts.map(r => [r.assignedToId, parseInt(r.count, 10)]));
    const scoreMap  = {};

    for (const m of metrics) {
      if (!scoreMap[m.userId]) scoreMap[m.userId] = 0;
      scoreMap[m.userId] += SCORE_WEIGHTS[m.metricType] ?? 1;
    }

    const leaderboard = agents.map(a => ({
      agentId:      a.id,
      firstName:    a.firstName,
      lastName:     a.lastName,
      profileImage: a.profileImage,
      role:         a.role,
      branch:       a.Branch ? a.Branch.name : null,
      properties:   propMap[a.id]   || 0,
      clients:      clientMap[a.id] || 0,
      inquiries:    inquiryMap[a.id] || 0,
      activityScore: Math.round(scoreMap[a.id] || 0),
    }));

    leaderboard.sort((a, b) => b.activityScore - a.activityScore);

    res.json(leaderboard);
  } catch (err) {
    console.error('GET /api/reports/agents error:', err);
    res.status(500).json({ error: 'Failed to load agent analytics' });
  }
});

// ─── GET /api/reports/clients ─────────────────────────────────────────────────
router.get('/clients', async (req, res) => {
  try {
    const { from, to, period } = req.query;
    const bounds = from || to ? { from, to } : periodBounds(period);
    const dateFilter = dateRangeWhere('createdAt', bounds.from, bounds.to);
    const baseWhere  = { ...dateFilter };

    const [
      byLookingFor,
      byUrgency,
      byStatus,
      allClients,
    ] = await Promise.all([
      Client.findAll({
        where: { ...baseWhere, lookingFor: { [Op.ne]: null } },
        attributes: ['lookingFor', [fn('COUNT', col('id')), 'count']],
        group: ['lookingFor'],
        raw: true,
      }),
      Client.findAll({
        where: { ...baseWhere, urgency: { [Op.ne]: null } },
        attributes: ['urgency', [fn('COUNT', col('id')), 'count']],
        group: ['urgency'],
        raw: true,
      }),
      Client.findAll({
        where: { ...baseWhere },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      // Budget distribution + localities
      Client.findAll({
        where: { ...baseWhere },
        attributes: ['maxBudget', 'preferredLocalities'],
        raw: true,
      }),
    ]);

    // Budget distribution
    const budgetRanges = {
      under100k: 0,
      '100k_300k': 0,
      '300k_600k': 0,
      '600k_1m': 0,
      over1m: 0,
    };
    const localityCount = {};

    for (const c of allClients) {
      const budget = parseFloat(c.maxBudget || 0);
      if (budget > 0) {
        if (budget < 100000)       budgetRanges.under100k++;
        else if (budget < 300000)  budgetRanges['100k_300k']++;
        else if (budget < 600000)  budgetRanges['300k_600k']++;
        else if (budget < 1000000) budgetRanges['600k_1m']++;
        else                       budgetRanges.over1m++;
      }

      const locs = Array.isArray(c.preferredLocalities) ? c.preferredLocalities : [];
      for (const loc of locs) {
        if (loc) localityCount[loc] = (localityCount[loc] || 0) + 1;
      }
    }

    const topLocalities = Object.entries(localityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([locality, count]) => ({ locality, count }));

    res.json({
      byLookingFor:  byLookingFor.map(r => ({ lookingFor: r.lookingFor, count: parseInt(r.count, 10) })),
      byUrgency:     byUrgency.map(r => ({ urgency: r.urgency, count: parseInt(r.count, 10) })),
      byStatus:      byStatus.map(r => ({ status: r.status, count: parseInt(r.count, 10) })),
      budgetRanges,
      topLocalities,
    });
  } catch (err) {
    console.error('GET /api/reports/clients error:', err);
    res.status(500).json({ error: 'Failed to load client analytics' });
  }
});

// ─── GET /api/reports/trends ──────────────────────────────────────────────────
router.get('/trends', async (req, res) => {
  try {
    const [properties, clients, inquiries] = await Promise.all([
      sequelize.query(
        `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
         FROM "properties"
         WHERE "createdAt" >= NOW() - INTERVAL '12 months'
         GROUP BY month ORDER BY month ASC`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
         FROM "clients"
         WHERE "deletedAt" IS NULL
           AND "createdAt" >= NOW() - INTERVAL '12 months'
         GROUP BY month ORDER BY month ASC`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
         FROM "inquiries"
         WHERE "createdAt" >= NOW() - INTERVAL '12 months'
         GROUP BY month ORDER BY month ASC`,
        { type: QueryTypes.SELECT }
      ),
    ]);

    // Fill in missing months so the chart always has 12 data points
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const toMap = rows => Object.fromEntries(rows.map(r => [r.month, parseInt(r.count, 10)]));
    const propMap    = toMap(properties);
    const clientMap  = toMap(clients);
    const inquiryMap = toMap(inquiries);

    const trends = months.map(month => ({
      month,
      properties: propMap[month]   || 0,
      clients:    clientMap[month]  || 0,
      inquiries:  inquiryMap[month] || 0,
    }));

    res.json(trends);
  } catch (err) {
    console.error('GET /api/reports/trends error:', err);
    res.status(500).json({ error: 'Failed to load trends' });
  }
});

module.exports = router;
