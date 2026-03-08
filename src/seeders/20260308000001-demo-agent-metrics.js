'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Look up demo agent user IDs (all seeded staff, not the client account)
    const agentEmails = [
      'admin@goldenkey.mt',
      'manager@goldenkey.mt',
      'agent@goldenkey.mt',
      'mario.vella@goldenkey.mt',
      'sarah.borg@goldenkey.mt',
      'james.camilleri@goldenkey.mt',
      'lisa.farrugia@goldenkey.mt',
    ];

    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN (:emails)`,
      {
        replacements: { emails: agentEmails },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (users.length === 0) return; // Nothing to seed if no agents exist yet

    const now = new Date();
    const metrics = [];

    // Spread sample activity across the past 30 days for each agent
    for (const user of users) {
      for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
        const date = new Date(now);
        date.setDate(now.getDate() - daysAgo);
        date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);

        // login every day
        metrics.push({
          id: uuidv4(),
          userId: user.id,
          metricType: 'login',
          entityType: null,
          entityId: null,
          metadata: null,
          createdAt: new Date(date),
          updatedAt: new Date(date),
        });

        // logout (30 min – 8 h later)
        const sessionSeconds = (30 + Math.floor(Math.random() * 450)) * 60;
        const logoutDate = new Date(date.getTime() + sessionSeconds * 1000);
        metrics.push({
          id: uuidv4(),
          userId: user.id,
          metricType: 'logout',
          entityType: null,
          entityId: null,
          metadata: null,
          createdAt: logoutDate,
          updatedAt: logoutDate,
        });

        // session_duration event — required by agentMetrics.js to calculate session hours
        const sessionDurationDate = new Date(logoutDate);
        metrics.push({
          id: uuidv4(),
          userId: user.id,
          metricType: 'session_duration',
          entityType: null,
          entityId: null,
          metadata: JSON.stringify({ duration: sessionSeconds }),
          createdAt: sessionDurationDate,
          updatedAt: sessionDurationDate,
        });

        // A handful of property / client / owner views per day
        const activityTypes = [
          { metricType: 'property_view',  entityType: 'property' },
          { metricType: 'client_view',    entityType: 'client' },
          { metricType: 'owner_view',     entityType: 'owner' },
          { metricType: 'inquiry_view',   entityType: 'inquiry' },
        ];

        const count = 1 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
          const act = activityTypes[Math.floor(Math.random() * activityTypes.length)];
          const actDate = new Date(date.getTime() + (i + 1) * 20 * 60 * 1000);
          metrics.push({
            id: uuidv4(),
            userId: user.id,
            metricType: act.metricType,
            entityType: act.entityType,
            entityId: null,
            metadata: null,
            createdAt: actDate,
            updatedAt: actDate,
          });
        }

        // Every 3 days, add a create event
        if (daysAgo % 3 === 0) {
          const createTypes = [
            { metricType: 'property_create', entityType: 'property' },
            { metricType: 'client_create',   entityType: 'client' },
            { metricType: 'owner_create',    entityType: 'owner' },
          ];
          const ct = createTypes[Math.floor(Math.random() * createTypes.length)];
          const ctDate = new Date(date.getTime() + 90 * 60 * 1000);
          metrics.push({
            id: uuidv4(),
            userId: user.id,
            metricType: ct.metricType,
            entityType: ct.entityType,
            entityId: null,
            metadata: null,
            createdAt: ctDate,
            updatedAt: ctDate,
          });
        }
      }
    }

    // Insert in batches of 100 to avoid huge single queries
    const BATCH = 100;
    for (let i = 0; i < metrics.length; i += BATCH) {
      await queryInterface.bulkInsert('agent_metrics', metrics.slice(i, i + BATCH));
    }
  },

  async down(queryInterface) {
    const agentEmails = [
      'admin@goldenkey.mt',
      'manager@goldenkey.mt',
      'agent@goldenkey.mt',
      'mario.vella@goldenkey.mt',
      'sarah.borg@goldenkey.mt',
      'james.camilleri@goldenkey.mt',
      'lisa.farrugia@goldenkey.mt',
    ];

    await queryInterface.sequelize.query(
      `DELETE FROM agent_metrics
       WHERE "userId" IN (
         SELECT id FROM users WHERE email IN (:emails)
       )`,
      { replacements: { emails: agentEmails } }
    );
  },
};
