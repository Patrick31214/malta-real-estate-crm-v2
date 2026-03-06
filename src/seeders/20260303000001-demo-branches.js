'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('branches', [
      {
        id: uuidv4(),
        name: 'Golden Key Realty — Sliema HQ',
        address: '123 Tower Road, Sliema SLM 1604',
        city: 'Sliema',
        locality: 'Sliema',
        country: 'Malta',
        phone: '+356 2131 2345',
        email: 'sliema@goldenkey.mt',
        description: 'Our flagship headquarters located on the Sliema seafront, specializing in luxury apartments and penthouses.',
        isActive: true,
        latitude: 35.9116,
        longitude: 14.5029,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Golden Key Realty — Valletta',
        address: '45 Republic Street, Valletta VLT 1110',
        city: 'Valletta',
        locality: 'Valletta',
        country: 'Malta',
        phone: '+356 2122 6789',
        email: 'valletta@goldenkey.mt',
        description: "Heritage property specialists in Malta's capital city. Palazzi, townhouses, and commercial spaces.",
        isActive: true,
        latitude: 35.8989,
        longitude: 14.5146,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: "Golden Key Realty — St Julian's",
        address: "78 Bay Street Complex, St Julian's STJ 3012",
        city: "St Julian's",
        locality: "St Julian's",
        country: 'Malta',
        phone: '+356 2138 4567',
        email: 'stjulians@goldenkey.mt',
        description: 'Entertainment district office focusing on modern high-rise apartments, serviced residences, and Portomaso properties.',
        isActive: true,
        latitude: 35.9186,
        longitude: 14.4906,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Golden Key Realty — Gozo',
        address: '12 Republic Street, Victoria VCT 1017, Gozo',
        city: 'Victoria',
        locality: 'Victoria (Rabat)',
        country: 'Malta',
        phone: '+356 2155 8901',
        email: 'gozo@goldenkey.mt',
        description: 'Gozo island operations — farmhouses, villas, and rural properties. Covering all Gozitan localities.',
        isActive: true,
        latitude: 36.0440,
        longitude: 14.2392,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Golden Key Realty — Mellieħa',
        address: '5 Borg Olivier Street, Mellieħa MLH 1014',
        city: 'Mellieħa',
        locality: 'Mellieħa',
        country: 'Malta',
        phone: '+356 2152 3456',
        email: 'mellieha@goldenkey.mt',
        description: 'North Malta specialists — covering Mellieħa, Għadira, Manikata and surrounding areas. Villas and family homes.',
        isActive: false,
        latitude: 35.9565,
        longitude: 14.3619,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('branches', {
      email: [
        'sliema@goldenkey.mt',
        'valletta@goldenkey.mt',
        'stjulians@goldenkey.mt',
        'gozo@goldenkey.mt',
        'mellieha@goldenkey.mt',
      ],
    });
  },
};

