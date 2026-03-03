'use strict';

module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define(
    'Service',
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM('boat', 'car_rental', 'motorcycle_rental', 'tour', 'transfer', 'other'),
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'EUR',
      },
      duration: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      heroImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'services',
    }
  );

  return Service;
};
