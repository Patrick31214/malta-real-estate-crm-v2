'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('contacts', 'profileImage', { type: Sequelize.STRING, allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('contacts', 'profileImage');
  },
};
