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
      category: {
        type: DataTypes.ENUM('legal', 'financial', 'maintenance', 'insurance', 'moving', 'renovation', 'consulting', 'other'),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerWebsite: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      priceCurrency: {
        type: DataTypes.STRING(3),
        defaultValue: 'EUR',
      },
      priceType: {
        type: DataTypes.ENUM('fixed', 'hourly', 'percentage', 'negotiable', 'free'),
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
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'services',
    }
  );

  Service.associate = (models) => {
    Service.belongsTo(models.User, { as: 'createdBy', foreignKey: 'createdById' });
  };

  return Service;
};
