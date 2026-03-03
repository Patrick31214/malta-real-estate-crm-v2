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
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'chat_messages',
    }
  );

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.ChatChannel, { foreignKey: 'channelId' });
    ChatMessage.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return ChatMessage;
};
