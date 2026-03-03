'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('contacts', [
      {
        id: uuidv4(),
        firstName: 'David',
        lastName: 'Mifsud',
        email: 'david.mifsud@maltanotary.mt',
        phone: '+356 2122 1234',
        company: 'Mifsud & Associates Notaries',
        role: 'Notary',
        category: 'legal',
        notes: 'Preferred notary for property transactions in Valletta area.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Anna',
        lastName: 'Galea',
        email: 'anna.galea@maltalaw.mt',
        phone: '+356 2134 5678',
        company: 'Galea Legal Associates',
        role: 'Lawyer',
        category: 'legal',
        notes: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Mark',
        lastName: 'Zammit',
        email: null,
        phone: '+356 9912 0011',
        company: null,
        role: 'Plumber',
        category: 'maintenance',
        notes: 'Available 24/7 for emergencies. Covers all Malta.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Paul',
        lastName: 'Debono',
        email: 'paul@debonoelectric.mt',
        phone: '+356 9923 4455',
        company: 'Debono Electrical Services',
        role: 'Electrician',
        category: 'maintenance',
        notes: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Sandra',
        lastName: 'Pace',
        email: 'sandra.pace@goldenkey.mt',
        phone: '+356 2134 0001',
        company: 'Golden Key Realty',
        role: 'Branch Receptionist',
        category: 'branch',
        notes: 'Sliema HQ front desk.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Emergency',
        lastName: 'Services',
        email: null,
        phone: '112',
        company: null,
        role: 'Emergency Services',
        category: 'emergency',
        notes: 'Malta Emergency Number',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('contacts', {
      email: [
        'david.mifsud@maltanotary.mt',
        'anna.galea@maltalaw.mt',
        'paul@debonoelectric.mt',
        'sandra.pace@goldenkey.mt',
      ],
    });
  },
};
