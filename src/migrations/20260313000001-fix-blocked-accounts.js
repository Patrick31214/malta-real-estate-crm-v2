'use strict';

/**
 * Fix inconsistent account states.
 *
 * Accounts where approvalStatus = 'approved' but isActive = false or
 * isBlocked = true are impossible to log in to. This migration repairs
 * those rows so that every approved account is active and not blocked.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE users
      SET    "isActive"  = true,
             "isBlocked" = false,
             "updatedAt" = NOW()
      WHERE  "approvalStatus" = 'approved'
        AND  ("isActive" = false OR "isBlocked" = true)
    `);
  },

  async down(queryInterface) {
    // This migration fixes data-integrity issues; reverting it would
    // re-introduce the broken state, so the down() is intentionally a no-op.
  },
};
