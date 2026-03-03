'use strict';

/**
 * Weighted scoring:
 * budget 25%, type 15%, location 15%, bedrooms 12%,
 * must-have features 15%, nice-to-have 8%, area 5%, listing type 5%
 * Total: 100%
 */

const WEIGHTS = {
  budget:      0.25,
  type:        0.15,
  location:    0.15,
  bedrooms:    0.12,
  mustHave:    0.15,
  niceToHave:  0.08,
  area:        0.05,
  listingType: 0.05,
};

function scoreBudget(client, property) {
  if (!client.maxBudget) return 1; // no constraint → full score
  const price = parseFloat(property.price);
  const max   = parseFloat(client.maxBudget);
  const min   = client.minBudget ? parseFloat(client.minBudget) : 0;
  if (price <= max && price >= min) return 1;
  if (price > max) {
    const overage = (price - max) / max;
    if (overage > 0.3) return 0;
    return 1 - (overage / 0.3);
  }
  return 0.7; // under budget — slightly penalise (might be too cheap)
}

function scoreType(client, property) {
  if (!client.propertyTypes || client.propertyTypes.length === 0) return 1;
  return client.propertyTypes.includes(property.type) ? 1 : 0;
}

function scoreLocation(client, property) {
  if (!client.preferredLocalities || client.preferredLocalities.length === 0) return 1;
  return client.preferredLocalities.map(l => l.toLowerCase()).includes((property.locality || '').toLowerCase()) ? 1 : 0;
}

function scoreBedrooms(client, property) {
  if (client.minBedrooms == null && client.maxBedrooms == null) return 1;
  const beds = property.bedrooms;
  if (beds == null) return 0.5;
  const min = client.minBedrooms ?? 0;
  const max = client.maxBedrooms ?? 999;
  if (beds >= min && beds <= max) return 1;
  const diff = Math.min(Math.abs(beds - min), Math.abs(beds - max));
  if (diff >= 3) return 0;
  return 1 - diff * 0.33;
}

function scoreMustHave(client, property) {
  if (!client.mustHaveFeatures || client.mustHaveFeatures.length === 0) return 1;
  const propFeatures = property.features || [];
  const matched = client.mustHaveFeatures.filter(f => propFeatures.includes(f));
  return matched.length / client.mustHaveFeatures.length;
}

function scoreNiceToHave(client, property) {
  if (!client.niceToHaveFeatures || client.niceToHaveFeatures.length === 0) return 1;
  const propFeatures = property.features || [];
  const matched = client.niceToHaveFeatures.filter(f => propFeatures.includes(f));
  return matched.length / client.niceToHaveFeatures.length;
}

function scoreArea(client, property) {
  if (client.minArea == null && client.maxArea == null) return 1;
  const area = parseFloat(property.area);
  if (!area) return 0.5;
  const min = client.minArea ? parseFloat(client.minArea) : 0;
  const max = client.maxArea ? parseFloat(client.maxArea) : 99999;
  if (area >= min && area <= max) return 1;
  if (area < min) {
    const deficit = (min - area) / min;
    if (deficit > 0.3) return 0;
    return 1 - deficit / 0.3;
  }
  return 0.8; // larger than max — still OK
}

function scoreListingType(client, property) {
  if (!client.lookingFor) return 1;
  if (client.lookingFor === 'both' || property.listingType === 'both') return 1;
  return client.lookingFor === property.listingType ? 1 : 0;
}

/** Round a weighted component score to one decimal place. */
const roundScore = (raw, weight) => Math.round(raw * weight * 100 * 10) / 10;

function calculateMatch(client, property) {
  const scores = {
    budget:      scoreBudget(client, property),
    type:        scoreType(client, property),
    location:    scoreLocation(client, property),
    bedrooms:    scoreBedrooms(client, property),
    mustHave:    scoreMustHave(client, property),
    niceToHave:  scoreNiceToHave(client, property),
    area:        scoreArea(client, property),
    listingType: scoreListingType(client, property),
  };

  const overall = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (scores[key] * weight * 100);
  }, 0);

  // Bonus scoring for pet/children compatibility
  let bonus = 0;
  if (client.hasPets && property.isPetFriendly) bonus += 5;
  if (client.hasChildren && property.acceptsChildren) bonus += 5;

  const propFeatures = property.features || [];
  const matchedMustHave   = (client.mustHaveFeatures   || []).filter(f => propFeatures.includes(f));
  const missingMustHave   = (client.mustHaveFeatures   || []).filter(f => !propFeatures.includes(f));
  const matchedNiceToHave = (client.niceToHaveFeatures || []).filter(f => propFeatures.includes(f));

  return {
    overall: Math.min(100, Math.round((overall + bonus) * 10) / 10),
    breakdown: {
      budget:      roundScore(scores.budget,      WEIGHTS.budget),
      type:        roundScore(scores.type,        WEIGHTS.type),
      location:    roundScore(scores.location,    WEIGHTS.location),
      bedrooms:    roundScore(scores.bedrooms,    WEIGHTS.bedrooms),
      mustHave:    roundScore(scores.mustHave,    WEIGHTS.mustHave),
      niceToHave:  roundScore(scores.niceToHave,  WEIGHTS.niceToHave),
      area:        roundScore(scores.area,        WEIGHTS.area),
      listingType: roundScore(scores.listingType, WEIGHTS.listingType),
    },
    matchedMustHave,
    missingMustHave,
    matchedNiceToHave,
  };
}

module.exports = { calculateMatch, WEIGHTS };
