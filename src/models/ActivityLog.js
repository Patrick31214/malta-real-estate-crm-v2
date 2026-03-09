'use strict';

const VALID_ACTIONS = [
  'create', 'update', 'delete', 'view', 'login', 'logout',
  'export', 'import', 'approve', 'reject', 'assign', 'status_change',
  'upload', 'download', 'share', 'comment',
];

const VALID_SEVERITIES = ['info', 'warning', 'critical'];

module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      action: {
        type: DataTypes.ENUM(...VALID_ACTIONS),
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
      entityName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      severity: {
        type: DataTypes.ENUM(...VALID_SEVERITIES),
        allowNull: false,
        defaultValue: 'info',
      },
    },
    {
      tableName: 'activity_logs',
      updatedAt: false,
    }
  );

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ActivityLog;
};
