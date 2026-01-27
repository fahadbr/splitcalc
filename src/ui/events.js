/**
 * Event wiring for user interactions
 */

import { controls } from './dom.js';

/**
 * Wire up all control events
 * @param {Function} dispatch - Action dispatch function
 */
export function wireEvents(dispatch) {
  // Distance preset change
  if (controls.distancePreset) {
    controls.distancePreset.addEventListener('change', (e) => {
      dispatch({
        type: 'SET_DISTANCE_PRESET',
        payload: e.target.value
      });
    });
  }

  // Custom distance change
  if (controls.customDistance) {
    controls.customDistance.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      dispatch({
        type: 'SET_CUSTOM_DISTANCE',
        payload: isNaN(value) ? null : value
      });
    });
  }

  // Unit change
  if (controls.unit) {
    controls.unit.addEventListener('change', (e) => {
      dispatch({
        type: 'SET_UNIT',
        payload: e.target.value
      });
    });
  }

  // Goal time fields
  if (controls.goalHours) {
    controls.goalHours.addEventListener('input', (e) => {
      dispatch({
        type: 'SET_GOAL_TIME_FIELD',
        payload: { field: 'h', value: e.target.value }
      });
    });
    controls.goalHours.addEventListener('blur', () => {
      dispatch({ type: 'MARK_DIRTY', payload: true });
    });
  }

  if (controls.goalMinutes) {
    controls.goalMinutes.addEventListener('input', (e) => {
      dispatch({
        type: 'SET_GOAL_TIME_FIELD',
        payload: { field: 'm', value: e.target.value }
      });
    });
    controls.goalMinutes.addEventListener('blur', () => {
      dispatch({ type: 'MARK_DIRTY', payload: true });
    });
  }

  if (controls.goalSeconds) {
    controls.goalSeconds.addEventListener('input', (e) => {
      dispatch({
        type: 'SET_GOAL_TIME_FIELD',
        payload: { field: 's', value: e.target.value }
      });
    });
    controls.goalSeconds.addEventListener('blur', () => {
      dispatch({ type: 'MARK_DIRTY', payload: true });
    });
  }

  // Strategy change
  if (controls.strategy) {
    controls.strategy.addEventListener('change', (e) => {
      dispatch({
        type: 'SET_STRATEGY',
        payload: e.target.value
      });
    });
  }

  // Clear all button
  if (controls.clearBtn) {
    controls.clearBtn.addEventListener('click', () => {
      dispatch({ type: 'CLEAR_ALL_PACES' });
    });
  }

  // Calculate and Copy buttons will be wired in later prompts
}
