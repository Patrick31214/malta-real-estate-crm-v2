'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Property, Owner, User, Branch, Client, ClientMatch, ChatChannel, ChatMessage } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Detect PostgreSQL "column does not exist" errors (code 42703) or similar
const isColumnMissingError = (err) =>
  err.original?.code === '42703' ||
  (err.message && err.message.toLowerCase().includes('does not exist'));

const router = express.Router();

/**
 * Fire-and-forget helper: post a system message to the property_updates channel.
 * Does NOT throw — failures are silently swallowed so they never affect the main request.
 */
async function postPropertyUpdateMessage(senderId, { propertyId, action, propertyTitle, propertyLocality, propertyPrice }) {
  try {
    let channel = await ChatChannel.findOne({ where: { type: 'property_updates', isActive: true } });
    if (!channel) {
      channel = await ChatChannel.create({
        name: 'Property Updates',
        type: 'property_updates',
        description: 'Automatic property activity feed',
        isActive: true,
      });
    }
    const content =
      `🏠 **${action}**: ${propertyTitle || 'Property'} — ${propertyLocality || ''} — €${propertyPrice ? Number(propertyPrice).toLocaleString() : '?'}`;
    const msg = await ChatMessage.create({
      channelId: channel.id,
      senderId,
      content,
      type: 'property_update',
      propertyId: propertyId || null,
      metadata: { action, propertyTitle, propertyLocality, propertyPrice },
      isRead: {},
    });
    await channel.update({ lastMessageAt: msg.createdAt });
  } catch {
    // non-critical — swallow errors
  }
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

const ALLOWED_PROPERTY_FIELDS = [
  'title', 'description', 'type', 'listingType', 'status',
  'price', 'currency',
  'bedrooms', 'bathrooms', 'area', 'floor', 'totalFloors', 'yearBuilt', 'energyRating',
  'locality', 'address', 'latitude', 'longitude',
  'features', 'images', 'heroImage',
  'virtualTourUrl', 'videoUrl',
  'droneImages', 'droneVideoUrl', 'threeDViewUrl',
  'isAvailable', 'isFeatured', 'availableFrom',
  'acceptsChildren', 'childFriendlyRequired', 'acceptsSharing',
  'acceptsShortLet', 'isPetFriendly', 'isNegotiable',
  'acceptedAgeRange', 'internalNotes',
  'referenceNumber',
  'petPolicy', 'tenantPolicy', 'nationalityPolicy', 'contractTerms',
  'ownerId', 'agentId', 'branchId',
];

function pickAllowed(body) {
  const result = {};
  for (const key of ALLOWED_PROPERTY_FIELDS) {
    if (key in body) result[key] = body[key];
  }
  return result;
}


const PROPERTY_TYPES = ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'];
const LISTING_TYPES  = ['sale','long_let','short_let','both'];
const STATUS_TYPES   = ['draft','listed','under_offer','sold','rented','withdrawn'];
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'not_required'];

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  return null;
};

// ── GET /api/properties ─────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const {
    page = 1, limit = 20,
    search, type, listingType, status, locality,
    minPrice, maxPrice, minBedrooms, maxBedrooms, minBathrooms,
    minArea, maxArea, floor, minYearBuilt, maxYearBuilt,
    energyRating, approvalStatus, hasPhotos, hasVideo,
    hasDroneMedia, has3DView, hasVirtualTour,
    isAvailable, isFeatured, agentId, ownerId, branchId,
    features,
    acceptsDogs, acceptsCats, acceptsFamilies, acceptsStudents, acceptsAllNationalities,
    sortBy = 'createdAt', sortOrder = 'DESC',
  } = req.query;

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset   = (pageNum - 1) * limitNum;

  const where = {};

  if (search) {
    where[Op.or] = [
      { title:         { [Op.iLike]: `%${search}%` } },
      { description:   { [Op.iLike]: `%${search}%` } },
      { locality:      { [Op.iLike]: `%${search}%` } },
      { address:       { [Op.iLike]: `%${search}%` } },
      { internalNotes: { [Op.iLike]: `%${search}%` } },
      { referenceNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (type)           where.type           = type;
  if (listingType)    where.listingType    = listingType;
  if (status)         where.status         = status;
  if (locality)       where.locality       = { [Op.iLike]: `%${locality}%` };
  if (agentId)        where.agentId        = agentId;
  if (ownerId)        where.ownerId        = ownerId;
  if (branchId)       where.branchId       = branchId;
  if (energyRating)   where.energyRating   = energyRating;
  if (approvalStatus) where.approvalStatus = approvalStatus;

  if (floor !== undefined && floor !== '') {
    const floorNum = parseInt(floor, 10);
    if (!isNaN(floorNum)) where.floor = floorNum;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice !== undefined) where.price[Op.lte] = parseFloat(maxPrice);
  }

  if (minBedrooms !== undefined || maxBedrooms !== undefined) {
    where.bedrooms = {};
    if (minBedrooms !== undefined) where.bedrooms[Op.gte] = parseInt(minBedrooms, 10);
    if (maxBedrooms !== undefined) where.bedrooms[Op.lte] = parseInt(maxBedrooms, 10);
  }

  if (minBathrooms !== undefined && minBathrooms !== '') {
    where.bathrooms = { [Op.gte]: parseInt(minBathrooms, 10) };
  }

  if (minArea !== undefined || maxArea !== undefined) {
    where.area = {};
    if (minArea !== undefined) where.area[Op.gte] = parseFloat(minArea);
    if (maxArea !== undefined) where.area[Op.lte] = parseFloat(maxArea);
  }

  if (minYearBuilt !== undefined || maxYearBuilt !== undefined) {
    where.yearBuilt = {};
    if (minYearBuilt !== undefined) where.yearBuilt[Op.gte] = parseInt(minYearBuilt, 10);
    if (maxYearBuilt !== undefined) where.yearBuilt[Op.lte] = parseInt(maxYearBuilt, 10);
  }

  if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
  if (isFeatured  !== undefined) where.isFeatured  = isFeatured  === 'true';

  // Internal spec filters
  if (req.query.isPetFriendly          !== undefined) where.isPetFriendly          = req.query.isPetFriendly          === 'true';
  if (req.query.acceptsChildren        !== undefined) where.acceptsChildren        = req.query.acceptsChildren        === 'true';
  if (req.query.acceptsSharing         !== undefined) where.acceptsSharing         = req.query.acceptsSharing         === 'true';
  if (req.query.acceptsShortLet        !== undefined) where.acceptsShortLet        = req.query.acceptsShortLet        === 'true';
  if (req.query.childFriendlyRequired  !== undefined) where.childFriendlyRequired  = req.query.childFriendlyRequired  === 'true';
  if (req.query.isNegotiable           !== undefined) where.isNegotiable           = req.query.isNegotiable           === 'true';
  if (req.query.acceptedAgeRange       !== undefined && req.query.acceptedAgeRange !== '') {
    where.acceptedAgeRange = { [Op.iLike]: `%${req.query.acceptedAgeRange}%` };
  }

  // JSONB policy filters — use Op.contains (@>) for PostgreSQL JSONB containment
  const petPolicyFilter = {};
  if (acceptsDogs !== undefined) petPolicyFilter.acceptsDogs = acceptsDogs === 'true';
  if (acceptsCats !== undefined) petPolicyFilter.acceptsCats = acceptsCats === 'true';
  if (Object.keys(petPolicyFilter).length > 0) {
    where.petPolicy = { [Op.contains]: petPolicyFilter };
  }

  const tenantPolicyFilter = {};
  if (acceptsFamilies !== undefined) tenantPolicyFilter.acceptsFamilies = acceptsFamilies === 'true';
  if (acceptsStudents !== undefined) tenantPolicyFilter.acceptsStudents = acceptsStudents === 'true';
  if (Object.keys(tenantPolicyFilter).length > 0) {
    where.tenantPolicy = { [Op.contains]: tenantPolicyFilter };
  }

  if (acceptsAllNationalities !== undefined) {
    where.nationalityPolicy = { [Op.contains]: { acceptsAll: acceptsAllNationalities === 'true' } };
  }

  // features: comma-separated list → filter for properties containing ALL listed features
  if (features) {
    const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
    if (featureList.length > 0) {
      where.features = { [Op.contains]: featureList };
    }
  }

  // hasPhotos / hasVideo / hasDroneMedia / has3DView / hasVirtualTour filters
  if (hasPhotos === 'true') {
    where.heroImage = { [Op.ne]: null };
  }
  if (hasVideo === 'true') {
    where.videoUrl = { [Op.ne]: null };
  }
  if (hasDroneMedia === 'true') {
    where[Op.and] = [
      ...(where[Op.and] || []),
      { [Op.or]: [{ droneImages: { [Op.ne]: null } }, { droneVideoUrl: { [Op.ne]: null } }] },
    ];
  }
  if (has3DView === 'true') {
    where.threeDViewUrl = { [Op.ne]: null };
  }
  if (hasVirtualTour === 'true') {
    where.virtualTourUrl = { [Op.ne]: null };
  }

  const allowedSortFields = ['createdAt','updatedAt','price','title','locality','bedrooms','area','yearBuilt','status'];
  const safeSortBy    = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const queryOptions = {
    where,
    include: [
      { model: Owner, attributes: ['id','firstName','lastName','phone'] },
      { model: User,  as: 'agent', attributes: ['id','firstName','lastName','profileImage'] },
      { model: Branch, attributes: ['id','name'] },
    ],
    order:  [[safeSortBy, safeSortOrder]],
    limit:  limitNum,
    offset,
  };

  const sendResult = (count, rows) => res.json({
    properties: rows,
    pagination: {
      total:      count,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(count / limitNum),
    },
  });

  try {
    const { count, rows } = await Property.findAndCountAll(queryOptions);
    sendResult(count, rows);
  } catch (err) {
    if (isColumnMissingError(err)) {
      // Retry without referenceNumber: strip it from Op.or search and exclude from SELECT
      try {
        if (where[Op.or]) {
          where[Op.or] = where[Op.or].filter(cond => !('referenceNumber' in cond));
          if (where[Op.or].length === 0) delete where[Op.or];
        }
        const retryOptions = { ...queryOptions, where, attributes: { exclude: ['referenceNumber'] } };
        const { count, rows } = await Property.findAndCountAll(retryOptions);
        sendResult(count, rows);
      } catch (retryErr) {
        console.error('GET /properties retry error:', retryErr.message);
        res.status(500).json({ error: retryErr.message });
      }
    } else {
      console.error('GET /properties error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// ── POST /api/properties/generate-description ────────────────────────────────
let _openaiClient = null;
function getOpenAIClient() {
  if (!_openaiClient) {
    const OpenAI = require('openai');
    _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openaiClient;
}

router.post('/generate-description', authenticate, authorize('admin', 'manager', 'agent'), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI description generation is not configured. Please set the OPENAI_API_KEY environment variable.' });
  }

  try {
    const openai = getOpenAIClient();

    const { type, listingType, locality, bedrooms, bathrooms, area, features, price, currency, floor, totalFloors, yearBuilt, energyRating } = req.body;

    const details = [
      type && `Type: ${type}`,
      listingType && `Listing: ${listingType.replace('_', ' ')}`,
      locality && `Location: ${locality}, Malta`,
      bedrooms != null && bedrooms !== '' && `Bedrooms: ${bedrooms}`,
      bathrooms != null && bathrooms !== '' && `Bathrooms: ${bathrooms}`,
      area && `Area: ${area}m²`,
      floor != null && floor !== '' && `Floor: ${floor}`,
      totalFloors && `Total floors in building: ${totalFloors}`,
      yearBuilt && `Year built: ${yearBuilt}`,
      energyRating && `Energy rating: ${energyRating}`,
      price && `Price: ${currency || 'EUR'} ${Number(price).toLocaleString()}`,
      features && features.length > 0 && `Key features: ${Array.isArray(features) ? features.join(', ') : features}`,
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional real estate copywriter specialising in Malta property listings. Write compelling, detailed property descriptions that highlight the property's best features. Use British English. Be descriptive but not overly flowery. Mention the locality and its benefits. Include practical details. The description should be 150-250 words, suitable for a property listing website.`,
        },
        {
          role: 'user',
          content: `Please write a property description for the following property:\n\n${details}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const description = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ description });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to generate description' });
  }
});

// ── GET /api/properties/check-duplicate ─────────────────────────────────────
router.get('/check-duplicate', authenticate, async (req, res) => {
  const { address, locality, ownerId, type, title, excludeId } = req.query;
  const conditions = [];

  // Same ownerId + locality + type
  if (ownerId && locality && type) {
    conditions.push({ ownerId, locality: { [Op.iLike]: locality }, type });
  }

  // Same address (case-insensitive)
  if (address && address.trim()) {
    conditions.push({ address: { [Op.iLike]: address.trim() } });
  }

  // Same ownerId + similar title
  if (ownerId && title && title.trim()) {
    conditions.push({ ownerId, title: { [Op.iLike]: `%${title.trim()}%` } });
  }

  if (conditions.length === 0) {
    return res.json({ isDuplicate: false, matches: [] });
  }

  const where = { [Op.or]: conditions };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const withRef = ['id', 'title', 'referenceNumber', 'locality', 'type', 'status', 'price', 'currency'];
  const withoutRef = ['id', 'title', 'locality', 'type', 'status', 'price', 'currency'];

  try {
    const matches = await Property.findAll({ where, attributes: withRef, limit: 10 });
    res.json({ isDuplicate: matches.length > 0, matches });
  } catch (err) {
    if (isColumnMissingError(err)) {
      try {
        const matches = await Property.findAll({ where, attributes: withoutRef, limit: 10 });
        res.json({ isDuplicate: matches.length > 0, matches });
      } catch (retryErr) {
        console.error('GET /properties/check-duplicate retry error:', retryErr.message);
        res.status(500).json({ error: retryErr.message });
      }
    } else {
      console.error('GET /properties/check-duplicate error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// ── GET /api/properties/:id ──────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  const includeOpts = [
    { model: Owner },
    { model: User, as: 'agent', attributes: { exclude: ['password'] } },
    { model: Branch },
  ];
  try {
    const property = await Property.findByPk(req.params.id, { include: includeOpts });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (err) {
    if (isColumnMissingError(err)) {
      try {
        const property = await Property.findByPk(req.params.id, {
          attributes: { exclude: ['referenceNumber'] },
          include: includeOpts,
        });
        if (!property) return res.status(404).json({ error: 'Property not found' });
        res.json(property);
      } catch (retryErr) {
        console.error('GET /properties/:id retry error:', retryErr.message);
        res.status(500).json({ error: retryErr.message });
      }
    } else {
      console.error('GET /properties/:id error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// ── POST /api/properties ─────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(PROPERTY_TYPES).withMessage('Invalid property type'),
    body('listingType').isIn(LISTING_TYPES).withMessage('Invalid listing type'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('locality').trim().notEmpty().withMessage('Locality is required'),
    body('ownerId').isUUID().withMessage('Valid owner ID is required'),
    body('status').optional().isIn(STATUS_TYPES),
    body('bedrooms').optional({ nullable: true }).isInt({ min: 0 }),
    body('bathrooms').optional({ nullable: true }).isInt({ min: 0 }),
    body('area').optional({ nullable: true }).isFloat({ min: 0 }),
    body('floor').optional({ nullable: true }).isInt(),
    body('totalFloors').optional({ nullable: true }).isInt({ min: 1 }),
    body('yearBuilt').optional({ nullable: true }).isInt({ min: 1800, max: new Date().getFullYear() }),
    body('agentId').optional({ nullable: true }).isUUID(),
    body('branchId').optional({ nullable: true }).isUUID(),
    body('isAvailable').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    try {
      // Auto-generate reference number
      let referenceNumber;
      try {
        const lastProp = await Property.findOne({
          where: { referenceNumber: { [Op.ne]: null } },
          order: [['referenceNumber', 'DESC']],
          attributes: ['referenceNumber'],
        });
        let nextNum = 1;
        if (lastProp?.referenceNumber) {
          const m = lastProp.referenceNumber.match(/PROP-(\d+)/);
          if (m) nextNum = parseInt(m[1], 10) + 1;
        }
        referenceNumber = `PROP-${String(nextNum).padStart(4, '0')}`;
      } catch {
        // referenceNumber column may not exist yet; skip
      }

      const data = pickAllowed(req.body);
      if (referenceNumber) data.referenceNumber = referenceNumber;

      const property = await Property.create(data);
      const full = await Property.findByPk(property.id, {
        include: [
          { model: Owner, attributes: ['id','firstName','lastName','phone'] },
          { model: User,  as: 'agent', attributes: ['id','firstName','lastName','profileImage'] },
          { model: Branch, attributes: ['id','name'] },
        ],
      });
      res.status(201).json(full);
      // Post to property updates chat channel (fire and forget)
      postPropertyUpdateMessage(req.user.id, {
        propertyId: property.id,
        action: 'Listed',
        propertyTitle: full.title,
        propertyLocality: full.locality,
        propertyPrice: full.price,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── PUT /api/properties/:id ──────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'agent'),
  [
    body('title').optional().trim().notEmpty(),
    body('type').optional().isIn(PROPERTY_TYPES),
    body('listingType').optional().isIn(LISTING_TYPES),
    body('price').optional({ nullable: true }).isFloat({ gt: 0 }),
    body('locality').optional().trim().notEmpty(),
    body('ownerId').optional({ nullable: true }).isUUID(),
    body('status').optional().isIn(STATUS_TYPES),
    body('bedrooms').optional({ nullable: true }).isInt({ min: 0 }),
    body('bathrooms').optional({ nullable: true }).isInt({ min: 0 }),
    body('area').optional({ nullable: true }).isFloat({ min: 0 }),
    body('agentId').optional({ nullable: true }).isUUID(),
    body('branchId').optional({ nullable: true }).isUUID(),
    body('isAvailable').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
  ],
  async (req, res) => {
    const invalid = handleValidation(req, res);
    if (invalid) return;

    try {
      const property = await Property.findByPk(req.params.id);
      if (!property) return res.status(404).json({ error: 'Property not found' });

      // Agents can only update their own properties
      if (req.user.role === 'agent' && property.agentId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own properties' });
      }

      await property.update(pickAllowed(req.body));
      const full = await Property.findByPk(property.id, {
        include: [
          { model: Owner, attributes: ['id','firstName','lastName','phone'] },
          { model: User,  as: 'agent', attributes: ['id','firstName','lastName','profileImage'] },
          { model: Branch, attributes: ['id','name'] },
        ],
      });
      res.json(full);
      // Post significant status changes to the property updates chat channel
      const newStatus = req.body.status;
      if (newStatus && newStatus !== property.status) {
        const actionMap = { sold: 'Sold', rented: 'Rented', listed: 'Listed', under_offer: 'Under Offer', withdrawn: 'Withdrawn' };
        postPropertyUpdateMessage(req.user.id, {
          propertyId: property.id,
          action: actionMap[newStatus] || 'Updated',
          propertyTitle: full.title,
          propertyLocality: full.locality,
          propertyPrice: full.price,
        });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── DELETE /api/properties/:id ───────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    await property.update({ status: 'withdrawn' });
    res.json({ message: 'Property withdrawn successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/properties/:id/toggle-available ───────────────────────────────
router.patch('/:id/toggle-available', authenticate, authorize('admin', 'manager', 'agent'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (req.user.role === 'agent' && property.agentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own properties' });
    }

    await property.update({ isAvailable: !property.isAvailable });
    res.json({ id: property.id, isAvailable: property.isAvailable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/properties/:id/toggle-featured ────────────────────────────────
router.patch('/:id/toggle-featured', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    await property.update({ isFeatured: !property.isFeatured });
    res.json({ id: property.id, isFeatured: property.isFeatured });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/properties/:id/submit-for-approval ───────────────────────────
router.patch('/:id/submit-for-approval', authenticate, authorize('admin', 'manager', 'agent'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (req.user.role === 'agent' && property.agentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only submit your own properties' });
    }

    await property.update({ approvalStatus: 'pending' });
    res.json({ id: property.id, approvalStatus: property.approvalStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/properties/:id/approve ───────────────────────────────────────
router.patch('/:id/approve', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    await property.update({
      approvalStatus: 'approved',
      approvedBy:     req.user.id,
      approvedAt:     new Date(),
      approvalNotes:  req.body.notes || null,
    });
    res.json({ id: property.id, approvalStatus: property.approvalStatus, approvedAt: property.approvedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/properties/:id/reject ────────────────────────────────────────
router.patch('/:id/reject', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    await property.update({
      approvalStatus:       'rejected',
      approvalNotes:        req.body.notes || null,
      isPublishedToWebsite: false,
    });
    res.json({ id: property.id, approvalStatus: property.approvalStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/properties/:id/toggle-publish ────────────────────────────────
router.patch('/:id/toggle-publish', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (property.approvalStatus !== 'approved' && !property.isPublishedToWebsite) {
      return res.status(400).json({ error: 'Property must be approved before publishing' });
    }

    await property.update({ isPublishedToWebsite: !property.isPublishedToWebsite });
    res.json({ id: property.id, isPublishedToWebsite: property.isPublishedToWebsite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/properties/:id/matched-clients ─────────────────────────────────
router.get('/:id/matched-clients', authenticate, authorize('admin', 'manager', 'agent'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const matches = await ClientMatch.findAll({
      where: { propertyId: req.params.id },
      include: [{ model: Client, attributes: ['id', 'firstName', 'lastName', 'email', 'status', 'isVIP'] }],
      order: [['matchScore', 'DESC']],
      limit: 50,
    });

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

