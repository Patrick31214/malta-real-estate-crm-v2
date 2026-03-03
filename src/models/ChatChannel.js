'use strict';

module.exports = (sequelize, DataTypes) => {
  const ChatChannel = sequelize.define(
    'ChatChannel',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('rentals', 'sales', 'managers', 'staff', 'general', 'custom'),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'chat_channels',
    }
  );

  ChatChannel.associate = (models) => {
    ChatChannel.hasMany(models.ChatMessage, { foreignKey: 'channelId' });
  };

  return ChatChannel;
};
