import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('UI Results and Error Display', () => {
  let dom;
  let document;
  let window;
  let applyAction;
  let state;
  let splits;
  let render;

  beforeEach(async () => {
    // Load HTML
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'outside-only'
    });

    document = dom.window.document;
    window = dom.window;

    // Set up globals
    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
    global.Event = window.Event;

    // Mock localStorage
    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      }
    };

    // Import modules
    const { initializeDOMRefs } = await import('../src/ui/dom.js');
    const renderModule = await import('../src/ui/render.js');
    const stateModule = await import('../src/state/store.js');

    render = renderModule.render;
    applyAction = stateModule.applyAction;
    state = stateModule.initialState;
    splits = stateModule.deriveSplits(state);

    initializeDOMRefs();
  });

  it('should show placeholder text when no results exist', () => {
    const dispatch = () => {};
    render(state, splits, dispatch);

    const resultsRoot = document.getElementById('results-table-root');
    expect(resultsRoot.textContent).toContain('Results will appear here');
  });

  it('should render results table when results exist', () => {
    // Set mock results
    const mockResults = {
      rows: [
        {
          id: 'km-1',
          label: 'KM 1 (1.0 km)',
          paceDisplay: '05:00',
          segmentDisplay: '05:00',
          cumulativeDisplay: '0:05:00'
        },
        {
          id: 'km-2',
          label: 'KM 2 (1.0 km)',
          paceDisplay: '05:00',
          segmentDisplay: '05:00',
          cumulativeDisplay: '0:10:00'
        }
      ]
    };

    state = applyAction(state, {
      type: 'SET_RESULTS',
      payload: { results: mockResults, error: null, offendingIds: [] }
    });

    const dispatch = () => {};
    render(state, splits, dispatch);

    const resultsTable = document.querySelector('#results-table-root table');
    expect(resultsTable).toBeTruthy();

    const rows = resultsTable.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    // Check first row content
    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toContain('KM 1');
    expect(firstRowCells[1].textContent).toBe('05:00');
    expect(firstRowCells[2].textContent).toBe('05:00');
    expect(firstRowCells[3].textContent).toBe('0:05:00');
  });

  it('should display error message when error exists', () => {
    state = applyAction(state, {
      type: 'SET_RESULTS',
      payload: {
        results: null,
        error: 'Fixed paces exceed goal time by 120 seconds',
        offendingIds: ['km-1', 'km-2']
      }
    });

    const dispatch = () => {};
    render(state, splits, dispatch);

    const errorArea = document.getElementById('error-message');
    expect(errorArea.classList.contains('visible')).toBe(true);
    expect(errorArea.textContent).toContain('Fixed paces exceed goal time');
  });

  it('should hide error message when no error exists', () => {
    state = applyAction(state, {
      type: 'SET_RESULTS',
      payload: {
        results: { rows: [] },
        error: null,
        offendingIds: []
      }
    });

    const dispatch = () => {};
    render(state, splits, dispatch);

    const errorArea = document.getElementById('error-message');
    expect(errorArea.classList.contains('visible')).toBe(false);
  });

  it('should apply offending class to input rows when error has offending IDs', async () => {
    // Import deriveSplits
    const { deriveSplits } = await import('../src/state/store.js');

    // Set state to 5K
    state = applyAction(state, {
      type: 'SET_DISTANCE_PRESET',
      payload: '5K'
    });
    state = applyAction(state, {
      type: 'SET_UNIT',
      payload: 'km'
    });
    splits = deriveSplits(state);

    state = applyAction(state, {
      type: 'SET_RESULTS',
      payload: {
        results: null,
        error: 'Test error',
        offendingIds: ['km-1', 'km-2']
      }
    });

    const dispatch = () => {};
    render(state, splits, dispatch);

    const inputRows = document.querySelectorAll('#input-table-root tbody tr');
    expect(inputRows[0].classList.contains('offending')).toBe(true);
    expect(inputRows[1].classList.contains('offending')).toBe(true);
    expect(inputRows[2].classList.contains('offending')).toBe(false);
  });

  it('should show dirty warning when dirtySinceCalc is true', () => {
    state = applyAction(state, {
      type: 'SET_RESULTS',
      payload: {
        results: { rows: [] },
        error: null,
        offendingIds: []
      }
    });

    // Now change an input
    state = applyAction(state, {
      type: 'SET_PACE_INPUT',
      payload: { splitId: 'km-1', value: '05:00' }
    });

    // Then blur (focus lost) which sets dirty flag
    state = applyAction(state, {
      type: 'MARK_DIRTY',
      payload: true
    });

    const dispatch = () => {};
    render(state, splits, dispatch);

    const dirtyWarning = document.getElementById('dirty-warning');
    expect(dirtyWarning.classList.contains('visible')).toBe(true);
    expect(dirtyWarning.textContent).toContain('Inputs changed');
  });

  it('should hide dirty warning when dirtySinceCalc is false', () => {
    const dispatch = () => {};
    render(state, splits, dispatch);

    const dirtyWarning = document.getElementById('dirty-warning');
    expect(dirtyWarning.classList.contains('visible')).toBe(false);
  });

  it('should hide dirty warning after new results are set', () => {
    // Set dirty flag
    state = applyAction(state, {
      type: 'MARK_DIRTY',
      payload: true
    });

    // Set new results (should clear dirty)
    state = applyAction(state, {
      type: 'SET_RESULTS',
      payload: {
        results: { rows: [] },
        error: null,
        offendingIds: []
      }
    });

    const dispatch = () => {};
    render(state, splits, dispatch);

    const dirtyWarning = document.getElementById('dirty-warning');
    expect(dirtyWarning.classList.contains('visible')).toBe(false);
  });
});
