'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const { Service, User } = require('../models');
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

const ALLOWED_FIELDS = [
  'name', 'category', 'description',
  'provider', 'providerEmail', 'providerPhone', 'providerWebsite',
  'price', 'priceCurrency', 'priceType',
  'isActive', 'isFeatured', 'notes', 'image',
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
  if (d.price === '' || d.price == null) d.price = null;
  ['category', 'priceType'].forEach(f => {
    if (d[f] === '') d[f] = null;
  });
  return d;
}

const VALID_CATEGORIES = ['legal', 'financial', 'maintenance', 'insurance', 'moving', 'renovation', 'consulting', 'other'];
const VALID_PRICE_TYPES = ['fixed', 'hourly', 'percentage', 'negotiable', 'free'];

// GET /api/services — list with search, category filter, pagination
router.get('/', authenticate, requirePermission('services_view'), async (req, res) => {
  try {
    const {
      search, category, isActive, isFeatured,
      page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
    if (isFeatured !== undefined && isFeatured !== '') where.isFeatured = isFeatured === 'true' || isFeatured === true;

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { provider: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const validSortCols = ['createdAt', 'updatedAt', 'name', 'category', 'price', 'provider'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortDir === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Service.findAndCountAll({
      where,
      include: [
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [[orderCol, orderDir]],
      limit: limitNum,
      offset,
    });

    res.json({
      services: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error('GET /api/services error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// GET /api/services/:id
router.get('/:id', authenticate, requirePermission('services_view'), async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    console.error('GET /api/services/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// POST /api/services — admin/manager only
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  requirePermission('services_create'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').optional({ nullable: true }).isIn([...VALID_CATEGORIES, '']).withMessage('Invalid category'),
    body('priceType').optional({ nullable: true }).isIn([...VALID_PRICE_TYPES, '']).withMessage('Invalid price type'),
    body('price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const data = sanitiseBody(pickAllowed(req.body));
      data.createdById = req.user.id;

      const service = await Service.create(data);
      const full = await Service.findByPk(service.id, {
        include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }],
      });
      res.status(201).json(full);
    } catch (err) {
      console.error('POST /api/services error:', err);
      res.status(500).json({ error: 'Failed to create service' });
    }
  }
);

// PUT /api/services/:id — admin/manager only
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  requirePermission('services_edit'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('category').optional({ nullable: true }).isIn([...VALID_CATEGORIES, '']).withMessage('Invalid category'),
    body('priceType').optional({ nullable: true }).isIn([...VALID_PRICE_TYPES, '']).withMessage('Invalid price type'),
    body('price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const service = await Service.findByPk(req.params.id);
      if (!service) return res.status(404).json({ error: 'Service not found' });

      const data = sanitiseBody(pickAllowed(req.body));
      await service.update(data);

      const full = await Service.findByPk(service.id, {
        include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }],
      });
      res.json(full);
    } catch (err) {
      console.error('PUT /api/services/:id error:', err);
      res.status(500).json({ error: 'Failed to update service' });
    }
  }
);

// DELETE /api/services/:id — admin only
router.delete('/:id', authenticate, authorize('admin'), requirePermission('services_delete'), async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    await service.destroy();
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/services/:id error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
