'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Owner } = require('../models');
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

// GET /api/owners
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset   = (pageNum - 1) * limitNum;

    const where = { isActive: true };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } },
        { phone:     { [Op.iLike]: `%${search}%` } },
        { email:     { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Owner.findAndCountAll({
      where,
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
      limit: limitNum,
      offset,
    });

    res.json({ owners: rows, pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/owners/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const owner = await Owner.findByPk(req.params.id);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.json(owner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/owners
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const owner = await Owner.create(req.body);
      res.status(201).json(owner);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/owners/:id
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const owner = await Owner.findByPk(req.params.id);
      if (!owner) return res.status(404).json({ error: 'Owner not found' });
      await owner.update(req.body);
      res.json(owner);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
