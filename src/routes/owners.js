'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Owner, OwnerContact, Property, ChatChannel, ChatMessage, sequelize: db } = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const { logActivity, getIp, getUa } = require('../services/activityLogger');

const router = express.Router();

/**
 * Fire-and-forget helper: post a system message to the property_updates channel for owner events.
 * Does NOT throw — failures are silently swallowed so they never affect the main request.
 */
async function postOwnerUpdateMessage(senderId, { ownerId, action, ownerName }) {
  try {
    let channel = await ChatChannel.findOne({ where: { type: 'property_updates', isActive: true } });
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
      senderId,
      content,
      type: 'owner_update',
      ownerId: ownerId || null,
      metadata: { action, ownerName, ownerId },
      isRead: {},
    });
    await channel.update({ lastMessageAt: message.createdAt });
  } catch (err) {
    console.error('[owners] postOwnerUpdateMessage error:', err.message);
  }
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
router.use(apiLimiter);

/* ── Helpers ── */
const sanitizeProfileImage = (val) => {
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === 'string' && val.trim() !== '') return val.trim();
  return null;
};

const OWNER_FIELDS = [
  'firstName','lastName','email','phone','alternatePhone','idNumber',
  'nationality','preferredLanguage','dateOfBirth','companyName','taxId',
  'address','notes','profileImage','isActive',
];

const CONTACT_FIELDS = [
  'relationship','firstName','lastName','phone','alternatePhone','email','notes','isEmergency','isPrimary',
];

const pickFields = (obj, fields) => {
  const result = {};
  fields.forEach(f => { if (f in obj && obj[f] !== undefined) result[f] = obj[f]; });
  return result;
};

/* ── LIST ── */
router.get('/', authenticate, requirePermission('owners_view'), async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { referenceNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'referenceNumber', 'isActive'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Owner.findAndCountAll({
      where,
      include: [
        { model: Property, attributes: ['id'], required: false },
      ],
      order: [[safeSortBy, safeSortOrder]],
      limit: limitNum,
      offset,
      distinct: true,
    });

    res.json({
      owners: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    console.error('GET /owners error:', err.message);
    res.status(500).json({ error: 'Failed to load owners' });
  }
});

/* ── CHECK DUPLICATE ── */
router.get('/check-duplicate', authenticate, requirePermission('owners_view'), async (req, res) => {
  try {
    const { phone, email, firstName, lastName, idNumber, excludeId } = req.query;
    const conditions = [];

    // Exact phone match (strip spaces)
    if (phone && phone.trim()) {
      const cleanPhone = phone.replace(/\s+/g, '');
      conditions.push({ phone: { [Op.iLike]: cleanPhone } });
    }

    // Case-insensitive email
    if (email && email.trim()) {
      conditions.push({ email: { [Op.iLike]: email.trim() } });
    }

    // Same first + last name
    if (firstName && lastName && firstName.trim() && lastName.trim()) {
      conditions.push({
        firstName: { [Op.iLike]: firstName.trim() },
        lastName: { [Op.iLike]: lastName.trim() },
      });
    }

    // Same ID number
    if (idNumber && idNumber.trim()) {
      conditions.push({ idNumber: { [Op.iLike]: idNumber.trim() } });
    }

    if (conditions.length === 0) {
      return res.json({ isDuplicate: false, matches: [] });
    }

    const where = { [Op.or]: conditions };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const matches = await Owner.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'referenceNumber', 'isActive'],
      limit: 10,
    });

    res.json({ isDuplicate: matches.length > 0, matches });
  } catch (err) {
    console.error('GET /owners/check-duplicate error:', err.message);
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
});

/* ── DETAIL ── */
router.get('/:id', authenticate, requirePermission('owners_view'), async (req, res) => {
  try {
    const owner = await Owner.findByPk(req.params.id, {
      include: [
        { model: OwnerContact, as: 'contacts' },
        { model: Property, attributes: ['id','title','type','listingType','status','price','currency','locality','referenceNumber'], required: false },
      ],
    });
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.json(owner);
  } catch (err) {
    console.error('GET /owners/:id error:', err.message);
    res.status(500).json({ error: 'Failed to load owner' });
  }
});

/* ── CREATE ── */
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  requirePermission('owners_create'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const t = await db.transaction();
    try {
      const { contacts, ...body } = req.body;
      const ownerData = pickFields(body, OWNER_FIELDS);
      ownerData.profileImage = sanitizeProfileImage(ownerData.profileImage);

      const owner = await Owner.create(ownerData, { transaction: t });

      if (Array.isArray(contacts) && contacts.length > 0) {
        const rows = contacts
          .filter(c => c.relationship && c.firstName)
          .map(c => ({ ownerId: owner.id, ...pickFields(c, CONTACT_FIELDS) }));
        if (rows.length > 0) await OwnerContact.bulkCreate(rows, { transaction: t });
      }

      await t.commit();

      const full = await Owner.findByPk(owner.id, {
        include: [{ model: OwnerContact, as: 'contacts' }],
      });

      // Fire-and-forget: notifications + chat message
      try {
        await notificationService.onOwnerCreated(full, req.user);
      } catch (e) { console.error('[owners] onOwnerCreated notification error:', e.message); }
      postOwnerUpdateMessage(req.user.id, {
        ownerId: full.id,
        action: 'Owner Added',
        ownerName: `${full.firstName} ${full.lastName}`,
      });
      setImmediate(() => logActivity({ userId: req.user.id, action: 'create', entityType: 'owner', entityId: full.id, entityName: `${full.firstName} ${full.lastName}`, description: `Created owner ${full.firstName} ${full.lastName}`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'info' }));

      res.status(201).json(full);
    } catch (err) {
      await t.rollback();
      console.error('POST /owners error:', err.message);
      res.status(500).json({ error: 'Failed to create owner' });
    }
  }
);

/* ── UPDATE ── */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  requirePermission('owners_edit'),
  [
    body('firstName').optional().trim().notEmpty(),
    body('email').optional({ checkFalsy: true }).isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const t = await db.transaction();
    try {
      const owner = await Owner.findByPk(req.params.id, { transaction: t });
      if (!owner) { await t.rollback(); return res.status(404).json({ error: 'Owner not found' }); }

      const { contacts, ...body } = req.body;
      const ownerData = pickFields(body, OWNER_FIELDS);
      if ('profileImage' in ownerData) ownerData.profileImage = sanitizeProfileImage(ownerData.profileImage);

      // Track which primitive fields are being changed for notification metadata
      const changedFields = Object.keys(ownerData).filter(k => {
        const oldVal = owner[k];
        const newVal = ownerData[k];
        if (typeof oldVal !== 'object' && typeof newVal !== 'object') return oldVal !== newVal;
        return false; // skip object/array fields from changed tracking
      });

      await owner.update(ownerData, { transaction: t });

      if (Array.isArray(contacts)) {
        await OwnerContact.destroy({ where: { ownerId: owner.id }, transaction: t });
        const rows = contacts
          .filter(c => c.relationship && c.firstName)
          .map(c => ({ ownerId: owner.id, ...pickFields(c, CONTACT_FIELDS) }));
        if (rows.length > 0) await OwnerContact.bulkCreate(rows, { transaction: t });
      }

      await t.commit();

      const full = await Owner.findByPk(owner.id, {
        include: [
          { model: OwnerContact, as: 'contacts' },
          { model: Property, attributes: ['id','title','type','listingType','status','price','currency','locality'], required: false },
        ],
      });

      // Fire-and-forget: notifications + chat message
      try {
        await notificationService.onOwnerUpdated(full, changedFields, req.user);
      } catch (e) { console.error('[owners] onOwnerUpdated notification error:', e.message); }
      postOwnerUpdateMessage(req.user.id, {
        ownerId: full.id,
        action: 'Owner Updated',
        ownerName: `${full.firstName} ${full.lastName}`,
      });
      setImmediate(() => logActivity({ userId: req.user.id, action: 'update', entityType: 'owner', entityId: full.id, entityName: `${full.firstName} ${full.lastName}`, description: `Updated owner ${full.firstName} ${full.lastName}`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'info' }));

      res.json(full);
    } catch (err) {
      await t.rollback();
      console.error('PUT /owners/:id error:', err.message);
      res.status(500).json({ error: 'Failed to update owner' });
    }
  }
);

/* ── DELETE ── */
router.delete('/:id', authenticate, authorize('admin', 'manager'), requirePermission('owners_delete'), async (req, res) => {
  try {
    const owner = await Owner.findByPk(req.params.id, {
      include: [{ model: Property, attributes: ['id'], required: false }],
    });
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    if (owner.Properties && owner.Properties.length > 0) {
      await owner.update({ isActive: false });
      setImmediate(() => logActivity({ userId: req.user.id, action: 'delete', entityType: 'owner', entityId: owner.id, entityName: `${owner.firstName} ${owner.lastName}`, description: `Deactivated owner ${owner.firstName} ${owner.lastName} (has linked properties)`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'warning' }));
      return res.json({ message: 'Owner deactivated (has linked properties)' });
    }

    await OwnerContact.destroy({ where: { ownerId: owner.id } });
    await owner.destroy();
    setImmediate(() => logActivity({ userId: req.user.id, action: 'delete', entityType: 'owner', entityId: req.params.id, entityName: `${owner.firstName} ${owner.lastName}`, description: `Deleted owner ${owner.firstName} ${owner.lastName}`, ipAddress: getIp(req), userAgent: getUa(req), severity: 'warning' }));
    res.json({ message: 'Owner deleted' });
  } catch (err) {
    console.error('DELETE /owners/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete owner' });
  }
});

module.exports = router;
