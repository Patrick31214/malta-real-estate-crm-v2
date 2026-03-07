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
        comment: 'login|logout|session_duration|client_view|client_create|client_update|client_delete|owner_view|owner_create|owner_update|owner_delete|property_view|property_create|property_update|property_delete|property_feature|inquiry_view|inquiry_assign|inquiry_resolve|document_upload|document_view|page_view',
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
    },
    {
      tableName: 'agent_metrics',
      updatedAt: false,
      indexes: [
        { fields: ['userId'] },
        { fields: ['metricType'] },
        { fields: ['createdAt'] },
        { fields: ['userId', 'metricType'] },
      ],
    }
  );

  AgentMetric.associate = (models) => {
    AgentMetric.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return AgentMetric;
};
