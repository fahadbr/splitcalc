/**
 * Main calculation engine - entry point for computing split plan
 */

import { parsePace, formatPace, formatHMS } from './time.js';
import { validateFixedPaces } from './validate.js';
import { distributeEven, distributeLinear, distributeWeighted } from './strategies.js';
import { segmentTimeSeconds, cumulativeTimes } from './compute.js';

/**
 * Calculate complete split plan with paces and times
 * @param {Object} params
 * @param {Array} params.splits - Split objects with {id, distance, label}
 * @param {number} params.goalSeconds - Goal time in seconds
 * @param {string} params.strategyKey - "even" | "linear-negative" | "linear-positive" | "weighted"
 * @param {Object} params.fixedPaceStringsById - Map of splitId -> "MM:SS" pace strings (blanks absent or "")
 * @returns {Object} Result with ok flag and either rows or error details
 */
export function calculateSplits({ splits, goalSeconds, strategyKey, fixedPaceStringsById }) {
  // Parse fixed paces from strings to seconds per unit
  const fixedPacesById = {};
  const parseErrors = [];

  for (const [splitId, paceStr] of Object.entries(fixedPaceStringsById)) {
    if (paceStr && paceStr.trim() !== '') {
      try {
        fixedPacesById[splitId] = parsePace(paceStr);
      } catch (error) {
        parseErrors.push(`Invalid pace for ${splitId}: ${error.message}`);
      }
    }
  }

  if (parseErrors.length > 0) {
    return {
      ok: false,
      errorMessage: parseErrors.join('; '),
      offendingIds: Object.keys(fixedPaceStringsById).filter(id => fixedPaceStringsById[id]?.trim())
    };
  }

  // Validate that fixed paces don't exceed goal time
  const validation = validateFixedPaces(goalSeconds, splits, fixedPacesById);

  if (!validation.ok) {
    return {
      ok: false,
      errorMessage: validation.errorMessage,
      offendingIds: validation.offendingIds
    };
  }

  // Identify blank splits (those without fixed paces)
  const blankIds = [];
  const blankDistances = [];

  for (const split of splits) {
    if (!(split.id in fixedPacesById)) {
      blankIds.push(split.id);
      blankDistances.push(split.distance);
    }
  }

  // Distribute remaining time across blanks using selected strategy
  let blankPacesById = {};

  if (blankIds.length > 0 && validation.remainingSeconds > 0) {
    const strategyParams = {
      blankIds,
      blankDistances,
      remainingSeconds: validation.remainingSeconds
    };

    try {
      switch (strategyKey) {
        case 'even':
          blankPacesById = distributeEven(strategyParams);
          break;
        case 'linear-negative':
          blankPacesById = distributeLinear({ ...strategyParams, mode: 'negative' });
          break;
        case 'linear-positive':
          blankPacesById = distributeLinear({ ...strategyParams, mode: 'positive' });
          break;
        case 'weighted':
          blankPacesById = distributeWeighted({ ...strategyParams, exponent: 2 });
          break;
        default:
          return {
            ok: false,
            errorMessage: `Unknown strategy: ${strategyKey}`,
            offendingIds: []
          };
      }

      // Check if strategy returned an error
      if (blankPacesById.ok === false) {
        return {
          ok: false,
          errorMessage: blankPacesById.message,
          offendingIds: []
        };
      }
    } catch (error) {
      return {
        ok: false,
        errorMessage: `Strategy error: ${error.message}`,
        offendingIds: []
      };
    }
  }

  // Combine fixed and blank paces
  const allPacesById = { ...fixedPacesById, ...blankPacesById };

  // Calculate segment times and cumulative times
  const segmentTimesArray = [];
  const rows = [];

  for (const split of splits) {
    const paceSecondsPerUnit = allPacesById[split.id];

    if (paceSecondsPerUnit === undefined) {
      // This shouldn't happen, but handle gracefully
      return {
        ok: false,
        errorMessage: `Missing pace for split ${split.id}`,
        offendingIds: []
      };
    }

    const segmentSeconds = segmentTimeSeconds(paceSecondsPerUnit, split.distance);
    segmentTimesArray.push(segmentSeconds);
  }

  const cumulativeTimesArray = cumulativeTimes(segmentTimesArray);

  // Build result rows with display strings
  for (let i = 0; i < splits.length; i++) {
    const split = splits[i];
    const paceSecondsPerUnit = allPacesById[split.id];
    const segmentSeconds = segmentTimesArray[i];
    const cumulativeSeconds = cumulativeTimesArray[i];

    rows.push({
      id: split.id,
      label: split.label,
      paceSecondsPerUnit,
      paceDisplay: formatPace(paceSecondsPerUnit),
      segmentSeconds,
      segmentDisplay: formatSegmentTime(segmentSeconds),
      cumulativeSeconds,
      cumulativeDisplay: formatHMS(cumulativeSeconds)
    });
  }

  return {
    ok: true,
    rows
  };
}

/**
 * Format segment time for display
 * If less than 1 hour, use MM:SS; otherwise use H:MM:SS
 * @param {number} seconds - Segment time in seconds
 * @returns {string} Formatted segment time
 */
function formatSegmentTime(seconds) {
  const rounded = Math.round(seconds);

  if (rounded < 3600) {
    // Less than 1 hour - format as MM:SS
    const minutes = Math.floor(rounded / 60);
    const secs = rounded % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return `${mm}:${ss}`;
  } else {
    // 1 hour or more - format as H:MM:SS
    return formatHMS(rounded);
  }
}
