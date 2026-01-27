import { describe, it, expect } from 'vitest';
import { initialState, deriveSplits, applyAction } from '../src/state/store.js';

describe('State management', () => {
  describe('deriveSplits', () => {
    it('should derive splits for 5K in km', () => {
      const state = {
        ...initialState,
        distancePresetKey: '5K',
        unit: 'km'
      };

      const splits = deriveSplits(state);

      expect(splits).toHaveLength(5);
      expect(splits[0].id).toBe('km-1');
      expect(splits[4].id).toBe('km-5');
    });

    it('should derive splits for custom distance', () => {
      const state = {
        ...initialState,
        distancePresetKey: 'Custom',
        customDistanceValue: 3.5,
        unit: 'mi'
      };

      const splits = deriveSplits(state);

      expect(splits).toHaveLength(4);
      expect(splits[3].isPartial).toBe(true);
    });

    it('should return empty array for invalid custom distance', () => {
      const state = {
        ...initialState,
        distancePresetKey: 'Custom',
        customDistanceValue: null,
        unit: 'km'
      };

      const splits = deriveSplits(state);

      expect(splits).toEqual([]);
    });
  });

  describe('applyAction - distance changes', () => {
    it('should update distance preset and regenerate splits', () => {
      const state = {
        ...initialState,
        distancePresetKey: '5K',
        unit: 'km'
      };
      const oldSplits = deriveSplits(state);

      expect(oldSplits).toHaveLength(5); // 5K

      const newState = applyAction(state, {
        type: 'SET_DISTANCE_PRESET',
        payload: '10K'
      });

      expect(newState.distancePresetKey).toBe('10K');

      const newSplits = deriveSplits(newState);
      expect(newSplits).toHaveLength(10);
    });

    it('should remap pace inputs when distance changes', () => {
      const state = {
        ...initialState,
        distancePresetKey: '5K',
        unit: 'km',
        paceInputsById: {
          'km-1': '05:00',
          'km-3': '05:30'
        }
      };

      // Change to 10K - km-1 and km-3 should still exist
      const newState = applyAction(state, {
        type: 'SET_DISTANCE_PRESET',
        payload: '10K'
      });

      expect(newState.paceInputsById['km-1']).toBe('05:00');
      expect(newState.paceInputsById['km-3']).toBe('05:30');
    });

    it('should drop pace inputs for non-existent splits when distance changes', () => {
      const state = {
        ...initialState,
        distancePresetKey: 'Custom',
        customDistanceValue: 5.0,
        unit: 'km',
        paceInputsById: {
          'km-1': '05:00',
          'km-4': '05:30',
          'km-6-partial': '06:00'
        }
      };

      // Change to 3 km - km-4 and km-6-partial should be dropped
      const newState = applyAction(state, {
        type: 'SET_CUSTOM_DISTANCE',
        payload: 3.0
      });

      expect(newState.paceInputsById['km-1']).toBe('05:00');
      expect(newState.paceInputsById['km-4']).toBeUndefined();
      expect(newState.paceInputsById['km-6-partial']).toBeUndefined();
    });

    it('should mark dirty when distance changes and results exist', () => {
      const state = {
        ...initialState,
        results: { rows: [] }
      };

      const newState = applyAction(state, {
        type: 'SET_DISTANCE_PRESET',
        payload: '10K'
      });

      expect(newState.dirtySinceCalc).toBe(true);
    });
  });

  describe('applyAction - unit change', () => {
    it('should update unit and regenerate splits', () => {
      const state = {
        ...initialState,
        unit: 'km'
      };

      const newState = applyAction(state, {
        type: 'SET_UNIT',
        payload: 'mi'
      });

      expect(newState.unit).toBe('mi');

      const splits = deriveSplits(newState);
      expect(splits[0].id).toBe('mi-1');
    });

    it('should remap pace inputs when unit changes', () => {
      const state = {
        ...initialState,
        unit: 'km',
        paceInputsById: {
          'km-1': '05:00',
          'km-2': '05:30'
        }
      };

      // Change to miles - km IDs will be gone
      const newState = applyAction(state, {
        type: 'SET_UNIT',
        payload: 'mi'
      });

      // Old km IDs should be dropped
      expect(newState.paceInputsById).toEqual({});
    });
  });

  describe('applyAction - goal time', () => {
    it('should update goal time field', () => {
      const state = { ...initialState };

      let newState = applyAction(state, {
        type: 'SET_GOAL_TIME_FIELD',
        payload: { field: 'h', value: 1 }
      });

      expect(newState.goalTime.h).toBe(1);

      newState = applyAction(newState, {
        type: 'SET_GOAL_TIME_FIELD',
        payload: { field: 'm', value: 30 }
      });

      expect(newState.goalTime.h).toBe(1);
      expect(newState.goalTime.m).toBe(30);
    });

    it('should NOT mark dirty when goal time changes (dirty flag set on blur)', () => {
      const state = {
        ...initialState,
        results: { rows: [] }
      };

      const newState = applyAction(state, {
        type: 'SET_GOAL_TIME_FIELD',
        payload: { field: 'm', value: 25 }
      });

      expect(newState.dirtySinceCalc).toBe(false);
    });
  });

  describe('applyAction - strategy', () => {
    it('should update strategy', () => {
      const state = { ...initialState };

      const newState = applyAction(state, {
        type: 'SET_STRATEGY',
        payload: 'linear-negative'
      });

      expect(newState.strategyKey).toBe('linear-negative');
    });

    it('should mark dirty when strategy changes and results exist', () => {
      const state = {
        ...initialState,
        results: { rows: [] }
      };

      const newState = applyAction(state, {
        type: 'SET_STRATEGY',
        payload: 'linear-positive'
      });

      expect(newState.dirtySinceCalc).toBe(true);
    });
  });

  describe('applyAction - pace inputs', () => {
    it('should set pace input for a split', () => {
      const state = { ...initialState };

      const newState = applyAction(state, {
        type: 'SET_PACE_INPUT',
        payload: { splitId: 'km-1', value: '05:00' }
      });

      expect(newState.paceInputsById['km-1']).toBe('05:00');
    });

    it('should update existing pace input', () => {
      const state = {
        ...initialState,
        paceInputsById: { 'km-1': '05:00' }
      };

      const newState = applyAction(state, {
        type: 'SET_PACE_INPUT',
        payload: { splitId: 'km-1', value: '05:30' }
      });

      expect(newState.paceInputsById['km-1']).toBe('05:30');
    });

    it('should clear pace input for a split', () => {
      const state = {
        ...initialState,
        paceInputsById: {
          'km-1': '05:00',
          'km-2': '05:30'
        }
      };

      const newState = applyAction(state, {
        type: 'CLEAR_PACE_INPUT',
        payload: { splitId: 'km-1' }
      });

      expect(newState.paceInputsById['km-1']).toBeUndefined();
      expect(newState.paceInputsById['km-2']).toBe('05:30');
    });

    it('should clear all pace inputs', () => {
      const state = {
        ...initialState,
        paceInputsById: {
          'km-1': '05:00',
          'km-2': '05:30',
          'km-3': '06:00'
        }
      };

      const newState = applyAction(state, {
        type: 'CLEAR_ALL_PACES'
      });

      expect(newState.paceInputsById).toEqual({});
    });

    it('should NOT mark dirty when pace input changes (dirty flag set on blur)', () => {
      const state = {
        ...initialState,
        results: { rows: [] }
      };

      const newState = applyAction(state, {
        type: 'SET_PACE_INPUT',
        payload: { splitId: 'km-1', value: '05:00' }
      });

      expect(newState.dirtySinceCalc).toBe(false);
    });
  });

  describe('applyAction - results', () => {
    it('should set results and clear dirty flag', () => {
      const state = {
        ...initialState,
        dirtySinceCalc: true
      };

      const mockResults = { rows: [{ id: 'km-1' }] };

      const newState = applyAction(state, {
        type: 'SET_RESULTS',
        payload: {
          results: mockResults,
          error: null,
          offendingIds: []
        }
      });

      expect(newState.results).toBe(mockResults);
      expect(newState.error).toBeNull();
      expect(newState.offendingIds).toEqual([]);
      expect(newState.dirtySinceCalc).toBe(false);
    });

    it('should set error and offending IDs', () => {
      const state = { ...initialState };

      const newState = applyAction(state, {
        type: 'SET_RESULTS',
        payload: {
          results: null,
          error: 'Fixed paces exceed goal time',
          offendingIds: ['km-1', 'km-2']
        }
      });

      expect(newState.results).toBeNull();
      expect(newState.error).toBe('Fixed paces exceed goal time');
      expect(newState.offendingIds).toEqual(['km-1', 'km-2']);
      expect(newState.dirtySinceCalc).toBe(false);
    });
  });

  describe('applyAction - mark dirty', () => {
    it('should set dirty flag when results exist', () => {
      const state = {
        ...initialState,
        results: { rows: [] }
      };

      const newState = applyAction(state, {
        type: 'MARK_DIRTY',
        payload: true
      });

      expect(newState.dirtySinceCalc).toBe(true);
    });

    it('should NOT set dirty flag when results do not exist', () => {
      const state = { ...initialState };

      const newState = applyAction(state, {
        type: 'MARK_DIRTY',
        payload: true
      });

      expect(newState.dirtySinceCalc).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not mutate original state', () => {
      const state = {
        ...initialState,
        paceInputsById: { 'km-1': '05:00' }
      };

      const stateCopy = JSON.parse(JSON.stringify(state));

      applyAction(state, {
        type: 'SET_PACE_INPUT',
        payload: { splitId: 'km-2', value: '06:00' }
      });

      // Original state should be unchanged
      expect(state).toEqual(stateCopy);
    });
  });
});
