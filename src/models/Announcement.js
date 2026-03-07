'use strict';

module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define(
    'Announcement',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'important', 'urgent'),
        defaultValue: 'normal',
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('general', 'policy', 'maintenance', 'property_update', 'achievement', 'event'),
        defaultValue: 'general',
        allowNull: false,
      },
      // Targeting
      targetType: {
        type: DataTypes.ENUM('all', 'roles', 'branches', 'users'),
        defaultValue: 'all',
        allowNull: false,
      },
      targetRoles: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      targetBranchIds: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      targetUserIds: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Scheduling
      startsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Legacy field — kept for backward compatibility
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Meta
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      readByUserIds: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    },
    {
      tableName: 'announcements',
    }
  );

  Announcement.associate = (models) => {
    Announcement.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' });
  };

  return Announcement;
};
