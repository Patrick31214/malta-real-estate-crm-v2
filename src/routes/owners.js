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

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return null;
};

// GET /api/owners
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 50 } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    else where.isActive = true;

    if (search) {
      where[Op.or] = [
        { firstName:       { [Op.iLike]: `%${search}%` } },
        { lastName:        { [Op.iLike]: `%${search}%` } },
        { phone:           { [Op.iLike]: `%${search}%` } },
        { email:           { [Op.iLike]: `%${search}%` } },
        { referenceNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Owner.findAndCountAll({
      where,
      include: [
        { model: OwnerContact, as: 'contacts' },
        { model: Property, attributes: ['id'], required: false },
      ],
      order: [['referenceNumber', 'ASC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    res.json({ owners: rows, pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/owners/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const owner = await Owner.findByPk(req.params.id, {
      include: [
        { model: OwnerContact, as: 'contacts' },
        { model: Property, attributes: ['id', 'title', 'type', 'listingType', 'status', 'price', 'currency', 'locality'], required: false },
      ],
    });
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.json(owner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/owners
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').optional({ nullable: true, checkFalsy: true }).trim(),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Valid email required'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    const t = await db.transaction();
    const CONTACT_FIELDS = ['relationship','firstName','lastName','phone','alternatePhone','email','notes','isEmergency','isPrimary'];
    try {
      const { contacts, ...ownerData } = req.body;
      if (Array.isArray(ownerData.profileImage)) {
        ownerData.profileImage = ownerData.profileImage[0] || null;
      }
      const owner = await Owner.create(ownerData, { transaction: t });
      if (Array.isArray(contacts) && contacts.length > 0) {
        const contactRows = contacts.map(c => {
          const row = { ownerId: owner.id };
          CONTACT_FIELDS.forEach(k => { if (k in c) row[k] = c[k]; });
          return row;
        });
        await OwnerContact.bulkCreate(contactRows, { transaction: t });
      }
      await t.commit();
      const full = await Owner.findByPk(owner.id, { include: [{ model: OwnerContact, as: 'contacts' }] });
      res.status(201).json(full);
    } catch (err) {
      await t.rollback();
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/owners/:id
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('firstName').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail(),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    const t = await db.transaction();
    try {
      const owner = await Owner.findByPk(req.params.id, { transaction: t });
      if (!owner) { await t.rollback(); return res.status(404).json({ error: 'Owner not found' }); }

      const { contacts, ...ownerData } = req.body;
      if (Array.isArray(ownerData.profileImage)) {
        ownerData.profileImage = ownerData.profileImage[0] || null;
      }
      await owner.update(ownerData, { transaction: t });

      if (Array.isArray(contacts)) {
        const incomingIds = contacts.filter(c => c.id).map(c => c.id);
        // Delete removed contacts (guard against empty array edge case)
        if (incomingIds.length > 0) {
          await OwnerContact.destroy({ where: { ownerId: owner.id, id: { [Op.notIn]: incomingIds } }, transaction: t });
        } else {
          await OwnerContact.destroy({ where: { ownerId: owner.id }, transaction: t });
        }
        // Update existing / create new
        const UPDATABLE = ['relationship','firstName','lastName','phone','alternatePhone','email','notes','isEmergency','isPrimary'];
        for (const c of contacts) {
          const fields = {};
          UPDATABLE.forEach(k => { if (k in c) fields[k] = c[k]; });
          if (c.id) {
            await OwnerContact.update(fields, { where: { id: c.id, ownerId: owner.id }, transaction: t });
          } else {
            await OwnerContact.create({ ...fields, ownerId: owner.id }, { transaction: t });
          }
        }
      }

      await t.commit();
      const full = await Owner.findByPk(owner.id, { include: [{ model: OwnerContact, as: 'contacts' }, { model: Property, attributes: ['id', 'title', 'type', 'listingType', 'status', 'price', 'currency', 'locality'], required: false }] });
      res.json(full);
    } catch (err) {
      await t.rollback();
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/owners/:id
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const owner = await Owner.findByPk(req.params.id, {
      include: [{ model: Property, attributes: ['id'], required: false }],
    });
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    if (owner.Properties && owner.Properties.length > 0) {
      // Has properties — soft delete only
      await owner.update({ isActive: false });
      return res.json({ message: 'Owner deactivated (has linked properties)' });
    }

    await OwnerContact.destroy({ where: { ownerId: owner.id } });
    await owner.destroy();
    res.json({ message: 'Owner deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/owners/:id/contacts
router.post('/:id/contacts', authenticate, authorize('admin', 'manager', 'agent'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('relationship').trim().notEmpty().withMessage('Relationship is required'),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;
    try {
      const owner = await Owner.findByPk(req.params.id);
      if (!owner) return res.status(404).json({ error: 'Owner not found' });
      const contact = await OwnerContact.create({ ...req.body, ownerId: owner.id });
      res.status(201).json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/owners/:id/contacts/:contactId
router.put('/:id/contacts/:contactId', authenticate, authorize('admin', 'manager', 'agent'), async (req, res) => {
  try {
    const contact = await OwnerContact.findOne({ where: { id: req.params.contactId, ownerId: req.params.id } });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    await contact.update(req.body);
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/owners/:id/contacts/:contactId
router.delete('/:id/contacts/:contactId', authenticate, authorize('admin', 'manager', 'agent'), async (req, res) => {
  try {
    const contact = await OwnerContact.findOne({ where: { id: req.params.contactId, ownerId: req.params.id } });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    await contact.destroy();
    res.json({ message: 'Contact removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
