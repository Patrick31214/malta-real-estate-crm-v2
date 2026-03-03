'use strict';

module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define(
    'Property',
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
      type: {
        type: DataTypes.ENUM(
          'apartment',
          'penthouse',
          'villa',
          'house',
          'maisonette',
          'townhouse',
          'palazzo',
          'farmhouse',
          'commercial',
          'office',
          'garage',
          'land',
          'other'
        ),
        allowNull: true,
      },
      listingType: {
        type: DataTypes.ENUM('sale', 'long_let', 'short_let', 'both'),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'listed', 'under_offer', 'sold', 'rented', 'withdrawn'),
        defaultValue: 'draft',
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'EUR',
      },
      bedrooms: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bathrooms: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      area: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      floor: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      totalFloors: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      yearBuilt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      locality: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      features: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
      virtualTourUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      videoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      energyRating: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      availableFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'owners', key: 'id' },
      },
      agentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      branchId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
      },
    },
    {
      tableName: 'properties',
    }
  );

  Property.associate = (models) => {
    Property.belongsTo(models.Owner, { foreignKey: 'ownerId' });
    Property.belongsTo(models.User, { foreignKey: 'agentId', as: 'agent' });
    Property.belongsTo(models.Branch, { foreignKey: 'branchId' });
    Property.hasMany(models.Document, { foreignKey: 'propertyId' });
    Property.hasMany(models.Inquiry, { foreignKey: 'propertyId' });
  };

  return Property;
};
