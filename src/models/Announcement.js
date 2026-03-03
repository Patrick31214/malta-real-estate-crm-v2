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
      targetRoles: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
