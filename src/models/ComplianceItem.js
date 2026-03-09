'use strict';

module.exports = (sequelize, DataTypes) => {
  const ComplianceItem = sequelize.define(
    'ComplianceItem',
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          'aml_kyc',
          'property_documentation',
          'licensing',
          'insurance',
          'tax_compliance',
          'data_protection',
          'health_safety',
          'other'
        ),
        allowNull: false,
        defaultValue: 'other',
      },
      priority: {
        type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'overdue', 'not_applicable'),
        allowNull: false,
        defaultValue: 'pending',
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      completedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      completedById: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      assignedToId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attachments: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      recurringInterval: {
        type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
        allowNull: true,
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    },
    {
      tableName: 'compliance_items',
    }
  );

  ComplianceItem.associate = (models) => {
    ComplianceItem.belongsTo(models.User, { as: 'createdBy',   foreignKey: 'createdById' });
    ComplianceItem.belongsTo(models.User, { as: 'assignedTo',  foreignKey: 'assignedToId' });
    ComplianceItem.belongsTo(models.User, { as: 'completedBy', foreignKey: 'completedById' });
    ComplianceItem.belongsTo(models.Property, { as: 'property', foreignKey: 'propertyId' });
    ComplianceItem.belongsTo(models.Client,   { as: 'client',   foreignKey: 'clientId' });
  };

  return ComplianceItem;
};
