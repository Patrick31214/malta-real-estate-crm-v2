'use strict';
const express = require('express');
const { Op, literal } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const { ChatChannel, ChatMessage, User } = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

/* ─── helpers ─────────────────────────────────────────────────────────────── */

/**
 * Determine which channels a user can see.
 */
function userCanSeeChannel(channel, user) {
  switch (channel.type) {
    case 'direct':
      return (
        Array.isArray(channel.participantIds) &&
        channel.participantIds.includes(user.id)
      );
    case 'role_group':
      return (
        Array.isArray(channel.allowedRoles) &&
        channel.allowedRoles.includes(user.role)
      );
    case 'branch':
      return channel.branchId === user.branchId;
    case 'property_updates':
    case 'general':
      return ['admin', 'manager', 'agent'].includes(user.role);
    default:
      return false;
  }
}

const senderAttrs = ['id', 'firstName', 'lastName', 'profileImage', 'role'];

/* ─── GET /api/chat/channels ────────────────────────────────────────────── */
router.get('/channels', authenticate, requirePermission('chat_internal'), async (req, res) => {
  try {
    const all = await ChatChannel.findAll({
      where: { isActive: true },
      order: [[literal('"lastMessageAt" DESC NULLS LAST')]],
    });

    const visible = all.filter(c => userCanSeeChannel(c, req.user));

    // Fetch last message + unread count for each channel
    const enriched = await Promise.all(
      visible.map(async channel => {
        let lastMsg = null;
        try {
          lastMsg = await ChatMessage.findOne({
            where: { channelId: channel.id },
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'sender', attributes: senderAttrs }],
          });
        } catch (err) {
          // If the sender FK is broken (e.g. orphaned rows after a partial seed
          // undo), continue without a lastMessage rather than crashing the list.
          console.error('[chat] lastMsg fetch error for channel', channel.id, err.message);
        }

        // Count unread: messages sent by others where this user's id key is absent from isRead
        const allMessages = await ChatMessage.findAll({
          where: {
            channelId: channel.id,
            senderId: { [Op.ne]: req.user.id },
          },
          attributes: ['id', 'isRead'],
        });
        const unread = allMessages.filter(
          m => !m.isRead || !Object.prototype.hasOwnProperty.call(m.isRead, req.user.id)
        ).length;

        return {
          ...channel.toJSON(),
          lastMessage: lastMsg
            ? { content: lastMsg.content, createdAt: lastMsg.createdAt, sender: lastMsg.sender }
            : null,
          unreadCount: unread,
        };
      })
    );

    res.json({ channels: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── POST /api/chat/channels/direct ────────────────────────────────────── */
router.post(
  '/channels/direct',
  authenticate,
  requirePermission('chat_internal'),
  [body('recipientId').isUUID().withMessage('Valid recipient ID required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { recipientId } = req.body;
      if (recipientId === req.user.id)
        return res.status(400).json({ error: 'Cannot create a conversation with yourself' });

      const recipient = await User.findByPk(recipientId, {
        attributes: ['id', 'firstName', 'lastName', 'role', 'isActive'],
      });
      if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

      // Look for an existing direct channel between these two users
      const existing = await ChatChannel.findOne({
        where: {
          type: 'direct',
          isActive: true,
          participantIds: { [Op.contains]: [req.user.id, recipientId] },
        },
      });
      if (existing) return res.json({ channel: existing, created: false });

      const channel = await ChatChannel.create({
        name: `${req.user.firstName} & ${recipient.firstName}`,
        type: 'direct',
        participantIds: [req.user.id, recipientId],
        createdById: req.user.id,
      });
      res.status(201).json({ channel, created: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── POST /api/chat/channels/group ─────────────────────────────────────── */
router.post(
  '/channels/group',
  authenticate,
  authorize('admin', 'manager'),
  requirePermission('chat_internal'),
  [
    body('name').trim().notEmpty().withMessage('Group name is required').isLength({ min: 1, max: 100 }),
    body('participantIds').isArray({ min: 2 }).withMessage('At least 2 participants required'),
    body('participantIds.*').isUUID().withMessage('Invalid participant ID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { name, participantIds } = req.body;

      // Ensure creator is always included and deduplicate
      const allParticipants = [...new Set([req.user.id, ...participantIds])];

      // Validate all participants exist and are active
      const foundUsers = await User.findAll({
        where: { id: { [Op.in]: allParticipants }, isActive: true },
        attributes: ['id'],
      });

      if (foundUsers.length !== allParticipants.length) {
        return res.status(400).json({ error: 'One or more participants not found or inactive' });
      }

      const channel = await ChatChannel.create({
        name: name.trim(),
        type: 'direct',
        participantIds: allParticipants,
        createdById: req.user.id,
      });

      res.status(201).json({ channel });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── GET /api/chat/channels/:id/messages ───────────────────────────────── */
router.get('/channels/:id/messages', authenticate, requirePermission('chat_internal'), async (req, res) => {
  try {
    const channel = await ChatChannel.findByPk(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (!userCanSeeChannel(channel, req.user))
      return res.status(403).json({ error: 'Access denied' });

    const { page = 1, limit = 50, after } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    // Build base where clause
    const where = { channelId: channel.id };

    // Incremental polling: when `after` (a message UUID) is provided, return only
    // messages created strictly after that message — avoids re-fetching the whole history.
    // If the referenced message no longer exists (e.g. was deleted), return an empty
    // result set so the client doesn't receive a confusing duplicate batch.
    let afterNotFound = false;
    if (after) {
      const afterMsg = await ChatMessage.findByPk(after, { attributes: ['createdAt'] });
      if (afterMsg) {
        where.createdAt = { [Op.gt]: afterMsg.createdAt };
      } else {
        afterNotFound = true;
      }
    }

    // Return empty messages immediately when the anchor message is missing
    if (afterNotFound) {
      return res.json({ messages: [], pagination: { total: 0, page: 1, limit: limitNum, totalPages: 0 } });
    }

    const { count, rows } = await ChatMessage.findAndCountAll({
      where,
      include: [{ model: User, as: 'sender', attributes: senderAttrs }],
      order: [['createdAt', 'ASC']],
      limit: after ? undefined : limitNum,
      offset: after ? undefined : (pageNum - 1) * limitNum,
    });

    // Mark all fetched messages as read by current user (single pass)
    const userId = req.user.id;
    const toUpdate = rows.filter(m => !m.isRead || !Object.prototype.hasOwnProperty.call(m.isRead, userId));

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(m => {
          const updated = { ...(m.isRead || {}), [userId]: new Date().toISOString() };
          return m.update({ isRead: updated });
        })
      );
    }

    res.json({
      messages: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── POST /api/chat/channels/:id/messages ──────────────────────────────── */
router.post(
  '/channels/:id/messages',
  authenticate,
  requirePermission('chat_internal'),
  [
    body('content').trim().notEmpty().withMessage('Message content is required').isLength({ max: 2000 }),
    body('type').optional().isIn(['text', 'system', 'property_update']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const channel = await ChatChannel.findByPk(req.params.id);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });
      if (!userCanSeeChannel(channel, req.user))
        return res.status(403).json({ error: 'Access denied' });

      const msgType = req.body.type || 'text';
      const message = await ChatMessage.create({
        channelId: channel.id,
        senderId: req.user.id,
        content: req.body.content,
        type: msgType,
        isRead: { [req.user.id]: new Date().toISOString() },
      });

      // Update channel's lastMessageAt
      await channel.update({ lastMessageAt: message.createdAt });

      const full = await ChatMessage.findByPk(message.id, {
        include: [{ model: User, as: 'sender', attributes: senderAttrs }],
      });
      res.status(201).json(full);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── GET /api/chat/unread-count ─────────────────────────────────────────── */
router.get('/unread-count', authenticate, requirePermission('chat_internal'), async (req, res) => {
  try {
    const all = await ChatChannel.findAll({ where: { isActive: true } });
    const visible = all.filter(c => userCanSeeChannel(c, req.user));
    const channelIds = visible.map(c => c.id);

    if (channelIds.length === 0) return res.json({ total: 0 });

    // Count messages sent by others that this user hasn't read
    const messages = await ChatMessage.findAll({
      where: {
        channelId: { [Op.in]: channelIds },
        senderId: { [Op.ne]: req.user.id },
      },
      attributes: ['id', 'isRead'],
    });

    const total = messages.filter(
      m => !m.isRead || !Object.prototype.hasOwnProperty.call(m.isRead, req.user.id)
    ).length;

    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET /api/chat/users ────────────────────────────────────────────────── */
router.get('/users', authenticate, requirePermission('chat_internal'), async (req, res) => {
  try {
    let where = { isActive: true, id: { [Op.ne]: req.user.id } };

    if (req.user.role === 'admin') {
      where.role = { [Op.in]: ['admin', 'manager', 'agent'] };
    } else {
      // manager or agent: admins, all managers, plus agents in same branch
      where = {
        ...where,
        [Op.or]: [
          { role: { [Op.in]: ['admin', 'manager'] } },
          { role: 'agent', branchId: req.user.branchId },
        ],
      };
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'role', 'profileImage', 'isActive', 'branchId'],
      order: [
        ['role', 'ASC'],
        ['firstName', 'ASC'],
      ],
    });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── POST /api/chat/property-update ─────────────────────────────────────── */
router.post(
  '/property-update',
  authenticate,
  requirePermission('chat_internal'),
  async (req, res) => {
    try {
      const { propertyId, action, propertyTitle, propertyLocality, propertyPrice, referenceNumber } = req.body;

      // Find the property_updates channel
      let channel = await ChatChannel.findOne({
        where: { type: 'property_updates', isActive: true },
      });

      if (!channel) {
        channel = await ChatChannel.create({
          name: 'Property Updates',
          type: 'property_updates',
          description: 'Automatic property activity feed',
          isActive: true,
        });
      }

      const refPart = referenceNumber ? `[${referenceNumber}] ` : '';
      const content =
        `🏠 **${action}**: ${refPart}${propertyTitle || 'Property'} — ${propertyLocality || ''} — €${propertyPrice ? Number(propertyPrice).toLocaleString() : '?'}`;

      const message = await ChatMessage.create({
        channelId: channel.id,
        senderId: req.user.id,
        content,
        type: 'property_update',
        propertyId: propertyId || null,
        metadata: { action, propertyTitle, propertyLocality, propertyPrice, referenceNumber },
        isRead: {},
      });

      await channel.update({ lastMessageAt: message.createdAt });

      res.status(201).json({ message });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── POST /api/chat/owner-update ────────────────────────────────────────── */
router.post(
  '/owner-update',
  authenticate,
  requirePermission('chat_internal'),
  async (req, res) => {
    try {
      const { ownerId, action, ownerName } = req.body;

      // Post to the existing property_updates channel (shared activity feed)
      let channel = await ChatChannel.findOne({
        where: { type: 'property_updates', isActive: true },
      });

      if (!channel) {
        channel = await ChatChannel.create({
          name: 'Property Updates',
          type: 'property_updates',
          description: 'Automatic property activity feed',
          isActive: true,
        });
      }

      const content = `👤 **${action}**: Owner "${ownerName || 'Unknown'}"`;

      const message = await ChatMessage.create({
        channelId: channel.id,
        senderId: req.user.id,
        content,
        type: 'owner_update',
        ownerId: ownerId || null,
        metadata: { action, ownerName, ownerId },
        isRead: {},
      });

      await channel.update({ lastMessageAt: message.createdAt });

      res.status(201).json({ message });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── PUT /api/chat/messages/:id ─────────────────────────────────────────── */
router.put(
  '/messages/:id',
  authenticate,
  requirePermission('chat_internal'),
  [body('content').trim().notEmpty().withMessage('Message content is required').isLength({ max: 2000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const message = await ChatMessage.findByPk(req.params.id);
      if (!message) return res.status(404).json({ error: 'Message not found' });
      if (message.senderId !== req.user.id && req.user.role !== 'admin')
        return res.status(403).json({ error: 'Access denied' });

      await message.update({
        content: req.body.content,
        metadata: { ...(message.metadata || {}), edited: true },
      });

      const full = await ChatMessage.findByPk(message.id, {
        include: [{ model: User, as: 'sender', attributes: senderAttrs }],
      });
      res.json(full);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ─── DELETE /api/chat/messages/:id ──────────────────────────────────────── */
router.delete('/messages/:id', authenticate, requirePermission('chat_internal'), async (req, res) => {
  try {
    const message = await ChatMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== req.user.id && !['admin', 'manager'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied' });

    await message.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── PATCH /api/chat/messages/:id/pin ───────────────────────────────────── */
router.patch('/messages/:id/pin', authenticate, authorize('admin', 'manager'), requirePermission('chat_internal'), async (req, res) => {
  try {
    const message = await ChatMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const newPinned = !(message.metadata?.pinned);
    await message.update({ metadata: { ...(message.metadata || {}), pinned: newPinned } });

    const full = await ChatMessage.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: senderAttrs }],
    });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
