'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('properties');
    if (!tableDesc.referenceNumber) {
      await queryInterface.addColumn('properties', 'referenceNumber', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('properties');
    if (tableDesc.referenceNumber) {
      await queryInterface.removeColumn('properties', 'referenceNumber');
    }
  },
};
