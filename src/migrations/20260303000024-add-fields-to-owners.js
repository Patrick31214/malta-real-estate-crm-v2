'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('owners', 'referenceNumber', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('owners', 'nationality', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('owners', 'preferredLanguage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('owners', 'dateOfBirth', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('owners', 'companyName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('owners', 'taxId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    // Make lastName optional
    await queryInterface.changeColumn('owners', 'lastName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('owners', 'referenceNumber');
    await queryInterface.removeColumn('owners', 'nationality');
    await queryInterface.removeColumn('owners', 'preferredLanguage');
    await queryInterface.removeColumn('owners', 'dateOfBirth');
    await queryInterface.removeColumn('owners', 'companyName');
    await queryInterface.removeColumn('owners', 'taxId');
    await queryInterface.changeColumn('owners', 'lastName', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
