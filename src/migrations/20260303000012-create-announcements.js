'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'important', 'urgent'),
        defaultValue: 'normal',
        allowNull: false,
      },
      targetRoles: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdById: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('announcements');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_announcements_priority";');
  },
};
