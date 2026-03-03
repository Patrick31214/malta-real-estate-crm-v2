'use strict';

module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'activity_logs',
      updatedAt: false,
    }
  );

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return ActivityLog;
};
