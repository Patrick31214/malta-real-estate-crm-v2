'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('properties', 'acceptsChildren',       { type: Sequelize.BOOLEAN, defaultValue: true,  allowNull: true });
    await queryInterface.addColumn('properties', 'childFriendlyRequired', { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: true });
    await queryInterface.addColumn('properties', 'acceptsSharing',        { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: true });
    await queryInterface.addColumn('properties', 'acceptsShortLet',       { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: true });
    await queryInterface.addColumn('properties', 'isPetFriendly',         { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: true });
    await queryInterface.addColumn('properties', 'isNegotiable',          { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: true });
    await queryInterface.addColumn('properties', 'acceptedAgeRange',      { type: Sequelize.STRING,  allowNull: true });
    await queryInterface.addColumn('properties', 'internalNotes',         { type: Sequelize.TEXT,    allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('properties', 'acceptsChildren');
    await queryInterface.removeColumn('properties', 'childFriendlyRequired');
    await queryInterface.removeColumn('properties', 'acceptsSharing');
    await queryInterface.removeColumn('properties', 'acceptsShortLet');
    await queryInterface.removeColumn('properties', 'isPetFriendly');
    await queryInterface.removeColumn('properties', 'isNegotiable');
    await queryInterface.removeColumn('properties', 'acceptedAgeRange');
    await queryInterface.removeColumn('properties', 'internalNotes');
  },
};
