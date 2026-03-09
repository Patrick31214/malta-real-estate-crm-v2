'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Document, User, Property, Owner, Client } = require('../models');
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

const VALID_CATEGORIES = [
  'contract', 'floor_plan', 'energy_cert', 'id_document', 'legal',
  'photo', 'team_photo', 'brochure',
  'agreement', 'permit', 'certificate', 'report', 'financial', 'template', 'correspondence',
  'other',
];
const VALID_STATUSES = ['draft', 'pending_review', 'approved', 'signed', 'archived', 'expired'];

const ALLOWED_FIELDS = [
  'name', 'description', 'category', 'status', 'fileName', 'fileUrl',
  'fileSize', 'mimeType', 'isConfidential', 'tags', 'expiryDate',
  'propertyId', 'ownerId', 'clientId', 'notes',
];

function pickAllowed(body) {
  const result = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) result[key] = body[key];
  }
  return result;
}

function sanitiseBody(body) {
  const d = { ...body };
  ['category', 'status', 'propertyId', 'ownerId', 'clientId'].forEach((f) => {
    if (d[f] === '' || d[f] === undefined) d[f] = null;
  });
  if (d.expiryDate === '') d.expiryDate = null;
  if (d.isConfidential === undefined) d.isConfidential = false;
  if (!Array.isArray(d.tags)) {
    d.tags = d.tags ? String(d.tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
  }
  if (typeof d.fileSize === 'string') d.fileSize = parseInt(d.fileSize, 10) || null;
  return d;
}

const INCLUDES = [
  { model: User,     as: 'uploadedBy', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
  { model: Property, as: 'property',   attributes: ['id', 'title', 'referenceNumber', 'status', 'locality'] },
  { model: Owner,    as: 'owner',      attributes: ['id', 'firstName', 'lastName', 'email'] },
  { model: Client,   as: 'client',     attributes: ['id', 'firstName', 'lastName', 'email'] },
];

// ── GET /api/documents ────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search, category, status, propertyId, ownerId, clientId, isConfidential,
      page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};

    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (status   && VALID_STATUSES.includes(status))     where.status   = status;
    if (propertyId) where.propertyId = propertyId;
    if (ownerId)    where.ownerId    = ownerId;
    if (clientId)   where.clientId   = clientId;

    // Only admin/manager can filter by isConfidential; agents only see non-confidential
    if (req.user.role === 'agent') {
      where.isConfidential = false;
    } else if (isConfidential !== undefined && isConfidential !== '') {
      where.isConfidential = isConfidential === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name:        { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { fileName:    { [Op.iLike]: `%${search}%` } },
        { notes:       { [Op.iLike]: `%${search}%` } },
      ];
    }

    const validSortCols = ['createdAt', 'updatedAt', 'name', 'category', 'status', 'expiryDate', 'fileSize'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortDir === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Document.findAndCountAll({
      where,
      include: INCLUDES,
      order: [[orderCol, orderDir]],
      limit: limitNum,
      offset,
      distinct: true,
    });

    res.json({
      documents: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error('GET /api/documents error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// ── GET /api/documents/stats ──────────────────────────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const baseWhere = {};
    if (req.user.role === 'agent') {
      baseWhere.isConfidential = false;
    }

    const today    = new Date();
    const in30days = new Date(today); in30days.setDate(today.getDate() + 30);

    const [total, pendingReview, expiringSoon, byCategory, byStatus] = await Promise.all([
      Document.count({ where: baseWhere }),
      Document.count({ where: { ...baseWhere, status: 'pending_review' } }),
      Document.count({
        where: {
          ...baseWhere,
          expiryDate: {
            [Op.between]: [
              today.toISOString().slice(0, 10),
              in30days.toISOString().slice(0, 10),
            ],
          },
          status: { [Op.notIn]: ['archived', 'expired'] },
        },
      }),
      Document.findAll({
        where: baseWhere,
        attributes: [
          'category',
          [Document.sequelize.fn('COUNT', Document.sequelize.col('id')), 'count'],
        ],
        group: ['category'],
        raw: true,
      }),
      Document.findAll({
        where: baseWhere,
        attributes: [
          'status',
          [Document.sequelize.fn('COUNT', Document.sequelize.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      }),
    ]);

    res.json({
      total,
      pendingReview,
      expiringSoon,
      byCategory: byCategory.reduce((acc, row) => {
        if (row.category) acc[row.category] = parseInt(row.count, 10);
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, row) => {
        if (row.status) acc[row.status] = parseInt(row.count, 10);
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error('GET /api/documents/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch document stats' });
  }
});

// ── GET /api/documents/:id ────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id, { include: INCLUDES });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Agents cannot see confidential documents
    if (req.user.role === 'agent' && doc.isConfidential) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(doc);
  } catch (err) {
    console.error('GET /api/documents/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// ── POST /api/documents ───────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Document name is required'),
    body('fileUrl').trim().notEmpty().withMessage('File URL is required'),
    body('fileName').trim().notEmpty().withMessage('File name is required'),
    body('category').optional({ nullable: true }).isIn([...VALID_CATEGORIES, '']).withMessage('Invalid category'),
    body('status').optional({ nullable: true }).isIn([...VALID_STATUSES, '']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const data = sanitiseBody(pickAllowed(req.body));
      data.uploadedById = req.user.id;

      const doc = await Document.create(data);
      const full = await Document.findByPk(doc.id, { include: INCLUDES });
      res.status(201).json(full);
    } catch (err) {
      console.error('POST /api/documents error:', err);
      res.status(500).json({ error: 'Failed to create document' });
    }
  }
);

// ── PUT /api/documents/:id ────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().notEmpty().withMessage('Document name cannot be empty'),
    body('category').optional({ nullable: true }).isIn([...VALID_CATEGORIES, '']).withMessage('Invalid category'),
    body('status').optional({ nullable: true }).isIn([...VALID_STATUSES, '']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const doc = await Document.findByPk(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });

      // Only admin/manager or the uploader can edit
      if (req.user.role === 'agent' && doc.uploadedById !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Agents can only update non-confidential documents they uploaded
      if (req.user.role === 'agent') {
        const allowed = pickAllowed({ name: req.body.name, description: req.body.description, notes: req.body.notes, tags: req.body.tags });
        await doc.update(sanitiseBody(allowed));
      } else {
        await doc.update(sanitiseBody(pickAllowed(req.body)));
      }

      const full = await Document.findByPk(doc.id, { include: INCLUDES });
      res.json(full);
    } catch (err) {
      console.error('PUT /api/documents/:id error:', err);
      res.status(500).json({ error: 'Failed to update document' });
    }
  }
);

// ── PUT /api/documents/:id/status ─────────────────────────────────────────────
router.put(
  '/:id/status',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('status').isIn(VALID_STATUSES).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const doc = await Document.findByPk(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });

      await doc.update({ status: req.body.status });
      const full = await Document.findByPk(doc.id, { include: INCLUDES });
      res.json(full);
    } catch (err) {
      console.error('PUT /api/documents/:id/status error:', err);
      res.status(500).json({ error: 'Failed to update document status' });
    }
  }
);

// ── DELETE /api/documents/:id ─────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    await doc.destroy();
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/documents/:id error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
