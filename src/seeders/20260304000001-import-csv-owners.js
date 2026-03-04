'use strict';

const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Minimal CSV parser — handles quoted fields (including commas inside quotes),
// BOM, and CRLF line endings without any external dependencies.
// ---------------------------------------------------------------------------
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
    .replace(/^\uFEFF/, '')   // Strip BOM
    .replace(/\r\n/g, '\n')  // Normalise CRLF
    .replace(/\r/g, '\n');

  const lines = raw.split('\n');
  const headers = parseCsvLine(lines[0]).map(h => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (values[idx] || '').trim();
    });
    if (obj['reference_number']) rows.push(obj);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Data-cleaning helpers
// ---------------------------------------------------------------------------
function parsePhone(raw) {
  const p = String(raw || '').trim();

  // Scientific notation (e.g. 4.48E+15) — parse digits directly to avoid
  // floating-point precision loss. Regex captures mantissa and exponent.
  const sciMatch = p.match(/^(\d+(?:\.\d+)?)[eE][+]?(\d+)$/);
  if (sciMatch) {
    try {
      // Use BigInt arithmetic on the integer part scaled by the exponent
      const [, mantissa, exp] = sciMatch;
      const [intPart, fracPart = ''] = mantissa.split('.');
      const totalExp = parseInt(exp, 10) - fracPart.length;
      const digits = intPart + fracPart;
      const result = BigInt(digits) * (10n ** BigInt(totalExp));
      return { primary: String(result), alternate: null };
    } catch {
      return { primary: p, alternate: null };
    }
  }

  // Slash-separated dual number (e.g. 99494659/99894659)
  if (p.includes('/')) {
    const parts = p.split('/');
    return {
      primary: parts[0].trim(),
      alternate: parts.length > 1 ? parts[1].trim() : null,
    };
  }

  return { primary: p, alternate: null };
}

function splitOwnerName(name) {
  const n = name.replace(/\s+/g, ' ').trim();
  // Keep the whole string in firstName (lastName = null) for:
  //   - Multi-person names joined by "or", "and", or "&" (e.g. "Alison or Otilia")
  //   - Names with a backslash separator (e.g. "Cristopher Borg\ Rosanna Borg")
  //   - Names with a forward-slash that isn't a phone extension starting with "+"
  if (/\b(or|and|&)\b/i.test(n) || n.includes('\\') || (n.includes('/') && !/^\+/.test(n))) {
    return { firstName: n, lastName: null };
  }
  const idx = n.indexOf(' ');
  if (idx === -1) return { firstName: n, lastName: null };
  return { firstName: n.slice(0, idx), lastName: n.slice(idx + 1) };
}

function moreCompleteName(a, b) {
  // Return the "more complete" of the two name strings
  const aWords = a.trim().split(/\s+/).length;
  const bWords = b.trim().split(/\s+/).length;
  if (bWords > aWords) return b;
  if (aWords > bWords) return a;
  return b.length > a.length ? b : a;
}

// ---------------------------------------------------------------------------
// Main seeder
// ---------------------------------------------------------------------------
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // CSV files are committed to the repo root with their original filenames.
    const projectRoot = path.resolve(__dirname, '..', '..');
    const file3 = path.join(projectRoot, 'New clean list  (3).csv');
    const file4 = path.join(projectRoot, 'New clean list  (4).csv');

    console.log('Reading CSV files...');
    let rows3 = [], rows4 = [];
    try { rows3 = parseCsv(file3); } catch (e) { console.warn('Could not read file (3):', e.message); }
    try { rows4 = parseCsv(file4); } catch (e) { console.warn('Could not read file (4):', e.message); }
    const combinedRows = [...rows3, ...rows4];
    console.log(`Loaded ${rows3.length} rows from file (3), ${rows4.length} from file (4). Total: ${combinedRows.length}`);

    // Deduplicate identical rows (same owner name + phone + city + address)
    // that may appear in both CSV files.
    const seenRowKeys = new Set();
    const allRows = [];
    for (const row of combinedRows) {
      const key = [
        (row['owner name'] || '').trim(),
        (row['phone number'] || '').trim(),
        (row['city'] || '').trim(),
        (row['address'] || '').trim(),
      ].join('|~|');
      if (!seenRowKeys.has(key)) {
        seenRowKeys.add(key);
        allRows.push(row);
      }
    }
    console.log(`After row deduplication: ${allRows.length} unique rows.`);

    // --- Step 1: Deduplicate owners by primary phone ---
    // phone → { bestName, alternatePhone, refs[] }
    const ownerMap = new Map();

    for (const row of allRows) {
      const rawPhone = String(row['phone number'] || '').trim();
      if (!rawPhone) continue;

      const { primary: phone, alternate } = parsePhone(rawPhone);
      if (!phone) continue;

      const rawName = (row['owner name'] || '').replace(/\s+/g, ' ').trim();
      if (!rawName) continue;

      const ref = (row['reference_number'] || '').trim();

      if (!ownerMap.has(phone)) {
        ownerMap.set(phone, {
          bestName: rawName,
          alternatePhone: alternate,
          refs: ref ? [ref] : [],
        });
      } else {
        const entry = ownerMap.get(phone);
        entry.bestName = moreCompleteName(entry.bestName, rawName);
        if (!entry.alternatePhone && alternate) entry.alternatePhone = alternate;
        if (ref && !entry.refs.includes(ref)) entry.refs.push(ref);
      }
    }

    console.log(`Deduplicated to ${ownerMap.size} unique owners.`);

    // --- Step 2: Build owner records ---
    const now = new Date();
    const ownerRecords = [];

    for (const [phone, entry] of ownerMap) {
      const { firstName, lastName } = splitOwnerName(entry.bestName);
      if (!firstName) {
        console.warn(`Skipping owner with blank name (phone: ${phone})`);
        continue;
      }

      const propCount = entry.refs.length;
      ownerRecords.push({
        firstName,
        lastName: lastName || null,
        phone,
        alternatePhone: entry.alternatePhone || null,
        notes: `Imported from CSV - ${propCount} ${propCount === 1 ? 'property' : 'properties'}`,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        // referenceNumber intentionally omitted — beforeCreate hook generates it
      });
    }

    console.log(`Prepared ${ownerRecords.length} owner records for insertion.`);

    // --- Step 3: Insert in batches of 20 using the model (so hooks fire) ---
    // Use require('../models') so Owner.bulkCreate triggers the beforeCreate hook
    // that auto-generates referenceNumber values.
    const { Owner } = require('../models');
    const sequelize = Owner.sequelize;
    const BATCH_SIZE = 20;
    const batches = [];
    for (let i = 0; i < ownerRecords.length; i += BATCH_SIZE) {
      batches.push(ownerRecords.slice(i, i + BATCH_SIZE));
    }

    let totalInserted = 0;
    let totalSkipped = 0;

    for (let b = 0; b < batches.length; b++) {
      console.log(`Inserting owner batch ${b + 1} of ${batches.length}...`);
      const batch = batches[b];

      const t = await sequelize.transaction();
      try {
        await Owner.bulkCreate(batch, {
          individualHooks: true,
          transaction: t,
          validate: true,
        });
        await t.commit();
        totalInserted += batch.length;
      } catch (err) {
        await t.rollback();
        console.error(`Batch ${b + 1} failed (${err.message}). Falling back to individual inserts...`);

        for (const record of batch) {
          const t2 = await sequelize.transaction();
          try {
            await Owner.create(record, { transaction: t2 });
            await t2.commit();
            totalInserted++;
          } catch (e2) {
            await t2.rollback();
            console.warn(`Skipped owner ${record.firstName} ${record.lastName || ''} (${record.phone}): ${e2.message}`.trim());
            totalSkipped++;
          }
        }
      }
    }

    console.log(`Owner import complete. Inserted: ${totalInserted}, Skipped: ${totalSkipped}`);
  },

  async down(queryInterface) {
    // Remove only owners whose notes indicate they were imported from CSV
    await queryInterface.bulkDelete('owners', {
      notes: { [require('sequelize').Op.like]: 'Imported from CSV%' },
    });
    console.log('Removed CSV-imported owners.');
  },
};
