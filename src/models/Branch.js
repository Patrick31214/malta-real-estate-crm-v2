'use strict';

module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define(
    'Branch',
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
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'branches',
    }
  );

  Branch.associate = (models) => {
    Branch.hasMany(models.User, { foreignKey: 'branchId', as: 'agents' });
    Branch.hasMany(models.Property, { foreignKey: 'branchId' });
  };

  return Branch;
};
