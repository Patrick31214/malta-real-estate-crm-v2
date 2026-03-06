'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');

    const addIfMissing = async (column, def) => {
      if (!tableDescription[column]) {
        await queryInterface.addColumn('users', column, def);
      }
    };

    await addIfMissing('approvalStatus', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'approved',
    });
    await addIfMissing('approvedBy', { type: Sequelize.UUID, allowNull: true });
    await addIfMissing('approvedAt', { type: Sequelize.DATE, allowNull: true });
    await addIfMissing('jobTitle',   { type: Sequelize.STRING, allowNull: true });
  },

  async down(queryInterface) {
    const cols = ['approvalStatus', 'approvedBy', 'approvedAt', 'jobTitle'];
    for (const col of cols) {
      await queryInterface.removeColumn('users', col);
    }
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_users_approvalStatus;"
    );
  },
};
