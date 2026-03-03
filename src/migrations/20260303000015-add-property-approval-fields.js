'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('properties', 'approvalStatus', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'not_required'),
      defaultValue: 'not_required',
      allowNull: false,
    });
    await queryInterface.addColumn('properties', 'approvalNotes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'approvedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('properties', 'approvedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'isPublishedToWebsite', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('properties', 'approvalStatus');
    await queryInterface.removeColumn('properties', 'approvalNotes');
    await queryInterface.removeColumn('properties', 'approvedBy');
    await queryInterface.removeColumn('properties', 'approvedAt');
    await queryInterface.removeColumn('properties', 'isPublishedToWebsite');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_approvalStatus";');
  },
};
