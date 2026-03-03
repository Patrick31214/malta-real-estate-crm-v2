'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Property, Owner, User, Branch } = require('../models');
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

const PROPERTY_TYPES = ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'];
const LISTING_TYPES  = ['sale','long_let','short_let','both'];
const STATUS_TYPES   = ['draft','listed','under_offer','sold','rented','withdrawn'];

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  return null;
};

// ── GET /api/properties ─────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      search, type, listingType, status, locality,
      minPrice, maxPrice, minBedrooms, maxBedrooms,
      isAvailable, isFeatured, agentId, ownerId, branchId,
      sortBy = 'createdAt', sortOrder = 'DESC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
      where[Op.or] = [
        { title:       { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { locality:    { [Op.iLike]: `%${search}%` } },
        { address:     { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (type)        where.type        = type;
    if (listingType) where.listingType = listingType;
    if (status)      where.status      = status;
    if (locality)    where.locality    = { [Op.iLike]: `%${locality}%` };
    if (agentId)     where.agentId     = agentId;
    if (ownerId)     where.ownerId     = ownerId;
    if (branchId)    where.branchId    = branchId;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice !== undefined) where.price[Op.lte] = parseFloat(maxPrice);
    }

    if (minBedrooms !== undefined || maxBedrooms !== undefined) {
      where.bedrooms = {};
      if (minBedrooms !== undefined) where.bedrooms[Op.gte] = parseInt(minBedrooms, 10);
      if (maxBedrooms !== undefined) where.bedrooms[Op.lte] = parseInt(maxBedrooms, 10);
    }

    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (isFeatured  !== undefined) where.isFeatured  = isFeatured  === 'true';

    const allowedSortFields = ['createdAt','updatedAt','price','title','locality','bedrooms','area'];
    const safeSortBy    = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Property.findAndCountAll({
      where,
      include: [
        { model: Owner, attributes: ['id','firstName','lastName','phone'] },
        { model: User,  as: 'agent', attributes: ['id','firstName','lastName'] },
        { model: Branch, attributes: ['id','name'] },
      ],
      order:  [[safeSortBy, safeSortOrder]],
      limit:  limitNum,
      offset,
    });

    res.json({
      properties: rows,
      pagination: {
        total:      count,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/properties/:id ──────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        { model: Owner },
        { model: User, as: 'agent', attributes: { exclude: ['password'] } },
        { model: Branch },
      ],
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/properties ─────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(PROPERTY_TYPES).withMessage('Invalid property type'),
    body('listingType').isIn(LISTING_TYPES).withMessage('Invalid listing type'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('locality').trim().notEmpty().withMessage('Locality is required'),
    body('ownerId').isUUID().withMessage('Valid owner ID is required'),
    body('status').optional().isIn(STATUS_TYPES),
    body('bedrooms').optional().isInt({ min: 0 }),
    body('bathrooms').optional().isInt({ min: 0 }),
    body('area').optional().isFloat({ min: 0 }),
    body('floor').optional().isInt(),
    body('totalFloors').optional().isInt({ min: 1 }),
    body('yearBuilt').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
    body('agentId').optional().isUUID(),
    body('branchId').optional().isUUID(),
    body('isAvailable').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    try {
      const property = await Property.create(req.body);
      const full = await Property.findByPk(property.id, {
        include: [
          { model: Owner, attributes: ['id','firstName','lastName','phone'] },
          { model: User,  as: 'agent', attributes: ['id','firstName','lastName'] },
          { model: Branch, attributes: ['id','name'] },
        ],
      });
      res.status(201).json(full);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── PUT /api/properties/:id ──────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('title').optional().trim().notEmpty(),
    body('type').optional().isIn(PROPERTY_TYPES),
    body('listingType').optional().isIn(LISTING_TYPES),
    body('price').optional().isFloat({ gt: 0 }),
    body('locality').optional().trim().notEmpty(),
    body('ownerId').optional().isUUID(),
    body('status').optional().isIn(STATUS_TYPES),
    body('bedrooms').optional().isInt({ min: 0 }),
    body('bathrooms').optional().isInt({ min: 0 }),
    body('area').optional().isFloat({ min: 0 }),
    body('agentId').optional().isUUID(),
    body('branchId').optional().isUUID(),
    body('isAvailable').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    try {
      const property = await Property.findByPk(req.params.id);
      if (!property) return res.status(404).json({ error: 'Property not found' });

      // Agents can only update their own properties
      if (req.user.role === 'agent' && property.agentId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own properties' });
      }

      await property.update(req.body);
      const full = await Property.findByPk(property.id, {
        include: [
          { model: Owner, attributes: ['id','firstName','lastName','phone'] },
          { model: User,  as: 'agent', attributes: ['id','firstName','lastName'] },
          { model: Branch, attributes: ['id','name'] },
        ],
      });
      res.json(full);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── DELETE /api/properties/:id ───────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    await property.update({ status: 'withdrawn' });
    res.json({ message: 'Property withdrawn successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/properties/:id/toggle-available ───────────────────────────────
router.patch('/:id/toggle-available', authenticate, authorize('admin', 'manager', 'agent'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (req.user.role === 'agent' && property.agentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own properties' });
    }

    await property.update({ isAvailable: !property.isAvailable });
    res.json({ id: property.id, isAvailable: property.isAvailable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/properties/:id/toggle-featured ────────────────────────────────
router.patch('/:id/toggle-featured', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    await property.update({ isFeatured: !property.isFeatured });
    res.json({ id: property.id, isFeatured: property.isFeatured });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
