'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Rate limiter applied to all auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(authLimiter);

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  return null;
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    try {
      const { email, password, firstName, lastName, phone } = req.body;

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone: phone || null,
        role: 'client',
      });

      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Registration failed. Please check your details.' });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await user.validatePassword(password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      await user.update({ lastLoginAt: new Date() });

      const token = signToken(user);
      res.json({ token, user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/me
router.put(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().trim(),
    body('avatar').optional().trim().isURL().withMessage('Avatar must be a valid URL'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    try {
      const { firstName, lastName, phone, avatar } = req.body;
      const updates = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (avatar !== undefined) updates.avatar = avatar;

      await req.user.update(updates);
      res.json({ user: req.user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);
      const valid = await user.validatePassword(currentPassword);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      await user.update({ password: newPassword });
      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
