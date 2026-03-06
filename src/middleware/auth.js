'use strict';

const jwt = require('jsonwebtoken');
const { User, UserPermission } = require('../models');

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

const requirePermission = (...features) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Admin bypasses all permission checks
    if (req.user.role === 'admin') {
      return next();
    }
    try {
      const perms = await UserPermission.findAll({
        where: { userId: req.user.id, feature: features, isEnabled: true },
      });
      const grantedFeatures = perms.map(p => p.feature);
      const hasAll = features.every(f => grantedFeatures.includes(f));
      if (!hasAll) {
        return res.status(403).json({ error: 'You do not have permission to perform this action' });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

module.exports = { authenticate, authorize, requirePermission };
