'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_activity_logs_action" ADD VALUE IF NOT EXISTS 'permissions_updated';`
    );
  },

  async down() {
    // PostgreSQL does not support removing values from an ENUM type.
    // This migration cannot be rolled back automatically.
  },
};
