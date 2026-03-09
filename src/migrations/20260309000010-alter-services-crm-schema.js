'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Remove old columns that are no longer needed
    const tableDesc = await queryInterface.describeTable('services');
    const colsToDrop = ['duration', 'images', 'heroImage', 'contactPhone', 'contactEmail', 'currency'];
    for (const col of colsToDrop) {
      if (tableDesc[col]) {
        await queryInterface.removeColumn('services', col);
      }
    }

    // 2. Add new columns
    const newCols = {
      provider: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      providerEmail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      providerPhone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      providerWebsite: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      priceCurrency: {
        type: Sequelize.STRING(3),
        defaultValue: 'EUR',
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdById: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    };

    for (const [colName, colDef] of Object.entries(newCols)) {
      if (!tableDesc[colName]) {
        await queryInterface.addColumn('services', colName, colDef);
      }
    }

    // 3. Change category enum: replace old values with new CRM-focused categories
    await queryInterface.sequelize.query(`
      ALTER TABLE services
        ALTER COLUMN category TYPE VARCHAR(50)
    `);
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_services_category" CASCADE');
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_services_category" AS ENUM (
        'legal', 'financial', 'maintenance', 'insurance',
        'moving', 'renovation', 'consulting', 'other'
      )
    `);
    await queryInterface.sequelize.query(`
      UPDATE services SET category = 'other'
      WHERE category NOT IN ('legal','financial','maintenance','insurance','moving','renovation','consulting','other')
         OR category IS NULL
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE services
        ALTER COLUMN category TYPE "enum_services_category" USING category::"enum_services_category"
    `);

    // 4. Add priceType enum column if not present
    if (!tableDesc.priceType) {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_services_priceType" AS ENUM (
          'fixed', 'hourly', 'percentage', 'negotiable', 'free'
        )
      `);
      await queryInterface.addColumn('services', 'priceType', {
        type: Sequelize.ENUM('fixed', 'hourly', 'percentage', 'negotiable', 'free'),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('services');

    // Restore old columns
    const oldCols = {
      duration: { type: Sequelize.STRING, allowNull: true },
      images: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      heroImage: { type: Sequelize.STRING, allowNull: true },
      contactPhone: { type: Sequelize.STRING, allowNull: true },
      contactEmail: { type: Sequelize.STRING, allowNull: true },
      currency: { type: Sequelize.STRING(3), defaultValue: 'EUR', allowNull: true },
    };
    for (const [colName, colDef] of Object.entries(oldCols)) {
      if (!tableDesc[colName]) {
        await queryInterface.addColumn('services', colName, colDef);
      }
    }

    // Remove new columns
    const newCols = ['provider', 'providerEmail', 'providerPhone', 'providerWebsite', 'priceCurrency', 'notes', 'image', 'createdById', 'priceType'];
    for (const col of newCols) {
      if (tableDesc[col]) {
        await queryInterface.removeColumn('services', col);
      }
    }

    // Restore old category enum
    await queryInterface.sequelize.query(`ALTER TABLE services ALTER COLUMN category TYPE VARCHAR(50)`);
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_services_category" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_services_priceType" CASCADE');
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_services_category" AS ENUM ('boat','car_rental','motorcycle_rental','tour','transfer','other')
    `);
    await queryInterface.sequelize.query(`
      UPDATE services SET category = 'other'
      WHERE category NOT IN ('boat','car_rental','motorcycle_rental','tour','transfer','other')
         OR category IS NULL
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE services
        ALTER COLUMN category TYPE "enum_services_category" USING category::"enum_services_category"
    `);
  },
};
