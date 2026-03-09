'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('activity_logs').catch((err) => {
      // Only suppress "table does not exist" errors — base migration handles creation
      if (err.message && (err.message.includes('does not exist') || err.message.includes('No such table'))) {
        return null;
      }
      console.warn('[activity-logs migration] describeTable warning:', err.message);
      return null;
    });
    if (!tableDesc) return; // table doesn't exist yet — base migration will handle it

    // Add entityName if missing
    if (!tableDesc.entityName) {
      await queryInterface.addColumn('activity_logs', 'entityName', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add userAgent if missing
    if (!tableDesc.userAgent) {
      await queryInterface.addColumn('activity_logs', 'userAgent', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    // Add severity if missing
    if (!tableDesc.severity) {
      // Create the enum type first
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
          CREATE TYPE "enum_activity_logs_severity" AS ENUM ('info', 'warning', 'critical');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;`
      );
      await queryInterface.addColumn('activity_logs', 'severity', {
        type: Sequelize.ENUM('info', 'warning', 'critical'),
        allowNull: false,
        defaultValue: 'info',
      });
    }

    // Upgrade action column from STRING to ENUM if it's not already an ENUM
    const actionColType = tableDesc.action && tableDesc.action.type;
    if (actionColType && !actionColType.includes('enum')) {
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
          CREATE TYPE "enum_activity_logs_action" AS ENUM (
            'create', 'update', 'delete', 'view', 'login', 'logout',
            'export', 'import', 'approve', 'reject', 'assign', 'status_change',
            'upload', 'download', 'share', 'comment'
          );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;`
      );
      // Cast existing values via USING — unknown values default to 'create'
      await queryInterface.sequelize.query(
        `ALTER TABLE "activity_logs"
         ALTER COLUMN "action" TYPE "enum_activity_logs_action"
         USING (
           CASE WHEN "action" IN (
             'create','update','delete','view','login','logout',
             'export','import','approve','reject','assign','status_change',
             'upload','download','share','comment'
           ) THEN "action"::"enum_activity_logs_action"
           ELSE 'create'::"enum_activity_logs_action"
           END
         );`
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('activity_logs', 'entityName').catch(() => {});
    await queryInterface.removeColumn('activity_logs', 'userAgent').catch(() => {});
    await queryInterface.removeColumn('activity_logs', 'severity').catch(() => {});
  },
};
