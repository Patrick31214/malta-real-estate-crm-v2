'use strict';

const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const noopLimiter = (_req, _res, next) => next();
const { User, Branch, AgentMetric } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = isDev ? noopLimiter : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

const TEAM_ROLES = ['admin', 'manager', 'agent'];

// Shared base attributes for team member listing
const MEMBER_ATTRIBUTES = [
  'id', 'firstName', 'lastName', 'email', 'phone',
  'role', 'branchId', 'profileImage',
  'specializations', 'languages', 'jobTitle',
  'isActive', 'isBlocked', 'lastLoginAt', 'createdAt',
  'dateOfBirth',
];

// ─── GET /api/team/overview ───────────────────────────────────────────────────
// Returns aggregated team stats
router.get('/overview', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [members, branches] = await Promise.all([
      User.findAll({
        where: { role: { [Op.in]: TEAM_ROLES }, isBlocked: false },
        attributes: MEMBER_ATTRIBUTES,
        include: [{ model: Branch, attributes: ['id', 'name'] }],
      }),
      Branch.findAll({ attributes: ['id', 'name'] }),
    ]);

    const total = members.length;
    const activeNow = members.filter(m => m.lastLoginAt && new Date(m.lastLoginAt) >= oneDayAgo).length;
    const newThisMonth = members.filter(m => new Date(m.createdAt) >= startOfMonth).length;

    // By role
    const byRole = {};
    for (const role of TEAM_ROLES) {
      byRole[role] = members.filter(m => m.role === role).length;
    }

    // By branch
    const byBranch = {};
    for (const b of branches) {
      byBranch[b.id] = { id: b.id, name: b.name, count: 0 };
    }
    for (const m of members) {
      if (m.branchId && byBranch[m.branchId]) {
        byBranch[m.branchId].count += 1;
      }
    }

    res.json({
      total,
      activeNow,
      newThisMonth,
      byRole,
      byBranch: Object.values(byBranch),
    });
  } catch (err) {
    console.error('GET /api/team/overview error:', err);
    res.status(500).json({ error: 'Failed to load team overview' });
  }
});

// ─── GET /api/team/members ────────────────────────────────────────────────────
// Paginated, searchable, filterable list of all team members
router.get('/members', authenticate, async (req, res) => {
  try {
    const {
      search = '',
      role,
      branchId,
      active,
      page = 1,
      limit = 50,
      sortBy = 'firstName',
      sortDir = 'ASC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset   = (pageNum - 1) * limitNum;

    const where = { role: { [Op.in]: TEAM_ROLES }, isBlocked: false };

    if (role && TEAM_ROLES.includes(role)) where.role = role;
    if (branchId) where.branchId = branchId;

    // Active filter: logged in within last 24 hours
    if (active === 'true') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      where.lastLoginAt = { [Op.gte]: oneDayAgo };
    }

    if (search) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName:  { [Op.iLike]: `%${search}%` } },
          { email:     { [Op.iLike]: `%${search}%` } },
          // Safe specializations search using Sequelize parameter binding
          literal(`EXISTS (SELECT 1 FROM unnest("specializations") s WHERE s ILIKE :searchPattern)`),
        ],
      });
    }

    const replacements = search ? { searchPattern: `%${search}%` } : {};

    const validSortCols = ['firstName', 'lastName', 'role', 'createdAt', 'lastLoginAt'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'firstName';
    const orderDir = sortDir === 'DESC' ? 'DESC' : 'ASC';

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: MEMBER_ATTRIBUTES,
      include: [{ model: Branch, attributes: ['id', 'name'] }],
      order: [[orderCol, orderDir]],
      limit: limitNum,
      offset,
      replacements,
    });

    res.json({
      members: rows,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (err) {
    console.error('GET /api/team/members error:', err);
    res.status(500).json({ error: 'Failed to load team members' });
  }
});

// ─── GET /api/team/leaderboard ────────────────────────────────────────────────
// Performance rankings sorted by total activity score
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const now = new Date();
    let since;
    switch (period) {
      case 'week':    since = new Date(now - 7  * 24 * 60 * 60 * 1000); break;
      case 'quarter': since = new Date(now - 90 * 24 * 60 * 60 * 1000); break;
      case 'year':    since = new Date(now - 365 * 24 * 60 * 60 * 1000); break;
      default:        since = new Date(now - 30 * 24 * 60 * 60 * 1000); // month
    }

    // Fetch all team members (agents + managers only for performance ranking)
    const members = await User.findAll({
      where: { role: { [Op.in]: ['agent', 'manager'] }, isBlocked: false },
      attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role', 'branchId'],
      include: [{ model: Branch, attributes: ['id', 'name'] }],
    });

    if (!members.length) return res.json([]);

    const memberIds = members.map(m => m.id);

    // Fetch metrics in period
    const metrics = await AgentMetric.findAll({
      where: {
        userId: { [Op.in]: memberIds },
        createdAt: { [Op.gte]: since },
      },
      attributes: ['userId', 'metricType'],
    });

    // Score calculation weights
    const SCORE_WEIGHTS = {
      property_create:  10,
      property_update:  3,
      property_view:    1,
      client_create:    8,
      client_update:    3,
      client_view:      1,
      viewing_schedule: 5,
      viewing_complete: 8,
      inquiry_create:   5,
      inquiry_resolve:  10,
      login:            2,
      page_view:        0.5,
    };

    // Aggregate per user
    const scoreMap = {};
    const countMap = {};
    for (const m of metrics) {
      if (!scoreMap[m.userId]) {
        scoreMap[m.userId] = 0;
        countMap[m.userId] = {};
      }
      const weight = SCORE_WEIGHTS[m.metricType] ?? 1;
      scoreMap[m.userId] += weight;
      countMap[m.userId][m.metricType] = (countMap[m.userId][m.metricType] || 0) + 1;
    }

    // Build leaderboard
    const leaderboard = members.map(m => {
      const counts = countMap[m.id] || {};
      return {
        userId: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        profileImage: m.profileImage,
        role: m.role,
        branch: m.Branch ? m.Branch.name : null,
        branchId: m.branchId,
        score: Math.round(scoreMap[m.id] || 0),
        propertiesAdded: counts.property_create || 0,
        clientsManaged: (counts.client_create || 0) + (counts.client_update || 0),
        viewingsScheduled: counts.viewing_schedule || 0,
        viewingsCompleted: counts.viewing_complete || 0,
        inquiriesResolved: counts.inquiry_resolve || 0,
        totalActions: Object.values(counts).reduce((s, v) => s + v, 0),
      };
    });

    leaderboard.sort((a, b) => b.score - a.score);

    res.json(leaderboard);
  } catch (err) {
    console.error('GET /api/team/leaderboard error:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// ─── GET /api/team/birthdays ──────────────────────────────────────────────────
// Upcoming birthdays within next 30 days
router.get('/birthdays', authenticate, async (req, res) => {
  try {
    const members = await User.findAll({
      where: {
        role: { [Op.in]: TEAM_ROLES },
        isBlocked: false,
        dateOfBirth: { [Op.ne]: null },
      },
      attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role', 'dateOfBirth'],
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcoming = [];
    for (const m of members) {
      const dob = new Date(m.dateOfBirth);
      // Calculate this year's birthday
      let birthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      // If already passed this year, use next year
      if (birthday < today) {
        birthday = new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate());
      }
      const daysUntil = Math.round((birthday - today) / (24 * 60 * 60 * 1000));
      if (daysUntil <= 30) {
        upcoming.push({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          profileImage: m.profileImage,
          role: m.role,
          dateOfBirth: m.dateOfBirth,
          birthdayDate: birthday,
          daysUntil,
          isToday: daysUntil === 0,
        });
      }
    }

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    res.json(upcoming);
  } catch (err) {
    console.error('GET /api/team/birthdays error:', err);
    res.status(500).json({ error: 'Failed to load birthdays' });
  }
});

// ─── GET /api/team/availability ───────────────────────────────────────────────
// Team members active within last 24 hours
router.get('/availability', authenticate, async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const members = await User.findAll({
      where: {
        role: { [Op.in]: TEAM_ROLES },
        isBlocked: false,
        lastLoginAt: { [Op.gte]: oneDayAgo },
      },
      attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role', 'branchId', 'lastLoginAt'],
      include: [{ model: Branch, attributes: ['id', 'name'] }],
      order: [['lastLoginAt', 'DESC']],
    });

    res.json(members);
  } catch (err) {
    console.error('GET /api/team/availability error:', err);
    res.status(500).json({ error: 'Failed to load availability' });
  }
});

// ─── GET /api/team/org-chart ──────────────────────────────────────────────────
// Hierarchical org chart data
router.get('/org-chart', authenticate, async (req, res) => {
  try {
    const members = await User.findAll({
      where: { role: { [Op.in]: TEAM_ROLES }, isBlocked: false },
      attributes: ['id', 'firstName', 'lastName', 'profileImage', 'role', 'branchId', 'jobTitle'],
      include: [{ model: Branch, attributes: ['id', 'name'] }],
      order: [
        ['role', 'ASC'],
        ['firstName', 'ASC'],
      ],
    });

    const branches = await Branch.findAll({ attributes: ['id', 'name', 'managerId'] });

    const admins   = members.filter(m => m.role === 'admin');
    const managers = members.filter(m => m.role === 'manager');
    const agents   = members.filter(m => m.role === 'agent');

    // Group agents by branch
    const agentsByBranch = {};
    for (const a of agents) {
      const key = a.branchId || 'unassigned';
      if (!agentsByBranch[key]) agentsByBranch[key] = [];
      agentsByBranch[key].push(a);
    }

    // Build branch nodes
    const branchNodes = branches.map(b => ({
      branchId: b.id,
      branchName: b.name,
      manager: managers.find(m => m.branchId === b.id) || null,
      agents: agentsByBranch[b.id] || [],
    }));

    // Unassigned agents
    const unassignedAgents = agentsByBranch['unassigned'] || [];

    res.json({ admins, branchNodes, unassignedAgents });
  } catch (err) {
    console.error('GET /api/team/org-chart error:', err);
    res.status(500).json({ error: 'Failed to load org chart' });
  }
});

module.exports = router;
