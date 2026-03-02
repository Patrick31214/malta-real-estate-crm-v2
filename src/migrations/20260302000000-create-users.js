'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'firstName',
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'lastName',
      },
      role: {
        type: Sequelize.ENUM('admin', 'manager', 'agent', 'client'),
        allowNull: false,
        defaultValue: 'client',
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'isActive',
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'lastLoginAt',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'createdAt',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updatedAt',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};
