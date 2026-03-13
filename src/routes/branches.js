'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const { Branch, User, Property, Client, AgentMetric, sequelize: db } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

const getPeriodWhere = (period, startDate, endDate) => {
  if (startDate && endDate) {
    return { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] } };
  }
  const now = new Date();
  if (period === 'day') { const start = new Date(now); start.setHours(0,0,0,0); return { createdAt: { [Op.gte]: start } }; }
  if (period === 'week') { const start = new Date(now); start.setDate(now.getDate()-7); start.setHours(0,0,0,0); return { createdAt: { [Op.gte]: start } }; }
  if (period === 'month') { const start = new Date(now); start.setDate(now.getDate()-30); start.setHours(0,0,0,0); return { createdAt: { [Op.gte]: start } }; }
  if (period === 'year') { const start = new Date(now); start.setFullYear(now.getFullYear()-1); start.setHours(0,0,0,0); return { createdAt: { [Op.gte]: start } }; }
  return {};
};

/* ── GET /api/branches — List all with pagination, search, agent count ── */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search, isActive,
      page = 1, limit = 20,
      sortBy = 'name', sortOrder = 'ASC',
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name:     { [Op.iLike]: `%${search}%` } },
        { city:     { [Op.iLike]: `%${search}%` } },
        { locality: { [Op.iLike]: `%${search}%` } },
        { address:  { [Op.iLike]: `%${search}%` } },
        { email:    { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (isActive === 'true')  where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const allowedSortFields = ['name', 'city', 'createdAt', 'isActive'];
    const safeSortBy    = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { count, rows } = await Branch.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'agents',
          attributes: ['id'],
          required: false,
          where: { role: { [Op.in]: ['agent', 'manager'] } },
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'],
          required: false,
        },
      ],
      order: [[safeSortBy, safeSortOrder]],
      limit: limitNum,
      offset,
      distinct: true,
    });

    const branches = rows.map(b => {
      const plain = b.toJSON();
      plain.agentCount = plain.agents ? plain.agents.length : 0;
      delete plain.agents;
      return plain;
    });

    res.json({
      branches,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    console.error('GET /branches error:', err.message);
    res.status(500).json({ error: 'Failed to load branches' });
  }
});

/* ── GET /api/branches/:id — Single branch with agents ── */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'agents',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'profileImage', 'isActive', 'licenseNumber'],
          where: { role: { [Op.in]: ['agent', 'manager'] } },
          required: false,
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'],
          required: false,
        },
      ],
    });

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const plain = branch.toJSON();
    plain.agentCount = plain.agents ? plain.agents.length : 0;
    res.json(plain);
  } catch (err) {
    console.error('GET /branches/:id error:', err.message);
    res.status(500).json({ error: 'Failed to load branch' });
  }
});

/* ── POST /api/branches — Create ── */
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Branch name is required'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email required'),
    body('latitude').optional({ checkFalsy: true }).isFloat().withMessage('Invalid latitude'),
    body('longitude').optional({ checkFalsy: true }).isFloat().withMessage('Invalid longitude'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const {
        name, address, city, locality, country,
        phone, email, description, logo, coverImage,
        latitude, longitude, managerId, isActive,
      } = req.body;

      const branchData = {
        name,
        address: address || null,
        city: city || null,
        locality: locality || null,
        country: country || 'Malta',
        phone: phone || null,
        email: email || null,
        description: description || null,
        logo: logo || null,
        coverImage: coverImage || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        managerId: managerId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      };

      const branch = await Branch.create(branchData);

      const full = await Branch.findByPk(branch.id, {
        include: [
          { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        ],
      });
      const plain = full.toJSON();
      plain.agentCount = 0;
      res.status(201).json(plain);
      try { await notificationService.onBranchCreated(branch, req.user); } catch (e) { console.error('Notification error:', e.message); }
    } catch (err) {
      console.error('POST /branches error:', err.message);
      res.status(500).json({ error: 'Failed to create branch' });
    }
  }
);

/* ── PUT /api/branches/:id — Update ── */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('name').optional().trim().notEmpty().withMessage('Branch name cannot be empty'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email required'),
    body('latitude').optional({ checkFalsy: true }).isFloat().withMessage('Invalid latitude'),
    body('longitude').optional({ checkFalsy: true }).isFloat().withMessage('Invalid longitude'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const branch = await Branch.findByPk(req.params.id);
      if (!branch) return res.status(404).json({ error: 'Branch not found' });

      const allowed = [
        'name', 'address', 'city', 'locality', 'country',
        'phone', 'email', 'description', 'logo', 'coverImage',
        'latitude', 'longitude', 'managerId', 'isActive',
      ];

      const updateData = {};
      for (const key of allowed) {
        if (key in req.body) {
          updateData[key] = req.body[key] === '' ? null : req.body[key];
        }
      }
      if (updateData.latitude  != null) updateData.latitude  = parseFloat(updateData.latitude);
      if (updateData.longitude != null) updateData.longitude = parseFloat(updateData.longitude);
      if ('isActive' in updateData) updateData.isActive = Boolean(updateData.isActive);

      await branch.update(updateData);

      const full = await Branch.findByPk(branch.id, {
        include: [
          {
            model: User,
            as: 'agents',
            attributes: ['id'],
            required: false,
            where: { role: { [Op.in]: ['agent', 'manager'] } },
          },
          { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        ],
      });
      const plain = full.toJSON();
      plain.agentCount = plain.agents ? plain.agents.length : 0;
      delete plain.agents;
      res.json(plain);
    } catch (err) {
      console.error('PUT /branches/:id error:', err.message);
      res.status(500).json({ error: 'Failed to update branch' });
    }
  }
);

/* ── DELETE /api/branches/:id — Deactivate (soft delete) ── */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    await branch.update({ isActive: false });
    res.json({ message: 'Branch deactivated successfully' });
  } catch (err) {
    console.error('DELETE /branches/:id error:', err.message);
    res.status(500).json({ error: 'Failed to deactivate branch' });
  }
});

/* ── GET /api/branches/:id/agents — Agents for a branch with performance stats ── */
router.get('/:id/agents', authenticate, async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const agents = await User.findAll({
      where: {
        branchId: req.params.id,
        role: { [Op.in]: ['agent', 'manager'] },
      },
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone', 'role',
        'profileImage', 'isActive', 'isBlocked', 'licenseNumber',
        'commissionRate', 'specializations', 'languages', 'jobTitle',
        'approvalStatus', 'lastLoginAt', 'createdAt',
      ],
    });

    // Attach property count for each agent
    const agentIds = agents.map(a => a.id);
    const propertyCounts = agentIds.length
      ? await Property.findAll({
          attributes: ['agentId', [db.fn('COUNT', db.col('id')), 'count']],
          where: { agentId: { [Op.in]: agentIds } },
          group: ['agentId'],
          raw: true,
        })
      : [];

    const soldCounts = agentIds.length
      ? await Property.findAll({
          attributes: ['agentId', [db.fn('COUNT', db.col('id')), 'count']],
          where: { agentId: { [Op.in]: agentIds }, status: { [Op.in]: ['sold', 'rented'] } },
          group: ['agentId'],
          raw: true,
        })
      : [];

    const clientCounts = agentIds.length
      ? await Client.findAll({
          attributes: ['agentId', [db.fn('COUNT', db.col('id')), 'count']],
          where: { agentId: { [Op.in]: agentIds }, deletedAt: null },
          group: ['agentId'],
          raw: true,
        })
      : [];

    const propMap   = Object.fromEntries(propertyCounts.map(r => [r.agentId, parseInt(r.count, 10)]));
    const soldMap   = Object.fromEntries(soldCounts.map(r => [r.agentId, parseInt(r.count, 10)]));
    const clientMap = Object.fromEntries(clientCounts.map(r => [r.agentId, parseInt(r.count, 10)]));

    const result = agents.map(a => ({
      ...a.toJSON(),
      propertyCount: propMap[a.id] || 0,
      soldRentedCount: soldMap[a.id] || 0,
      clientCount: clientMap[a.id] || 0,
    }));

    res.json({ agents: result, total: result.length });
  } catch (err) {
    console.error('GET /branches/:id/agents error:', err.message);
    res.status(500).json({ error: 'Failed to load branch agents' });
  }
});

/* ── GET /api/branches/:id/properties — Properties for a branch ── */
router.get('/:id/properties', authenticate, async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const { status, page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = { branchId: req.params.id };
    if (status) where.status = status;

    const { count, rows } = await Property.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'profileImage'],
          required: false,
        },
      ],
      attributes: [
        'id', 'title', 'type', 'listingType', 'status', 'price', 'currency',
        'bedrooms', 'bathrooms', 'locality', 'heroImage', 'referenceNumber', 'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({
      properties: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    console.error('GET /branches/:id/properties error:', err.message);
    res.status(500).json({ error: 'Failed to load branch properties' });
  }
});

/* ── GET /api/branches/:id/clients — Clients managed by branch agents ── */
router.get('/:id/clients', authenticate, async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const { count, rows } = await Client.findAndCountAll({
      where: { branchId: req.params.id, deletedAt: null },
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'profileImage'],
          required: false,
        },
      ],
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone',
        'lookingFor', 'status', 'minBudget', 'maxBudget', 'budgetCurrency',
        'preferredLocalities', 'isVIP', 'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({
      clients: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    console.error('GET /branches/:id/clients error:', err.message);
    res.status(500).json({ error: 'Failed to load branch clients' });
  }
});

/* ── GET /api/branches/:id/stats — Aggregated statistics for the branch ── */
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const [agentCount, propertyRows, clientCount] = await Promise.all([
      User.count({ where: { branchId: req.params.id, role: { [Op.in]: ['agent', 'manager'] } } }),
      Property.findAll({
        where: { branchId: req.params.id },
        attributes: ['status', [db.fn('COUNT', db.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Client.count({ where: { branchId: req.params.id, deletedAt: null } }),
    ]);

    const totalProperties  = propertyRows.reduce((s, r) => s + parseInt(r.count, 10), 0);
    const listedProperties = propertyRows
      .filter(r => r.status === 'listed')
      .reduce((s, r) => s + parseInt(r.count, 10), 0);
    const soldProperties   = propertyRows
      .filter(r => r.status === 'sold')
      .reduce((s, r) => s + parseInt(r.count, 10), 0);
    const rentedProperties = propertyRows
      .filter(r => r.status === 'rented')
      .reduce((s, r) => s + parseInt(r.count, 10), 0);

    // Monthly stats (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [propertiesThisMonth, clientsThisMonth] = await Promise.all([
      Property.count({ where: { branchId: req.params.id, createdAt: { [Op.gte]: startOfMonth } } }),
      Client.count({ where: { branchId: req.params.id, deletedAt: null, createdAt: { [Op.gte]: startOfMonth } } }),
    ]);

    res.json({
      agentCount,
      totalProperties,
      listedProperties,
      soldProperties,
      rentedProperties,
      clientCount,
      propertiesThisMonth,
      clientsThisMonth,
    });
  } catch (err) {
    console.error('GET /branches/:id/stats error:', err.message);
    res.status(500).json({ error: 'Failed to load branch stats' });
  }
});

/* ── PATCH /api/branches/:id/assign-agent — Assign agent to branch ── */
router.patch('/:id/assign-agent', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const { agentId } = req.body;
    if (!agentId) return res.status(422).json({ error: 'agentId is required' });

    const agent = await User.findByPk(agentId);
    if (!agent || !['agent', 'manager'].includes(agent.role)) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await agent.update({ branchId: req.params.id });
    res.json({ message: 'Agent assigned to branch successfully', agentId, branchId: req.params.id });
  } catch (err) {
    console.error('PATCH /branches/:id/assign-agent error:', err.message);
    res.status(500).json({ error: 'Failed to assign agent' });
  }
});

/* ── PATCH /api/branches/:id/remove-agent — Remove agent from branch ── */
router.patch('/:id/remove-agent', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const { agentId } = req.body;
    if (!agentId) return res.status(422).json({ error: 'agentId is required' });

    const agent = await User.findByPk(agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    if (String(agent.branchId) !== String(req.params.id)) {
      return res.status(400).json({ error: 'Agent is not assigned to this branch' });
    }

    await agent.update({ branchId: null });
    res.json({ message: 'Agent removed from branch successfully', agentId });
  } catch (err) {
    console.error('PATCH /branches/:id/remove-agent error:', err.message);
    res.status(500).json({ error: 'Failed to remove agent' });
  }
});

/* ── GET /api/branches/:id/metrics — Aggregated metrics for branch ── */
router.get('/:id/metrics', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const periodWhere = getPeriodWhere(period, startDate, endDate);

    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    // Get all agents/managers for this branch
    const agents = await User.findAll({
      where: { branchId: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
      attributes: ['id', 'firstName', 'lastName', 'role', 'profileImage', 'isActive'],
    });

    const agentIds = agents.map(a => a.id);
    const totalAgents  = agents.length;
    const activeAgents = agents.filter(a => a.isActive).length;

    if (!agentIds.length) {
      return res.json({
        branchSummary: {
          totalAgents: 0, activeAgents: 0, totalLogins: 0, totalSessionHours: 0, totalActions: 0,
          clientsCreated: 0, clientsViewed: 0, clientsUpdated: 0, clientsDeleted: 0,
          ownersCreated: 0, ownersViewed: 0, ownersUpdated: 0, ownersDeleted: 0,
          propertiesCreated: 0, propertiesViewed: 0, propertiesUpdated: 0, propertiesDeleted: 0, propertiesFeatured: 0,
          inquiriesViewed: 0, inquiriesAssigned: 0, inquiriesResolved: 0,
        },
        agentBreakdown: [],
        timeline: [],
        activityByHour: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 })),
        activityByType: {},
        topPerformers: {},
      });
    }

    // Fetch all metric rows for these agents in the period
    const [allRows, sessionRows] = await Promise.all([
      AgentMetric.findAll({
        where: { userId: { [Op.in]: agentIds }, ...periodWhere },
        attributes: ['userId', 'metricType', 'metadata', 'createdAt'],
        order: [['createdAt', 'ASC']],
      }),
      AgentMetric.findAll({
        where: { userId: { [Op.in]: agentIds }, metricType: { [Op.in]: ['session_duration'] } },
        attributes: ['userId', 'metricType', 'metadata', 'createdAt'],
      }),
    ]);

    const countByType = (rows, type) => rows.filter(r => r.metricType === type).length;

    // Per-agent aggregation
    const agentRowMap = {};
    for (const a of agents) agentRowMap[a.id] = [];
    for (const row of allRows) {
      if (agentRowMap[row.userId]) agentRowMap[row.userId].push(row);
    }

    const agentSessionMap = {};
    for (const a of agents) agentSessionMap[a.id] = [];
    for (const row of sessionRows) {
      if (agentSessionMap[row.userId]) agentSessionMap[row.userId].push(row);
    }

    const agentBreakdown = agents.map(a => {
      const rows = agentRowMap[a.id] || [];
      const sesRows = agentSessionMap[a.id] || [];
      const totalSessionSeconds = sesRows.reduce((acc, r) => acc + (r.metadata?.duration || 0), 0);
      const totalSessionHours = Math.round((totalSessionSeconds / 3600) * 10) / 10;
      return {
        agentId: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        role: a.role,
        profileImage: a.profileImage,
        isActive: a.isActive,
        metrics: {
          totalLogins: countByType(rows, 'login'),
          totalSessionHours,
          totalActions: rows.length,
          clientsCreated: countByType(rows, 'client_create'),
          clientsViewed: countByType(rows, 'client_view'),
          clientsUpdated: countByType(rows, 'client_update'),
          clientsDeleted: countByType(rows, 'client_delete'),
          ownersCreated: countByType(rows, 'owner_create'),
          ownersViewed: countByType(rows, 'owner_view'),
          ownersUpdated: countByType(rows, 'owner_update'),
          ownersDeleted: countByType(rows, 'owner_delete'),
          propertiesCreated: countByType(rows, 'property_create'),
          propertiesViewed: countByType(rows, 'property_view'),
          propertiesUpdated: countByType(rows, 'property_update'),
          propertiesDeleted: countByType(rows, 'property_delete'),
          propertiesFeatured: countByType(rows, 'property_feature'),
          inquiriesViewed: countByType(rows, 'inquiry_view'),
          inquiriesAssigned: countByType(rows, 'inquiry_assign'),
          inquiriesResolved: countByType(rows, 'inquiry_resolve'),
        },
      };
    });

    // Branch summary (sum of all agents)
    const totalSessionSeconds = sessionRows.reduce((acc, r) => acc + (r.metadata?.duration || 0), 0);
    const branchSummary = {
      totalAgents,
      activeAgents,
      totalLogins: countByType(allRows, 'login'),
      totalSessionHours: Math.round((totalSessionSeconds / 3600) * 10) / 10,
      totalActions: allRows.length,
      clientsCreated: countByType(allRows, 'client_create'),
      clientsViewed: countByType(allRows, 'client_view'),
      clientsUpdated: countByType(allRows, 'client_update'),
      clientsDeleted: countByType(allRows, 'client_delete'),
      ownersCreated: countByType(allRows, 'owner_create'),
      ownersViewed: countByType(allRows, 'owner_view'),
      ownersUpdated: countByType(allRows, 'owner_update'),
      ownersDeleted: countByType(allRows, 'owner_delete'),
      propertiesCreated: countByType(allRows, 'property_create'),
      propertiesViewed: countByType(allRows, 'property_view'),
      propertiesUpdated: countByType(allRows, 'property_update'),
      propertiesDeleted: countByType(allRows, 'property_delete'),
      propertiesFeatured: countByType(allRows, 'property_feature'),
      inquiriesViewed: countByType(allRows, 'inquiry_view'),
      inquiriesAssigned: countByType(allRows, 'inquiry_assign'),
      inquiriesResolved: countByType(allRows, 'inquiry_resolve'),
    };

    // Timeline (daily buckets, with per-agent breakdown)
    const timelineMap = {};
    for (const row of allRows) {
      const day = row.createdAt.toISOString().slice(0, 10);
      if (!timelineMap[day]) timelineMap[day] = { date: day, count: 0, byAgent: {} };
      timelineMap[day].count++;
      timelineMap[day].byAgent[row.userId] = (timelineMap[day].byAgent[row.userId] || 0) + 1;
    }
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Activity by hour
    const activityByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const row of allRows) {
      activityByHour[row.createdAt.getHours()].count++;
    }

    // Activity by type
    const activityByType = {};
    for (const row of allRows) {
      const t = row.metricType.split('_')[0];
      activityByType[t] = (activityByType[t] || 0) + 1;
    }

    // Top performers
    const topPerformers = {};
    if (agentBreakdown.length) {
      const byActions    = [...agentBreakdown].sort((a, b) => b.metrics.totalActions - a.metrics.totalActions)[0];
      const byClients    = [...agentBreakdown].sort((a, b) => b.metrics.clientsCreated - a.metrics.clientsCreated)[0];
      const byProperties = [...agentBreakdown].sort((a, b) => b.metrics.propertiesCreated - a.metrics.propertiesCreated)[0];
      const byLogins     = [...agentBreakdown].sort((a, b) => b.metrics.totalLogins - a.metrics.totalLogins)[0];
      const bySessions   = [...agentBreakdown].sort((a, b) => b.metrics.totalSessionHours - a.metrics.totalSessionHours)[0];
      const n = (a) => `${a.firstName} ${a.lastName}`;
      topPerformers.mostActions    = { agentId: byActions.agentId,    name: n(byActions),    count: byActions.metrics.totalActions };
      topPerformers.mostClients    = { agentId: byClients.agentId,    name: n(byClients),    count: byClients.metrics.clientsCreated };
      topPerformers.mostProperties = { agentId: byProperties.agentId, name: n(byProperties), count: byProperties.metrics.propertiesCreated };
      topPerformers.mostLogins     = { agentId: byLogins.agentId,     name: n(byLogins),     count: byLogins.metrics.totalLogins };
      topPerformers.longestSession = { agentId: bySessions.agentId,   name: n(bySessions),   hours: bySessions.metrics.totalSessionHours };
    }

    res.json({ branchSummary, agentBreakdown, timeline, activityByHour, activityByType, topPerformers });
  } catch (err) {
    console.error('GET /branches/:id/metrics error:', err.message);
    res.status(500).json({ error: 'Failed to load branch metrics' });
  }
});

module.exports = router;

