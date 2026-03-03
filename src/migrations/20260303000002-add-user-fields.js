'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'branchId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'profileImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'specializations', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'languages', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'licenseNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'commissionRate', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'isBlocked', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('users', 'blockedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'blockedReason', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'branchId');
    await queryInterface.removeColumn('users', 'bio');
    await queryInterface.removeColumn('users', 'profileImage');
    await queryInterface.removeColumn('users', 'specializations');
    await queryInterface.removeColumn('users', 'languages');
    await queryInterface.removeColumn('users', 'licenseNumber');
    await queryInterface.removeColumn('users', 'commissionRate');
    await queryInterface.removeColumn('users', 'isBlocked');
    await queryInterface.removeColumn('users', 'blockedAt');
    await queryInterface.removeColumn('users', 'blockedReason');
  },
};
