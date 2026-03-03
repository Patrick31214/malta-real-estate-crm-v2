'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Contact } = require('../models');
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

const CATEGORIES = ['branch', 'emergency', 'staff', 'legal', 'maintenance', 'other'];

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  return null;
};

const contactValidators = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Invalid email address'),
  body('phone').optional({ nullable: true, checkFalsy: true }).isString(),
  body('category').optional({ nullable: true, checkFalsy: true }).isIn(CATEGORIES).withMessage('Invalid category'),
  body('isActive').optional().isBoolean(),
];

// ── GET /api/contacts ────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, isActive } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } },
        { email:     { [Op.iLike]: `%${search}%` } },
        { phone:     { [Op.iLike]: `%${search}%` } },
        { company:   { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category) where.category = category;
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';

    const { count, rows } = await Contact.findAndCountAll({
      where,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      limit:  limitNum,
      offset,
    });

    res.json({
      contacts: rows,
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

// ── GET /api/contacts/:id ────────────────────────────────────────────────────
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/contacts ───────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  contactValidators,
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    const { firstName, lastName, email, phone } = req.body;
    if (!email && !phone) {
      return res.status(422).json({ errors: [{ msg: 'At least one of email or phone is required', path: 'email' }] });
    }

    try {
      const contact = await Contact.create(req.body);
      res.status(201).json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── PUT /api/contacts/:id ────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  contactValidators,
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(422).json({ errors: [{ msg: 'At least one of email or phone is required', path: 'email' }] });
    }

    try {
      const contact = await Contact.findByPk(req.params.id);
      if (!contact) return res.status(404).json({ error: 'Contact not found' });

      await contact.update(req.body);
      res.json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── PATCH /api/contacts/:id/toggle-active ────────────────────────────────────
router.patch('/:id/toggle-active', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    await contact.update({ isActive: !contact.isActive });
    res.json({ id: contact.id, isActive: contact.isActive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/contacts/:id ─────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    await contact.destroy();
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
