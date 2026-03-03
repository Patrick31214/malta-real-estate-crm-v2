'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('clients');
    const cols = ['acceptsChildren','childFriendlyRequired','acceptsSharing','acceptsShortLet','isPetFriendly','isNegotiable','acceptedAgeRange'];
    for (const col of cols) {
      if (tableDesc[col]) await queryInterface.removeColumn('clients', col);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('clients', 'acceptsChildren',       { type: Sequelize.BOOLEAN, allowNull: true });
    await queryInterface.addColumn('clients', 'childFriendlyRequired', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('clients', 'acceptsSharing',        { type: Sequelize.BOOLEAN, allowNull: true });
    await queryInterface.addColumn('clients', 'acceptsShortLet',       { type: Sequelize.BOOLEAN, allowNull: true });
    await queryInterface.addColumn('clients', 'isPetFriendly',         { type: Sequelize.BOOLEAN, allowNull: true });
    await queryInterface.addColumn('clients', 'isNegotiable',          { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('clients', 'acceptedAgeRange',      { type: Sequelize.JSONB,   allowNull: true });
  },
};
