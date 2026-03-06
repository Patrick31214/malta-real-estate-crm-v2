'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact an administrator.' });
    }
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({ error: 'Your account is pending admin approval.' });
    }
    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({ error: 'Your account registration was rejected. Please contact an administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
