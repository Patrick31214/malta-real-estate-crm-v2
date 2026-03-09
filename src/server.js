require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const ownerRoutes = require('./routes/owners');
const userRoutes = require('./routes/users');
const branchRoutes = require('./routes/branches');
const uploadsRoutes = require('./routes/uploads');
const contactRoutes = require('./routes/contacts');
const clientRoutes  = require('./routes/clients');
const chatRoutes = require('./routes/chat');
const announcementRoutes = require('./routes/announcements');
const publicRoutes = require('./routes/public');
const agentRoutes = require('./routes/agents');
const agentMetricsRoutes = require('./routes/agentMetrics');
const notificationRoutes = require('./routes/notifications');
const inquiryRoutes = require('./routes/inquiries');
const serviceRoutes = require('./routes/services');
const complianceRoutes = require('./routes/compliance');
const documentRoutes = require('./routes/documents');
const metricsTracker = require('./middleware/metricsTracker');
const { cleanupOldNotifications } = require('./services/notificationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Metrics tracking middleware — must run before route handlers so the
// res.on('finish', ...) listener is registered before the response is sent
app.use(metricsTracker);

// API routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/clients',  clientRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/agents', agentMetricsRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/documents', documentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  // Cleanup old notifications on startup
  cleanupOldNotifications();
  // Backfill any properties that are missing reference numbers
  await backfillReferenceNumbers();
});

/**
 * On every server start, assign sequential PROP-NNNN reference numbers to any
 * properties that were created before the reference-number system existed.
 */
async function backfillReferenceNumbers() {
  try {
    const { Property, sequelize } = require('./models');
    const { Op } = require('sequelize');

    await sequelize.transaction(async (t) => {
      const nullProps = await Property.findAll({
        where: { [Op.or]: [{ referenceNumber: null }, { referenceNumber: '' }] },
        order: [['createdAt', 'ASC']],
        attributes: ['id', 'referenceNumber', 'createdAt'],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (nullProps.length === 0) return;

      console.log(`Backfilling reference numbers for ${nullProps.length} properties...`);

      // Find the current highest sequential PROP-NNNN number
      const existing = await Property.findAll({
        where: { referenceNumber: { [Op.like]: 'PROP-%' } },
        attributes: ['referenceNumber'],
        transaction: t,
      });
      let maxNum = 0;
      for (const p of existing) {
        const match = p.referenceNumber && p.referenceNumber.match(/^PROP-(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      console.log(`Current max reference number: PROP-${String(maxNum).padStart(4, '0')}`);

      for (const prop of nullProps) {
        maxNum += 1;
        const ref = `PROP-${String(maxNum).padStart(4, '0')}`;
        await Property.update(
          { referenceNumber: ref },
          {
            where: { id: prop.id, [Op.or]: [{ referenceNumber: null }, { referenceNumber: '' }] },
            transaction: t,
          }
        );
        console.log(`  Assigned ${ref} to property ${prop.id}`);
      }

      console.log(`Backfill complete — assigned ${nullProps.length} reference numbers.`);
    });
  } catch (err) {
    console.error('backfillReferenceNumbers error:', err.message);
  }
}

module.exports = app;
