'use strict';

const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const {
  Property, Client, ClientMatch, Owner, User, Branch,
  Inquiry, ChatChannel, ChatMessage, Notification, Announcement,
  Contact, Service, ComplianceItem, Document, File, Event,
  TrainingCourse, TrainingProgress, AgentMetric, sequelize,
} = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

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
router.use(authorize('admin', 'manager', 'agent'));
router.use(requirePermission('dashboard_view'));

function getPeriodStart(period) {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d;
    }
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'quarter': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'year': {
      const d = new Date(now);
      d.setDate(d.getDate() - 365);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    default:
      return null; // 'all'
  }
}

function periodWhere(start) {
  if (!start) return {};
  return { createdAt: { [Op.gte]: start } };
}

function countByField(rows, field) {
  const result = {};
  for (const row of rows) {
    const key = row[field] || 'unknown';
    result[key] = (result[key] || 0) + parseInt(row.count || row.dataValues?.count || 1, 10);
  }
  return result;
}

function groupCount(rows) {
  const result = {};
  for (const row of rows) {
    const raw = row.dataValues || row;
    const keys = Object.keys(raw);
    // Find the group key (not 'count')
    const groupKey = keys.find(k => k !== 'count');
    const key = raw[groupKey] || 'unknown';
    result[key] = parseInt(raw.count || 1, 10);
  }
  return result;
}

// ─── GET /api/dashboard/metrics ──────────────────────────────────────────────
router.get('/metrics', async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const periodStart = getPeriodStart(period);
    const pw = periodWhere(periodStart);

    // ── parallel bulk queries ────────────────────────────────────────────────
    const [
      // Overview counts
      totalProperties,
      totalClients,
      totalOwners,
      totalAgents,
      totalBranches,
      totalInquiries,
      totalDocuments,
      totalFiles,
      totalEvents,
      totalServices,
      totalContacts,
      totalAnnouncements,
      totalChatMessages,
      totalChatChannels,
      totalNotifications,
      totalComplianceItems,
      totalTrainingCourses,

      // Properties breakdown
      propByStatus,
      propByType,
      propByListingType,
      propByLocality,
      propAvgPrice,
      propNewThisPeriod,
      propSoldThisPeriod,
      propRentedThisPeriod,

      // Clients breakdown
      clientByStatus,
      clientByUrgency,
      clientByReferral,
      clientByLookingFor,
      vipCount,
      clientNewThisPeriod,
      clientCompleted,

      // ClientMatches
      matchByStatus,
      matchAvgScore,
      matchTotal,

      // Inquiries breakdown
      inqByStatus,
      inqByType,
      inqByPriority,
      inqBySource,
      inqNewThisPeriod,
      inqResolvedThisPeriod,
      inqOpenUrgent,

      // Agents
      totalActiveAgents,
      agentsByBranch,
      recentLogins,

      // Branches
      activeBranches,

      // Owners
      ownersByType,
      ownersNewThisPeriod,

      // Chat
      activeChannels,
      chatMessagesThisPeriod,

      // Notifications
      unreadNotifications,
      notifByType,
      notifThisPeriod,

      // Documents
      docByCategory,
      docThisPeriod,

      // Files
      filesByCategory,
      filesThisPeriod,
      totalFolders,

      // Compliance
      complianceByStatus,
      complianceByPriority,
      overdueCompliance,

      // Services
      activeServices,
      featuredServices,
      servicesByCategory,

      // Contacts
      activeContacts,
      contactsByCategory,

      // Events
      upcomingEvents,
      eventsByType,
      eventsThisMonth,

      // Training
      publishedCourses,
      requiredCourses,
      coursesByCategory,
      coursesByDifficulty,
      trainingEnrollments,

      // Announcements
      activeAnnouncements,
      announcementsByType,
      announcementsByPriority,

    ] = await Promise.all([
      // Overview counts
      Property.count().catch(() => 0),
      Client.count().catch(() => 0),
      Owner.count().catch(() => 0),
      User.count({ where: { role: 'agent', isActive: true } }).catch(() => 0),
      Branch.count().catch(() => 0),
      Inquiry.count().catch(() => 0),
      Document.count().catch(() => 0),
      File.count({ where: { isArchived: false } }).catch(() => 0),
      Event.count().catch(() => 0),
      Service.count().catch(() => 0),
      Contact.count().catch(() => 0),
      Announcement.count().catch(() => 0),
      ChatMessage.count().catch(() => 0),
      ChatChannel.count().catch(() => 0),
      Notification.count().catch(() => 0),
      ComplianceItem.count().catch(() => 0),
      TrainingCourse.count().catch(() => 0),

      // Properties breakdowns
      Property.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }).catch(() => []),
      Property.findAll({ attributes: ['type', [fn('COUNT', col('id')), 'count']], group: ['type'], raw: true }).catch(() => []),
      Property.findAll({ attributes: ['listingType', [fn('COUNT', col('id')), 'count']], group: ['listingType'], raw: true }).catch(() => []),
      Property.findAll({
        attributes: ['locality', [fn('COUNT', col('id')), 'count']],
        where: { locality: { [Op.ne]: null } },
        group: ['locality'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 15,
        raw: true,
      }).catch(() => []),
      Property.findOne({ attributes: [[fn('AVG', col('price')), 'avgPrice']], where: { status: 'listed' }, raw: true }).catch(() => null),
      Property.count({ where: { ...pw } }).catch(() => 0),
      Property.count({ where: { status: 'sold', ...(periodStart ? { updatedAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      Property.count({ where: { status: 'rented', ...(periodStart ? { updatedAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),

      // Clients
      Client.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }).catch(() => []),
      Client.findAll({ attributes: ['urgency', [fn('COUNT', col('id')), 'count']], where: { urgency: { [Op.ne]: null } }, group: ['urgency'], raw: true }).catch(() => []),
      Client.findAll({ attributes: ['referralSource', [fn('COUNT', col('id')), 'count']], where: { referralSource: { [Op.ne]: null } }, group: ['referralSource'], raw: true }).catch(() => []),
      Client.findAll({ attributes: ['lookingFor', [fn('COUNT', col('id')), 'count']], where: { lookingFor: { [Op.ne]: null } }, group: ['lookingFor'], raw: true }).catch(() => []),
      Client.count({ where: { isVIP: true } }).catch(() => 0),
      Client.count({ where: { ...pw } }).catch(() => 0),
      // Count clients who have completed their transaction ('completed' is the valid ENUM value;
      // 'converted' does not exist in enum_clients_status)
      Client.count({ where: { status: 'completed' } }).catch(() => 0),

      // ClientMatches
      ClientMatch.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }).catch(() => []),
      ClientMatch.findOne({ attributes: [[fn('AVG', col('matchScore')), 'avgScore']], raw: true }).catch(() => null),
      ClientMatch.count().catch(() => 0),

      // Inquiries
      Inquiry.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }).catch(() => []),
      Inquiry.findAll({ attributes: ['type', [fn('COUNT', col('id')), 'count']], group: ['type'], raw: true }).catch(() => []),
      Inquiry.findAll({ attributes: ['priority', [fn('COUNT', col('id')), 'count']], group: ['priority'], raw: true }).catch(() => []),
      Inquiry.findAll({ attributes: ['source', [fn('COUNT', col('id')), 'count']], group: ['source'], raw: true }).catch(() => []),
      Inquiry.count({ where: { ...pw } }).catch(() => 0),
      Inquiry.count({ where: { status: { [Op.in]: ['resolved', 'closed'] }, ...(periodStart ? { updatedAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      Inquiry.count({ where: { status: { [Op.in]: ['new', 'open', 'assigned', 'in_progress'] }, priority: 'urgent' } }).catch(() => 0),

      // Agents
      User.count({ where: { role: 'agent', isActive: true } }).catch(() => 0),
      User.findAll({
        attributes: ['branchId', [fn('COUNT', col('id')), 'count']],
        where: { role: 'agent' },
        group: ['branchId'],
        raw: true,
      }).catch(() => []),
      User.count({ where: { role: 'agent', lastLoginAt: { [Op.gte]: new Date(Date.now() - 7 * 86400000) } } }).catch(() => 0),

      // Branches
      Branch.count({ where: { isActive: true } }).catch(() => 0),

      // Owners
      Owner.findAll({ attributes: ['type', [fn('COUNT', col('id')), 'count']], where: { type: { [Op.ne]: null } }, group: ['type'], raw: true }).catch(() => []),
      Owner.count({ where: { ...pw } }).catch(() => 0),

      // Chat
      ChatChannel.count({ where: { isActive: true } }).catch(() => 0),
      ChatMessage.count({ where: { ...pw } }).catch(() => 0),

      // Notifications
      Notification.count({ where: { isRead: false } }).catch(() => 0),
      Notification.findAll({ attributes: ['type', [fn('COUNT', col('id')), 'count']], group: ['type'], raw: true }).catch(() => []),
      Notification.count({ where: { ...pw } }).catch(() => 0),

      // Documents
      Document.findAll({ attributes: ['category', [fn('COUNT', col('id')), 'count']], group: ['category'], raw: true }).catch(() => []),
      Document.count({ where: { ...pw } }).catch(() => 0),

      // Files
      File.findAll({ attributes: ['category', [fn('COUNT', col('id')), 'count']], where: { isArchived: false }, group: ['category'], raw: true }).catch(() => []),
      File.count({ where: { isArchived: false, isFolder: false, ...pw } }).catch(() => 0),
      File.count({ where: { isFolder: true, isArchived: false } }).catch(() => 0),

      // Compliance
      ComplianceItem.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'], raw: true }).catch(() => []),
      ComplianceItem.findAll({ attributes: ['priority', [fn('COUNT', col('id')), 'count']], group: ['priority'], raw: true }).catch(() => []),
      ComplianceItem.count({ where: { status: { [Op.in]: ['pending', 'in_progress', 'non_compliant'] }, dueDate: { [Op.lt]: new Date() } } }).catch(() => 0),

      // Services
      Service.count({ where: { isActive: true } }).catch(() => 0),
      Service.count({ where: { isFeatured: true } }).catch(() => 0),
      Service.findAll({ attributes: ['category', [fn('COUNT', col('id')), 'count']], where: { category: { [Op.ne]: null } }, group: ['category'], raw: true }).catch(() => []),

      // Contacts
      Contact.count({ where: { isActive: true } }).catch(() => 0),
      Contact.findAll({ attributes: ['category', [fn('COUNT', col('id')), 'count']], group: ['category'], raw: true }).catch(() => []),

      // Events
      Event.count({ where: { startDate: { [Op.gte]: new Date() } } }).catch(() => 0),
      Event.findAll({ attributes: ['type', [fn('COUNT', col('id')), 'count']], group: ['type'], raw: true }).catch(() => []),
      Event.count({ where: { startDate: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }).catch(() => 0),

      // Training
      TrainingCourse.count({ where: { isPublished: true } }).catch(() => 0),
      TrainingCourse.count({ where: { isRequired: true } }).catch(() => 0),
      TrainingCourse.findAll({ attributes: ['category', [fn('COUNT', col('id')), 'count']], where: { category: { [Op.ne]: null } }, group: ['category'], raw: true }).catch(() => []),
      TrainingCourse.findAll({ attributes: ['difficulty', [fn('COUNT', col('id')), 'count']], where: { difficulty: { [Op.ne]: null } }, group: ['difficulty'], raw: true }).catch(() => []),
      TrainingProgress.findAll({
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'count'],
          [fn('AVG', col('progress')), 'avgProgress'],
          [fn('AVG', col('score')), 'avgScore'],
        ],
        group: ['status'],
        raw: true,
      }).catch(() => []),

      // Announcements
      Announcement.count({ where: { isActive: true } }).catch(() => 0),
      Announcement.findAll({ attributes: ['type', [fn('COUNT', col('id')), 'count']], group: ['type'], raw: true }).catch(() => []),
      Announcement.findAll({ attributes: ['priority', [fn('COUNT', col('id')), 'count']], group: ['priority'], raw: true }).catch(() => []),
    ]);

    // ── Second batch: financial + website + activity + timelines ─────────────
    const [
      portfolioValue,
      salesValue,
      rentalValue,
      topDealsByValue,
      propTimeline,
      clientTimeline,
      inqTimeline,
      chatTimeline,
      activityByType,
      activityByEntity,
      activityByDay,
      mostActiveUsers,
      recentActions,
      websitePageViews,
      websiteUniqueSessions,
      websitePagesByUrl,
      websiteAvgDuration,
      websiteClickEvents,
      websiteFormSubmissions,
      websiteChatbotInteractions,
      websitePropertyViews,
      websitePropertyShares,
      websiteLoginAttempts,
      websiteRegistrations,
      websiteSearchEvents,
      websiteViewsByDay,
      avgInqResolutionTime,
      dueSoonCompliance,
      totalStorageBytes,
      topAgentsByProperties,
      topAgentsByClients,
      branchPerformance,
      priceDistribution,
    ] = await Promise.all([
      // Financial
      Property.findOne({
        attributes: [[fn('SUM', col('price')), 'total']],
        where: { status: { [Op.in]: ['listed', 'under_offer'] } },
        raw: true,
      }).catch(() => null),
      Property.findOne({
        attributes: [[fn('SUM', col('price')), 'total']],
        where: { status: 'sold' },
        raw: true,
      }).catch(() => null),
      Property.findOne({
        attributes: [[fn('SUM', col('price')), 'total']],
        where: { status: 'rented' },
        raw: true,
      }).catch(() => null),
      Property.findAll({
        attributes: ['id', 'title', 'price', 'currency', 'status', 'locality', 'type'],
        where: { status: { [Op.in]: ['sold', 'rented', 'listed'] }, price: { [Op.ne]: null } },
        order: [['price', 'DESC']],
        limit: 10,
        raw: true,
      }).catch(() => []),

      // Timelines — group by date
      Property.findAll({
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: periodStart ? { createdAt: { [Op.gte]: periodStart } } : {},
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        limit: 60,
        raw: true,
      }).catch(() => []),
      Client.findAll({
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: periodStart ? { createdAt: { [Op.gte]: periodStart } } : {},
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        limit: 60,
        raw: true,
      }).catch(() => []),
      Inquiry.findAll({
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: periodStart ? { createdAt: { [Op.gte]: periodStart } } : {},
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        limit: 60,
        raw: true,
      }).catch(() => []),
      ChatMessage.findAll({
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: periodStart ? { createdAt: { [Op.gte]: periodStart } } : {},
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        limit: 60,
        raw: true,
      }).catch(() => []),

      // Activity (AgentMetric)
      AgentMetric.findAll({
        attributes: ['metricType', [fn('COUNT', col('id')), 'count']],
        where: periodStart ? { createdAt: { [Op.gte]: periodStart } } : {},
        group: ['metricType'],
        raw: true,
      }).catch(() => []),
      AgentMetric.findAll({
        attributes: ['entityType', [fn('COUNT', col('id')), 'count']],
        where: { entityType: { [Op.ne]: null }, ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) },
        group: ['entityType'],
        raw: true,
      }).catch(() => []),
      AgentMetric.findAll({
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: periodStart ? { createdAt: { [Op.gte]: periodStart } } : {},
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        limit: 60,
        raw: true,
      }).catch(() => []),
      AgentMetric.findAll({
        attributes: ['userId', [fn('COUNT', col('id')), 'count']],
        where: { userId: { [Op.ne]: null }, ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) },
        group: ['userId'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10,
        raw: true,
      }).catch(() => []),
      AgentMetric.findAll({
        where: periodStart ? { createdAt: { [Op.gte]: periodStart } } : {},
        order: [['createdAt', 'DESC']],
        limit: 20,
        raw: true,
      }).catch(() => []),

      // Website metrics from AgentMetric
      AgentMetric.count({ where: { metricType: 'page_view', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.count({
        where: { metricType: 'page_view', sessionId: { [Op.ne]: null }, ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) },
        distinct: true,
        col: 'sessionId',
      }).catch(() => 0),
      AgentMetric.findAll({
        attributes: ['pageUrl', [fn('COUNT', col('id')), 'count']],
        where: { metricType: 'page_view', pageUrl: { [Op.ne]: null }, ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) },
        group: ['pageUrl'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10,
        raw: true,
      }).catch(() => []),
      AgentMetric.findOne({
        attributes: [[fn('AVG', col('duration')), 'avgDuration']],
        where: { metricType: 'page_view', duration: { [Op.ne]: null }, ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) },
        raw: true,
      }).catch(() => null),
      AgentMetric.count({ where: { metricType: 'click', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.count({ where: { metricType: 'form_submit', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.count({ where: { metricType: 'chatbot_interaction', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.count({ where: { metricType: 'property_view', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.count({ where: { metricType: 'property_share', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.count({ where: { metricType: 'login', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.count({ where: { metricType: 'register', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.count({ where: { metricType: 'search', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) } }).catch(() => 0),
      AgentMetric.findAll({
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: { metricType: 'page_view', ...(periodStart ? { createdAt: { [Op.gte]: periodStart } } : {}) },
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        limit: 60,
        raw: true,
      }).catch(() => []),

      // Inquiry average resolution time (hours)
      sequelize.query(
        `SELECT AVG(EXTRACT(EPOCH FROM ("closedAt" - "createdAt")) / 3600) as "avgHours"
         FROM inquiries
         WHERE "closedAt" IS NOT NULL AND status IN ('resolved', 'closed')
         ${periodStart ? 'AND "createdAt" >= :periodStart' : ''}`,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: periodStart ? { periodStart: periodStart.toISOString() } : {},
        }
      ).catch(() => []),

      // Compliance due soon (within next 7 days)
      ComplianceItem.count({
        where: {
          status: { [Op.notIn]: ['compliant', 'expired'] },
          dueDate: { [Op.between]: [new Date(), new Date(Date.now() + 7 * 86400000)] },
        },
      }).catch(() => 0),

      // Total file storage
      File.findOne({
        attributes: [[fn('SUM', col('size')), 'totalBytes']],
        where: { isArchived: false, isFolder: false },
        raw: true,
      }).catch(() => null),

      // Top agents by property count
      Property.findAll({
        attributes: ['agentId', [fn('COUNT', col('id')), 'count']],
        where: { agentId: { [Op.ne]: null } },
        group: ['agentId'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10,
        raw: true,
      }).catch(() => []),

      // Top agents by client count
      Client.findAll({
        attributes: ['agentId', [fn('COUNT', col('id')), 'count']],
        where: { agentId: { [Op.ne]: null } },
        group: ['agentId'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10,
        raw: true,
      }).catch(() => []),

      // Branch performance
      Branch.findAll({
        attributes: ['id', 'name', 'locality', 'isActive'],
        raw: true,
      }).catch(() => []),

      // Price distribution
      Property.findAll({
        attributes: ['price'],
        where: { price: { [Op.ne]: null }, status: { [Op.in]: ['listed', 'under_offer', 'sold'] } },
        raw: true,
      }).catch(() => []),
    ]);

    // ── Post-process ─────────────────────────────────────────────────────────

    // Build branch performance data
    const branchIds = branchPerformance.map(b => b.id);
    const [branchPropCounts, branchClientCounts, branchAgentCounts, branchInqCounts] = await Promise.all([
      Property.findAll({
        attributes: ['branchId', [fn('COUNT', col('id')), 'count']],
        where: { branchId: { [Op.in]: branchIds } },
        group: ['branchId'],
        raw: true,
      }),
      Client.findAll({
        attributes: ['branchId', [fn('COUNT', col('id')), 'count']],
        where: { branchId: { [Op.in]: branchIds } },
        group: ['branchId'],
        raw: true,
      }),
      User.findAll({
        attributes: ['branchId', [fn('COUNT', col('id')), 'count']],
        where: { branchId: { [Op.in]: branchIds }, role: 'agent' },
        group: ['branchId'],
        raw: true,
      }),
      Inquiry.findAll({
        attributes: [
          [literal('"Property"."branchId"'), 'branchId'],
          [fn('COUNT', col('Inquiry.id')), 'count'],
        ],
        include: [{ model: Property, attributes: [] }],
        group: [literal('"Property"."branchId"')],
        raw: true,
      }).catch(() => []),
    ]);

    const mapById = (arr) => {
      const m = {};
      for (const r of arr) { m[r.branchId] = parseInt(r.count, 10); }
      return m;
    };
    const bpMap   = mapById(branchPropCounts);
    const bcMap   = mapById(branchClientCounts);
    const baMap   = mapById(branchAgentCounts);
    const biMap   = mapById(branchInqCounts);

    const branchPerfResult = branchPerformance.map(b => ({
      branchId:  b.id,
      name:      b.name,
      locality:  b.locality,
      isActive:  b.isActive,
      properties: bpMap[b.id] || 0,
      clients:    bcMap[b.id] || 0,
      agents:     baMap[b.id] || 0,
      inquiries:  biMap[b.id] || 0,
    }));

    // Fetch agent names for top-agents lists
    const agentIdsForProps   = topAgentsByProperties.map(r => r.agentId).filter(Boolean);
    const agentIdsForClients = topAgentsByClients.map(r => r.agentId).filter(Boolean);
    const allAgentIds = [...new Set([...agentIdsForProps, ...agentIdsForClients])];
    const agentUsers = allAgentIds.length
      ? await User.findAll({ where: { id: { [Op.in]: allAgentIds } }, attributes: ['id', 'firstName', 'lastName', 'branchId'], raw: true }).catch(() => [])
      : [];
    const agentMap = {};
    for (const a of agentUsers) { agentMap[a.id] = a; }

    const topByProps = topAgentsByProperties.map(r => ({
      agentId:   r.agentId,
      name:      agentMap[r.agentId] ? `${agentMap[r.agentId].firstName} ${agentMap[r.agentId].lastName}` : r.agentId,
      count:     parseInt(r.count, 10),
    }));
    const topByClients = topAgentsByClients.map(r => ({
      agentId:   r.agentId,
      name:      agentMap[r.agentId] ? `${agentMap[r.agentId].firstName} ${agentMap[r.agentId].lastName}` : r.agentId,
      count:     parseInt(r.count, 10),
    }));

    // Fetch user names for activity most-active users
    const activeUserIds = mostActiveUsers.map(r => r.userId).filter(Boolean);
    const activeUserList = activeUserIds.length
      ? await User.findAll({ where: { id: { [Op.in]: activeUserIds } }, attributes: ['id', 'firstName', 'lastName', 'role'], raw: true }).catch(() => [])
      : [];
    const activeUserMap = {};
    for (const u of activeUserList) { activeUserMap[u.id] = u; }
    const mostActiveUsersResult = mostActiveUsers.map(r => ({
      userId: r.userId,
      name: activeUserMap[r.userId] ? `${activeUserMap[r.userId].firstName} ${activeUserMap[r.userId].lastName}` : r.userId,
      role: activeUserMap[r.userId]?.role || 'unknown',
      count: parseInt(r.count, 10),
    }));

    // Price distribution
    const priceDist = { under100k: 0, '100k_300k': 0, '300k_600k': 0, '600k_1m': 0, over1m: 0 };
    for (const p of priceDistribution) {
      const price = parseFloat(p.price || 0);
      if (price < 100000) priceDist.under100k++;
      else if (price < 300000) priceDist['100k_300k']++;
      else if (price < 600000) priceDist['300k_600k']++;
      else if (price < 1000000) priceDist['600k_1m']++;
      else priceDist.over1m++;
    }

    // Budget distribution for clients
    const clientBudgetDist = { under100k: 0, '100k_300k': 0, '300k_600k': 0, '600k_1m': 0, over1m: 0 };
    const clientBudgetRows = await Client.findAll({
      attributes: ['maxBudget'],
      where: { maxBudget: { [Op.ne]: null } },
      raw: true,
    }).catch(() => []);
    for (const c of clientBudgetRows) {
      const b = parseFloat(c.maxBudget || 0);
      if (b < 100000) clientBudgetDist.under100k++;
      else if (b < 300000) clientBudgetDist['100k_300k']++;
      else if (b < 600000) clientBudgetDist['300k_600k']++;
      else if (b < 1000000) clientBudgetDist['600k_1m']++;
      else clientBudgetDist.over1m++;
    }

    // Training progress aggregation
    let trainingCompleted = 0, trainingInProgress = 0, trainingNotStarted = 0;
    for (const row of trainingEnrollments) {
      const cnt = parseInt(row.count || 0, 10);
      if (row.status === 'completed')   trainingCompleted   += cnt;
      if (row.status === 'in_progress') trainingInProgress  += cnt;
      if (row.status === 'not_started') trainingNotStarted  += cnt;
    }
    const totalEnrollments = trainingCompleted + trainingInProgress + trainingNotStarted;
    const completionRate = totalEnrollments > 0 ? Math.round((trainingCompleted / totalEnrollments) * 100) : 0;

    // Compute weighted averages across ALL enrollment rows that have scores/progress
    let weightedProgressSum = 0, weightedScoreSum = 0, progressCount = 0, scoreCount = 0;
    for (const row of trainingEnrollments) {
      const cnt = parseInt(row.count || 0, 10);
      if (row.avgProgress != null) { weightedProgressSum += parseFloat(row.avgProgress) * cnt; progressCount += cnt; }
      if (row.avgScore    != null) { weightedScoreSum    += parseFloat(row.avgScore)    * cnt; scoreCount    += cnt; }
    }
    const trainingAvgProgress = progressCount > 0 ? weightedProgressSum / progressCount : 0;
    const trainingAvgScore    = scoreCount    > 0 ? weightedScoreSum    / scoreCount    : 0;

    // Compliance rate
    const compByStatus = {};
    for (const row of complianceByStatus) {
      compByStatus[row.status] = parseInt(row.count, 10);
    }
    const compliantCount = compByStatus.compliant || 0;
    const complianceRate = totalComplianceItems > 0 ? Math.round((compliantCount / totalComplianceItems) * 100) : 0;

    // Client conversion rate: percentage of clients who completed their transaction
    // (kept as 'conversionRate' in the response for API compatibility with the frontend)
    const conversionRate = totalClients > 0 ? Math.round((clientCompleted / totalClients) * 100) : 0;

    // Match stats
    const matchByStatusMap = {};
    for (const row of matchByStatus) { matchByStatusMap[row.status] = parseInt(row.count, 10); }

    // Website pages by URL
    const pageViewsByPage = {};
    for (const row of websitePagesByUrl) {
      pageViewsByPage[row.pageUrl] = parseInt(row.count, 10);
    }
    const topPages = websitePagesByUrl.map(r => ({ page: r.pageUrl, views: parseInt(r.count, 10) }));

    // Activity totals
    const totalActivityActions = activityByType.reduce((s, r) => s + parseInt(r.count || 0, 10), 0);
    const actByType = {};
    for (const r of activityByType) { actByType[r.metricType] = parseInt(r.count, 10); }
    const actByEntity = {};
    for (const r of activityByEntity) { actByEntity[r.entityType] = parseInt(r.count, 10); }

    // Average inquiry resolution
    const avgResolutionHours = avgInqResolutionTime?.[0]?.avgHours
      ? Math.round(parseFloat(avgInqResolutionTime[0].avgHours))
      : 0;

    // Total file storage
    const totalStorageBytesVal = parseInt(totalStorageBytes?.totalBytes || 0, 10);

    // Unique sessions (count distinct sessionId)
    const uniqueSessionsCount = websiteUniqueSessions || 0;

    // Agents by branch with names
    const agentBranchMap = {};
    for (const row of agentsByBranch) {
      agentBranchMap[row.branchId] = parseInt(row.count, 10);
    }

    // Build response
    const response = {
      period,
      generatedAt: new Date().toISOString(),

      overview: {
        totalProperties,
        totalClients,
        totalOwners,
        totalAgents,
        totalBranches,
        totalInquiries,
        totalDocuments,
        totalFiles,
        totalEvents,
        totalServices,
        totalContacts,
        totalAnnouncements,
        totalChatMessages,
        totalChatChannels,
        totalNotifications,
        totalComplianceItems,
        totalTrainingCourses,
      },

      properties: {
        total: totalProperties,
        byStatus:      toObj(propByStatus,      'status'),
        byType:        toObj(propByType,         'type'),
        byListingType: toObj(propByListingType,  'listingType'),
        byLocality:    toObj(propByLocality,     'locality'),
        byBranch:      branchPerfResult.map(b => ({ branchId: b.branchId, branchName: b.name, count: b.properties })),
        avgPrice:      Math.round(parseFloat(propAvgPrice?.avgPrice || 0)),
        totalPortfolioValue: Math.round(parseFloat(portfolioValue?.total || 0)),
        newThisPeriod:  propNewThisPeriod,
        soldThisPeriod: propSoldThisPeriod,
        rentedThisPeriod: propRentedThisPeriod,
        avgDaysOnMarket: 0,
        priceDistribution: priceDist,
        timeline: propTimeline.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
      },

      clients: {
        total: totalClients,
        byStatus:         toObj(clientByStatus,   'status'),
        byUrgency:        toObj(clientByUrgency,   'urgency'),
        vipCount,
        byReferralSource: toObj(clientByReferral,  'referralSource'),
        byLookingFor:     toObj(clientByLookingFor,'lookingFor'),
        budgetDistribution: clientBudgetDist,
        newThisPeriod:    clientNewThisPeriod,
        conversionRate,
        timeline: clientTimeline.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
      },

      clientMatches: {
        total: matchTotal,
        byStatus:       matchByStatusMap,
        avgMatchScore:  Math.round(parseFloat(matchAvgScore?.avgScore || 0)),
        interestedCount: matchByStatusMap.interested || 0,
        viewingsScheduled: matchByStatusMap.viewing_scheduled || 0,
        offersMade:        matchByStatusMap.offer_made || 0,
      },

      inquiries: {
        total: totalInquiries,
        byStatus:   toObj(inqByStatus,   'status'),
        byType:     toObj(inqByType,     'type'),
        byPriority: toObj(inqByPriority, 'priority'),
        bySource:   toObj(inqBySource,   'source'),
        newThisPeriod:      inqNewThisPeriod,
        resolvedThisPeriod: inqResolvedThisPeriod,
        avgResolutionTimeHours: avgResolutionHours,
        openUrgent: inqOpenUrgent,
        timeline: inqTimeline.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
      },

      financial: {
        totalPortfolioValue: Math.round(parseFloat(portfolioValue?.total || 0)),
        totalSalesValue:     Math.round(parseFloat(salesValue?.total || 0)),
        totalRentalValue:    Math.round(parseFloat(rentalValue?.total || 0)),
        avgSalePrice:        Math.round(parseFloat(propAvgPrice?.avgPrice || 0)),
        avgRentalPrice:      0,
        topDealsByValue:     topDealsByValue,
        priceDistribution:   priceDist,
      },

      agents: {
        total:       totalAgents,
        active:      totalActiveAgents,
        byBranch:    branchPerfResult.map(b => ({ branchId: b.branchId, name: b.name, count: b.agents })),
        topByProperties: topByProps,
        topByClients:    topByClients,
        recentLogins:    recentLogins,
      },

      branches: {
        total:  totalBranches,
        active: activeBranches,
        performance: branchPerfResult,
      },

      owners: {
        total: totalOwners,
        byType: toObj(ownersByType, 'type'),
        newThisPeriod: ownersNewThisPeriod,
      },

      chat: {
        totalChannels:    totalChatChannels,
        activeChannels,
        totalMessages:    totalChatMessages,
        messagesThisPeriod: chatMessagesThisPeriod,
        messagesByDay:    chatTimeline.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
      },

      notifications: {
        total:    totalNotifications,
        unread:   unreadNotifications,
        byType:   toObj(notifByType, 'type'),
        thisPeriod: notifThisPeriod,
      },

      documents: {
        total:              totalDocuments,
        byCategory:         toObj(docByCategory, 'category'),
        uploadedThisPeriod: docThisPeriod,
      },

      files: {
        total:              totalFiles,
        totalFolders,
        byCategory:         toObj(filesByCategory, 'category'),
        totalStorageBytes:  totalStorageBytesVal,
        uploadedThisPeriod: filesThisPeriod,
      },

      compliance: {
        total:          totalComplianceItems,
        byStatus:       compByStatus,
        byPriority:     toObj(complianceByPriority, 'priority'),
        overdue:        overdueCompliance,
        dueSoon:        dueSoonCompliance,
        complianceRate,
      },

      services: {
        total:      totalServices,
        active:     activeServices,
        featured:   featuredServices,
        byCategory: toObj(servicesByCategory, 'category'),
      },

      contacts: {
        total:      totalContacts,
        active:     activeContacts,
        byCategory: toObj(contactsByCategory, 'category'),
      },

      events: {
        total:     totalEvents,
        upcoming:  upcomingEvents,
        byType:    toObj(eventsByType, 'type'),
        thisMonth: eventsThisMonth,
      },

      training: {
        totalCourses:     totalTrainingCourses,
        publishedCourses,
        requiredCourses,
        byCategory:       toObj(coursesByCategory,  'category'),
        byDifficulty:     toObj(coursesByDifficulty,'difficulty'),
        progress: {
          totalEnrollments,
          completed:    trainingCompleted,
          inProgress:   trainingInProgress,
          notStarted:   trainingNotStarted,
          avgProgress:  Math.round(trainingAvgProgress),
          avgScore:     Math.round(trainingAvgScore),
          completionRate,
        },
      },

      announcements: {
        total:      totalAnnouncements,
        active:     activeAnnouncements,
        byType:     toObj(announcementsByType,     'type'),
        byPriority: toObj(announcementsByPriority, 'priority'),
      },

      website: {
        totalPageViews:       websitePageViews,
        uniqueSessions:       uniqueSessionsCount,
        pageViewsByPage,
        viewsByDay:           websiteViewsByDay.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
        avgSessionDuration:   Math.round(parseFloat(websiteAvgDuration?.avgDuration || 0)),
        topPages,
        clickEvents:          websiteClickEvents,
        formSubmissions:      websiteFormSubmissions,
        chatbotInteractions:  websiteChatbotInteractions,
        propertyViews:        websitePropertyViews,
        propertyShares:       websitePropertyShares,
        loginAttempts:        websiteLoginAttempts,
        registrations:        websiteRegistrations,
        searchEvents:         websiteSearchEvents,
      },

      activity: {
        totalActions:    totalActivityActions,
        byMetricType:    actByType,
        byEntityType:    actByEntity,
        activityByDay:   activityByDay.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
        mostActiveUsers: mostActiveUsersResult,
        recentActions:   recentActions.slice(0, 10),
      },
    };

    return res.json(response);
  } catch (err) {
    console.error('[dashboard/metrics]', err);
    return res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

// Helper: convert array of raw groupBy rows to a plain object { key: count }
function toObj(rows, field) {
  const result = {};
  for (const row of rows) {
    const key = row[field] || 'unknown';
    result[key] = parseInt(row.count || 1, 10);
  }
  return result;
}

module.exports = router;
