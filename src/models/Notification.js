'use strict';

const { Model } = require('sequelize');

const NOTIFICATION_TYPES = [
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
  'commission_update', 'performance_milestone',
];

const PRIORITY_LEVELS = ['low', 'normal', 'high', 'urgent'];

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, { as: 'recipient', foreignKey: 'recipientId' });
      Notification.belongsTo(models.User, { as: 'sender',    foreignKey: 'senderId' });
    }
  }

  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      recipientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      type: {
        type: DataTypes.ENUM(...NOTIFICATION_TYPES),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      actionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM(...PRIORITY_LEVELS),
        allowNull: false,
        defaultValue: 'normal',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      timestamps: true,
    }
  );

  return Notification;
};
