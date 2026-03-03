'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('branches', [
      {
        id: uuidv4(),
        name: 'Sliema Office (HQ)',
        address: '125 Tower Road, Sliema, SLM 1601, Malta',
        phone: '+356 2134 0000',
        email: 'sliema@goldenkey.mt',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Valletta Office',
        address: '48 Republic Street, Valletta, VLT 1117, Malta',
        phone: '+356 2124 0000',
        email: 'valletta@goldenkey.mt',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: "St Julian's Office",
        address: '32 St George\'s Road, St Julian\'s, STJ 1080, Malta',
        phone: '+356 2138 0000',
        email: 'stjulians@goldenkey.mt',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('branches', {
      email: ['sliema@goldenkey.mt', 'valletta@goldenkey.mt', 'stjulians@goldenkey.mt'],
    });
  },
};
