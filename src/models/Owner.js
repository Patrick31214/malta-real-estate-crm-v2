'use strict';

module.exports = (sequelize, DataTypes) => {
  const Owner = sequelize.define(
    'Owner',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alternatePhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      idNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'owners',
    }
  );

  Owner.associate = (models) => {
    Owner.hasMany(models.Property, { foreignKey: 'ownerId' });
    Owner.hasMany(models.Document, { foreignKey: 'ownerId' });
  };

  return Owner;
};
