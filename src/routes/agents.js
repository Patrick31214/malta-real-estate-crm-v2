'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { User, UserPermission, Branch, Property, ActivityLog, sequelize: db } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { ALL_PERMISSION_KEYS } = require('../constants/agentPermissions');

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
const AGENT_PROFILE_FIELDS = [
  'firstName', 'lastName', 'phone', 'bio', 'profileImage',
  'specializations', 'languages', 'licenseNumber', 'commissionRate',
  'branchId', 'isActive',
  // Extended agent fields
  'passportImage', 'idCardImage', 'contractFile', 'startDate',
  'emergencyContact', 'emergencyPhone', 'nationality', 'dateOfBirth',
  'address', 'eireLicenseExpiry', 'jobTitle',
];

const pickFields = (obj, fields) => {
  const result = {};
  fields.forEach(f => { if (f in obj && obj[f] !== undefined) result[f] = obj[f]; });
  return result;
};

const agentIncludes = [
  { model: Branch, attributes: ['id', 'name', 'city', 'locality'], required: false },
  { model: UserPermission, attributes: ['id', 'feature', 'isEnabled'], required: false },
  { model: Property, attributes: ['id'], required: false },
];

const sanitizePermissionsMap = (permObj) => {
  if (!permObj || typeof permObj !== 'object' || Array.isArray(permObj)) return {};
  const sanitized = {};
  for (const [key, val] of Object.entries(permObj)) {
    if (ALL_PERMISSION_KEYS.includes(key)) {
      sanitized[key] = Boolean(val);
    }
  }
  return sanitized;
};

const syncPermissions = async (userId, permissionsMap, grantedById, transaction) => {
  await UserPermission.destroy({ where: { userId }, transaction });

  const rows = Object.entries(permissionsMap).map(([feature, isEnabled]) => ({
    userId,
    feature,
    isEnabled: Boolean(isEnabled),
    grantedById,
  }));

  if (rows.length > 0) {
    await UserPermission.bulkCreate(rows, { transaction });
  }
};

/* ── LIST agents/managers ── */
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const {
      search, status = 'all', branchId,
      page = 1, limit = 20,
      sortBy = 'createdAt', sortOrder = 'DESC',
    } = req.query;

    const where = {
      role: { [Op.in]: ['agent', 'manager'] },
    };

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } },
        { email:     { [Op.iLike]: `%${search}%` } },
        { phone:     { [Op.iLike]: `%${search}%` } },
        { licenseNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status === 'active')  { where.isActive = true;  where.isBlocked = false; }
    if (status === 'blocked') { where.isBlocked = true; }
    if (status === 'agents')  { where.role = 'agent'; }
    if (status === 'managers') { where.role = 'manager'; }

    if (branchId) where.branchId = branchId;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'commissionRate', 'isActive'];
    const safeSortBy    = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        { model: Branch, attributes: ['id', 'name', 'city', 'locality'], required: false },
        { model: Property, attributes: ['id'], required: false },
        { model: UserPermission, attributes: ['id', 'feature', 'isEnabled'], required: false },
      ],
      order: [[safeSortBy, safeSortOrder]],
      limit: limitNum,
      offset,
      distinct: true,
    });

    res.json({
      agents: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    console.error('GET /agents error:', err.message);
    res.status(500).json({ error: 'Failed to load agents' });
  }
});

/* ── GET single agent ── */
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const agent = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager', 'admin'] } },
      include: [
        { model: Branch, attributes: ['id', 'name', 'city', 'locality'], required: false },
        { model: UserPermission, attributes: ['id', 'feature', 'isEnabled'], required: false },
        { model: Property, attributes: ['id', 'title', 'status', 'price', 'currency', 'locality', 'referenceNumber'], required: false },
        {
          model: ActivityLog,
          attributes: ['id', 'action', 'entityType', 'entityId', 'createdAt'],
          required: false,
          limit: 20,
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    console.error('GET /agents/:id error:', err.message);
    res.status(500).json({ error: 'Failed to load agent' });
  }
});

/* ── CREATE agent ── */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['agent', 'manager']).withMessage('Role must be agent or manager'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const t = await db.transaction();
    try {
      const { permissions, ...body } = req.body;

      // Check email uniqueness
      const existing = await User.findOne({ where: { email: body.email }, transaction: t });
      if (existing) {
        await t.rollback();
        return res.status(409).json({ error: 'Email already in use' });
      }

      const agentData = pickFields(body, [
        'firstName', 'lastName', 'email', 'password', 'phone',
        'role', 'branchId', 'bio', 'profileImage',
        'specializations', 'languages', 'licenseNumber', 'commissionRate',
        'passportImage', 'idCardImage', 'contractFile', 'startDate',
        'emergencyContact', 'emergencyPhone', 'nationality', 'dateOfBirth',
        'address', 'eireLicenseExpiry', 'jobTitle', 'approvalStatus',
      ]);
      agentData.role = agentData.role || 'agent';
      // Sanitize UUID foreign key fields: empty string → null
      if (!agentData.branchId) agentData.branchId = null;
      // New agents created by admin start as approved; default pending for self-registration
      if (!agentData.approvalStatus) agentData.approvalStatus = 'approved';

      const agent = await User.create(agentData, { transaction: t });

      if (permissions && typeof permissions === 'object') {
        const sanitized = sanitizePermissionsMap(permissions);
        await syncPermissions(agent.id, sanitized, req.user.id, t);
      }

      await t.commit();

      const full = await User.findByPk(agent.id, { include: agentIncludes });
      res.status(201).json(full);
    } catch (err) {
      await t.rollback();
      console.error('POST /agents error:', err.message);
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Email already in use' });
      }
      res.status(500).json({ error: 'Failed to create agent' });
    }
  }
);

/* ── UPDATE agent ── */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['agent', 'manager', 'admin']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const t = await db.transaction();
    try {
      const agent = await User.findOne({
        where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager', 'admin'] } },
        transaction: t,
      });
      if (!agent) { await t.rollback(); return res.status(404).json({ error: 'Agent not found' }); }

      const { permissions, ...body } = req.body;

      // Managers can only update limited fields
      const updateFields = req.user.role === 'admin'
        ? [...AGENT_PROFILE_FIELDS, 'email']
        : AGENT_PROFILE_FIELDS;

      // Only admin can change role
      if (body.role && req.user.role !== 'admin') {
        await t.rollback();
        return res.status(403).json({ error: 'Only admin can change roles' });
      }
      if (body.role && req.user.role === 'admin') updateFields.push('role');

      const updateData = pickFields(body, updateFields);

      // Sanitize UUID foreign key fields: empty string → null
      if ('branchId' in updateData && !updateData.branchId) updateData.branchId = null;

      // Check email uniqueness if changing email
      if (updateData.email && updateData.email !== agent.email) {
        const existing = await User.findOne({ where: { email: updateData.email }, transaction: t });
        if (existing) {
          await t.rollback();
          return res.status(409).json({ error: 'Email already in use' });
        }
      }

      await agent.update(updateData, { transaction: t });

      if (permissions && typeof permissions === 'object' && ['admin', 'manager'].includes(req.user.role)) {
        const sanitized = sanitizePermissionsMap(permissions);
        await syncPermissions(agent.id, sanitized, req.user.id, t);
      }

      await t.commit();

      const full = await User.findByPk(agent.id, { include: agentIncludes });
      res.json(full);
    } catch (err) {
      await t.rollback();
      console.error('PUT /agents/:id error:', err.message);
      res.status(500).json({ error: 'Failed to update agent' });
    }
  }
);

/* ── DELETE agent ── */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const agent = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    // Soft-delete: deactivate instead of hard delete to preserve history
    await agent.update({ isActive: false });
    res.json({ message: 'Agent deactivated successfully' });
  } catch (err) {
    console.error('DELETE /agents/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

/* ── BLOCK agent ── */
router.patch('/:id/block', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: 'You cannot block your own account' });
    }
    const agent = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    await agent.update({
      isBlocked: true,
      blockedAt: new Date(),
      blockedReason: req.body.blockedReason || null,
    });
    res.json({ message: 'Agent blocked', agent });
  } catch (err) {
    console.error('PATCH /agents/:id/block error:', err.message);
    res.status(500).json({ error: 'Failed to block agent' });
  }
});

/* ── UNBLOCK agent ── */
router.patch('/:id/unblock', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const agent = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    await agent.update({ isBlocked: false, blockedAt: null, blockedReason: null });
    res.json({ message: 'Agent unblocked', agent });
  } catch (err) {
    console.error('PATCH /agents/:id/unblock error:', err.message);
    res.status(500).json({ error: 'Failed to unblock agent' });
  }
});

/* ── RESET PASSWORD ── */
router.patch(
  '/:id/reset-password',
  authenticate,
  authorize('admin'),
  [body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const agent = await User.findOne({
        where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
      });
      if (!agent) return res.status(404).json({ error: 'Agent not found' });

      // Assign plaintext — the User model's beforeUpdate hook checks changed('password')
      // and hashes it before saving, so no manual bcrypt call is needed here.
      agent.password = req.body.newPassword;
      await agent.save();
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error('PATCH /agents/:id/password error:', err.message);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

/* ── CHANGE EMAIL ── */
router.patch(
  '/:id/email',
  authenticate,
  authorize('admin'),
  [body('newEmail').isEmail().withMessage('Valid email required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const agent = await User.findOne({
        where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
      });
      if (!agent) return res.status(404).json({ error: 'Agent not found' });

      const existing = await User.findOne({ where: { email: req.body.newEmail } });
      if (existing && existing.id !== agent.id) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      await agent.update({ email: req.body.newEmail });
      res.json({ message: 'Email updated successfully', agent });
    } catch (err) {
      console.error('PATCH /agents/:id/email error:', err.message);
      res.status(500).json({ error: 'Failed to update email' });
    }
  }
);

/* ── GET permissions ── */
router.get('/:id/permissions', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const permissions = await UserPermission.findAll({
      where: { userId: req.params.id },
      attributes: ['feature', 'isEnabled'],
    });
    res.json(permissions);
  } catch (err) {
    console.error('GET /agents/:id/permissions error:', err.message);
    res.status(500).json({ error: 'Failed to load permissions' });
  }
});

/* ── INSTANT single-permission toggle ── */
router.patch('/:id/permissions/:feature', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { isEnabled } = req.body;
    const agent = await User.findByPk(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    if (!ALL_PERMISSION_KEYS.includes(req.params.feature)) {
      return res.status(400).json({ error: `Invalid permission feature: ${req.params.feature}` });
    }

    await UserPermission.upsert(
      {
        userId: agent.id,
        feature: req.params.feature,
        isEnabled: Boolean(isEnabled),
        grantedById: req.user.id,
      },
      { conflictFields: ['userId', 'feature'] }
    );

    const allPerms = await UserPermission.findAll({
      where: { userId: agent.id },
      attributes: ['feature', 'isEnabled'],
    });
    res.json(allPerms);
  } catch (err) {
    console.error('PATCH permission error:', err.message);
    res.status(500).json({ error: 'Failed to update permission' });
  }
});

/* ── BULK UPDATE permissions ── */
router.put(
  '/:id/permissions',
  authenticate,
  authorize('admin', 'manager'),
  async (req, res) => {
    try {
      const agent = await User.findByPk(req.params.id);
      if (!agent) return res.status(404).json({ error: 'Agent not found' });

      const { permissions } = req.body;
      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ error: 'permissions object required' });
      }

      const sanitized = sanitizePermissionsMap(permissions);
      const t = await db.transaction();
      try {
        await syncPermissions(agent.id, sanitized, req.user.id, t);
        await t.commit();
      } catch (e) {
        await t.rollback();
        throw e;
      }

      const updated = await UserPermission.findAll({ where: { userId: agent.id } });
      res.json(updated);
    } catch (err) {
      console.error('PUT /agents/:id/permissions error:', err.message);
      res.status(500).json({ error: 'Failed to update permissions' });
    }
  }
);

/* ── UPLOAD document ── */
router.post('/:id/documents', authenticate, authorize('admin'), async (req, res) => {
  try {
    const agent = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { type, url } = req.body;
    const VALID_TYPES = { passportImage: true, idCardImage: true, contractFile: true };
    if (!type || !VALID_TYPES[type]) {
      return res.status(400).json({ error: 'type must be passportImage, idCardImage, or contractFile' });
    }
    if (!url) return res.status(400).json({ error: 'url is required' });

    await agent.update({ [type]: url });
    res.json({ message: 'Document saved', agent });
  } catch (err) {
    console.error('POST /agents/:id/documents error:', err.message);
    res.status(500).json({ error: 'Failed to save document' });
  }
});

/* ── APPROVE agent ── */
router.patch('/:id/approve', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const agent = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    await agent.update({
      approvalStatus: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      isActive: true,
    });
    res.json({ message: 'Agent approved', agent });
  } catch (err) {
    console.error('PATCH /agents/:id/approve error:', err.message);
    res.status(500).json({ error: 'Failed to approve agent' });
  }
});

/* ── REJECT agent ── */
router.patch('/:id/reject', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const agent = await User.findOne({
      where: { id: req.params.id, role: { [Op.in]: ['agent', 'manager'] } },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    await agent.update({
      approvalStatus: 'rejected',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      isActive: false,
    });
    res.json({ message: 'Agent rejected', agent });
  } catch (err) {
    console.error('PATCH /agents/:id/reject error:', err.message);
    res.status(500).json({ error: 'Failed to reject agent' });
  }
});

module.exports = router;
