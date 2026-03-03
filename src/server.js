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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
