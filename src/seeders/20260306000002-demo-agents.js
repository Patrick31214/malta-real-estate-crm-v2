'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Fetch branch IDs by email
    const branches = await queryInterface.sequelize.query(
      'SELECT id, email FROM branches',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const branchMap = {};
    for (const b of branches) {
      branchMap[b.email] = b.id;
    }

    const sliemasId   = branchMap['sliema@goldenkey.mt']    || null;
    const vallettaId  = branchMap['valletta@goldenkey.mt']   || null;
    const stjuliansId = branchMap['stjulians@goldenkey.mt']  || null;
    const gozoId      = branchMap['gozo@goldenkey.mt']       || null;

    const hash = await bcrypt.hash('Agent@1234', 10);

    const agents = [
      {
        id: uuidv4(),
        firstName: 'Mario',
        lastName: 'Vella',
        email: 'mario.vella@goldenkey.mt',
        password: hash,
        phone: '+356 9910 1111',
        role: 'agent',
        branchId: sliemasId,
        licenseNumber: 'MKL-2019-001',
        specializations: JSON.stringify(['Luxury Sales', 'Penthouses', 'Seafront Properties']),
        languages: JSON.stringify(['Maltese', 'English', 'Italian']),
        bio: 'Senior agent with over 10 years experience specialising in luxury properties along the Sliema and St Julian\'s seafronts.',
        nationality: 'Maltese',
        startDate: new Date('2014-03-01'),
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 3.5,
        jobTitle: 'Senior Sales Agent',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Sarah',
        lastName: 'Borg',
        email: 'sarah.borg@goldenkey.mt',
        password: hash,
        phone: '+356 9921 2222',
        role: 'manager',
        branchId: gozoId,
        licenseNumber: 'MKL-2016-015',
        specializations: JSON.stringify(['Farmhouses & Rural', 'Heritage & Palazzi', 'Land & Development']),
        languages: JSON.stringify(['Maltese', 'English']),
        bio: 'Gozo Branch Manager with deep expertise in rural and heritage properties across the Gozitan countryside.',
        nationality: 'Maltese',
        startDate: new Date('2016-07-15'),
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 4.0,
        jobTitle: 'Branch Manager — Gozo',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'James',
        lastName: 'Camilleri',
        email: 'james.camilleri@goldenkey.mt',
        password: hash,
        phone: '+356 9932 3333',
        role: 'agent',
        branchId: stjuliansId,
        licenseNumber: 'MKL-2020-042',
        specializations: JSON.stringify(['Expat Services', 'Investment Properties', 'Off-Plan Sales']),
        languages: JSON.stringify(['English', 'French', 'Arabic']),
        bio: 'International agent serving expatriates and foreign investors looking for premium apartments in St Julian\'s and Paceville.',
        nationality: 'Maltese',
        startDate: new Date('2020-01-10'),
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 3.0,
        jobTitle: 'International Sales Agent',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'Lisa',
        lastName: 'Farrugia',
        email: 'lisa.farrugia@goldenkey.mt',
        password: hash,
        phone: '+356 9943 4444',
        role: 'agent',
        branchId: vallettaId,
        licenseNumber: 'MKL-2018-028',
        specializations: JSON.stringify(['Heritage & Palazzi', 'Townhouses', 'Commercial Sales']),
        languages: JSON.stringify(['Maltese', 'English', 'German']),
        bio: 'Heritage property specialist with unique expertise in Valletta palazzi, restored townhouses, and commercial spaces in the capital.',
        nationality: 'Maltese',
        startDate: new Date('2018-09-01'),
        isActive: true,
        approvalStatus: 'approved',
        commissionRate: 3.5,
        jobTitle: 'Heritage Property Specialist',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        firstName: 'David',
        lastName: 'Grech',
        email: 'david.grech@goldenkey.mt',
        password: hash,
        phone: '+356 9954 5555',
        role: 'agent',
        branchId: sliemasId,
        licenseNumber: null,
        specializations: JSON.stringify(['Residential Sales', 'Buy-to-Let']),
        languages: JSON.stringify(['Maltese', 'English']),
        bio: 'Junior agent currently completing licensing requirements. Enthusiastic and client-focused.',
        nationality: 'Maltese',
        startDate: new Date('2026-02-01'),
        isActive: false,
        approvalStatus: 'pending',
        commissionRate: 2.5,
        jobTitle: 'Junior Sales Agent',
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Only insert agents whose email doesn't already exist
    const existingEmails = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE email IN (${agents.map(() => '?').join(',')})`,
      { replacements: agents.map(a => a.email), type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingSet = new Set(existingEmails.map(r => r.email));
    const toInsert = agents.filter(a => !existingSet.has(a.email));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('users', toInsert);
    }
  },

  async down(queryInterface) {
    // chat_messages.senderId has allowNull:false, so deleting users that sent
    // messages would violate the FK / NOT NULL constraint. Delete messages first.
    await queryInterface.sequelize.query(
      `DELETE FROM chat_messages
       WHERE "senderId" IN (
         SELECT id FROM users
         WHERE email IN (
           'mario.vella@goldenkey.mt',
           'sarah.borg@goldenkey.mt',
           'james.camilleri@goldenkey.mt',
           'lisa.farrugia@goldenkey.mt',
           'david.grech@goldenkey.mt'
         )
       )`
    );

    // Clean up notifications and agent_metrics for these agents too.
    await queryInterface.sequelize.query(
      `DELETE FROM notifications
       WHERE "recipientId" IN (
         SELECT id FROM users
         WHERE email IN (
           'mario.vella@goldenkey.mt',
           'sarah.borg@goldenkey.mt',
           'james.camilleri@goldenkey.mt',
           'lisa.farrugia@goldenkey.mt',
           'david.grech@goldenkey.mt'
         )
       )`
    );

    await queryInterface.sequelize.query(
      `DELETE FROM agent_metrics
       WHERE "userId" IN (
         SELECT id FROM users
         WHERE email IN (
           'mario.vella@goldenkey.mt',
           'sarah.borg@goldenkey.mt',
           'james.camilleri@goldenkey.mt',
           'lisa.farrugia@goldenkey.mt',
           'david.grech@goldenkey.mt'
         )
       )`
    );

    await queryInterface.bulkDelete('users', {
      email: [
        'mario.vella@goldenkey.mt',
        'sarah.borg@goldenkey.mt',
        'james.camilleri@goldenkey.mt',
        'lisa.farrugia@goldenkey.mt',
        'david.grech@goldenkey.mt',
      ],
    });
  },
};
