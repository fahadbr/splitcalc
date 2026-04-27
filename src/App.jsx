import { useAppState } from './hooks/useAppState.js';
import { calculateSplits } from './engine/calculate.js';
import { toSeconds } from './engine/time.js';
import { savePersistedState, createStateSnapshot } from './persistence/storage.js';
import ControlsPanel from './components/ControlsPanel.jsx';
import InputTable from './components/InputTable.jsx';
import ResultsTable from './components/ResultsTable.jsx';

export default function App() {
  const { state, splits, dispatch } = useAppState();

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
              <h3>Input Table</h3>
              <div id="input-table-root">
                <InputTable splits={splits} state={state} dispatch={dispatch} />
              </div>
            </div>

            <div className="table-wrapper">
              <h3>Results</h3>
              <div id="results-table-root">
                <ResultsTable results={state.results} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
