'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('properties', 'droneImages',   { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true });
    await queryInterface.addColumn('properties', 'droneVideoUrl', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('properties', 'threeDViewUrl', { type: Sequelize.STRING, allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('properties', 'droneImages');
    await queryInterface.removeColumn('properties', 'droneVideoUrl');
    await queryInterface.removeColumn('properties', 'threeDViewUrl');
  },
};
