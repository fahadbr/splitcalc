/**
 * Computation helpers for segment and cumulative times
 */

/**
 * Calculate segment time based on pace and distance
 * @param {number} secondsPerUnit - Pace in seconds per unit (km or mi)
 * @param {number} segmentDistance - Distance of segment in units
 * @returns {number} Segment time in seconds (float)
 */
export function segmentTimeSeconds(secondsPerUnit, segmentDistance) {
  return secondsPerUnit * segmentDistance;
}

/**
 * Calculate cumulative times from segment times
 * @param {Array<number>} segmentTimes - Array of segment times in seconds
 * @returns {Array<number>} Array of cumulative times in seconds
 */
export function cumulativeTimes(segmentTimes) {
  const cumulative = [];
  let sum = 0;

  for (const segmentTime of segmentTimes) {
    sum += segmentTime;
    cumulative.push(sum);
  }

  return cumulative;
}
