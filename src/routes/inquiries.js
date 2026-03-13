'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const { Inquiry, InquiryAssignment, Property, User } = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
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

const sanitiseBody = (body) => {
  const d = { ...body };
  ['propertyId', 'assignedToId', 'assignedAt', 'assignmentDeadline', 'resolvedAt', 'closedAt'].forEach(f => {
    if (d[f] === '') d[f] = null;
  });
  ['type', 'status', 'priority', 'source'].forEach(f => {
    if (d[f] === '') d[f] = null;
  });
  return d;
};

// GET /api/inquiries
router.get('/', authenticate, requirePermission('inquiries_view_all'), async (req, res) => {
  try {
    const {
      search, status, type, priority, source, assignedToId,
      page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};
    if (status)       where.status       = status;
    if (type)         where.type         = type;
    if (priority)     where.priority     = priority;
    if (source)       where.source       = source;
    if (assignedToId) where.assignedToId = assignedToId;

    // Agents can only see their own assigned inquiries
    if (req.user.role === 'agent') {
      where.assignedToId = req.user.id;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } },
        { email:     { [Op.iLike]: `%${search}%` } },
        { phone:     { [Op.iLike]: `%${search}%` } },
      ];
    }

    const validSortCols = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'status', 'priority', 'assignedAt'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortDir === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Inquiry.findAndCountAll({
      where,
      include: [
        { model: Property, attributes: ['id', 'title', 'referenceNumber', 'type', 'locality', 'price', 'currency'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [[orderCol, orderDir]],
      limit: limitNum,
      offset,
    });

    res.json({
      inquiries: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inquiries/:id
router.get('/:id', authenticate, requirePermission('inquiries_view_all'), async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id, {
      include: [
        { model: Property, attributes: ['id', 'title', 'referenceNumber', 'type', 'listingType', 'status', 'locality', 'price', 'currency', 'bedrooms', 'bathrooms'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        {
          model: InquiryAssignment,
          include: [
            { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'assignedBy', attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
      ],
    });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    // Agents can only view their assigned inquiries
    if (req.user.role === 'agent' && inquiry.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inquiries
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  requirePermission('inquiries_create'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('type').isIn(['property', 'work_with_us', 'affiliate', 'general', 'viewing', 'valuation']).withMessage('Invalid type'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Valid email required'),
    body('status').optional().isIn(['new','open','assigned','in_progress','viewing_scheduled','resolved','closed','spam']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low','medium','high','urgent']).withMessage('Invalid priority'),
    body('source').optional({ nullable: true, checkFalsy: true }).isIn(['website','phone','email','whatsapp','walk_in','referral','social_media','other']).withMessage('Invalid source'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const inquiry = await Inquiry.create(sanitiseBody(req.body));
      res.status(201).json(inquiry);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/inquiries/:id
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  requirePermission('inquiries_manage'),
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Valid email required'),
    body('type').optional().isIn(['property', 'work_with_us', 'affiliate', 'general', 'viewing', 'valuation']).withMessage('Invalid type'),
    body('status').optional().isIn(['new','open','assigned','in_progress','viewing_scheduled','resolved','closed','spam']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low','medium','high','urgent']).withMessage('Invalid priority'),
    body('source').optional({ nullable: true, checkFalsy: true }).isIn(['website','phone','email','whatsapp','walk_in','referral','social_media','other']).withMessage('Invalid source'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const inquiry = await Inquiry.findByPk(req.params.id);
      if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

      // Agents can only edit their own assigned inquiries
      if (req.user.role === 'agent' && inquiry.assignedToId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await inquiry.update(sanitiseBody(req.body));
      res.json(inquiry);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/inquiries/:id
router.delete('/:id', authenticate, authorize('admin'), requirePermission('inquiries_manage'), async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    await inquiry.destroy();
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inquiries/:id/assign
router.post(
  '/:id/assign',
  authenticate,
  authorize('admin', 'manager'),
  requirePermission('inquiries_assign'),
  [
    body('assignedToId').notEmpty().withMessage('assignedToId is required'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const inquiry = await Inquiry.findByPk(req.params.id);
      if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

      const agent = await User.findOne({ where: { id: req.body.assignedToId, role: { [Op.in]: ['agent', 'manager', 'admin'] } } });
      if (!agent) return res.status(404).json({ error: 'Agent not found' });

      const now = new Date();
      await inquiry.update({ assignedToId: req.body.assignedToId, assignedAt: now, status: 'assigned' });

      await InquiryAssignment.create({
        inquiryId:    inquiry.id,
        assignedToId: req.body.assignedToId,
        assignedById: req.user.id,
        assignedAt:   now,
        deadline:     req.body.deadline || null,
        notes:        req.body.notes    || null,
      });

      const updated = await Inquiry.findByPk(inquiry.id, {
        include: [{ model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
