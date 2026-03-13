'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const { User, UserPermission, Branch, ActivityLog } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { AGENT_PERMISSION_CATEGORIES, ALL_PERMISSION_KEYS } = require('../constants/agentPermissions');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);
router.use(authenticate);

const serverError = (err, fallback) => ({ error: isDev ? (err.message || fallback) : fallback });

// ─── System Config helpers ─────────────────────────────────────────────────────

const CONFIG_FILE = path.join(__dirname, '../data/system-config.json');

const DEFAULT_CONFIG = {
  companyName: 'GKR Real Estate Malta',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
  logoUrl: '',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Malta',
  businessHours: {
    monday:    { open: '09:00', close: '18:00', enabled: true  },
    tuesday:   { open: '09:00', close: '18:00', enabled: true  },
    wednesday: { open: '09:00', close: '18:00', enabled: true  },
    thursday:  { open: '09:00', close: '18:00', enabled: true  },
    friday:    { open: '09:00', close: '18:00', enabled: true  },
    saturday:  { open: '09:00', close: '13:00', enabled: true  },
    sunday:    { open: '09:00', close: '13:00', enabled: false },
  },
  vatNumber: '',
  socialMedia: { facebook: '', instagram: '', linkedin: '', twitter: '' },
  features: {
    enableChat: true,
    enableMortgageCalculator: true,
    enableCompliance: true,
    enableDocuments: true,
    enableReports: true,
  },
  emailNotifications: {
    newInquiry: true,
    propertyStatusChange: true,
    chatMessage: false,
    announcement: true,
  },
  updatedAt: null,
  updatedById: null,
};

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('settings readConfig error:', e.message);
  }
  return { ...DEFAULT_CONFIG };
}

function writeConfig(data) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── GET /api/settings/system ──────────────────────────────────────────────────
router.get('/system', authorize('admin'), async (req, res) => {
  try {
    const config = readConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json(serverError(err, 'Failed to load system settings'));
  }
});

// ─── PUT /api/settings/system ──────────────────────────────────────────────────
router.put('/system', authorize('admin'), async (req, res) => {
  try {
    const config = readConfig();
    const allowed = [
      'companyName', 'companyAddress', 'companyPhone', 'companyEmail',
      'companyWebsite', 'logoUrl', 'defaultCurrency', 'timezone',
      'businessHours', 'vatNumber', 'socialMedia', 'features', 'emailNotifications',
    ];
    const updated = { ...config };
    for (const key of allowed) {
      if (req.body[key] !== undefined) updated[key] = req.body[key];
    }
    updated.updatedAt = new Date().toISOString();
    updated.updatedById = req.user.id;
    writeConfig(updated);

    setImmediate(async () => {
      try {
        await ActivityLog.create({
          action: 'settings_updated',
          description: 'System settings updated',
          entityType: 'settings',
          entityId: null,
          userId: req.user.id,
          metadata: { keys: Object.keys(req.body) },
        });
      } catch (e) {
        console.error('settings audit log error:', e.message);
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json(serverError(err, 'Failed to update system settings'));
  }
});

// ─── GET /api/settings/roles ───────────────────────────────────────────────────
router.get('/roles', authorize('admin', 'manager'), async (req, res) => {
  try {
    const roles = [
      {
        role: 'admin',
        label: 'Administrator',
        description: 'Full system access — can manage all users, settings, and data',
        color: '#A85C5C',
        defaultPermissions: 'all',
      },
      {
        role: 'manager',
        label: 'Manager',
        description: 'Branch-level management — can manage agents, clients, and properties',
        color: '#8B6914',
        defaultPermissions: 'management',
      },
      {
        role: 'agent',
        label: 'Agent',
        description: 'Standard agent — can manage assigned properties and clients',
        color: '#B8912A',
        defaultPermissions: 'basic',
      },
    ];
    res.json(roles);
  } catch (err) {
    res.status(500).json(serverError(err, 'Failed to load roles'));
  }
});

// ─── GET /api/settings/permissions ────────────────────────────────────────────
router.get('/permissions', authorize('admin'), async (req, res) => {
  try {
    res.json(AGENT_PERMISSION_CATEGORIES);
  } catch (err) {
    res.status(500).json(serverError(err, 'Failed to load permissions'));
  }
});

// ─── PUT /api/settings/users/:id/permissions ──────────────────────────────────
router.put('/users/:id/permissions', authorize('admin'), async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions must be an array' });
    }

    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    for (const perm of permissions) {
      if (!ALL_PERMISSION_KEYS.includes(perm.feature)) continue;
      await UserPermission.upsert(
        {
          userId: targetUser.id,
          feature: perm.feature,
          isEnabled: Boolean(perm.isEnabled),
          grantedById: req.user.id,
        },
        { conflictFields: ['userId', 'feature'] }
      );
    }

    setImmediate(async () => {
      try {
        await ActivityLog.create({
          action: 'permissions_updated',
          description: `Permissions updated for ${targetUser.firstName} ${targetUser.lastName}`,
          entityType: 'user',
          entityId: targetUser.id,
          userId: req.user.id,
          metadata: { targetUserId: targetUser.id, count: permissions.length },
        });
      } catch (e) {
        console.error('permissions audit log error:', e.message);
      }
    });

    const allPerms = await UserPermission.findAll({
      where: { userId: targetUser.id },
      attributes: ['feature', 'isEnabled'],
    });
    res.json(allPerms);
  } catch (err) {
    res.status(500).json(serverError(err, 'Failed to update permissions'));
  }
});

// ─── GET /api/settings/audit-log ──────────────────────────────────────────────
router.get('/audit-log', authorize('admin'), async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { action, userId, from, to } = req.query;
    const where = {};
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to)   where.createdAt[Op.lte] = new Date(to);
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          required: false,
        },
      ],
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      logs: rows,
    });
  } catch (err) {
    res.status(500).json(serverError(err, 'Failed to load audit log'));
  }
});

module.exports = router;
