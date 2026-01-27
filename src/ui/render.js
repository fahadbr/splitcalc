/**
 * Rendering logic for UI elements
 */

import { controls, containers, createElement } from './dom.js';

/**
 * Render the entire UI from state
 * @param {Object} state - Current application state
 * @param {Array} splits - Current splits array
 * @param {Function} dispatch - Action dispatch function
 */
export function render(state, splits, dispatch) {
  renderControls(state);
  renderInputTable(state, splits, dispatch);
  renderResultsTable(state);
  renderErrorMessage(state);
  renderDirtyWarning(state);
}

/**
 * Render control values from state
 * @param {Object} state - Current state
 */
function renderControls(state) {
  if (controls.distancePreset) {
    controls.distancePreset.value = state.distancePresetKey;
  }

  if (controls.customDistance) {
    controls.customDistance.disabled = state.distancePresetKey !== 'Custom';
    if (state.customDistanceValue !== null) {
      controls.customDistance.value = state.customDistanceValue;
    }
  }

  if (controls.unit) {
    controls.unit.value = state.unit;
  }

  if (controls.goalHours) {
    controls.goalHours.value = state.goalTime.h;
  }

  if (controls.goalMinutes) {
    controls.goalMinutes.value = state.goalTime.m;
  }

  if (controls.goalSeconds) {
    controls.goalSeconds.value = state.goalTime.s;
  }

  if (controls.strategy) {
    controls.strategy.value = state.strategyKey;
  }
}

/**
 * Render input table
 * @param {Object} state - Current state
 * @param {Array} splits - Current splits array
 * @param {Function} dispatch - Action dispatch function
 */
function renderInputTable(state, splits, dispatch) {
  if (!containers.inputTableRoot) return;

  // Capture currently focused element and cursor position before re-render
  const activeElement = document.activeElement;
  let focusedSplitId = null;
  let selectionStart = null;
  let selectionEnd = null;

  if (activeElement && activeElement.dataset && activeElement.dataset.splitId) {
    focusedSplitId = activeElement.dataset.splitId;
    selectionStart = activeElement.selectionStart;
    selectionEnd = activeElement.selectionEnd;
  }

  // Clear existing content
  containers.inputTableRoot.innerHTML = '';

  if (splits.length === 0) {
    containers.inputTableRoot.textContent = 'No splits to display';
    return;
  }

  const table = createElement('table', {}, [
    createElement('thead', {}, [
      createElement('tr', {}, [
        createElement('th', {}, 'Split'),
        createElement('th', {}, 'Pace (MM:SS)'),
        createElement('th', {}, '')
      ])
    ]),
    createElement('tbody', {}, splits.map(split => createInputRow(split, state, dispatch)))
  ]);

  containers.inputTableRoot.appendChild(table);
}

/**
 * Create input table row for a split
 * @param {Object} split - Split object
 * @param {Object} state - Current state
 * @param {Function} dispatch - Action dispatch function
 * @returns {HTMLElement} Table row element
 */
function createInputRow(split, state, dispatch) {
  const isOffending = state.offendingIds.includes(split.id);
  const paceValue = state.paceInputsById[split.id] || '';

  const paceInput = createElement('input', {
    type: 'text',
    placeholder: 'MM:SS',
    value: paceValue,
    inputmode: 'text',
    dataset: { splitId: split.id }
  });

  // Wire pace input change
  paceInput.addEventListener('input', (e) => {
    dispatch({
      type: 'SET_PACE_INPUT',
      payload: { splitId: split.id, value: e.target.value }
    });
  });

  // Mark dirty when focus leaves the input
  paceInput.addEventListener('blur', () => {
    dispatch({
      type: 'MARK_DIRTY',
      payload: true
    });
  });

  const clearButton = createElement('button', {
    type: 'button',
    dataset: { splitId: split.id }
  }, 'Clear');

  // Wire clear button
  clearButton.addEventListener('click', () => {
    dispatch({
      type: 'CLEAR_PACE_INPUT',
      payload: { splitId: split.id }
    });
  });

  const labelDiv = createElement('div', { className: 'split-label' }, split.label);

  const row = createElement('tr', {
    className: isOffending ? 'offending' : ''
  }, [
    createElement('td', {}, [labelDiv]),
    createElement('td', {}, [paceInput]),
    createElement('td', {}, [clearButton])
  ]);

  return row;
}

/**
 * Render results table
 * @param {Object} state - Current state
 */
function renderResultsTable(state) {
  if (!containers.resultsTableRoot) return;

  // Clear existing content
  containers.resultsTableRoot.innerHTML = '';

  if (!state.results) {
    containers.resultsTableRoot.textContent = 'Results will appear here after calculation';
    return;
  }

  const table = createElement('table', {}, [
    createElement('thead', {}, [
      createElement('tr', {}, [
        createElement('th', {}, 'Split'),
        createElement('th', {}, 'Pace'),
        createElement('th', {}, 'Segment'),
        createElement('th', {}, 'Cumulative')
      ])
    ]),
    createElement('tbody', {}, state.results.rows.map(row => createResultsRow(row)))
  ]);

  containers.resultsTableRoot.appendChild(table);
}

/**
 * Create results table row
 * @param {Object} row - Result row object
 * @returns {HTMLElement} Table row element
 */
function createResultsRow(row) {
  return createElement('tr', {}, [
    createElement('td', {}, row.label),
    createElement('td', {}, row.paceDisplay),
    createElement('td', {}, row.segmentDisplay),
    createElement('td', {}, row.cumulativeDisplay)
  ]);
}

/**
 * Render error message
 * @param {Object} state - Current state
 */
function renderErrorMessage(state) {
  if (!containers.errorMessage) return;

  if (state.error) {
    containers.errorMessage.textContent = state.error;
    containers.errorMessage.classList.add('visible');
  } else {
    containers.errorMessage.textContent = '';
    containers.errorMessage.classList.remove('visible');
  }
}

/**
 * Render dirty warning
 * @param {Object} state - Current state
 */
function renderDirtyWarning(state) {
  if (!containers.dirtyWarning) return;

  if (state.dirtySinceCalc) {
    containers.dirtyWarning.textContent = 'Inputs changed — recalculate to update results';
    containers.dirtyWarning.classList.add('visible');
  } else {
    containers.dirtyWarning.textContent = '';
    containers.dirtyWarning.classList.remove('visible');
  }
}
