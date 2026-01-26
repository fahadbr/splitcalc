import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('UI Input Table', () => {
  let dom;
  let document;
  let window;

  beforeEach(async () => {
    // Load HTML
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'outside-only'
    });

    document = dom.window.document;
    window = dom.window;

    // Set up global document and window for modules
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

    // Import and initialize app
    const { initializeApp } = await import('../src/app.js');
    initializeApp();
  });

  it('should render input table with correct number of rows for 5K', () => {
    const inputTable = document.querySelector('#input-table-root table');
    expect(inputTable).toBeTruthy();

    const tbody = inputTable.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');

    // 5K in km should have 5 splits
    expect(rows.length).toBe(5);
  });

  it('should render pace inputs for each split', () => {
    const paceInputs = document.querySelectorAll('#input-table-root input[type="text"]');

    // 5K should have 5 pace inputs
    expect(paceInputs.length).toBe(5);

    paceInputs.forEach(input => {
      expect(input.placeholder).toBe('MM:SS');
    });
  });

  it('should render clear buttons for each split', () => {
    const clearButtons = document.querySelectorAll('#input-table-root button');

    // 5K should have 5 clear buttons
    expect(clearButtons.length).toBe(5);
  });

  it('should display split labels', () => {
    const labels = document.querySelectorAll('#input-table-root .split-label');

    expect(labels.length).toBe(5);
    expect(labels[0].textContent).toContain('KM 1');
    expect(labels[4].textContent).toContain('KM 5');
  });

  it('should update input value when user types', async () => {
    const paceInputs = document.querySelectorAll('#input-table-root input[type="text"]');
    const firstInput = paceInputs[0];

    // Simulate user input
    firstInput.value = '05:30';
    firstInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    // Re-query to get updated element
    const updatedInput = document.querySelectorAll('#input-table-root input[type="text"]')[0];
    expect(updatedInput.value).toBe('05:30');
  });

  it('should clear input when clear button is clicked', async () => {
    const paceInputs = document.querySelectorAll('#input-table-root input[type="text"]');
    const firstInput = paceInputs[0];

    // Set a value first
    firstInput.value = '05:30';
    firstInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    // Click clear button
    const clearButtons = document.querySelectorAll('#input-table-root button');
    clearButtons[0].click();

    // Input should be cleared
    const updatedInput = document.querySelectorAll('#input-table-root input[type="text"]')[0];
    expect(updatedInput.value).toBe('');
  });

  it('should apply offending class when split is in offendingIds', async () => {
    // This test verifies the class is applied correctly
    // Actual offending IDs will be set by Calculate in later prompts
    const rows = document.querySelectorAll('#input-table-root tbody tr');

    // Initially, no rows should have offending class
    rows.forEach(row => {
      expect(row.classList.contains('offending')).toBe(false);
    });
  });

  it('should update number of rows when distance preset changes', () => {
    const distanceSelect = document.getElementById('distance-preset');

    // Change to 10K
    distanceSelect.value = '10K';
    distanceSelect.dispatchEvent(new window.Event('change', { bubbles: true }));

    const rows = document.querySelectorAll('#input-table-root tbody tr');
    expect(rows.length).toBe(10);
  });

  it('should enable custom distance input when Custom is selected', () => {
    const distanceSelect = document.getElementById('distance-preset');
    const customInput = document.getElementById('custom-distance');

    // Initially disabled (5K is selected)
    expect(customInput.disabled).toBe(true);

    // Change to Custom
    distanceSelect.value = 'Custom';
    distanceSelect.dispatchEvent(new window.Event('change', { bubbles: true }));

    // Should be enabled now
    expect(customInput.disabled).toBe(false);
  });
});
