/**
 * Strategy functions for distributing remaining time across blank splits
 * All strategies operate ONLY on blank rows (user-entered paces are treated as fixed anchors)
 */

import { segmentTimeSeconds } from './compute.js';

/**
 * Distribute remaining time evenly across blank splits
 * @param {Object} params
 * @param {Array<string>} params.blankIds - IDs of blank splits
 * @param {Array<number>} params.blankDistances - Distances for blank splits (in unit)
 * @param {number} params.remainingSeconds - Remaining time to distribute
 * @returns {Object} Map of splitId -> secondsPerUnit
 */
export function distributeEven({ blankIds, blankDistances, remainingSeconds }) {
  if (blankIds.length === 0) {
    return {};
  }

  // Calculate total distance of blank segments
  const totalBlankDistance = blankDistances.reduce((sum, d) => sum + d, 0);

  if (totalBlankDistance === 0) {
    throw new Error('Total blank distance cannot be zero');
  }

  // Even pace across all blanks
  const paceSecondsPerUnit = remainingSeconds / totalBlankDistance;

  if (paceSecondsPerUnit <= 0) {
    return {
      ok: false,
      message: 'Remaining time is too small for even distribution'
    };
  }

  const result = {};
  blankIds.forEach(id => {
    result[id] = paceSecondsPerUnit;
  });

  return result;
}

/**
 * Distribute remaining time linearly (negative or positive split)
 * @param {Object} params
 * @param {string} params.mode - "negative" or "positive"
 * @param {Array<string>} params.blankIds - IDs of blank splits (in order)
 * @param {Array<number>} params.blankDistances - Distances for blank splits
 * @param {number} params.remainingSeconds - Remaining time to distribute
 * @returns {Object} Map of splitId -> secondsPerUnit
 */
export function distributeLinear({ mode, blankIds, blankDistances, remainingSeconds }) {
  if (blankIds.length === 0) {
    return {};
  }

  const n = blankIds.length;

  // For linear distribution, we want pace to change linearly across segments
  // Let pace_i = baseline + delta * i (for i = 0, 1, ..., n-1)
  // We need: sum(pace_i * distance_i) = remainingSeconds
  // And: all pace_i > 0

  // Use a heuristic: vary pace by ±20% from even pace
  const totalBlankDistance = blankDistances.reduce((sum, d) => sum + d, 0);
  const evenPace = remainingSeconds / totalBlankDistance;

  // Determine variance based on mode
  // negative split: faster toward end (pace decreases)
  // positive split: slower toward end (pace increases)
  const variance = evenPace * 0.2; // 20% variation

  const paces = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1); // Normalized position [0, 1]

    let pace;
    if (mode === 'negative') {
      // Start slower, end faster (pace decreases)
      pace = evenPace + variance * (1 - t);
    } else if (mode === 'positive') {
      // Start faster, end slower (pace increases)
      pace = evenPace - variance * (1 - t);
    } else {
      throw new Error(`Invalid mode: ${mode}`);
    }

    paces.push(pace);
  }

  // Adjust paces to match exact remainingSeconds
  // Calculate current total
  let currentTotal = 0;
  for (let i = 0; i < n; i++) {
    currentTotal += segmentTimeSeconds(paces[i], blankDistances[i]);
  }

  // Scale paces proportionally
  const scale = remainingSeconds / currentTotal;
  const adjustedPaces = paces.map(p => p * scale);

  // Verify all paces are positive
  if (adjustedPaces.some(p => p <= 0)) {
    return {
      ok: false,
      message: 'Cannot distribute linearly - would result in non-positive paces'
    };
  }

  const result = {};
  blankIds.forEach((id, i) => {
    result[id] = adjustedPaces[i];
  });

  return result;
}

/**
 * Distribute remaining time with weighted exponential bias toward end
 * @param {Object} params
 * @param {Array<string>} params.blankIds - IDs of blank splits (in order)
 * @param {Array<number>} params.blankDistances - Distances for blank splits
 * @param {number} params.remainingSeconds - Remaining time to distribute
 * @param {number} params.exponent - Exponent for weighting (default 2)
 * @returns {Object} Map of splitId -> secondsPerUnit
 */
export function distributeWeighted({ blankIds, blankDistances, remainingSeconds, exponent = 2 }) {
  if (blankIds.length === 0) {
    return {};
  }

  const n = blankIds.length;

  // Generate weights that grow toward end
  const weights = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / n; // Normalized position [0, 1]
    weights.push(Math.pow(t, exponent));
  }

  // Use weights to bias pace changes
  // Baseline even pace
  const totalBlankDistance = blankDistances.reduce((sum, d) => sum + d, 0);
  const evenPace = remainingSeconds / totalBlankDistance;

  // Apply weighted variance
  const variance = evenPace * 0.3; // 30% max variation
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const paces = [];
  for (let i = 0; i < n; i++) {
    // Normalize weight
    const normalizedWeight = weights[i] / totalWeight * n;
    // Apply variance (weighted segments get slower pace for negative split effect)
    const pace = evenPace + variance * (1 - normalizedWeight);
    paces.push(pace);
  }

  // Adjust to match exact remainingSeconds
  let currentTotal = 0;
  for (let i = 0; i < n; i++) {
    currentTotal += segmentTimeSeconds(paces[i], blankDistances[i]);
  }

  const scale = remainingSeconds / currentTotal;
  const adjustedPaces = paces.map(p => p * scale);

  // Verify all paces are positive
  if (adjustedPaces.some(p => p <= 0)) {
    return {
      ok: false,
      message: 'Cannot distribute with weighting - would result in non-positive paces'
    };
  }

  const result = {};
  blankIds.forEach((id, i) => {
    result[id] = adjustedPaces[i];
  });

  return result;
}
