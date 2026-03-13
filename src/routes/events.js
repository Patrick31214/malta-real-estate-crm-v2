'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const { Event, EventAttendee, User, Property, Branch } = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
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

const VALID_TYPES    = ['open_house', 'team_meeting', 'training', 'networking', 'client_viewing', 'company_event', 'deadline', 'other'];
const VALID_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'];
const VALID_RSVPS    = ['pending', 'accepted', 'declined', 'tentative'];

const ALLOWED_FIELDS = [
  'title', 'description', 'type', 'startDate', 'endDate', 'startTime', 'endTime',
  'isAllDay', 'location', 'onlineLink', 'propertyId', 'branchId', 'maxAttendees',
  'status', 'isRecurring', 'recurrencePattern', 'color', 'notes', 'attachments',
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
  ['type', 'status', 'propertyId', 'branchId'].forEach((f) => {
    if (d[f] === '' || d[f] === undefined) d[f] = null;
  });
  ['startTime', 'endTime', 'location', 'onlineLink', 'color', 'notes'].forEach((f) => {
    if (d[f] === '') d[f] = null;
  });
  if (d.startDate === '') d.startDate = null;
  if (d.endDate === '') d.endDate = null;
  if (d.isAllDay === undefined) d.isAllDay = false;
  if (d.isRecurring === undefined) d.isRecurring = false;
  if (!d.isRecurring) d.recurrencePattern = null;
  if (d.maxAttendees !== undefined && d.maxAttendees !== null && d.maxAttendees !== '') {
    d.maxAttendees = parseInt(d.maxAttendees, 10) || null;
  } else if (d.maxAttendees === '') {
    d.maxAttendees = null;
  }
  if (!Array.isArray(d.attachments)) d.attachments = d.attachments || [];
  return d;
}

const BASE_INCLUDES = [
  { model: User, as: 'organizer', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
  { model: Property, as: 'property', attributes: ['id', 'title', 'referenceNumber', 'status'] },
  { model: Branch, as: 'branch', attributes: ['id', 'name', 'city'] },
];

const FULL_INCLUDES = [
  ...BASE_INCLUDES,
  {
    model: EventAttendee,
    as: 'attendees',
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] }],
  },
];

// ── GET /api/events ───────────────────────────────────────────────────────────
router.get('/', authenticate, requirePermission('events_view'), async (req, res) => {
  try {
    const {
      search, type, status, branchId, dateFrom, dateTo,
      page = 1, limit = 20, sortBy = 'startDate', sortDir = 'ASC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};

    if (type   && VALID_TYPES.includes(type))       where.type   = type;
    if (status && VALID_STATUSES.includes(status))  where.status = status;
    if (branchId) where.branchId = branchId;

    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) where.startDate[Op.gte] = dateFrom;
      if (dateTo)   where.startDate[Op.lte] = dateTo;
    }

    if (search) {
      where[Op.or] = [
        { title:    { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const validSortCols = ['startDate', 'endDate', 'title', 'type', 'status', 'createdAt'];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : 'startDate';
    const orderDir = sortDir === 'DESC' ? 'DESC' : 'ASC';

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: BASE_INCLUDES,
      order:  [[orderCol, orderDir]],
      limit:  limitNum,
      offset,
      distinct: true,
    });

    res.json({
      events: rows,
      pagination: {
        total:      count,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error('GET /events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ── GET /api/events/calendar ──────────────────────────────────────────────────
router.get('/calendar', authenticate, requirePermission('events_view'), async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const y = parseInt(year, 10) || now.getFullYear();
    const m = parseInt(month, 10) - 1 || now.getMonth(); // 0-indexed

    const startOfMonth = new Date(y, m, 1);
    const endOfMonth   = new Date(y, m + 1, 0);

    // Format as YYYY-MM-DD strings
    const pad = (n) => String(n).padStart(2, '0');
    const fromStr = `${startOfMonth.getFullYear()}-${pad(startOfMonth.getMonth() + 1)}-${pad(startOfMonth.getDate())}`;
    const toStr   = `${endOfMonth.getFullYear()}-${pad(endOfMonth.getMonth() + 1)}-${pad(endOfMonth.getDate())}`;

    const events = await Event.findAll({
      where: {
        [Op.or]: [
          { startDate: { [Op.between]: [fromStr, toStr] } },
          { endDate:   { [Op.between]: [fromStr, toStr] } },
          { [Op.and]:  [{ startDate: { [Op.lte]: fromStr } }, { endDate: { [Op.gte]: toStr } }] },
        ],
      },
      include: BASE_INCLUDES,
      order: [['startDate', 'ASC'], ['startTime', 'ASC']],
    });

    res.json({ events });
  } catch (err) {
    console.error('GET /events/calendar error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// ── GET /api/events/upcoming ──────────────────────────────────────────────────
router.get('/upcoming', authenticate, requirePermission('events_view'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const events = await Event.findAll({
      where: {
        startDate: { [Op.gte]: today },
        status:    { [Op.in]: ['scheduled', 'in_progress'] },
      },
      include: BASE_INCLUDES,
      order: [['startDate', 'ASC'], ['startTime', 'ASC']],
      limit: 10,
    });

    res.json({ events });
  } catch (err) {
    console.error('GET /events/upcoming error:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// ── GET /api/events/stats ─────────────────────────────────────────────────────
router.get('/stats', authenticate, requirePermission('events_view'), async (req, res) => {
  try {
    const now   = new Date();
    const today = now.toISOString().slice(0, 10);

    // Month range
    const pad = (n) => String(n).padStart(2, '0');
    const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const nextMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEnd   = new Date(nextMonth - 1).toISOString().slice(0, 10);

    const [totalThisMonth, upcoming, openHouses, myRsvps] = await Promise.all([
      // Total events this month
      Event.count({
        where: { startDate: { [Op.between]: [monthStart, monthEnd] } },
      }),
      // Upcoming events (from today, scheduled/in_progress)
      Event.count({
        where: {
          startDate: { [Op.gte]: today },
          status:    { [Op.in]: ['scheduled', 'in_progress'] },
        },
      }),
      // Open houses scheduled
      Event.count({
        where: {
          type:   'open_house',
          status: { [Op.in]: ['scheduled', 'in_progress'] },
        },
      }),
      // Pending RSVPs for current user
      EventAttendee.count({
        where: {
          userId:     req.user.id,
          rsvpStatus: 'pending',
        },
      }),
    ]);

    // Type breakdown
    const typeRows = await Event.findAll({
      attributes: ['type', [Event.sequelize.fn('COUNT', Event.sequelize.col('id')), 'count']],
      group: ['type'],
      raw: true,
    });
    const byType = {};
    typeRows.forEach((r) => { byType[r.type] = parseInt(r.count, 10); });

    // Status breakdown
    const statusRows = await Event.findAll({
      attributes: ['status', [Event.sequelize.fn('COUNT', Event.sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const byStatus = {};
    statusRows.forEach((r) => { byStatus[r.status] = parseInt(r.count, 10); });

    res.json({ totalThisMonth, upcoming, openHouses, myRsvps, byType, byStatus });
  } catch (err) {
    console.error('GET /events/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch event stats' });
  }
});

// ── GET /api/events/:id ───────────────────────────────────────────────────────
router.get('/:id', authenticate, requirePermission('events_view'), [
  param('id').isUUID().withMessage('Invalid event ID'),
], async (req, res) => {
  if (handleValidation(req, res)) return;
  try {
    const event = await Event.findByPk(req.params.id, { include: FULL_INCLUDES });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (err) {
    console.error('GET /events/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// ── POST /api/events ──────────────────────────────────────────────────────────
router.post('/', authenticate, requirePermission('events_manage'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('startDate').isDate().withMessage('Start date is required'),
  body('endDate').isDate().withMessage('End date is required'),
  body('type').optional().isIn(VALID_TYPES).withMessage('Invalid event type'),
  body('status').optional().isIn(VALID_STATUSES).withMessage('Invalid status'),
], async (req, res) => {
  if (handleValidation(req, res)) return;
  try {
    const data = sanitiseBody(pickAllowed(req.body));
    data.organizerId = req.user.id;

    // Agents can only create client_viewing or open_house
    if (req.user.role === 'agent' && !['client_viewing', 'open_house'].includes(data.type)) {
      data.type = 'client_viewing';
    }

    const event = await Event.create(data);

    // Auto-add organizer as accepted attendee
    await EventAttendee.create({
      eventId:    event.id,
      userId:     req.user.id,
      rsvpStatus: 'accepted',
      rsvpDate:   new Date().toISOString().slice(0, 10),
    });

    // Add invited attendees from req.body.attendeeIds
    if (Array.isArray(req.body.attendeeIds)) {
      const others = req.body.attendeeIds.filter((uid) => uid !== req.user.id);
      if (others.length > 0) {
        await EventAttendee.bulkCreate(
          others.map((uid) => ({ eventId: event.id, userId: uid, rsvpStatus: 'pending' })),
          { ignoreDuplicates: true }
        );
      }
    }

    const full = await Event.findByPk(event.id, { include: FULL_INCLUDES });
    res.status(201).json({ event: full });
  } catch (err) {
    console.error('POST /events error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ── PUT /api/events/:id ───────────────────────────────────────────────────────
router.put('/:id', authenticate, requirePermission('events_manage'), [
  param('id').isUUID().withMessage('Invalid event ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be blank'),
  body('startDate').optional().isDate().withMessage('Invalid start date'),
  body('endDate').optional().isDate().withMessage('Invalid end date'),
  body('type').optional().isIn(VALID_TYPES).withMessage('Invalid event type'),
  body('status').optional().isIn(VALID_STATUSES).withMessage('Invalid status'),
], async (req, res) => {
  if (handleValidation(req, res)) return;
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Only organizer or admin/manager can update
    const canEdit = ['admin', 'manager'].includes(req.user.role) || event.organizerId === req.user.id;
    if (!canEdit) return res.status(403).json({ error: 'Access denied' });

    const data = sanitiseBody(pickAllowed(req.body));
    await event.update(data);

    // Sync attendees if provided
    if (Array.isArray(req.body.attendeeIds)) {
      const desired = [...new Set([...req.body.attendeeIds, event.organizerId])];
      const current = await EventAttendee.findAll({ where: { eventId: event.id }, attributes: ['userId'] });
      const currentIds = current.map((a) => a.userId);

      // Add new
      const toAdd = desired.filter((uid) => !currentIds.includes(uid));
      if (toAdd.length > 0) {
        await EventAttendee.bulkCreate(
          toAdd.map((uid) => ({
            eventId: event.id,
            userId:  uid,
            rsvpStatus: uid === event.organizerId ? 'accepted' : 'pending',
          })),
          { ignoreDuplicates: true }
        );
      }

      // Remove those not in desired (except organizer)
      const toRemove = currentIds.filter((uid) => !desired.includes(uid) && uid !== event.organizerId);
      if (toRemove.length > 0) {
        await EventAttendee.destroy({ where: { eventId: event.id, userId: { [Op.in]: toRemove } } });
      }
    }

    const full = await Event.findByPk(event.id, { include: FULL_INCLUDES });
    res.json({ event: full });
  } catch (err) {
    console.error('PUT /events/:id error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// ── PUT /api/events/:id/rsvp ──────────────────────────────────────────────────
router.put('/:id/rsvp', authenticate, requirePermission('events_view'), [
  param('id').isUUID().withMessage('Invalid event ID'),
  body('rsvpStatus').isIn(VALID_RSVPS).withMessage('Invalid RSVP status'),
], async (req, res) => {
  if (handleValidation(req, res)) return;
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const today = new Date().toISOString().slice(0, 10);
    const [attendee, created] = await EventAttendee.findOrCreate({
      where:    { eventId: event.id, userId: req.user.id },
      defaults: { eventId: event.id, userId: req.user.id, rsvpStatus: req.body.rsvpStatus, rsvpDate: today },
    });
    if (!created) {
      await attendee.update({ rsvpStatus: req.body.rsvpStatus, rsvpDate: today });
    }

    res.json({ attendee });
  } catch (err) {
    console.error('PUT /events/:id/rsvp error:', err);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
});

// ── DELETE /api/events/:id ────────────────────────────────────────────────────
router.delete('/:id', authenticate, requirePermission('events_manage'), [
  param('id').isUUID().withMessage('Invalid event ID'),
], async (req, res) => {
  if (handleValidation(req, res)) return;
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const canDelete = ['admin', 'manager'].includes(req.user.role) || event.organizerId === req.user.id;
    if (!canDelete) return res.status(403).json({ error: 'Access denied' });

    await EventAttendee.destroy({ where: { eventId: event.id } });
    await event.destroy();

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('DELETE /events/:id error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
