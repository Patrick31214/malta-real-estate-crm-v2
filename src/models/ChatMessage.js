'use strict';

module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define(
    'ChatMessage',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      channelId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'chat_channels', key: 'id' },
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('text', 'system', 'property_update'),
        defaultValue: 'text',
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      isRead: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      tableName: 'chat_messages',
    }
  );

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.ChatChannel, { foreignKey: 'channelId' });
    ChatMessage.belongsTo(models.User, { as: 'sender', foreignKey: 'senderId' });
  };

  return ChatMessage;
};
