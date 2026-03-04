'use strict';

const path = require('path');
const fs = require('fs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { Owner, Property } = require('../models');
    const sequelize = Property.sequelize;

    // --- Load prepared properties JSON ---
    const jsonPath = path.resolve(__dirname, '..', '..', 'data', 'prepared-properties.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`prepared-properties.json not found at ${jsonPath}`);
    }
    const properties = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded ${properties.length} prepared properties.`);

    // --- Build phone → owner id lookup ---
    console.log('Building owner phone → id lookup...');
    const owners = await Owner.findAll({ attributes: ['id', 'phone', 'alternatePhone'] });
    const phoneToOwnerId = new Map();
    for (const o of owners) {
      if (o.phone) phoneToOwnerId.set(o.phone.trim(), o.id);
      if (o.alternatePhone) phoneToOwnerId.set(o.alternatePhone.trim(), o.id);
    }
    console.log(`Lookup built for ${phoneToOwnerId.size} phone entries.`);

    // --- Validate and build property records ---
    const now = new Date();
    const propertyRecords = [];
    let skipped = 0;

    for (const prop of properties) {
      const ownerId = phoneToOwnerId.get((prop.ownerPhone || '').trim());
      if (!ownerId) {
        console.warn(`No owner found for phone "${prop.ownerPhone}" (ref: ${prop.csvReferenceNumber}) — skipping.`);
        skipped++;
        continue;
      }

      if (!prop.price && prop.price !== 0) {
        console.warn(`Property ${prop.csvReferenceNumber} has no price — skipping.`);
        skipped++;
        continue;
      }

      if (!prop.locality) {
        console.warn(`Property ${prop.csvReferenceNumber} has no locality — skipping.`);
        skipped++;
        continue;
      }

      propertyRecords.push({
        title: prop.title || `Property - ${prop.csvReferenceNumber}`,
        type: prop.type || 'other',
        listingType: prop.listingType || 'long_let',
        status: prop.status || 'draft',
        price: prop.price,
        currency: prop.currency || 'EUR',
        bedrooms: prop.bedrooms !== undefined ? prop.bedrooms : null,
        bathrooms: prop.bathrooms !== undefined ? prop.bathrooms : null,
        locality: prop.locality,
        address: prop.address || null,
        features: Array.isArray(prop.features) && prop.features.length > 0 ? prop.features : null,
        isPetFriendly: prop.isPetFriendly || false,
        ownerId,
        internalNotes: `CSV ref: ${prop.csvReferenceNumber}`,
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(`Prepared ${propertyRecords.length} property records (${skipped} skipped).`);

    // --- Insert in batches of 20 ---
    const BATCH_SIZE = 20;
    const batches = [];
    for (let i = 0; i < propertyRecords.length; i += BATCH_SIZE) {
      batches.push(propertyRecords.slice(i, i + BATCH_SIZE));
    }

    let totalInserted = 0;
    let totalFailed = 0;

    for (let b = 0; b < batches.length; b++) {
      console.log(`Inserting property batch ${b + 1} of ${batches.length}...`);
      const batch = batches[b];

      const t = await sequelize.transaction();
      try {
        await Property.bulkCreate(batch, {
          transaction: t,
          validate: true,
        });
        await t.commit();
        totalInserted += batch.length;
      } catch (err) {
        await t.rollback();
        console.error(`Property batch ${b + 1} failed (${err.message}). Falling back to individual inserts...`);

        for (const record of batch) {
          const t2 = await sequelize.transaction();
          try {
            await Property.create(record, { transaction: t2 });
            await t2.commit();
            totalInserted++;
          } catch (e2) {
            await t2.rollback();
            console.warn(`Skipped property "${record.title}" (owner ${record.ownerId}): ${e2.message}`);
            totalFailed++;
          }
        }
      }
    }

    console.log(`Property import complete. Inserted: ${totalInserted}, Failed: ${totalFailed}`);
  },

  async down(queryInterface) {
    // Remove only properties whose internalNotes indicate they were imported from CSV
    await queryInterface.bulkDelete('properties', {
      internalNotes: { [require('sequelize').Op.like]: 'CSV ref:%' },
    });
    console.log('Removed CSV-imported properties.');
  },
};
