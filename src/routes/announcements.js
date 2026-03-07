'use strict';
const express = require('express');
const { Op, literal } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Announcement, User, Branch } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

// Helper: check if an announcement targets the current user
function announcementMatchesUser(a, user) {
  // Admin sees everything regardless of targeting
  if (user.role === 'admin') return true;
  const tt = a.targetType || 'all';
  if (tt === 'all') return true;
  if (tt === 'roles') {
    const roles = Array.isArray(a.targetRoles) ? a.targetRoles : [];
    return roles.includes(user.role);
  }
  if (tt === 'branches') {
    const bids = Array.isArray(a.targetBranchIds) ? a.targetBranchIds : [];
    return user.branchId && bids.includes(user.branchId);
  }
  if (tt === 'users') {
    const uids = Array.isArray(a.targetUserIds) ? a.targetUserIds : [];
    return uids.includes(user.id);
  }
  return true;
}

// GET /api/announcements/unread-count — must be before /:id route
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const where = {
      isActive: true,
      [Op.and]: [
        { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
        { [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }] },
      ],
    };
    const all = await Announcement.findAll({ where, attributes: ['id', 'targetType', 'targetRoles', 'targetBranchIds', 'targetUserIds', 'readByUserIds'] });
    const userId = req.user.id;
    const count = all.filter(a => {
      if (!announcementMatchesUser(a, req.user)) return false;
      const reads = Array.isArray(a.readByUserIds) ? a.readByUserIds : [];
      return !reads.includes(userId);
    }).length;
    res.json({ count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/announcements/admin — All announcements (admin/manager only, no targeting filter)
router.get('/admin', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, priority } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const { count, rows } = await Announcement.findAndCountAll({
      where,
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }],
      order: [
        ['isPinned', 'DESC'],
        [literal(`CASE priority WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END`), 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });
    res.json({ announcements: rows, pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/announcements — List announcements visible to the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, priority, search } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const now = new Date();

    // Build AND conditions to avoid Op.or key collisions
    const andConditions = [
      { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
      { [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }] },
    ];
    if (search) {
      andConditions.push({
        [Op.or]: [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const where = { isActive: true, [Op.and]: andConditions };
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const allRows = await Announcement.findAll({
      where,
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }],
      order: [
        ['isPinned', 'DESC'],
        [literal(`CASE priority WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END`), 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    const filtered = allRows.filter(a => announcementMatchesUser(a, req.user));
    const total = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    res.json({ announcements: paginated, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/announcements/:id — Single announcement detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id, {
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }],
    });
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    res.json(a);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/announcements — Create (admin/manager only)
router.post('/', authenticate, authorize('admin', 'manager'),
  [body('title').trim().notEmpty(), body('content').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const {
        title, content,
        priority = 'normal',
        type = 'general',
        targetType = 'all',
        targetRoles,
        targetBranchIds,
        targetUserIds,
        startsAt,
        expiresAt,
        isPinned = false,
      } = req.body;
      const a = await Announcement.create({
        title, content, priority, type,
        targetType,
        targetRoles: targetRoles || null,
        targetBranchIds: targetBranchIds || null,
        targetUserIds: targetUserIds || null,
        startsAt: startsAt || null,
        expiresAt: expiresAt || null,
        publishedAt: startsAt || new Date(),
        isPinned: !!isPinned,
        isActive: true,
        createdById: req.user.id,
        readByUserIds: [],
      });
      res.status(201).json(a);
      try { await notificationService.onAnnouncementCreated(a, req.user); } catch (e) { console.error('Notification error:', e.message); }
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// PUT /api/announcements/:id — Update (admin/manager only)
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    const {
      title, content, priority, type,
      targetType, targetRoles, targetBranchIds, targetUserIds,
      startsAt, expiresAt, isPinned, isActive,
    } = req.body;
    await a.update({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(priority !== undefined && { priority }),
      ...(type !== undefined && { type }),
      ...(targetType !== undefined && { targetType }),
      ...(targetRoles !== undefined && { targetRoles }),
      ...(targetBranchIds !== undefined && { targetBranchIds }),
      ...(targetUserIds !== undefined && { targetUserIds }),
      ...(startsAt !== undefined && { startsAt: startsAt != null && startsAt !== '' ? startsAt : null, publishedAt: startsAt != null && startsAt !== '' ? startsAt : null }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt || null }),
      ...(isPinned !== undefined && { isPinned: !!isPinned }),
      ...(isActive !== undefined && { isActive: !!isActive }),
    });
    res.json(a);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/announcements/:id — Soft delete (set isActive=false), admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    await a.update({ isActive: false });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/announcements/:id/read — Mark as read by current user
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    const userId = req.user.id;
    const reads = Array.isArray(a.readByUserIds) ? a.readByUserIds : [];
    if (!reads.includes(userId)) {
      await a.update({ readByUserIds: [...reads, userId] });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/announcements/:id/toggle-active — legacy endpoint
router.patch('/:id/toggle-active', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    await a.update({ isActive: !a.isActive });
    res.json(a);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

