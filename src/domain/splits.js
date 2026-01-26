/**
 * Generate split list for a given total distance
 * Creates one split per full unit (1.0 km or 1.0 mi)
 * Adds a partial segment for any remainder
 */

const EPSILON = 1e-9;

/**
 * Generate splits for a race distance
 * @param {number} totalDistance - Total distance in the selected unit
 * @param {string} unit - 'km' or 'mi'
 * @returns {Array} Array of split objects
 */
export function generateSplits(totalDistance, unit) {
  if (!totalDistance || totalDistance <= 0) {
    throw new Error('Total distance must be positive');
  }
  if (unit !== 'km' && unit !== 'mi') {
    throw new Error(`Invalid unit: ${unit}`);
  }

  const splits = [];
  const fullUnits = Math.floor(totalDistance);
  const remainder = totalDistance - fullUnits;

  const unitLabel = unit === 'km' ? 'KM' : 'Mile';
  const unitAbbrev = unit;

  // Generate full unit splits
  for (let i = 1; i <= fullUnits; i++) {
    splits.push({
      id: `${unit}-${i}`,
      index: i,
      distance: 1.0,
      isPartial: false,
      label: `${unitLabel} ${i} (1.0 ${unitAbbrev})`
    });
  }

  // Add partial segment if remainder is significant
  if (remainder > EPSILON) {
    const partialIndex = fullUnits + 1;
    splits.push({
      id: `${unit}-${partialIndex}-partial`,
      index: partialIndex,
      distance: remainder,
      isPartial: true,
      label: `Last segment (${remainder.toFixed(2)} ${unitAbbrev})`
    });
  }

  return splits;
}
