import { useState, useMemo, useRef } from 'react';
import { useAppState } from './hooks/useAppState.js';
import { calculateSplits } from './engine/calculate.js';
import { toSeconds, formatPace } from './engine/time.js';
import { resolveDistance } from './domain/distance.js';
import { savePersistedState, createStateSnapshot } from './persistence/storage.js';
import ControlsPanel from './components/ControlsPanel.jsx';
import InputTable from './components/InputTable.jsx';
import ResultsTable from './components/ResultsTable.jsx';

export default function App() {
  const { state, splits, dispatch } = useAppState();
  const [inputTableVisible, setInputTableVisible] = useState(false);
  const resultsRef = useRef(null);

  const averagePace = useMemo(() => {
    try {
      const goalSeconds = toSeconds(state.goalTime);
      if (goalSeconds <= 0) return null;
      const distance = resolveDistance(state.distancePresetKey, state.customDistanceValue, state.unit);
      if (!distance || distance <= 0) return null;
      return formatPace(goalSeconds / distance);
    } catch {
      return null;
    }
  }, [state.goalTime, state.distancePresetKey, state.customDistanceValue, state.unit]);

  function handleCalculate() {
    try {
      const goalSeconds = toSeconds(state.goalTime);

      if (goalSeconds <= 0) {
        dispatch({ type: 'SET_RESULTS', payload: { results: null, error: 'Goal time must be greater than zero', offendingIds: [] } });
        return;
      }

      const result = calculateSplits({
        splits,
        goalSeconds,
        strategyKey: state.strategyKey,
        fixedPaceStringsById: state.paceInputsById
      });

      if (result.ok) {
        dispatch({ type: 'SET_RESULTS', payload: { results: result, error: null, offendingIds: [] } });
        savePersistedState(createStateSnapshot(state));
        setTimeout(() => {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          resultsRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }, 0);
      } else {
        dispatch({ type: 'SET_RESULTS', payload: { results: null, error: result.errorMessage, offendingIds: result.offendingIds } });
      }
    } catch (error) {
      dispatch({ type: 'SET_RESULTS', payload: { results: null, error: `Calculation error: ${error.message}`, offendingIds: [] } });
    }
  }

  function handleCopyResults() {
    if (!state.results) return;

    state.results.rows.forEach(row => {
      const currentInput = state.paceInputsById[row.id];
      if (!currentInput || currentInput.trim() === '') {
        dispatch({ type: 'SET_PACE_INPUT', payload: { splitId: row.id, value: row.paceDisplay } });
      }
    });

    if (state.results) {
      dispatch({ type: 'MARK_DIRTY', payload: true });
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.splitId) {
      e.preventDefault();
      handleCalculate();
    }
  }

  return (
    <>
      <header>
        <h1>Running Split Calculator</h1>
      </header>

      <main onKeyDown={handleKeyDown}>
        <section className="inputs-section">
          <h2>Inputs</h2>

          <ControlsPanel state={state} dispatch={dispatch} />

          <div
            className={`message-area${state.error ? ' visible' : ''}`}
            id="error-message"
            role="alert"
            aria-live="polite"
          >
            {state.error || ''}
          </div>

          <div
            className={`message-area warning${state.dirtySinceCalc ? ' visible' : ''}`}
            id="dirty-warning"
            role="status"
            aria-live="polite"
          >
            {state.dirtySinceCalc ? 'Inputs changed — recalculate to update results' : ''}
          </div>

          <div className="button-group">
            <button type="button" id="calculate-btn" className="primary" onClick={handleCalculate}>
              Calculate
            </button>
            <button type="button" id="copy-btn" onClick={handleCopyResults}>
              Copy results to input
            </button>
            <button type="button" id="clear-btn" onClick={() => dispatch({ type: 'CLEAR_ALL_PACES' })}>
              Clear input table
            </button>
          </div>
        </section>

        <section className="tables-section">
          <div className="table-container">
            <div className="table-wrapper">
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setInputTableVisible(v => !v)}
                aria-expanded={inputTableVisible}
                aria-controls="input-table-root"
              >
                <h3>Pace Input Table {inputTableVisible ? '\u25B2' : '\u25BC'}</h3>
              </button>
              {inputTableVisible && (
                <div id="input-table-root">
                  <InputTable splits={splits} state={state} dispatch={dispatch} />
                </div>
              )}
            </div>

            <div className="table-wrapper" ref={resultsRef}>
              <h3>Results</h3>
              <div id="results-table-root">
                <ResultsTable results={state.results} averagePace={averagePace} unit={state.unit} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
