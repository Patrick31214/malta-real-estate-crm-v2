'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('client_matches', {
      fields: ['clientId', 'propertyId'],
      type: 'unique',
      name: 'client_matches_clientId_propertyId_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('client_matches', 'client_matches_clientId_propertyId_unique');
  },
};
