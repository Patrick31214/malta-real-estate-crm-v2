'use strict';

/**
 * matchingService.js
 *
 * Matches active clients to a given property using the weighted scoring engine
 * (matchingEngine.js) and creates or updates ClientMatch records.
 *
 * Minimum score threshold for creating a match record: 30 out of 100.
 * Call matchClientsToProperty() fire-and-forget from property create/update routes.
 */

const { Op } = require('sequelize');
const { Client, ClientMatch } = require('../models');
const { calculateMatch } = require('./matchingEngine');

/** Only properties with a status eligible to be matched against clients. */
const MATCHABLE_STATUSES = ['listed', 'draft'];

/** Minimum weighted match score (0–100) required to persist a ClientMatch record. */
const MIN_SCORE = 30;

/**
 * Match all active clients against a single property and persist the results.
 *
 * @param {object} property - A Sequelize Property instance (or plain object with all fields).
 * @returns {Promise<{ created: number, updated: number, skipped: number }>}
 */
async function matchClientsToProperty(property) {
  const stats = { created: 0, updated: 0, skipped: 0 };

  try {
    // Only run matching for properties that are visible to clients
    if (!MATCHABLE_STATUSES.includes(property.status)) return stats;

    // Load all active clients that have at least some search criteria
    const clients = await Client.findAll({
      where: {
        deletedAt: null,
        status: { [Op.notIn]: ['completed', 'inactive'] },
      },
      attributes: [
        'id', 'lookingFor', 'propertyTypes', 'preferredLocalities',
        'minBudget', 'maxBudget', 'minBedrooms', 'maxBedrooms',
        'minBathrooms', 'minArea', 'maxArea',
        'mustHaveFeatures', 'niceToHaveFeatures',
        'hasPets', 'hasChildren',
      ],
    });

    const now = new Date();

    for (const client of clients) {
      try {
        const result = calculateMatch(client, property);

        if (result.overall < MIN_SCORE) {
          stats.skipped++;
          continue;
        }

        const [record, wasCreated] = await ClientMatch.findOrCreate({
          where: { clientId: client.id, propertyId: property.id },
          defaults: {
            matchScore:     result.overall,
            matchBreakdown: result.breakdown,
            status:         'new',
            lastCalculatedAt: now,
          },
        });

        if (!wasCreated) {
          // Update score on existing records that are still in a re-calculable state
          if (['new', 'sent'].includes(record.status)) {
            await record.update({
              matchScore:       result.overall,
              matchBreakdown:   result.breakdown,
              lastCalculatedAt: now,
            });
            stats.updated++;
          } else {
            stats.skipped++;
          }
        } else {
          stats.created++;
        }
      } catch (clientErr) {
        console.error(`[matchingService] Error matching client ${client.id}:`, clientErr.message);
      }
    }
  } catch (err) {
    console.error('[matchingService] matchClientsToProperty error:', err.message);
  }

  return stats;
}

module.exports = { matchClientsToProperty };
