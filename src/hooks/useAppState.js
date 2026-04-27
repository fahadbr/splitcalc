import { useReducer, useMemo, useEffect, useRef } from 'react';
import { applyAction, initialState, deriveSplits } from '../state/store.js';
import { loadPersistedState } from '../persistence/storage.js';

function initState() {
  const persisted = loadPersistedState();
  if (!persisted) return initialState;
  return {
    ...initialState,
    distancePresetKey: persisted.distancePresetKey || initialState.distancePresetKey,
    customDistanceValue: persisted.customDistanceValue || initialState.customDistanceValue,
    unit: persisted.unit || initialState.unit,
    goalTime: persisted.goalTime || initialState.goalTime,
    strategyKey: persisted.strategyKey || initialState.strategyKey,
    paceInputsById: persisted.paceInputsById || initialState.paceInputsById
  };
}

export function useAppState() {
  const [state, dispatch] = useReducer(applyAction, null, initState);
  const initialized = useRef(false);

  const splits = useMemo(
    () => deriveSplits(state),
    [state.distancePresetKey, state.customDistanceValue, state.unit]
  );

  useEffect(() => {
    initialized.current = true;
  }, []);

  return { state, splits, dispatch, initialized };
}
