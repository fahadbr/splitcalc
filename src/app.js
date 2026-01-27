/**
 * Main application entry point
 */

import { initialState, deriveSplits, applyAction } from './state/store.js';
import { initializeDOMRefs, controls } from './ui/dom.js';
import { render } from './ui/render.js';
import { wireEvents } from './ui/events.js';
import { loadPersistedState, savePersistedState, createStateSnapshot } from './persistence/storage.js';
import { calculateSplits } from './engine/calculate.js';
import { toSeconds } from './engine/time.js';

// Application state
let state = initialState;
let splits = [];

/**
 * Dispatch an action to update state and re-render
 * @param {Object} action - Action object
 */
function dispatch(action) {
  state = applyAction(state, action);
  splits = deriveSplits(state);

  // Skip re-render for input changes - the input already has the value
  // This prevents focus loss and cursor jumping during typing
  if (action.type === 'SET_PACE_INPUT' || action.type === 'SET_GOAL_TIME_FIELD') {
    return;
  }

  render(state, splits, dispatch);
}

/**
 * Handle Copy results to input button click
 */
function handleCopyResults() {
  if (!state.results) return;

  // Copy paces from results to blank inputs only
  state.results.rows.forEach(row => {
    const currentInput = state.paceInputsById[row.id];

    // Only copy if the input is currently blank
    if (!currentInput || currentInput.trim() === '') {
      dispatch({
        type: 'SET_PACE_INPUT',
        payload: { splitId: row.id, value: row.paceDisplay }
      });
    }
  });

  // Mark as dirty since inputs changed
  if (state.results) {
    dispatch({ type: 'MARK_DIRTY', payload: true });
  }
}

/**
 * Handle Calculate button click
 */
function handleCalculate() {
  try {
    const goalSeconds = toSeconds(state.goalTime);

    if (goalSeconds <= 0) {
      dispatch({
        type: 'SET_RESULTS',
        payload: {
          results: null,
          error: 'Goal time must be greater than zero',
          offendingIds: []
        }
      });
      return;
    }

    const result = calculateSplits({
      splits,
      goalSeconds,
      strategyKey: state.strategyKey,
      fixedPaceStringsById: state.paceInputsById
    });

    if (result.ok) {
      dispatch({
        type: 'SET_RESULTS',
        payload: {
          results: result,
          error: null,
          offendingIds: []
        }
      });

      // Persist state snapshot after successful calculation
      const snapshot = createStateSnapshot(state);
      savePersistedState(snapshot);
    } else {
      dispatch({
        type: 'SET_RESULTS',
        payload: {
          results: null,
          error: result.errorMessage,
          offendingIds: result.offendingIds
        }
      });
    }
  } catch (error) {
    dispatch({
      type: 'SET_RESULTS',
      payload: {
        results: null,
        error: `Calculation error: ${error.message}`,
        offendingIds: []
      }
    });
  }
}

/**
 * Initialize and start the application
 */
export function initializeApp() {
  // Initialize DOM references
  initializeDOMRefs();

  // Load persisted state
  const persisted = loadPersistedState();
  if (persisted) {
    // Merge persisted state into initial state
    state = {
      ...state,
      distancePresetKey: persisted.distancePresetKey || state.distancePresetKey,
      customDistanceValue: persisted.customDistanceValue || state.customDistanceValue,
      unit: persisted.unit || state.unit,
      goalTime: persisted.goalTime || state.goalTime,
      strategyKey: persisted.strategyKey || state.strategyKey,
      paceInputsById: persisted.paceInputsById || state.paceInputsById
    };
  }

  // Wire up control events
  wireEvents(dispatch);

  // Wire Calculate button
  if (controls.calculateBtn) {
    controls.calculateBtn.addEventListener('click', handleCalculate);
  }

  // Wire Copy button
  if (controls.copyBtn) {
    controls.copyBtn.addEventListener('click', handleCopyResults);
  }

  // Wire Enter key in input fields to trigger calculation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.splitId) {
      // Enter pressed in a pace input field
      e.preventDefault();
      handleCalculate();
    }
  });

  // Derive initial splits and render
  splits = deriveSplits(state);
  render(state, splits, dispatch);
}

/**
 * Register service worker for PWA support
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Register service worker
registerServiceWorker();
