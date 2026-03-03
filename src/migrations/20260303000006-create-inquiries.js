'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inquiries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('property', 'work_with_us', 'affiliate', 'general', 'viewing', 'valuation'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'new',
          'open',
          'assigned',
          'in_progress',
          'viewing_scheduled',
          'resolved',
          'closed',
          'spam'
        ),
        defaultValue: 'new',
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
        allowNull: false,
      },
      source: {
        type: Sequelize.ENUM(
          'website',
          'phone',
          'email',
          'whatsapp',
          'walk_in',
          'referral',
          'social_media',
          'other'
        ),
        allowNull: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
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
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assignmentDeadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      closedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      questionnaire: {
        type: Sequelize.JSONB,
        allowNull: true,
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
    await queryInterface.dropTable('inquiries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inquiries_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inquiries_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inquiries_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inquiries_source";');
  },
};
