'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      recipientId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'recipientId',
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'senderId',
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM(
          'property_created', 'property_updated', 'property_sold', 'property_rented',
          'property_status_changed', 'property_price_changed', 'property_approved', 'property_rejected',
          'client_created', 'client_updated', 'client_assigned',
          'inquiry_created', 'inquiry_assigned', 'inquiry_status_changed',
          'agent_created', 'agent_approved', 'agent_rejected', 'agent_blocked',
          'branch_created', 'branch_updated',
          'announcement_created',
          'chat_message', 'chat_mention',
          'document_uploaded', 'document_shared',
          'system_alert', 'system_maintenance',
          'commission_update', 'performance_milestone'
        ),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'entityType',
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'entityId',
      },
      actionUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'actionUrl',
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal',
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'isRead',
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'readAt',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
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

    await queryInterface.addIndex('notifications', ['recipientId']);
    await queryInterface.addIndex('notifications', ['recipientId', 'isRead']);
    await queryInterface.addIndex('notifications', ['createdAt']);
    await queryInterface.addIndex('notifications', ['type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    // Drop enum types created by Sequelize
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_priority";');
  },
};
