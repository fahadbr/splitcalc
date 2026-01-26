/**
 * Validation logic for split calculations
 */

import { segmentTimeSeconds } from './compute.js';

/**
 * Validate that fixed paces don't exceed goal time
 * @param {number} goalSeconds - Goal time in seconds
 * @param {Array} splits - Array of split objects with {id, distance}
 * @param {Object} fixedPacesById - Map of splitId -> secondsPerUnit for user-entered paces
 * @returns {Object} Validation result
 */
export function validateFixedPaces(goalSeconds, splits, fixedPacesById) {
  let fixedTotalSeconds = 0;
  const offendingIds = [];

  // Calculate total time for all fixed paces
  for (const split of splits) {
    const fixedPace = fixedPacesById[split.id];

    if (fixedPace !== undefined && fixedPace !== null) {
      const segmentTime = segmentTimeSeconds(fixedPace, split.distance);
      fixedTotalSeconds += segmentTime;
      offendingIds.push(split.id);
    }
  }

  const remainingSeconds = goalSeconds - fixedTotalSeconds;

  // Check if fixed paces exceed goal time
  if (remainingSeconds < 0) {
    return {
      ok: false,
      errorMessage: `Fixed paces exceed goal time by ${Math.abs(Math.round(remainingSeconds))} seconds. Please adjust your inputs.`,
      offendingIds,
      fixedTotalSeconds,
      remainingSeconds
    };
  }

  return {
    ok: true,
    fixedTotalSeconds,
    remainingSeconds
  };
}
