'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('properties', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM('sale', 'long_let', 'short_let', 'both'),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'listed', 'under_offer', 'sold', 'rented', 'withdrawn'),
        defaultValue: 'draft',
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'EUR',
      },
      bedrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bathrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      area: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      floor: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      totalFloors: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      yearBuilt: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      locality: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },
      features: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      heroImage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      virtualTourUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      videoUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      energyRating: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      availableFrom: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ownerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'owners', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      agentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('properties');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_listingType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_status";');
  },
};
