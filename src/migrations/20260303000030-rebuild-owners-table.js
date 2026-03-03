'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop dependent tables first (catch errors if tables don't exist yet)
    await queryInterface.dropTable('owner_contacts', { cascade: true }).catch(() => {});
    await queryInterface.dropTable('owners', { cascade: true }).catch(() => {});

    // Recreate owners with ALL columns
    await queryInterface.createTable('owners', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      referenceNumber: { type: Sequelize.STRING, allowNull: true, unique: true },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: false },
      alternatePhone: { type: Sequelize.STRING, allowNull: true },
      idNumber: { type: Sequelize.STRING, allowNull: true },
      nationality: { type: Sequelize.STRING, allowNull: true },
      preferredLanguage: { type: Sequelize.STRING, allowNull: true },
      dateOfBirth: { type: Sequelize.DATEONLY, allowNull: true },
      companyName: { type: Sequelize.STRING, allowNull: true },
      taxId: { type: Sequelize.STRING, allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      profileImage: { type: Sequelize.STRING, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Recreate owner_contacts
    await queryInterface.createTable('owner_contacts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      ownerId: { type: Sequelize.UUID, allowNull: false, references: { model: 'owners', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      relationship: { type: Sequelize.STRING, allowNull: false },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      alternatePhone: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.STRING, allowNull: true },
      isEmergency: { type: Sequelize.BOOLEAN, defaultValue: false },
      isPrimary: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('owner_contacts').catch(() => {});
    await queryInterface.dropTable('owners').catch(() => {});
  },
};
