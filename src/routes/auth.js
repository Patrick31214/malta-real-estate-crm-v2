'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const noopLimiter = (_req, _res, next) => next();
const { User, UserPermission, AgentMetric } = require('../models');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../services/activityLogger');
const router = express.Router();

// General rate limiter for all auth endpoints
const authLimiter = isDev ? noopLimiter : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict rate limiter for login — only counts FAILED attempts
const loginLimiter = isDev ? noopLimiter : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skipSuccessfulRequests: true, // only failed (4xx/5xx) responses count
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many failed login attempts, please try again later.' },
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

const getIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
const getUa = (req) =>
  (req.headers['user-agent'] || '').slice(0, 500) || null;

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

      await User.create({
        email,
        password,
        firstName,
        lastName,
        phone: phone || null,
        role: 'client',
        approvalStatus: 'pending',
        isActive: false,
      });

      res.status(201).json({
        pending: true,
        message: 'Registration successful. Your account is pending admin approval. You will be notified once approved.',
      });
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
  loginLimiter,
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
      if (!user) {
        console.warn('[auth] login failed — user not found');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!user.isActive) {
        console.warn(`[auth] login blocked — isActive=false for userId=${user.id} (approvalStatus=${user.approvalStatus})`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.isBlocked) {
        console.warn(`[auth] login blocked — isBlocked=true for userId=${user.id}`);
        return res.status(403).json({ error: 'Your account has been blocked. Please contact an administrator.' });
      }

      if (user.approvalStatus === 'pending') {
        console.warn(`[auth] login blocked — approvalStatus=pending for userId=${user.id}`);
        return res.status(403).json({ error: 'Your account is pending admin approval.' });
      }

      if (user.approvalStatus === 'rejected') {
        console.warn(`[auth] login blocked — approvalStatus=rejected for userId=${user.id}`);
        return res.status(403).json({ error: 'Your account registration was rejected. Please contact an administrator.' });
      }

      const valid = await user.validatePassword(password);
      if (!valid) {
        console.warn(`[auth] login failed — wrong password for userId=${user.id}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      await user.update({ lastLoginAt: new Date() });

      const token = signToken(user);
      const userWithPerms = await User.findByPk(user.id, {
        include: [{ model: UserPermission, attributes: ['feature', 'isEnabled'] }],
      });

      // Track login metric server-side (req.user not set on auth routes,
      // so we create the record directly here after successful auth)
      const sessionId = req.headers['x-session-id'] || null;
      setImmediate(async () => {
        try {
          await AgentMetric.create({
            userId:    user.id,
            metricType: 'login',
            entityType: null,
            entityId:   null,
            metadata:   null,
            ipAddress:  getIp(req),
            userAgent:  getUa(req),
            sessionId,
          });
        } catch (e) {
          console.error('[auth] login metric insert error:', e.message);
        }
      });

      res.json({ token, user: userWithPerms });
      setImmediate(() => logActivity({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id, entityName: `${user.firstName} ${user.lastName}`, description: `User ${user.email} logged in`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'info' }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Resolve user from Authorization header so we can record a logout metric
  // even though this route doesn't use the authenticate middleware.
  const authHeader = req.headers.authorization || '';
  const rawToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (rawToken) {
    try {
      const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
      const sessionId = req.headers['x-session-id'] || null;
      setImmediate(async () => {
        try {
          await AgentMetric.create({
            userId:    decoded.id,
            metricType: 'logout',
            entityType: null,
            entityId:   null,
            metadata:   null,
            ipAddress:  getIp(req),
            userAgent:  getUa(req),
            sessionId,
          });
        } catch (e) {
          console.error('[auth] logout metric insert error:', e.message);
        }
      });
    } catch {
      // Token expired or invalid — still return success; just skip metric
    }
  }
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: UserPermission, attributes: ['feature', 'isEnabled'] }],
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      setImmediate(() => logActivity({ userId: req.user.id, action: 'update', entityType: 'user', entityId: req.user.id, entityName: `${req.user.firstName} ${req.user.lastName}`, description: `User ${req.user.email} updated their profile`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'info' }));
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
