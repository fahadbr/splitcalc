import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { expandInputTable } from './helpers.js';

describe('UI Calculate Button and Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should calculate and show results when Calculate button is clicked', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const resultsTable = container.querySelector('#results-table-root table');
    expect(resultsTable).toBeTruthy();

    const rows = resultsTable.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });

  it('should show error when fixed paces exceed goal time', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '10');

    expandInputTable();
    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    for (const input of paceInputs) {
      await user.clear(input);
      await user.type(input, '03:00');
    }

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const errorArea = container.querySelector('#error-message');
    expect(errorArea.classList.contains('visible')).toBe(true);
    expect(errorArea.textContent).toContain('exceed goal time');

    const inputRows = container.querySelectorAll('#input-table-root tbody tr');
    const offendingRows = Array.from(inputRows).filter(row =>
      row.classList.contains('offending')
    );
    expect(offendingRows.length).toBeGreaterThan(0);
  });

  it('should persist state only when Calculate is pressed', async () => {
    render(<App />);
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

    expect(localStorage.getItem('splitcalc-state')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const persisted = localStorage.getItem('splitcalc-state');
    expect(persisted).toBeTruthy();

    const parsed = JSON.parse(persisted);
    expect(parsed.goalTime.m).toBe('25');
  });

  it('should include pace inputs in persisted state', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

    expandInputTable();
    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    await user.type(paceInputs[0], '04:50');
    await user.type(paceInputs[2], '05:10');

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const persisted = JSON.parse(localStorage.getItem('splitcalc-state'));
    expect(persisted.paceInputsById['km-1']).toBe('04:50');
    expect(persisted.paceInputsById['km-3']).toBe('05:10');
  });

  it('should handle partial segments correctly in calculations', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: 'Custom' } });
    await user.clear(screen.getByLabelText('Custom Distance'));
    await user.type(screen.getByLabelText('Custom Distance'), '3.5');
    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '21');

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const resultsTable = container.querySelector('#results-table-root table');
    const rows = resultsTable.querySelectorAll('tbody tr');
    expect(rows.length).toBe(4);
  });
});
