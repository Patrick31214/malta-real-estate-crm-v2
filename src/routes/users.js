'use strict';

const express = require('express');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const noopLimiter = (_req, _res, next) => next();
const { User, Branch } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = isDev ? noopLimiter : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

// GET /api/users
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { role, search, branchId } = req.query;

    const where = { isActive: true, isBlocked: false };
    if (role)     where.role     = role;
    if (branchId) where.branchId = branchId;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } },
        { email:     { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: Branch, attributes: ['id','name'] }],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
