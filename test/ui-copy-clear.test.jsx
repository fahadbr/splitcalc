import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { expandInputTable } from './helpers.js';

describe('UI Copy and Clear functionality', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Copy results to input', () => {
    it('should fill only blank inputs with calculated paces', async () => {
      const { container } = render(<App />);
      const user = userEvent.setup();

      fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
      fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
      await user.clear(screen.getByLabelText('Goal Time - Minutes'));
      await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

      await user.click(screen.getByRole('button', { name: 'Calculate' }));

      expandInputTable();
      const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
      await user.clear(paceInputs[0]);
      await user.type(paceInputs[0], '04:30');

      await user.click(screen.getByRole('button', { name: 'Copy results to input' }));

      const updatedInputs = container.querySelectorAll('#input-table-root input[type="text"]');
      expect(updatedInputs[0].value).toBe('04:30');
      expect(updatedInputs[1].value).toBe('05:00');
      expect(updatedInputs[2].value).toBe('05:00');
      expect(updatedInputs[3].value).toBe('05:00');
      expect(updatedInputs[4].value).toBe('05:00');
    });

    it('should mark dirty after copying results', async () => {
      const { container } = render(<App />);
      const user = userEvent.setup();

      fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
      fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
      await user.clear(screen.getByLabelText('Goal Time - Minutes'));
      await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

      await user.click(screen.getByRole('button', { name: 'Calculate' }));

      const dirtyWarning = container.querySelector('#dirty-warning');
      expect(dirtyWarning.classList.contains('visible')).toBe(false);

      await user.click(screen.getByRole('button', { name: 'Copy results to input' }));

      expect(dirtyWarning.classList.contains('visible')).toBe(true);
    });
  });

  describe('Clear input table', () => {
    it('should clear all pace inputs', async () => {
      const { container } = render(<App />);
      const user = userEvent.setup();
      expandInputTable();

      const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
      await user.type(paceInputs[0], '05:00');
      await user.type(paceInputs[2], '05:30');

      await user.click(screen.getByRole('button', { name: 'Clear input table' }));

      const updatedInputs = container.querySelectorAll('#input-table-root input[type="text"]');
      updatedInputs.forEach(input => {
        expect(input.value).toBe('');
      });
    });

    it('should mark dirty if results exist when clearing', async () => {
      const { container } = render(<App />);
      const user = userEvent.setup();

      await user.clear(screen.getByLabelText('Goal Time - Minutes'));
      await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');
      await user.click(screen.getByRole('button', { name: 'Calculate' }));

      await user.click(screen.getByRole('button', { name: 'Clear input table' }));

      const dirtyWarning = container.querySelector('#dirty-warning');
      expect(dirtyWarning.classList.contains('visible')).toBe(true);
    });

    it('should not update persisted state until next Calculate', async () => {
      const { container } = render(<App />);
      const user = userEvent.setup();

      fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
      fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
      await user.clear(screen.getByLabelText('Goal Time - Minutes'));
      await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

      expandInputTable();
      const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
      await user.type(paceInputs[0], '05:00');

      await user.click(screen.getByRole('button', { name: 'Calculate' }));

      let persisted = JSON.parse(localStorage.getItem('splitcalc-state'));
      expect(persisted.paceInputsById['km-1']).toBe('05:00');

      await user.click(screen.getByRole('button', { name: 'Clear input table' }));

      persisted = JSON.parse(localStorage.getItem('splitcalc-state'));
      expect(persisted.paceInputsById['km-1']).toBe('05:00');

      await user.click(screen.getByRole('button', { name: 'Calculate' }));

      persisted = JSON.parse(localStorage.getItem('splitcalc-state'));
      expect(persisted.paceInputsById['km-1']).toBeUndefined();
    });
  });

  describe('Enter key to calculate', () => {
    it('should trigger calculation when Enter is pressed in a pace input', async () => {
      const { container } = render(<App />);
      const user = userEvent.setup();

      fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
      fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
      await user.clear(screen.getByLabelText('Goal Time - Minutes'));
      await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

      expandInputTable();
      const paceInput = container.querySelectorAll('#input-table-root input[type="text"]')[0];
      paceInput.focus();
      fireEvent.keyDown(paceInput, { key: 'Enter', bubbles: true });

      const resultsTable = container.querySelector('#results-table-root table');
      expect(resultsTable).toBeTruthy();

      const rows = resultsTable.querySelectorAll('tbody tr');
      expect(rows.length).toBe(5);
    });
  });
});
