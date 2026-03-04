'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Owner, OwnerContact, Property, sequelize: db } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

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
router.get('/', authenticate, async (req, res) => {
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
router.get('/check-duplicate', authenticate, async (req, res) => {
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
router.get('/:id', authenticate, async (req, res) => {
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
      res.json(full);
    } catch (err) {
      await t.rollback();
      console.error('PUT /owners/:id error:', err.message);
      res.status(500).json({ error: 'Failed to update owner' });
    }
  }
);

/* ── DELETE ── */
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const owner = await Owner.findByPk(req.params.id, {
      include: [{ model: Property, attributes: ['id'], required: false }],
    });
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    if (owner.Properties && owner.Properties.length > 0) {
      await owner.update({ isActive: false });
      return res.json({ message: 'Owner deactivated (has linked properties)' });
    }

    await OwnerContact.destroy({ where: { ownerId: owner.id } });
    await owner.destroy();
    res.json({ message: 'Owner deleted' });
  } catch (err) {
    console.error('DELETE /owners/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete owner' });
  }
});

module.exports = router;
