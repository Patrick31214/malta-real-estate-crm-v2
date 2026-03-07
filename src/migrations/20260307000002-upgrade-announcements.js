'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('announcements');

    // Add 'type' column
    if (!table.type) {
      await queryInterface.addColumn('announcements', 'type', {
        type: Sequelize.ENUM('general', 'policy', 'maintenance', 'property_update', 'achievement', 'event'),
        defaultValue: 'general',
        allowNull: false,
      });
    }

    // Add 'targetType' column
    if (!table.targetType) {
      await queryInterface.addColumn('announcements', 'targetType', {
        type: Sequelize.ENUM('all', 'roles', 'branches', 'users'),
        defaultValue: 'all',
        allowNull: false,
      });
    }

    // Replace targetRoles ARRAY with JSONB (safe: add new JSONB column, migrate data, drop old)
    if (table.targetRoles) {
      const colType = (table.targetRoles.type || '').toUpperCase();
      const isArrayType = colType.startsWith('ARRAY') || colType.includes('[]') || colType.startsWith('_');
      if (isArrayType) {
        await queryInterface.addColumn('announcements', 'targetRolesJson', {
          type: Sequelize.JSONB,
          allowNull: true,
        });
        await queryInterface.sequelize.query(`
          UPDATE announcements SET "targetRolesJson" = to_jsonb("targetRoles")
          WHERE "targetRoles" IS NOT NULL
        `);
        await queryInterface.removeColumn('announcements', 'targetRoles');
        await queryInterface.renameColumn('announcements', 'targetRolesJson', 'targetRoles');
      }
      // If already JSONB, nothing to do
    } else {
      await queryInterface.addColumn('announcements', 'targetRoles', {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }

    // Add 'targetBranchIds' column
    if (!table.targetBranchIds) {
      await queryInterface.addColumn('announcements', 'targetBranchIds', {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }

    // Add 'targetUserIds' column
    if (!table.targetUserIds) {
      await queryInterface.addColumn('announcements', 'targetUserIds', {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }

    // Add 'startsAt' column
    if (!table.startsAt) {
      await queryInterface.addColumn('announcements', 'startsAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
      // Backfill startsAt from publishedAt
      await queryInterface.sequelize.query(`
        UPDATE announcements SET "startsAt" = "publishedAt" WHERE "publishedAt" IS NOT NULL AND "startsAt" IS NULL
      `);
    }

    // Add 'isPinned' column
    if (!table.isPinned) {
      await queryInterface.addColumn('announcements', 'isPinned', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }

    // Add 'readByUserIds' column
    if (!table.readByUserIds) {
      await queryInterface.addColumn('announcements', 'readByUserIds', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('announcements');

    if (table.readByUserIds) await queryInterface.removeColumn('announcements', 'readByUserIds');
    if (table.isPinned) await queryInterface.removeColumn('announcements', 'isPinned');
    if (table.startsAt) await queryInterface.removeColumn('announcements', 'startsAt');
    if (table.targetUserIds) await queryInterface.removeColumn('announcements', 'targetUserIds');
    if (table.targetBranchIds) await queryInterface.removeColumn('announcements', 'targetBranchIds');
    if (table.targetType) {
      await queryInterface.removeColumn('announcements', 'targetType');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_announcements_targetType";');
    }
    if (table.type) {
      await queryInterface.removeColumn('announcements', 'type');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_announcements_type";');
    }
  },
};
