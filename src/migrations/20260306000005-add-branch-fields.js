'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('branches', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('branches', 'locality', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('branches', 'country', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'Malta',
    });
    await queryInterface.addColumn('branches', 'latitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('branches', 'longitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('branches', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('branches', 'logo', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('branches', 'coverImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('branches', 'managerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('branches', 'managerId');
    await queryInterface.removeColumn('branches', 'coverImage');
    await queryInterface.removeColumn('branches', 'logo');
    await queryInterface.removeColumn('branches', 'description');
    await queryInterface.removeColumn('branches', 'longitude');
    await queryInterface.removeColumn('branches', 'latitude');
    await queryInterface.removeColumn('branches', 'country');
    await queryInterface.removeColumn('branches', 'locality');
    await queryInterface.removeColumn('branches', 'city');
  },
};
