'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { File, User, Property, Client } = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

// ── Multer setup ─────────────────────────────────────────────────────────────

const FILES_DIR = path.join(__dirname, '../../uploads/files');

if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FILES_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return null;
};

const VALID_CATEGORIES = ['property', 'client', 'legal', 'financial', 'marketing', 'internal', 'other'];

const INCLUDES = [
  { model: User,     as: 'uploader',  attributes: ['id', 'firstName', 'lastName', 'avatar'] },
  { model: Property, as: 'property',  attributes: ['id', 'title', 'referenceNumber'] },
  { model: Client,   as: 'client',    attributes: ['id', 'firstName', 'lastName'] },
];

function sanitiseBody(body) {
  const d = { ...body };
  ['category', 'folderId', 'propertyId', 'clientId'].forEach((f) => {
    if (d[f] === '' || d[f] === undefined) d[f] = null;
  });
  if (!Array.isArray(d.tags)) {
    d.tags = d.tags ? String(d.tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
  }
  return d;
}

// ── GET /api/files ────────────────────────────────────────────────────────────
router.get('/', authenticate, requirePermission('files_view'), async (req, res) => {
  try {
    const {
      search,
      category,
      folderId,
      isFolder,
      page = 1,
      limit = 30,
      sortBy = 'createdAt',
      sortDir = 'DESC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const offset   = (pageNum - 1) * limitNum;

    const where = { isArchived: false };

    // Folder navigation
    if (folderId === 'null' || folderId === '' || folderId === undefined) {
      where.folderId = null;
    } else {
      where.folderId = folderId;
    }

    if (isFolder !== undefined) {
      where.isFolder = isFolder === 'true';
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    // Agents only see their own files
    if (req.user.role === 'agent') {
      where.uploadedBy = req.user.id;
    }

    const validSortCols = ['name', 'size', 'createdAt', 'updatedAt', 'category'];
    const col = validSortCols.includes(sortBy) ? sortBy : 'createdAt';
    const dir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await File.findAndCountAll({
      where,
      include: INCLUDES,
      order: [
        ['isFolder', 'DESC'], // folders first
        [col, dir],
      ],
      limit: limitNum,
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error('GET /api/files error:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// ── GET /api/files/:id ────────────────────────────────────────────────────────
router.get('/:id', authenticate, requirePermission('files_view'), async (req, res) => {
  try {
    const file = await File.findOne({
      where: { id: req.params.id, isArchived: false },
      include: INCLUDES,
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Agents can only see their own files
    if (req.user.role === 'agent' && file.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: file });
  } catch (err) {
    console.error('GET /api/files/:id error:', err);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// ── POST /api/files (upload) ──────────────────────────────────────────────────
router.post('/', authenticate, requirePermission('files_upload'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, description, category, folderId, tags, propertyId, clientId } = req.body;
    const sanitised = sanitiseBody({
      name: name || req.file.originalname,
      description,
      category,
      folderId,
      tags,
      propertyId,
      clientId,
    });

    const file = await File.create({
      name: sanitised.name,
      path: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: sanitised.category || 'other',
      folderId: sanitised.folderId,
      isFolder: false,
      uploadedBy: req.user.id,
      description: sanitised.description || null,
      tags: sanitised.tags,
      propertyId: sanitised.propertyId,
      clientId: sanitised.clientId,
      isArchived: false,
    });

    const full = await File.findOne({ where: { id: file.id }, include: INCLUDES });
    res.status(201).json({ data: full });
  } catch (err) {
    console.error('POST /api/files error:', err);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to clean up uploaded file:', unlinkErr);
      });
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// ── POST /api/files/folder ────────────────────────────────────────────────────
router.post(
  '/folder',
  authenticate,
  requirePermission('files_upload'),
  [
    body('name').trim().notEmpty().withMessage('Folder name is required'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const { name, folderId, category } = req.body;
      const sanitised = sanitiseBody({ folderId, category });

      const folder = await File.create({
        name: name.trim(),
        path: '',
        mimeType: null,
        size: null,
        category: sanitised.category || 'other',
        folderId: sanitised.folderId,
        isFolder: true,
        uploadedBy: req.user.id,
        description: req.body.description || null,
        tags: [],
        isArchived: false,
      });

      const full = await File.findOne({ where: { id: folder.id }, include: INCLUDES });
      res.status(201).json({ data: full });
    } catch (err) {
      console.error('POST /api/files/folder error:', err);
      res.status(500).json({ error: 'Failed to create folder' });
    }
  }
);

// ── PUT /api/files/:id ────────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  requirePermission('files_upload'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const file = await File.findOne({ where: { id: req.params.id, isArchived: false } });
      if (!file) return res.status(404).json({ error: 'File not found' });

      // Only uploader or admin/manager can edit
      if (req.user.role === 'agent' && file.uploadedBy !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const allowed = ['name', 'description', 'category', 'folderId', 'tags', 'propertyId', 'clientId'];
      const updates = {};
      for (const key of allowed) {
        if (key in req.body) updates[key] = req.body[key];
      }
      const sanitised = sanitiseBody(updates);

      await file.update(sanitised);
      const full = await File.findOne({ where: { id: file.id }, include: INCLUDES });
      res.json({ data: full });
    } catch (err) {
      console.error('PUT /api/files/:id error:', err);
      res.status(500).json({ error: 'Failed to update file' });
    }
  }
);

// ── DELETE /api/files/:id ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, requirePermission('files_delete'), async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Only uploader or admin/manager can delete
    if (req.user.role === 'agent' && file.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const hard = req.query.hard === 'true' && ['admin', 'manager'].includes(req.user.role);

    if (hard) {
      // Hard delete — remove file from disk too
      if (!file.isFolder && file.path) {
        const diskPath = path.join(FILES_DIR, file.path);
        fs.unlink(diskPath, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete file from disk:', unlinkErr);
        });
      }
      await file.destroy();
    } else {
      await file.update({ isArchived: true });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/files/:id error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ── GET /api/files/:id/download ───────────────────────────────────────────────
router.get('/:id/download', authenticate, requirePermission('files_view'), async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, isArchived: false, isFolder: false } });
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (req.user.role === 'agent' && file.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const diskPath = path.join(FILES_DIR, file.path);
    if (!fs.existsSync(diskPath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.sendFile(diskPath);
  } catch (err) {
    console.error('GET /api/files/:id/download error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

module.exports = router;
