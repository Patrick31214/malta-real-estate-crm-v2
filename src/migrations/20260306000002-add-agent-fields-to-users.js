'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');

    const addIfMissing = async (column, def) => {
      if (!tableDescription[column]) {
        await queryInterface.addColumn('users', column, def);
      }
    };

    await addIfMissing('passportImage',      { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('idCardImage',        { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('contractFile',       { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('startDate',          { type: Sequelize.DATE,   allowNull: true });
    await addIfMissing('emergencyContact',   { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('emergencyPhone',     { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('nationality',        { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('dateOfBirth',        { type: Sequelize.DATE,   allowNull: true });
    await addIfMissing('address',            { type: Sequelize.TEXT,   allowNull: true });
    await addIfMissing('eireLicenseExpiry',  { type: Sequelize.DATE,   allowNull: true });
  },

  async down(queryInterface) {
    const cols = [
      'passportImage', 'idCardImage', 'contractFile', 'startDate',
      'emergencyContact', 'emergencyPhone', 'nationality', 'dateOfBirth',
      'address', 'eireLicenseExpiry',
    ];
    for (const col of cols) {
      await queryInterface.removeColumn('users', col);
    }
  },
};
