import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App.jsx';

describe('UI Shell', () => {
  it('should have all required control elements', () => {
    render(<App />);

    expect(screen.getByLabelText('Distance')).toBeTruthy();
    expect(screen.getByLabelText('Custom Distance')).toBeTruthy();
    expect(screen.getByLabelText('Unit')).toBeTruthy();
    expect(screen.getByLabelText('Goal Time - Hours')).toBeTruthy();
    expect(screen.getByLabelText('Goal Time - Minutes')).toBeTruthy();
    expect(screen.getByLabelText('Goal Time - Seconds')).toBeTruthy();
    expect(screen.getByLabelText('Strategy')).toBeTruthy();
  });

  it('should have Calculate button with type="button"', () => {
    render(<App />);

    const calculateBtn = screen.getByRole('button', { name: 'Calculate' });
    expect(calculateBtn).toBeTruthy();
    expect(calculateBtn.getAttribute('type')).toBe('button');
  });

  it('should have Copy and Clear buttons', () => {
    render(<App />);

    const copyBtn = screen.getByRole('button', { name: 'Copy results to input' });
    expect(copyBtn.getAttribute('type')).toBe('button');

    const clearBtn = screen.getByRole('button', { name: 'Clear input table' });
    expect(clearBtn.getAttribute('type')).toBe('button');
  });

  it('should have message and table containers', () => {
    const { container } = render(<App />);

    expect(container.querySelector('#error-message')).toBeTruthy();
    expect(container.querySelector('#dirty-warning')).toBeTruthy();
    expect(container.querySelector('#input-table-root')).toBeTruthy();
    expect(container.querySelector('#results-table-root')).toBeTruthy();
  });

  it('should have custom distance input disabled by default', () => {
    render(<App />);

    expect(screen.getByLabelText('Custom Distance')).toBeDisabled();
  });

  it('should have correct default values', () => {
    render(<App />);

    expect(screen.getByLabelText('Distance').value).toBe('Half');
    expect(screen.getByLabelText('Unit').value).toBe('mi');
    expect(screen.getByLabelText('Strategy').value).toBe('even');
  });
});
