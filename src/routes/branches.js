'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { Branch } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

// GET /api/branches
router.get('/', authenticate, async (req, res) => {
  try {
    const branches = await Branch.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
    res.json({ branches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
