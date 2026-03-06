'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Branch, User, sequelize: db } = require('../models');
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

module.exports = router;

