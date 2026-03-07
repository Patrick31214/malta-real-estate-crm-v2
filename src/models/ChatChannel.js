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
        type: DataTypes.ENUM('direct', 'role_group', 'branch', 'property_updates', 'general'),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      participantIds: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      allowedRoles: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      branchId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'chat_channels',
    }
  );

  ChatChannel.associate = (models) => {
    ChatChannel.hasMany(models.ChatMessage, { foreignKey: 'channelId' });
    ChatChannel.belongsTo(models.User, { as: 'createdBy', foreignKey: 'createdById' });
  };

  return ChatChannel;
};
