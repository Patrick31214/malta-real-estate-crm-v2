'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const saltRounds = 12;
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        email: 'admin@goldenkey.mt',
        password: await bcrypt.hash('Admin123!', saltRounds),
        firstName: 'Patrick',
        lastName: 'Admin',
        role: 'admin',
        phone: null,
        avatar: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        email: 'manager@goldenkey.mt',
        password: await bcrypt.hash('Manager123!', saltRounds),
        firstName: 'Maria',
        lastName: 'Manager',
        role: 'manager',
        phone: null,
        avatar: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        email: 'agent@goldenkey.mt',
        password: await bcrypt.hash('Agent123!', saltRounds),
        firstName: 'Alex',
        lastName: 'Agent',
        role: 'agent',
        phone: null,
        avatar: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        email: 'client@goldenkey.mt',
        password: await bcrypt.hash('Client123!', saltRounds),
        firstName: 'Chris',
        lastName: 'Client',
        role: 'client',
        phone: null,
        avatar: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    // chat_messages.senderId has allowNull:false so deleting users would violate the FK
    // constraint (SET NULL can't be applied). Delete dependent rows first.
    await queryInterface.sequelize.query(
      `DELETE FROM chat_messages
       WHERE "senderId" IN (
         SELECT id FROM users
         WHERE email IN (
           'admin@goldenkey.mt',
           'manager@goldenkey.mt',
           'agent@goldenkey.mt',
           'client@goldenkey.mt'
         )
       )`
    );

    // notifications.recipientId has ON DELETE CASCADE, but delete explicitly to
    // avoid issues when the constraint is missing from an older schema.
    await queryInterface.sequelize.query(
      `DELETE FROM notifications
       WHERE "recipientId" IN (
         SELECT id FROM users
         WHERE email IN (
           'admin@goldenkey.mt',
           'manager@goldenkey.mt',
           'agent@goldenkey.mt',
           'client@goldenkey.mt'
         )
       )`
    );

    // agent_metrics.userId has ON DELETE CASCADE, but clean up explicitly.
    await queryInterface.sequelize.query(
      `DELETE FROM agent_metrics
       WHERE "userId" IN (
         SELECT id FROM users
         WHERE email IN (
           'admin@goldenkey.mt',
           'manager@goldenkey.mt',
           'agent@goldenkey.mt',
           'client@goldenkey.mt'
         )
       )`
    );

    await queryInterface.bulkDelete('users', {
      email: [
        'admin@goldenkey.mt',
        'manager@goldenkey.mt',
        'agent@goldenkey.mt',
        'client@goldenkey.mt',
      ],
    });
  },
};
