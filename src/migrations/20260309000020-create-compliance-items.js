'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUMs first
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_compliance_items_category" AS ENUM (
        'aml_kyc', 'property_documentation', 'licensing', 'insurance',
        'tax_compliance', 'data_protection', 'health_safety', 'other'
      )
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_compliance_items_priority" AS ENUM (
        'critical', 'high', 'medium', 'low'
      )
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_compliance_items_status" AS ENUM (
        'pending', 'in_progress', 'completed', 'overdue', 'not_applicable'
      )
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_compliance_items_recurringInterval" AS ENUM (
        'monthly', 'quarterly', 'annually'
      )
    `);

    await queryInterface.createTable('compliance_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM(
          'aml_kyc', 'property_documentation', 'licensing', 'insurance',
          'tax_compliance', 'data_protection', 'health_safety', 'other'
        ),
        allowNull: false,
        defaultValue: 'other',
      },
      priority: {
        type: Sequelize.ENUM('critical', 'high', 'medium', 'low'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'overdue', 'not_applicable'),
        allowNull: false,
        defaultValue: 'pending',
      },
      dueDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      completedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      completedById: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      assignedToId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: '[]',
      },
      isRecurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      recurringInterval: {
        type: Sequelize.ENUM('monthly', 'quarterly', 'annually'),
        allowNull: true,
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
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Indexes
    await queryInterface.addIndex('compliance_items', ['status']);
    await queryInterface.addIndex('compliance_items', ['category']);
    await queryInterface.addIndex('compliance_items', ['priority']);
    await queryInterface.addIndex('compliance_items', ['assignedToId']);
    await queryInterface.addIndex('compliance_items', ['propertyId']);
    await queryInterface.addIndex('compliance_items', ['clientId']);
    await queryInterface.addIndex('compliance_items', ['dueDate']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('compliance_items');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_compliance_items_category" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_compliance_items_priority" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_compliance_items_status" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_compliance_items_recurringInterval" CASCADE');
  },
};
