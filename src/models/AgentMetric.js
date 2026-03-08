'use strict';

module.exports = (sequelize, DataTypes) => {
  const AgentMetric = sequelize.define(
    'AgentMetric',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      metricType: {
        type: DataTypes.STRING,
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
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sessionId: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pageUrl: {
        type: DataTypes.STRING(2048),
        allowNull: true,
      },
    },
    {
      tableName: 'agent_metrics',
      updatedAt: false,
      indexes: [
        { fields: ['userId'] },
        { fields: ['metricType'] },
        { fields: ['createdAt'] },
        { fields: ['userId', 'metricType'] },
        { fields: ['sessionId'] },
        { fields: ['pageUrl'] },
      ],
    }
  );

  AgentMetric.associate = (models) => {
    AgentMetric.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return AgentMetric;
};
