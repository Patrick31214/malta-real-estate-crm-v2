'use strict';

const express = require('express');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const noopLimiter = (_req, _res, next) => next();
const { Notification, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = isDev ? noopLimiter : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
router.use(apiLimiter);

const senderAttrs = ['id', 'firstName', 'lastName', 'profileImage'];

// ── GET /api/notifications/unread-count ──────────────────────────────────────
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.count({
      where: { recipientId: req.user.id, isRead: false },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      unread, type,
      page = 1, limit = 20,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = { recipientId: req.user.id };
    if (unread === 'true') where.isRead = false;
    if (type)              where.type   = type;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: senderAttrs, required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({
      notifications: rows,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { recipientId: req.user.id, isRead: false } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id },
    });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    await notification.update({ isRead: true, readAt: new Date() });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id },
    });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    await notification.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
