'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Default permissions granted to newly created agents.
 * These allow an agent to use the CRM immediately after account creation.
 */
const AGENT_DEFAULT_PERMISSIONS = [
  'dashboard_view',
  'properties_view',
  'clients_view',
  'owners_view',
  'contacts_view',
  'inquiries_view_own',
  'calendar_view',
  'chat_view',
  'chat_direct_message',
  'chat_group_channels',
  'notifications_view',
  'announcements_view',
  'documents_view',
  'services_view',
  'financial_own_commission',
];

/**
 * Additional permissions granted to managers on top of the agent defaults.
 */
const MANAGER_EXTRA_PERMISSIONS = [
  'inquiries_view_all',
  'inquiries_assign',
  'agents_view',
  'agents_performance',
  'branches_view',
  'reports_generate',
  'reports_analytics_dashboard',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Fetch all active (approved) agents and managers
    const users = await queryInterface.sequelize.query(
      `SELECT id, role FROM users WHERE role IN ('agent', 'manager') AND "approvalStatus" = 'approved'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) return;

    const rows = [];
    for (const user of users) {
      const keys = user.role === 'manager'
        ? [...AGENT_DEFAULT_PERMISSIONS, ...MANAGER_EXTRA_PERMISSIONS]
        : AGENT_DEFAULT_PERMISSIONS;

      for (const feature of keys) {
        rows.push({
          id: uuidv4(),
          userId: user.id,
          feature,
          isEnabled: true,
          grantedById: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (rows.length === 0) return;

    // Insert with ON CONFLICT DO NOTHING so this migration is safe to re-run
    await queryInterface.sequelize.query(
      `INSERT INTO user_permissions (id, "userId", feature, "isEnabled", "grantedById", "createdAt", "updatedAt")
       VALUES ${rows.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}
       ON CONFLICT ("userId", feature) DO NOTHING`,
      {
        replacements: rows.flatMap(r => [
          r.id, r.userId, r.feature, r.isEnabled, r.grantedById, r.createdAt, r.updatedAt,
        ]),
        type: queryInterface.sequelize.QueryTypes.INSERT,
      }
    );
  },

  async down(queryInterface) {
    const allPermissions = [...AGENT_DEFAULT_PERMISSIONS, ...MANAGER_EXTRA_PERMISSIONS];
    await queryInterface.sequelize.query(
      `DELETE FROM user_permissions
       WHERE "userId" IN (
         SELECT id FROM users WHERE role IN ('agent', 'manager')
       )
       AND feature IN (${allPermissions.map(() => '?').join(', ')})
       AND "grantedById" IS NULL`,
      {
        replacements: allPermissions,
        type: queryInterface.sequelize.QueryTypes.DELETE,
      }
    );
  },
};
