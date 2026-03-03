'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('owners', [
      {
        id: uuidv4(),
        firstName: 'Joseph',
        lastName: 'Borg',
        email: 'joseph.borg@example.mt',
        phone: '+356 9912 3456',
        alternatePhone: null,
        idNumber: '123456M',
        address: '15 Triq il-Kbira, Birkirkara, BKR 1234, Malta',
        notes: 'Long-time client. Prefers contact via phone.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Maria',
        lastName: 'Camilleri',
        email: 'maria.camilleri@example.mt',
        phone: '+356 9923 4567',
        alternatePhone: '+356 2134 5678',
        idNumber: '234567F',
        address: '8 Triq il-Ħaqqieqa, Sliema, SLM 1456, Malta',
        notes: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Anthony',
        lastName: 'Farrugia',
        email: 'anthony.farrugia@example.mt',
        phone: '+356 9934 5678',
        alternatePhone: null,
        idNumber: '345678M',
        address: '22 Triq San Ġorġ, St Julian\'s, STJ 2100, Malta',
        notes: 'Owns multiple properties. Looking to sell 2 this year.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Carmen',
        lastName: 'Vella',
        email: null,
        phone: '+356 9945 6789',
        alternatePhone: null,
        idNumber: '456789F',
        address: 'Triq id-Dehra, Mellieħa, MLH 1230, Malta',
        notes: 'Elderly owner. Contact only by phone.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Robert',
        lastName: 'Muscat',
        email: 'robert.muscat@example.mt',
        phone: '+356 9956 7890',
        alternatePhone: '+356 9956 7891',
        idNumber: '567890M',
        address: 'Triq il-Qaliet, Marsaskala, MSK 3012, Malta',
        notes: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Grace',
        lastName: 'Azzopardi',
        email: 'grace.azzopardi@example.mt',
        phone: '+356 9967 8901',
        alternatePhone: null,
        idNumber: '678901F',
        address: '5 Triq il-Palazz, Valletta, VLT 1010, Malta',
        notes: 'Owner of a historic palazzo. Very particular about buyers.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('owners', {
      phone: [
        '+356 9912 3456',
        '+356 9923 4567',
        '+356 9934 5678',
        '+356 9945 6789',
        '+356 9956 7890',
        '+356 9967 8901',
      ],
    });
  },
};
