import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { expandInputTable } from './helpers.js';

describe('UI Input Table', () => {
  function selectDistance(preset) {
    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: preset } });
  }

  function selectUnit(unit) {
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: unit } });
  }

  it('should render input table with correct number of rows for 5K', () => {
    const { container } = render(<App />);

    selectUnit('km');
    selectDistance('5K');
    expandInputTable();

    const rows = container.querySelectorAll('#input-table-root tbody tr');
    expect(rows.length).toBe(5);
  });

  it('should render pace inputs for each split', () => {
    const { container } = render(<App />);

    selectUnit('km');
    selectDistance('5K');
    expandInputTable();

    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    expect(paceInputs.length).toBe(5);

    paceInputs.forEach(input => {
      expect(input.placeholder).toBe('MM:SS');
    });
  });

  it('should render clear buttons for each split', () => {
    const { container } = render(<App />);

    selectUnit('km');
    selectDistance('5K');
    expandInputTable();

    const clearButtons = container.querySelectorAll('#input-table-root button');
    expect(clearButtons.length).toBe(5);
  });

  it('should display split labels', () => {
    const { container } = render(<App />);

    selectUnit('km');
    selectDistance('5K');
    expandInputTable();

    const labels = container.querySelectorAll('#input-table-root .split-label');
    expect(labels.length).toBe(5);
    expect(labels[0].textContent).toContain('KM 1');
    expect(labels[4].textContent).toContain('KM 5');
  });

  it('should update input value when user types', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();
    expandInputTable();

    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    await user.type(paceInputs[0], '05:30');

    expect(paceInputs[0].value).toBe('05:30');
  });

  it('should clear input when clear button is clicked', async () => {
    const { container } = render(<App />);
    const user = userEvent.setup();
    expandInputTable();

    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    await user.type(paceInputs[0], '05:30');
    expect(paceInputs[0].value).toBe('05:30');

    const clearButtons = container.querySelectorAll('#input-table-root button');
    await user.click(clearButtons[0]);

    expect(container.querySelectorAll('#input-table-root input[type="text"]')[0].value).toBe('');
  });

  it('should not apply offending class initially', () => {
    const { container } = render(<App />);
    expandInputTable();

    const rows = container.querySelectorAll('#input-table-root tbody tr');
    rows.forEach(row => {
      expect(row.classList.contains('offending')).toBe(false);
    });
  });

  it('should update number of rows when distance preset changes', () => {
    const { container } = render(<App />);

    selectUnit('km');
    selectDistance('10K');
    expandInputTable();

    const rows = container.querySelectorAll('#input-table-root tbody tr');
    expect(rows.length).toBe(10);
  });

  it('should enable custom distance input when Custom is selected', () => {
    render(<App />);

    const customInput = screen.getByLabelText('Custom Distance');
    expect(customInput).toBeDisabled();

    selectDistance('Custom');
    expect(customInput).not.toBeDisabled();
  });
});
