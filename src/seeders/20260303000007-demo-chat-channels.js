'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Fetch existing channel names so this seeder is idempotent
    const existing = await queryInterface.sequelize.query(
      'SELECT name FROM chat_channels',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingNames = new Set(existing.map(r => r.name));

    const channels = [
      {
        name: 'General',
        type: 'general',
        description: 'General company-wide announcements and chat.',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
      },
      {
        name: 'Rentals',
        type: 'role_group',
        description: 'Channel for the rentals team.',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
      },
      {
        name: 'Sales',
        type: 'role_group',
        description: 'Channel for the sales team.',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
      },
      {
        name: 'Managers',
        type: 'role_group',
        description: 'Private channel for managers and above.',
        allowedRoles: JSON.stringify(['admin', 'manager']),
        participantIds: JSON.stringify([]),
      },
      {
        name: 'Staff',
        type: 'general',
        description: 'All staff channel.',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
      },
    ];

    const toInsert = channels
      .filter(c => !existingNames.has(c.name))
      .map(c => ({
        id: uuidv4(),
        name: c.name,
        type: c.type,
        description: c.description,
        allowedRoles: c.allowedRoles,
        participantIds: c.participantIds,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('chat_channels', toInsert);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('chat_channels', {
      name: ['General', 'Rentals', 'Sales', 'Managers', 'Staff'],
    });
  },
};
