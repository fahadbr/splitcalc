/**
 * LocalStorage persistence utilities
 */

const STORAGE_KEY = 'splitcalc-state';

/**
 * Load persisted state from localStorage
 * @returns {Object|null} Persisted state or null if not found
 */
export function loadPersistedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Basic validation
    if (typeof parsed !== 'object') return null;

    return parsed;
  } catch (error) {
    console.warn('Failed to load persisted state:', error);
    return null;
  }
}

/**
 * Save state snapshot to localStorage
 * @param {Object} stateSnapshot - State to persist
 */
export function savePersistedState(stateSnapshot) {
  try {
    const serialized = JSON.stringify(stateSnapshot);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('Failed to save persisted state:', error);
  }
}

/**
 * Create a persistable snapshot of the state
 * @param {Object} state - Current state
 * @returns {Object} Snapshot to persist
 */
export function createStateSnapshot(state) {
  return {
    distancePresetKey: state.distancePresetKey,
    customDistanceValue: state.customDistanceValue,
    unit: state.unit,
    goalTime: state.goalTime,
    strategyKey: state.strategyKey,
    paceInputsById: state.paceInputsById
  };
}
