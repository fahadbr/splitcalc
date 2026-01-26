/**
 * State management module (pure, no framework)
 * Handles immutable state updates via actions
 */

import { generateSplits } from '../domain/splits.js';
import { resolveDistance } from '../domain/distance.js';

/**
 * Initial application state
 */
export const initialState = {
  distancePresetKey: '5K',
  customDistanceValue: null,
  unit: 'km',
  goalTime: { h: 0, m: 0, s: 0 },
  strategyKey: 'even',
  paceInputsById: {},
  results: null,
  error: null,
  offendingIds: [],
  dirtySinceCalc: false
};

/**
 * Derive splits list from current state
 * @param {Object} state - Current state
 * @returns {Array} Splits array
 */
export function deriveSplits(state) {
  try {
    const distance = resolveDistance(
      state.distancePresetKey,
      state.customDistanceValue,
      state.unit
    );
    return generateSplits(distance, state.unit);
  } catch {
    // If distance resolution fails, return empty splits
    return [];
  }
}

/**
 * Apply action to state and return new state
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
export function applyAction(state, action) {
  switch (action.type) {
    case 'SET_DISTANCE_PRESET': {
      const newState = {
        ...state,
        distancePresetKey: action.payload
      };

      // Regenerate splits and remap pace inputs
      const oldSplits = deriveSplits(state);
      const newSplits = deriveSplits(newState);

      newState.paceInputsById = remapPaceInputs(
        state.paceInputsById,
        oldSplits,
        newSplits
      );

      // Mark dirty if results exist
      if (state.results) {
        newState.dirtySinceCalc = true;
      }

      return newState;
    }

    case 'SET_CUSTOM_DISTANCE': {
      const newState = {
        ...state,
        customDistanceValue: action.payload
      };

      // Only regenerate if Custom is selected
      if (state.distancePresetKey === 'Custom') {
        const oldSplits = deriveSplits(state);
        const newSplits = deriveSplits(newState);

        newState.paceInputsById = remapPaceInputs(
          state.paceInputsById,
          oldSplits,
          newSplits
        );

        if (state.results) {
          newState.dirtySinceCalc = true;
        }
      }

      return newState;
    }

    case 'SET_UNIT': {
      const newState = {
        ...state,
        unit: action.payload
      };

      // Regenerate splits and remap pace inputs
      const oldSplits = deriveSplits(state);
      const newSplits = deriveSplits(newState);

      newState.paceInputsById = remapPaceInputs(
        state.paceInputsById,
        oldSplits,
        newSplits
      );

      // Mark dirty if results exist
      if (state.results) {
        newState.dirtySinceCalc = true;
      }

      return newState;
    }

    case 'SET_GOAL_TIME_FIELD': {
      const newState = {
        ...state,
        goalTime: {
          ...state.goalTime,
          [action.payload.field]: action.payload.value
        }
      };

      // Mark dirty if results exist
      if (state.results) {
        newState.dirtySinceCalc = true;
      }

      return newState;
    }

    case 'SET_STRATEGY': {
      const newState = {
        ...state,
        strategyKey: action.payload
      };

      // Mark dirty if results exist
      if (state.results) {
        newState.dirtySinceCalc = true;
      }

      return newState;
    }

    case 'SET_PACE_INPUT': {
      const newState = {
        ...state,
        paceInputsById: {
          ...state.paceInputsById,
          [action.payload.splitId]: action.payload.value
        }
      };

      // Mark dirty if results exist
      if (state.results) {
        newState.dirtySinceCalc = true;
      }

      return newState;
    }

    case 'CLEAR_PACE_INPUT': {
      const newPaceInputs = { ...state.paceInputsById };
      delete newPaceInputs[action.payload.splitId];

      const newState = {
        ...state,
        paceInputsById: newPaceInputs
      };

      // Mark dirty if results exist
      if (state.results) {
        newState.dirtySinceCalc = true;
      }

      return newState;
    }

    case 'CLEAR_ALL_PACES': {
      const newState = {
        ...state,
        paceInputsById: {}
      };

      // Mark dirty if results exist
      if (state.results) {
        newState.dirtySinceCalc = true;
      }

      return newState;
    }

    case 'SET_RESULTS': {
      return {
        ...state,
        results: action.payload.results,
        error: action.payload.error,
        offendingIds: action.payload.offendingIds || [],
        dirtySinceCalc: false
      };
    }

    case 'MARK_DIRTY': {
      return {
        ...state,
        dirtySinceCalc: action.payload
      };
    }

    default:
      return state;
  }
}

/**
 * Remap pace inputs when splits change
 * Drops inputs for splits that no longer exist
 * @param {Object} oldPaceInputs - Old pace inputs by ID
 * @param {Array} oldSplits - Old splits array
 * @param {Array} newSplits - New splits array
 * @returns {Object} Remapped pace inputs
 */
function remapPaceInputs(oldPaceInputs, oldSplits, newSplits) {
  const newIds = new Set(newSplits.map(s => s.id));
  const remapped = {};

  for (const [id, value] of Object.entries(oldPaceInputs)) {
    if (newIds.has(id)) {
      remapped[id] = value;
    }
  }

  return remapped;
}
