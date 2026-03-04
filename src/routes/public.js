'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { Property, User } = require('../models');

const router = express.Router();

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(publicLimiter);

// GET /api/public/properties/:id?agent=UUID
router.get('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profileImage', 'bio'],
        },
      ],
    });

    if (!property) return res.status(404).json({ error: 'Property not found' });

    const data = property.toJSON();

    // CRITICAL: strip all owner fields — never expose to public
    delete data.Owner;
    delete data.ownerId;

    // If ?agent= param provided, override agent with the sender's details
    if (req.query.agent) {
      const senderAgent = await User.findByPk(req.query.agent, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profileImage', 'bio'],
      });
      if (senderAgent) data.agent = senderAgent.toJSON();
    }

    res.json(data);
  } catch (err) {
    console.error('Public property fetch error:', err);
    res.status(500).json({ error: 'Failed to load property' });
  }
});

module.exports = router;
