import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { expandInputTable } from './helpers.js';

describe('UI Results and Error Display', () => {
  it('should show placeholder text when no results exist', () => {
    render(<App />);

    expect(screen.getByText('Results will appear here after calculation')).toBeTruthy();
  });

  it('should render results table when Calculate is clicked with valid inputs', async () => {
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

    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toContain('KM 1');
    expect(firstRowCells[1].textContent).toBe('05:00');
  });

  it('should display error message when fixed paces exceed goal time', async () => {
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
  });

  it('should hide error message when no error exists', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const errorArea = container.querySelector('#error-message');
    expect(errorArea.classList.contains('visible')).toBe(false);
  });

  it('should apply offending class to input rows when error has offending IDs', async () => {
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

    const inputRows = container.querySelectorAll('#input-table-root tbody tr');
    const offendingRows = Array.from(inputRows).filter(row =>
      row.classList.contains('offending')
    );
    expect(offendingRows.length).toBeGreaterThan(0);
  });

  it('should show dirty warning when inputs change after calculation', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const dirtyWarning = container.querySelector('#dirty-warning');
    expect(dirtyWarning.classList.contains('visible')).toBe(false);

    expandInputTable();
    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    await user.type(paceInputs[0], '05:00');
    fireEvent.blur(paceInputs[0]);

    expect(dirtyWarning.classList.contains('visible')).toBe(true);
  });

  it('should hide dirty warning when dirtySinceCalc is false', () => {
    const { container } = render(<App />);

    const dirtyWarning = container.querySelector('#dirty-warning');
    expect(dirtyWarning.classList.contains('visible')).toBe(false);
  });

  it('should hide dirty warning after new results are set', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expandInputTable();
    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    await user.type(paceInputs[0], '05:00');
    fireEvent.blur(paceInputs[0]);

    const dirtyWarning = container.querySelector('#dirty-warning');
    expect(dirtyWarning.classList.contains('visible')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(dirtyWarning.classList.contains('visible')).toBe(false);
  });
});
