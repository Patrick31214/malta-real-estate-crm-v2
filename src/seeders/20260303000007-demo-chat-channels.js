'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('chat_channels', [
      {
        id: uuidv4(),
        name: 'General',
        type: 'general',
        description: 'General company-wide announcements and chat.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Rentals',
        type: 'rentals',
        description: 'Channel for the rentals team.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Sales',
        type: 'sales',
        description: 'Channel for the sales team.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Managers',
        type: 'managers',
        description: 'Private channel for managers and above.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Staff',
        type: 'staff',
        description: 'All staff channel.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('chat_channels', {
      type: ['general', 'rentals', 'sales', 'managers', 'staff'],
    });
  },
};
