'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { TrainingCourse, TrainingProgress, User } = require('../models');
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return null;
};

const VALID_CATEGORIES = ['onboarding', 'sales', 'legal', 'compliance', 'product_knowledge', 'soft_skills', 'technology', 'other'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const VALID_CONTENT_TYPES = ['video', 'document', 'quiz', 'interactive', 'external_link'];

function sanitiseCourse(body) {
  const d = { ...body };
  ['category', 'difficulty', 'contentType', 'contentUrl', 'thumbnailUrl', 'instructor'].forEach((f) => {
    if (d[f] === '' || d[f] === undefined) d[f] = null;
  });
  if (!Array.isArray(d.tags)) {
    d.tags = d.tags ? String(d.tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
  }
  if (typeof d.duration === 'string') d.duration = parseInt(d.duration, 10) || null;
  if (typeof d.order === 'string') d.order = parseInt(d.order, 10) || 0;
  return d;
}

// ── GET /api/training/courses ─────────────────────────────────────────────────
router.get('/courses', authenticate, async (req, res) => {
  try {
    const {
      search,
      category,
      difficulty,
      isRequired,
      page = 1,
      limit = 20,
      sortBy = 'order',
      sortDir = 'ASC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = { isPublished: true };

    // Admin/manager can see unpublished courses too
    if (['admin', 'manager'].includes(req.user.role)) {
      delete where.isPublished;
    }

    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (difficulty && VALID_DIFFICULTIES.includes(difficulty)) where.difficulty = difficulty;
    if (isRequired === 'true') where.isRequired = true;

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { instructor: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const validSortCols = ['title', 'order', 'createdAt', 'duration', 'category', 'difficulty'];
    const col = validSortCols.includes(sortBy) ? sortBy : 'order';
    const dir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await TrainingCourse.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      ],
      order: [[col, dir]],
      limit: limitNum,
      offset,
    });

    // Attach current user's progress to each course
    const courseIds = rows.map((c) => c.id);
    const progressRecords = courseIds.length
      ? await TrainingProgress.findAll({
          where: { userId: req.user.id, courseId: { [Op.in]: courseIds } },
        })
      : [];
    const progressMap = {};
    progressRecords.forEach((p) => { progressMap[p.courseId] = p; });

    const data = rows.map((course) => ({
      ...course.toJSON(),
      userProgress: progressMap[course.id] || null,
    }));

    res.json({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error('GET /api/training/courses error:', err);
    res.status(500).json({ error: 'Failed to list courses' });
  }
});

// ── GET /api/training/stats ───────────────────────────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalCourses = await TrainingCourse.count({ where: { isPublished: true } });
    const requiredCourses = await TrainingCourse.count({ where: { isPublished: true, isRequired: true } });

    const allProgress = await TrainingProgress.findAll({
      where: { userId: req.user.id },
    });

    const completed  = allProgress.filter((p) => p.status === 'completed').length;
    const inProgress = allProgress.filter((p) => p.status === 'in_progress').length;
    const completionRate = totalCourses > 0 ? Math.round((completed / totalCourses) * 100) : 0;

    res.json({
      data: {
        totalCourses,
        requiredCourses,
        completed,
        inProgress,
        completionRate,
      },
    });
  } catch (err) {
    console.error('GET /api/training/stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ── GET /api/training/progress ────────────────────────────────────────────────
router.get('/progress', authenticate, async (req, res) => {
  try {
    const records = await TrainingProgress.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: TrainingCourse,
          as: 'course',
          attributes: ['id', 'title', 'category', 'difficulty', 'duration', 'isRequired'],
        },
      ],
    });
    res.json({ data: records });
  } catch (err) {
    console.error('GET /api/training/progress error:', err);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// ── GET /api/training/courses/:id ─────────────────────────────────────────────
router.get('/courses/:id', authenticate, async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role === 'agent') where.isPublished = true;

    const course = await TrainingCourse.findOne({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      ],
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const userProgress = await TrainingProgress.findOne({
      where: { userId: req.user.id, courseId: course.id },
    });

    res.json({ data: { ...course.toJSON(), userProgress: userProgress || null } });
  } catch (err) {
    console.error('GET /api/training/courses/:id error:', err);
    res.status(500).json({ error: 'Failed to get course' });
  }
});

// ── POST /api/training/courses ────────────────────────────────────────────────
router.post(
  '/courses',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').optional().isIn(VALID_CATEGORIES).withMessage('Invalid category'),
    body('difficulty').optional().isIn(VALID_DIFFICULTIES).withMessage('Invalid difficulty'),
    body('contentType').optional().isIn(VALID_CONTENT_TYPES).withMessage('Invalid content type'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const sanitised = sanitiseCourse(req.body);
      const course = await TrainingCourse.create({
        title: sanitised.title,
        description: sanitised.description || null,
        category: sanitised.category || 'other',
        difficulty: sanitised.difficulty || 'beginner',
        duration: sanitised.duration,
        contentType: sanitised.contentType || 'document',
        contentUrl: sanitised.contentUrl,
        thumbnailUrl: sanitised.thumbnailUrl,
        instructor: sanitised.instructor,
        isRequired: sanitised.isRequired === true || sanitised.isRequired === 'true',
        isPublished: sanitised.isPublished !== false && sanitised.isPublished !== 'false',
        order: sanitised.order || 0,
        createdBy: req.user.id,
        tags: sanitised.tags,
      });

      const full = await TrainingCourse.findOne({
        where: { id: course.id },
        include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
      });
      res.status(201).json({ data: full });
    } catch (err) {
      console.error('POST /api/training/courses error:', err);
      res.status(500).json({ error: 'Failed to create course' });
    }
  }
);

// ── PUT /api/training/courses/:id ─────────────────────────────────────────────
router.put(
  '/courses/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('category').optional().isIn(VALID_CATEGORIES).withMessage('Invalid category'),
    body('difficulty').optional().isIn(VALID_DIFFICULTIES).withMessage('Invalid difficulty'),
    body('contentType').optional().isIn(VALID_CONTENT_TYPES).withMessage('Invalid content type'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const course = await TrainingCourse.findByPk(req.params.id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const allowed = [
        'title', 'description', 'category', 'difficulty', 'duration',
        'contentType', 'contentUrl', 'thumbnailUrl', 'instructor',
        'isRequired', 'isPublished', 'order', 'tags',
      ];
      const updates = {};
      for (const key of allowed) {
        if (key in req.body) updates[key] = req.body[key];
      }
      const sanitised = sanitiseCourse(updates);
      await course.update(sanitised);

      const full = await TrainingCourse.findOne({
        where: { id: course.id },
        include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
      });
      res.json({ data: full });
    } catch (err) {
      console.error('PUT /api/training/courses/:id error:', err);
      res.status(500).json({ error: 'Failed to update course' });
    }
  }
);

// ── DELETE /api/training/courses/:id ─────────────────────────────────────────
router.delete(
  '/courses/:id',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const course = await TrainingCourse.findByPk(req.params.id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      await TrainingProgress.destroy({ where: { courseId: course.id } });
      await course.destroy();

      res.json({ message: 'Course deleted successfully' });
    } catch (err) {
      console.error('DELETE /api/training/courses/:id error:', err);
      res.status(500).json({ error: 'Failed to delete course' });
    }
  }
);

// ── POST /api/training/progress/:courseId ─────────────────────────────────────
router.post(
  '/progress/:courseId',
  authenticate,
  [
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be 0–100'),
    body('status').optional().isIn(['not_started', 'in_progress', 'completed']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr) return;

    try {
      const course = await TrainingCourse.findOne({
        where: { id: req.params.courseId, isPublished: true },
      });
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const { status, progress, score, notes } = req.body;

      const [record, created] = await TrainingProgress.findOrCreate({
        where: { userId: req.user.id, courseId: course.id },
        defaults: {
          status: 'not_started',
          progress: 0,
          userId: req.user.id,
          courseId: course.id,
        },
      });

      const updates = {};

      if (status) updates.status = status;
      if (progress !== undefined) updates.progress = parseInt(progress, 10);
      if (score !== undefined) updates.score = score;
      if (notes !== undefined) updates.notes = notes;

      // Auto-set timestamps
      const currentStatus = updates.status || record.status;
      if (currentStatus === 'in_progress' && !record.startedAt) {
        updates.startedAt = new Date();
      }
      if (currentStatus === 'completed') {
        if (!record.startedAt) updates.startedAt = new Date();
        updates.completedAt = new Date();
        updates.progress = 100;
      }
      // Auto-start if progress > 0
      if (updates.progress > 0 && !record.startedAt) {
        updates.startedAt = new Date();
        if (!updates.status && record.status === 'not_started') {
          updates.status = 'in_progress';
        }
      }

      await record.update(updates);
      res.json({ data: record });
    } catch (err) {
      console.error('POST /api/training/progress/:courseId error:', err);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  }
);

module.exports = router;
