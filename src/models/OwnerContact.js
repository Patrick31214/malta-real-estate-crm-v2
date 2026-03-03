'use strict';

module.exports = (sequelize, DataTypes) => {
  const OwnerContact = sequelize.define(
    'OwnerContact',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      relationship: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      alternatePhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isEmergency: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'owner_contacts',
    }
  );

  OwnerContact.associate = (models) => {
    OwnerContact.belongsTo(models.Owner, { foreignKey: 'ownerId' });
  };

  return OwnerContact;
};
