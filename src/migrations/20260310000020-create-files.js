'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_files_category" AS ENUM (
        'property', 'client', 'legal', 'financial', 'marketing', 'internal', 'other'
      )
    `);

    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mimeType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM(
          'property', 'client', 'legal', 'financial', 'marketing', 'internal', 'other'
        ),
        allowNull: true,
        defaultValue: 'other',
      },
      folderId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'files', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      isFolder: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      uploadedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: '{}',
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('files', ['uploadedBy']);
    await queryInterface.addIndex('files', ['folderId']);
    await queryInterface.addIndex('files', ['category']);
    await queryInterface.addIndex('files', ['isArchived']);
    await queryInterface.addIndex('files', ['propertyId']);
    await queryInterface.addIndex('files', ['clientId']);
    await queryInterface.addIndex('files', ['isFolder']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('files');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_files_category" CASCADE');
  },
};
