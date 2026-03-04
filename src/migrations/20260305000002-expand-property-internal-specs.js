'use strict';

const columnExists = async (queryInterface, table, column) => {
  const tableDescription = await queryInterface.describeTable(table);
  return Object.prototype.hasOwnProperty.call(tableDescription, column);
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (!(await columnExists(queryInterface, 'properties', 'petPolicy'))) {
      await queryInterface.addColumn('properties', 'petPolicy', { type: Sequelize.JSONB, allowNull: true });
    }
    if (!(await columnExists(queryInterface, 'properties', 'tenantPolicy'))) {
      await queryInterface.addColumn('properties', 'tenantPolicy', { type: Sequelize.JSONB, allowNull: true });
    }
    if (!(await columnExists(queryInterface, 'properties', 'nationalityPolicy'))) {
      await queryInterface.addColumn('properties', 'nationalityPolicy', { type: Sequelize.JSONB, allowNull: true });
    }
    if (!(await columnExists(queryInterface, 'properties', 'contractTerms'))) {
      await queryInterface.addColumn('properties', 'contractTerms', { type: Sequelize.JSONB, allowNull: true });
    }
  },
  down: async (queryInterface) => {
    if (await columnExists(queryInterface, 'properties', 'petPolicy')) {
      await queryInterface.removeColumn('properties', 'petPolicy');
    }
    if (await columnExists(queryInterface, 'properties', 'tenantPolicy')) {
      await queryInterface.removeColumn('properties', 'tenantPolicy');
    }
    if (await columnExists(queryInterface, 'properties', 'nationalityPolicy')) {
      await queryInterface.removeColumn('properties', 'nationalityPolicy');
    }
    if (await columnExists(queryInterface, 'properties', 'contractTerms')) {
      await queryInterface.removeColumn('properties', 'contractTerms');
    }
  },
};
