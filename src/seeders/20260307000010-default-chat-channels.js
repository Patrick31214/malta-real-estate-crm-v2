'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const channels = [
      {
        name: 'All Team',
        type: 'general',
        description: 'Company-wide team chat — everyone can participate',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
        isActive: true,
      },
      {
        name: 'Sales Team',
        type: 'role_group',
        description: 'Sales department discussions',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
        isActive: true,
      },
      {
        name: 'Rentals Team',
        type: 'role_group',
        description: 'Rentals department discussions',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
        isActive: true,
      },
      {
        name: 'Managers',
        type: 'role_group',
        description: 'Managers and admin discussion channel',
        allowedRoles: JSON.stringify(['admin', 'manager']),
        participantIds: JSON.stringify([]),
        isActive: true,
      },
      {
        name: 'Agents',
        type: 'role_group',
        description: 'All agents channel',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
        isActive: true,
      },
      {
        name: 'Admin',
        type: 'role_group',
        description: 'Administrators only',
        allowedRoles: JSON.stringify(['admin']),
        participantIds: JSON.stringify([]),
        isActive: true,
      },
      {
        name: 'Property Updates',
        type: 'property_updates',
        description: 'Automatic feed of property changes across the system',
        allowedRoles: JSON.stringify(['admin', 'manager', 'agent']),
        participantIds: JSON.stringify([]),
        isActive: true,
      },
    ];

    // Fetch existing channel names to keep this seeder idempotent
    const existing = await queryInterface.sequelize.query(
      'SELECT name FROM chat_channels',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingNames = new Set(existing.map(r => r.name));

    const toInsert = channels
      .filter(c => !existingNames.has(c.name))
      .map(c => ({
        id: uuidv4(),
        name: c.name,
        type: c.type,
        description: c.description,
        allowedRoles: c.allowedRoles,
        participantIds: c.participantIds,
        isActive: c.isActive,
        createdAt: now,
        updatedAt: now,
      }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('chat_channels', toInsert);
    }
  },

  async down(queryInterface) {
    const names = [
      'All Team',
      'Sales Team',
      'Rentals Team',
      'Managers',
      'Agents',
      'Admin',
      'Property Updates',
    ];
    await queryInterface.bulkDelete('chat_channels', { name: names });
  },
};
