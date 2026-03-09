'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { ComplianceItem, User, Property, Client } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

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

const VALID_CATEGORIES = [
  'aml_kyc', 'property_documentation', 'licensing', 'insurance',
  'tax_compliance', 'data_protection', 'health_safety', 'other',
];
const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];
const VALID_STATUSES   = ['pending', 'in_progress', 'completed', 'overdue', 'not_applicable'];
const VALID_INTERVALS  = ['monthly', 'quarterly', 'annually'];

const ALLOWED_FIELDS = [
  'title', 'description', 'category', 'priority', 'status',
  'dueDate', 'completedDate', 'completedById', 'assignedToId',
  'propertyId', 'clientId', 'notes', 'attachments',
  'isRecurring', 'recurringInterval',
];

function pickAllowed(body) {
  const result = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) result[key] = body[key];
  }
  return result;
}

function sanitiseBody(body) {
  const d = { ...body };
  // Null out blank enum/UUID fields
  ['category', 'priority', 'status', 'recurringInterval',
   'completedById', 'assignedToId', 'propertyId', 'clientId'].forEach((f) => {
    if (d[f] === '' || d[f] === undefined) d[f] = null;
  });
  if (d.dueDate === '') d.dueDate = null;
  if (d.completedDate === '') d.completedDate = null;
  if (d.isRecurring === undefined) d.isRecurring = false;
  if (!d.isRecurring) d.recurringInterval = null;
  if (!Array.isArray(d.attachments)) d.attachments = d.attachments || [];
  return d;
}

// Common includes
const INCLUDES = [
  { model: User, as: 'createdBy',   attributes: ['id', 'firstName', 'lastName', 'avatar'] },
  { model: User, as: 'assignedTo',  attributes: ['id', 'firstName', 'lastName', 'avatar'] },
  { model: User, as: 'completedBy', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
  { model: Property, as: 'property', attributes: ['id', 'title', 'referenceNumber', 'status'] },
  { model: Client,   as: 'client',   attributes: ['id', 'firstName', 'lastName', 'email'] },
];

// ── GET /api/compliance ───────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search, status, category, priority, assignedToId, propertyId, clientId,
      page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};

    if (status   && VALID_STATUSES.includes(status))     where.status   = status;
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (priority && VALID_PRIORITIES.includes(priority)) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (propertyId)   where.propertyId   = propertyId;
    if (clientId)     where.clientId     = clientId;

    // Agents can only see items assigned to them
    if (req.user.role === 'agent') {
      where.assignedToId = req.user.id;
    }

    if (search) {
      where[Op.or] = [
        { title:       { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { notes:       { [Op.iLike]: `%${search}%` } },
      ];
    }

    const validSortCols = ['createdAt', 'updatedAt', 'title', 'dueDate', 'status', 'priority', 'category'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortDir === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await ComplianceItem.findAndCountAll({
      where,
      include: INCLUDES,
      order: [[orderCol, orderDir]],
      limit: limitNum,
      offset,
    });

    res.json({
      items: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error('GET /api/compliance error:', err);
    res.status(500).json({ error: 'Failed to fetch compliance items' });
  }
});

// ── GET /api/compliance/stats ─────────────────────────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const baseWhere = {};
    if (req.user.role === 'agent') {
      baseWhere.assignedToId = req.user.id;
    }

    const today    = new Date();
    const weekEnd  = new Date(today); weekEnd.setDate(today.getDate() + 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [total, overdue, dueThisWeek, completedThisMonth, byCategory] = await Promise.all([
      ComplianceItem.count({ where: { ...baseWhere, status: { [Op.ne]: 'not_applicable' } } }),
      ComplianceItem.count({ where: { ...baseWhere, status: 'overdue' } }),
      ComplianceItem.count({
        where: {
          ...baseWhere,
          status: { [Op.notIn]: ['completed', 'not_applicable'] },
          dueDate: { [Op.between]: [today.toISOString().slice(0, 10), weekEnd.toISOString().slice(0, 10)] },
        },
      }),
      ComplianceItem.count({
        where: {
          ...baseWhere,
          status: 'completed',
          completedDate: { [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)] },
        },
      }),
      ComplianceItem.findAll({
        where: baseWhere,
        attributes: [
          'category',
          [ComplianceItem.sequelize.fn('COUNT', ComplianceItem.sequelize.col('id')), 'count'],
        ],
        group: ['category'],
        raw: true,
      }),
    ]);

    const completed = await ComplianceItem.count({ where: { ...baseWhere, status: 'completed' } });
    const complianceScore = total > 0 ? Math.round((completed / total) * 100) : 100;

    res.json({
      total,
      overdue,
      dueThisWeek,
      completedThisMonth,
      complianceScore,
      byCategory: byCategory.reduce((acc, row) => {
        acc[row.category] = parseInt(row.count, 10);
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error('GET /api/compliance/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch compliance stats' });
  }
});

// ── GET /api/compliance/:id ───────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await ComplianceItem.findByPk(req.params.id, { include: INCLUDES });
    if (!item) return res.status(404).json({ error: 'Compliance item not found' });

    // Agents can only see their assigned items
    if (req.user.role === 'agent' && item.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(item);
  } catch (err) {
    console.error('GET /api/compliance/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch compliance item' });
  }
});

// ── POST /api/compliance ──────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').optional({ nullable: true }).isIn([...VALID_CATEGORIES, '']).withMessage('Invalid category'),
    body('priority').optional({ nullable: true }).isIn([...VALID_PRIORITIES, '']).withMessage('Invalid priority'),
    body('status').optional({ nullable: true }).isIn([...VALID_STATUSES, '']).withMessage('Invalid status'),
    body('recurringInterval').optional({ nullable: true }).isIn([...VALID_INTERVALS, '']).withMessage('Invalid recurring interval'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const data = sanitiseBody(pickAllowed(req.body));
      data.createdById = req.user.id;

      const item = await ComplianceItem.create(data);
      const full = await ComplianceItem.findByPk(item.id, { include: INCLUDES });
      res.status(201).json(full);
    } catch (err) {
      console.error('POST /api/compliance error:', err);
      res.status(500).json({ error: 'Failed to create compliance item' });
    }
  }
);

// ── PUT /api/compliance/:id ───────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('category').optional({ nullable: true }).isIn([...VALID_CATEGORIES, '']).withMessage('Invalid category'),
    body('priority').optional({ nullable: true }).isIn([...VALID_PRIORITIES, '']).withMessage('Invalid priority'),
    body('status').optional({ nullable: true }).isIn([...VALID_STATUSES, '']).withMessage('Invalid status'),
    body('recurringInterval').optional({ nullable: true }).isIn([...VALID_INTERVALS, '']).withMessage('Invalid recurring interval'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const item = await ComplianceItem.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: 'Compliance item not found' });

      // Agents may only update status of their assigned items
      if (req.user.role === 'agent') {
        if (item.assignedToId !== req.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }
        // Agents may only change the status field
        const allowed = { status: req.body.status };
        if (req.body.status === 'completed') {
          allowed.completedById = req.user.id;
          allowed.completedDate = new Date().toISOString().slice(0, 10);
        }
        await item.update(sanitiseBody(allowed));
      } else {
        const data = sanitiseBody(pickAllowed(req.body));
        // Auto-set completedBy/Date when marking complete
        if (data.status === 'completed' && item.status !== 'completed') {
          if (!data.completedById) data.completedById = req.user.id;
          if (!data.completedDate) data.completedDate = new Date().toISOString().slice(0, 10);
        }
        await item.update(data);
      }

      const full = await ComplianceItem.findByPk(item.id, { include: INCLUDES });
      res.json(full);
    } catch (err) {
      console.error('PUT /api/compliance/:id error:', err);
      res.status(500).json({ error: 'Failed to update compliance item' });
    }
  }
);

// ── DELETE /api/compliance/:id ────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const item = await ComplianceItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Compliance item not found' });
    await item.destroy();
    res.json({ message: 'Compliance item deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/compliance/:id error:', err);
    res.status(500).json({ error: 'Failed to delete compliance item' });
  }
});

module.exports = router;
