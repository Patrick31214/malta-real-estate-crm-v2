'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Get admin user id
    const admins = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@goldenkey.mt' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!admins.length) return;
    const adminId = admins[0].id;

    await queryInterface.bulkInsert('announcements', [
      {
        id: uuidv4(),
        title: 'Welcome to Golden Key Realty CRM!',
        content:
          'Welcome to our brand new CRM system. This platform is your central hub for managing properties, inquiries, clients, and team communications. Please take a moment to explore the features and reach out to your manager if you have any questions.',
        priority: 'normal',
        type: 'general',
        targetType: 'all',
        targetRoles: JSON.stringify([]),
        targetBranchIds: JSON.stringify([]),
        targetUserIds: JSON.stringify([]),
        isPinned: false,
        startsAt: null,
        readByUserIds: JSON.stringify([]),
        publishedAt: now,
        expiresAt: null,
        isActive: true,
        createdById: adminId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: 'System Update — New Features Available',
        content:
          'We have just launched several new features including internal chat channels, document management, and the inquiry round-robin assignment system. Full training sessions will be scheduled next week.',
        priority: 'important',
        type: 'general',
        targetType: 'roles',
        targetRoles: JSON.stringify(['admin', 'manager', 'agent']),
        targetBranchIds: JSON.stringify([]),
        targetUserIds: JSON.stringify([]),
        isPinned: false,
        startsAt: null,
        readByUserIds: JSON.stringify([]),
        publishedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdById: adminId,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('announcements', {
      title: [
        'Welcome to Golden Key Realty CRM!',
        'System Update — New Features Available',
      ],
    });
  },
};
