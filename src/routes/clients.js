'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Client, ClientMatch, Property, User, Branch } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { calculateMatch } = require('../services/matchingEngine');
const notificationService = require('../services/notificationService');
const { logActivity, getIp, getUa } = require('../services/activityLogger');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return null;
};

// GET /api/clients
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, lookingFor, agentId, urgency, isVIP, page = 1, limit = 50 } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};
    if (status)     where.status     = status;
    if (lookingFor) where.lookingFor = lookingFor;
    if (agentId)    where.agentId    = agentId;
    if (urgency)    where.urgency    = urgency;
    if (isVIP !== undefined) where.isVIP = isVIP === 'true';

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } },
        { email:     { [Op.iLike]: `%${search}%` } },
        { phone:     { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Client.findAndCountAll({
      where,
      include: [
        { model: User,   as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Branch, attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({ clients: rows, pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [
        { model: User,   as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Branch, attributes: ['id', 'name', 'email', 'phone'] },
      ],
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: sanitise client body to coerce types for DB
const sanitiseClientBody = (body) => {
  const d = { ...body };

  // childrenAges: comma-separated string → array of integers
  if (typeof d.childrenAges === 'string') {
    const trimmed = d.childrenAges.trim();
    d.childrenAges = trimmed
      ? trimmed.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
      : null;
  }

  // petDetails: plain string → JSONB object
  if (typeof d.petDetails === 'string') {
    const trimmed = d.petDetails.trim();
    d.petDetails = trimmed ? { description: trimmed } : null;
  }

  // Numeric fields: empty string → null
  ['numberOfPeople','numberOfChildren','yearsInMalta','minBudget','maxBudget',
   'minBedrooms','maxBedrooms','minBathrooms','minArea','maxArea'].forEach(f => {
    if (d[f] === '') d[f] = null;
  });

  // ENUM fields: empty string → null
  ['lookingFor','urgency','moveInFlexibility','status'].forEach(f => {
    if (d[f] === '') d[f] = null;
  });

  // agentId / moveInDate / dateOfBirth: empty string → null
  ['agentId','moveInDate','dateOfBirth'].forEach(f => {
    if (d[f] === '') d[f] = null;
  });

  return d;
};

// POST /api/clients
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required'),
    body('lookingFor').optional().isIn(['sale','long_let','short_let','both']).withMessage('Invalid lookingFor value'),
    body('status').optional().isIn(['active','matched','viewing','offer_made','contracted','completed','on_hold','inactive']).withMessage('Invalid status'),
    body('urgency').optional().isIn(['immediate','within_month','within_3months','within_6months','flexible']).withMessage('Invalid urgency'),
    body('maxBudget').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    body('minBudget').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const client = await Client.create(sanitiseClientBody(req.body));
      res.status(201).json(client);
      try { await notificationService.onClientCreated(client, req.user); } catch (e) { console.error('Notification error:', e.message); }
      setImmediate(() => logActivity({ userId: req.user.id, action: 'create', entityType: 'client', entityId: client.id, entityName: `${client.firstName} ${client.lastName}`, description: `Created client ${client.firstName} ${client.lastName}`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'info' }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/clients/:id
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required'),
    body('lookingFor').optional().isIn(['sale','long_let','short_let','both']).withMessage('Invalid lookingFor value'),
    body('status').optional().isIn(['active','matched','viewing','offer_made','contracted','completed','on_hold','inactive']).withMessage('Invalid status'),
    body('urgency').optional().isIn(['immediate','within_month','within_3months','within_6months','flexible']).withMessage('Invalid urgency'),
    body('maxBudget').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    body('minBudget').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const client = await Client.findByPk(req.params.id);
      if (!client) return res.status(404).json({ error: 'Client not found' });

      // Role-based permission check when agentId is being changed
      if ('agentId' in req.body) {
        const { role, branchId: userBranchId } = req.user;
        if (role === 'agent') {
          return res.status(403).json({ error: 'Agents cannot reassign clients to a different agent' });
        }
        if (role === 'manager' && req.body.agentId) {
          // Managers can only assign clients to agents within their own branch
          const targetAgent = await User.findOne({
            where: { id: req.body.agentId, role: 'agent', branchId: userBranchId },
          });
          if (!targetAgent) {
            return res.status(403).json({ error: 'Managers can only assign clients to agents in their own branch' });
          }
        }
      }

      await client.update(sanitiseClientBody(req.body));
      res.json(client);
      setImmediate(() => logActivity({ userId: req.user.id, action: 'update', entityType: 'client', entityId: client.id, entityName: `${client.firstName} ${client.lastName}`, description: `Updated client ${client.firstName} ${client.lastName}`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'info' }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PATCH /api/clients/:id/toggle-vip
router.patch('/:id/toggle-vip', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    await client.update({ isVIP: !client.isVIP });
    res.json({ id: client.id, isVIP: client.isVIP });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/clients/:id/status
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('status').isIn(['active','matched','viewing','offer_made','contracted','completed','on_hold','inactive']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const client = await Client.findByPk(req.params.id);
      if (!client) return res.status(404).json({ error: 'Client not found' });
      await client.update({ status: req.body.status });
      res.json({ id: client.id, status: client.status });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/clients/:id (soft delete)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    await client.destroy(); // paranoid soft delete
    res.json({ message: 'Client deleted successfully' });
    setImmediate(() => logActivity({ userId: req.user.id, action: 'delete', entityType: 'client', entityId: req.params.id, entityName: `${client.firstName} ${client.lastName}`, description: `Deleted client ${client.firstName} ${client.lastName}`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'warning' }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id/matches
router.get('/:id/matches', authenticate, async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const { page = 1, limit = 20, minScore } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = { clientId: req.params.id };
    if (minScore) where.matchScore = { [Op.gte]: parseFloat(minScore) };

    const { count, rows } = await ClientMatch.findAndCountAll({
      where,
      include: [{ model: Property, attributes: ['id', 'title', 'type', 'listingType', 'status', 'price', 'currency', 'bedrooms', 'bathrooms', 'area', 'locality', 'features'] }],
      order: [['matchScore', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({ matches: rows, pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients/:id/matches/recalculate
router.post('/:id/matches/recalculate', authenticate, authorize('admin', 'manager', 'agent'), async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const properties = await Property.findAll({
      where: { status: { [Op.in]: ['listed', 'under_offer'] }, isAvailable: true },
      attributes: ['id', 'type', 'listingType', 'price', 'bedrooms', 'bathrooms', 'area', 'locality', 'features', 'isPetFriendly', 'acceptsChildren'],
      limit: 500, // cap to avoid excessive processing; run in batches for very large inventories
    });

    const now = new Date();
    let upserted = 0;

    for (const property of properties) {
      const result = calculateMatch(client.toJSON(), property.toJSON());
      if (result.overall <= 0) continue;

      await ClientMatch.upsert({
        clientId:         client.id,
        propertyId:       property.id,
        matchScore:       result.overall,
        matchBreakdown:   result.breakdown,
        lastCalculatedAt: now,
      }, { conflictFields: ['clientId', 'propertyId'] });

      upserted++;
    }

    const topMatches = await ClientMatch.findAll({
      where: { clientId: client.id },
      include: [{ model: Property, attributes: ['id', 'title', 'type', 'listingType', 'price', 'currency', 'bedrooms', 'locality'] }],
      order: [['matchScore', 'DESC']],
      limit: 20,
    });

    res.json({ recalculated: upserted, matches: topMatches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/clients/:id/matches/:matchId/status
router.patch(
  '/:id/matches/:matchId/status',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('status').isIn(['new','sent','viewed','interested','not_interested','viewing_scheduled','offer_made','rejected']).withMessage('Invalid match status'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const match = await ClientMatch.findOne({ where: { id: req.params.matchId, clientId: req.params.id } });
      if (!match) return res.status(404).json({ error: 'Match not found' });
      await match.update({ status: req.body.status, agentNotes: req.body.agentNotes ?? match.agentNotes });
      res.json(match);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
