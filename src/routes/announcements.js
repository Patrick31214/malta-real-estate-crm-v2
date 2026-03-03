'use strict';
const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Announcement, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/announcements
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const now = new Date();
    const where = {
      isActive: true,
      publishedAt: { [Op.lte]: now },
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }],
    };
    const { count, rows } = await Announcement.findAndCountAll({
      where,
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }],
      order: [
        [Op.literal(`CASE priority WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END`), 'ASC'],
        ['publishedAt', 'DESC'],
      ],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });
    // Filter by targetRoles
    const userRole = req.user.role;
    const filtered = rows.filter(a => {
      if (!a.targetRoles || a.targetRoles.length === 0) return true;
      return a.targetRoles.includes(userRole);
    });
    res.json({ announcements: filtered, pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/announcements/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id, {
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }],
    });
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    res.json(a);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/announcements
router.post('/', authenticate, authorize('admin', 'manager'),
  [body('title').trim().notEmpty(), body('content').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { title, content, priority = 'normal', targetRoles, publishedAt, expiresAt } = req.body;
      const a = await Announcement.create({ title, content, priority, targetRoles: targetRoles || null, publishedAt: publishedAt || new Date(), expiresAt: expiresAt || null, isActive: true, createdById: req.user.id });
      res.status(201).json(a);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// PUT /api/announcements/:id
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    const { title, content, priority, targetRoles, publishedAt, expiresAt } = req.body;
    await a.update({ title, content, priority, targetRoles, publishedAt, expiresAt });
    res.json(a);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    await a.destroy();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/announcements/:id/toggle-active
router.patch('/:id/toggle-active', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    await a.update({ isActive: !a.isActive });
    res.json(a);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
