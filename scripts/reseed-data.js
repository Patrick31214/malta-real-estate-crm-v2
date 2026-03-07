'use strict';

/**
 * Reseed script — re-imports owners and properties from prepared JSON data files.
 *
 * Usage:  node scripts/reseed-data.js
 *
 * Data files:
 *   data/deduplicated-owners.json   — owner records keyed by phone
 *   data/prepared-properties.json  — property records with ownerPhone FK
 *
 * Duplicates are skipped (owners by phone, properties by internalNotes CSV ref).
 */

const path = require('path');
const fs   = require('fs');

// Bootstrap Sequelize models from the project root
const db = require('../src/models');
const { Owner, Property, sequelize } = db;

const OWNERS_JSON    = path.resolve(__dirname, '..', 'data', 'deduplicated-owners.json');
const PROPERTIES_JSON = path.resolve(__dirname, '..', 'data', 'prepared-properties.json');

async function seedOwners() {
  console.log('\n── Seeding Owners ──────────────────────────────────────────');

  if (!fs.existsSync(OWNERS_JSON)) {
    throw new Error(`Owners data file not found: ${OWNERS_JSON}`);
  }
  const owners = JSON.parse(fs.readFileSync(OWNERS_JSON, 'utf8'));
  console.log(`Loaded ${owners.length} owner records from JSON.`);

  // Build set of existing phones to detect duplicates
  const existingOwners = await Owner.findAll({ attributes: ['phone', 'alternatePhone'] });
  const existingPhones = new Set();
  for (const o of existingOwners) {
    if (o.phone) existingPhones.add(o.phone.trim());
    if (o.alternatePhone) existingPhones.add(o.alternatePhone.trim());
  }
  console.log(`Found ${existingPhones.size} existing phone entries in DB.`);

  const now = new Date();
  let inserted = 0;
  let skipped  = 0;

  const BATCH_SIZE = 20;

  for (let i = 0; i < owners.length; i += BATCH_SIZE) {
    const batch = owners.slice(i, i + BATCH_SIZE);
    const toInsert = [];

    for (const entry of batch) {
      const phone = (entry.phone || '').trim();
      if (!phone) { skipped++; continue; }
      if (existingPhones.has(phone)) { skipped++; continue; }
      if (!entry.firstName) { skipped++; continue; }

      toInsert.push({
        firstName:      entry.firstName,
        lastName:       entry.lastName || null,
        phone,
        alternatePhone: entry.alternatePhone || null,
        notes:          entry.notes || null,
        isActive:       true,
        createdAt:      now,
        updatedAt:      now,
      });

      // Pre-register phone so later batches don't duplicate it
      existingPhones.add(phone);
      if (entry.alternatePhone) existingPhones.add(entry.alternatePhone.trim());
    }

    if (toInsert.length === 0) continue;

    const t = await sequelize.transaction();
    try {
      await Owner.bulkCreate(toInsert, { individualHooks: true, transaction: t, validate: true });
      await t.commit();
      inserted += toInsert.length;
      process.stdout.write(`  inserted batch ending at index ${i + BATCH_SIZE - 1} (${inserted} total)\r`);
    } catch (err) {
      await t.rollback();
      console.error(`\nBatch failed (${err.message}), retrying individually...`);
      for (const record of toInsert) {
        const t2 = await sequelize.transaction();
        try {
          await Owner.create(record, { transaction: t2 });
          await t2.commit();
          inserted++;
        } catch (e2) {
          await t2.rollback();
          console.warn(`  Skipped owner ${record.firstName} ${record.lastName || ''} (${record.phone}): ${e2.message}`.trim());
          skipped++;
        }
      }
    }
  }

  console.log(`\nOwner seeding complete — inserted: ${inserted}, skipped: ${skipped}`);
  return inserted;
}

async function seedProperties() {
  console.log('\n── Seeding Properties ──────────────────────────────────────');

  if (!fs.existsSync(PROPERTIES_JSON)) {
    throw new Error(`Properties data file not found: ${PROPERTIES_JSON}`);
  }
  const properties = JSON.parse(fs.readFileSync(PROPERTIES_JSON, 'utf8'));
  console.log(`Loaded ${properties.length} property records from JSON.`);

  // Build phone → owner ID lookup
  const owners = await Owner.findAll({ attributes: ['id', 'phone', 'alternatePhone'] });
  const phoneToOwnerId = new Map();
  for (const o of owners) {
    if (o.phone) phoneToOwnerId.set(o.phone.trim(), o.id);
    if (o.alternatePhone) phoneToOwnerId.set(o.alternatePhone.trim(), o.id);
  }
  console.log(`Phone lookup built for ${phoneToOwnerId.size} entries.`);

  // Build set of existing CSV refs to skip duplicates
  const existingProps = await Property.findAll({
    where: { internalNotes: { [db.Sequelize.Op.like]: 'CSV ref:%' } },
    attributes: ['internalNotes'],
  });
  const existingRefs = new Set(existingProps.map(p => p.internalNotes));
  console.log(`Found ${existingRefs.size} existing CSV-imported properties in DB.`);

  const now = new Date();
  const BATCH_SIZE = 20;
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < properties.length; i += BATCH_SIZE) {
    const batch = properties.slice(i, i + BATCH_SIZE);
    const toInsert = [];

    for (const prop of batch) {
      const noteKey = `CSV ref: ${prop.csvReferenceNumber}`;
      if (existingRefs.has(noteKey)) { skipped++; continue; }

      const ownerId = phoneToOwnerId.get((prop.ownerPhone || '').trim());
      if (!ownerId) {
        console.warn(`  No owner for phone "${prop.ownerPhone}" (ref: ${prop.csvReferenceNumber}) — skipping.`);
        skipped++;
        continue;
      }

      if (prop.price == null) { skipped++; continue; }
      if (!prop.locality)     { skipped++; continue; }

      toInsert.push({
        title:         prop.title || `Property - ${prop.csvReferenceNumber}`,
        type:          prop.type || 'other',
        listingType:   prop.listingType || 'long_let',
        status:        prop.status || 'draft',
        price:         prop.price,
        currency:      prop.currency || 'EUR',
        bedrooms:      prop.bedrooms !== undefined ? prop.bedrooms : null,
        bathrooms:     prop.bathrooms !== undefined ? prop.bathrooms : null,
        locality:      prop.locality,
        address:       prop.address || null,
        features:      Array.isArray(prop.features) && prop.features.length > 0 ? prop.features : null,
        isPetFriendly: prop.isPetFriendly || false,
        ownerId,
        internalNotes: noteKey,
        isAvailable:   true,
        createdAt:     now,
        updatedAt:     now,
      });

      existingRefs.add(noteKey);
    }

    if (toInsert.length === 0) continue;

    const t = await sequelize.transaction();
    try {
      await Property.bulkCreate(toInsert, { transaction: t, validate: true });
      await t.commit();
      inserted += toInsert.length;
      process.stdout.write(`  inserted batch ending at index ${i + BATCH_SIZE - 1} (${inserted} total)\r`);
    } catch (err) {
      await t.rollback();
      console.error(`\nBatch failed (${err.message}), retrying individually...`);
      for (const record of toInsert) {
        const t2 = await sequelize.transaction();
        try {
          await Property.create(record, { transaction: t2 });
          await t2.commit();
          inserted++;
        } catch (e2) {
          await t2.rollback();
          console.warn(`  Skipped property "${record.title}": ${e2.message}`);
          skipped++;
        }
      }
    }
  }

  console.log(`\nProperty seeding complete — inserted: ${inserted}, skipped: ${skipped}`);
  return inserted;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              Malta CRM — Data Reseed Script              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  try {
    await db.sequelize.authenticate();
    console.log('Database connection established.');
  } catch (err) {
    console.error('Cannot connect to database:', err.message);
    process.exit(1);
  }

  try {
    const ownersInserted     = await seedOwners();
    const propertiesInserted = await seedProperties();

    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`  Done! Owners inserted: ${ownersInserted} | Properties inserted: ${propertiesInserted}`);
    console.log('══════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\nReseed failed:', err.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

main();
