'use strict';
const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { ChatChannel, ChatMessage, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const CHANNEL_ACCESS = {
  general: ['admin', 'manager', 'agent'],
  rentals: ['admin', 'manager', 'agent'],
  sales:   ['admin', 'manager', 'agent'],
  managers:['admin', 'manager'],
  staff:   ['admin', 'manager', 'agent'],
  custom:  ['admin', 'manager', 'agent'],
};

const canAccessChannel = (channel, role) => {
  const allowed = CHANNEL_ACCESS[channel.type] || ['admin', 'manager', 'agent'];
  return allowed.includes(role);
};

// GET /api/chat/channels
router.get('/channels', authenticate, async (req, res) => {
  try {
    const channels = await ChatChannel.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
    const filtered = channels.filter(c => canAccessChannel(c, req.user.role));
    res.json({ channels: filtered });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/chat/channels/:id
router.get('/channels/:id', authenticate, async (req, res) => {
  try {
    const channel = await ChatChannel.findByPk(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (!canAccessChannel(channel, req.user.role)) return res.status(403).json({ error: 'Access denied' });
    const messages = await ChatMessage.findAll({
      where: { channelId: channel.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json({ channel, messages: messages.reverse() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/chat/channels/:id/messages
router.get('/channels/:id/messages', authenticate, async (req, res) => {
  try {
    const channel = await ChatChannel.findByPk(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (!canAccessChannel(channel, req.user.role)) return res.status(403).json({ error: 'Access denied' });
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const { count, rows } = await ChatMessage.findAndCountAll({
      where: { channelId: channel.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });
    res.json({ messages: rows.reverse(), pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/chat/channels/:id/messages
router.post('/channels/:id/messages', authenticate,
  [body('content').trim().notEmpty().withMessage('Message content is required').isLength({ max: 2000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const channel = await ChatChannel.findByPk(req.params.id);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });
      if (!canAccessChannel(channel, req.user.role)) return res.status(403).json({ error: 'Access denied' });
      const message = await ChatMessage.create({ channelId: channel.id, userId: req.user.id, content: req.body.content });
      const full = await ChatMessage.findByPk(message.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role'] }],
      });
      res.status(201).json(full);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// PUT /api/chat/messages/:id
router.put('/messages/:id', authenticate, [body('content').trim().notEmpty().isLength({ max: 2000 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const message = await ChatMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.userId !== req.user.id) return res.status(403).json({ error: 'Can only edit your own messages' });
    const ageMs = Date.now() - new Date(message.createdAt).getTime();
    if (ageMs > 15 * 60 * 1000) return res.status(403).json({ error: 'Can only edit messages within 15 minutes' });
    await message.update({ content: req.body.content, isEdited: true });
    res.json(message);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/chat/messages/:id
router.delete('/messages/:id', authenticate, async (req, res) => {
  try {
    const message = await ChatMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.userId !== req.user.id && !['admin'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    await message.destroy();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/chat/messages/:id/pin
router.patch('/messages/:id/pin', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const message = await ChatMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    await message.update({ isPinned: !message.isPinned });
    res.json(message);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/chat/channels (create custom channel - admin only)
router.post('/channels', authenticate, authorize('admin'),
  [body('name').trim().notEmpty(), body('description').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const channel = await ChatChannel.create({ name: req.body.name, description: req.body.description, type: 'custom', isActive: true });
      res.status(201).json(channel);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

module.exports = router;
