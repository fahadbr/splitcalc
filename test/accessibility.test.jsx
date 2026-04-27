import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App.jsx';
import { expandInputTable } from './helpers.js';

describe('Accessibility', () => {
  it('should have proper labels for all form controls', () => {
    render(<App />);

    const labels = ['Distance', 'Custom Distance', 'Unit',
      'Goal Time - Hours', 'Goal Time - Minutes', 'Goal Time - Seconds', 'Strategy'];

    labels.forEach(label => {
      expect(screen.getByLabelText(label)).toBeTruthy();
    });
  });

  it('should have inputmode attributes on numeric inputs', () => {
    render(<App />);

    expect(screen.getByLabelText('Goal Time - Hours').getAttribute('inputmode')).toBe('numeric');
    expect(screen.getByLabelText('Goal Time - Minutes').getAttribute('inputmode')).toBe('numeric');
    expect(screen.getByLabelText('Goal Time - Seconds').getAttribute('inputmode')).toBe('numeric');
    expect(screen.getByLabelText('Custom Distance').getAttribute('inputmode')).toBe('decimal');
  });

  it('should have semantic HTML structure', () => {
    const { container } = render(<App />);

    expect(container.querySelector('header')).toBeTruthy();
    expect(container.querySelector('main')).toBeTruthy();
    expect(container.querySelector('h1')).toBeTruthy();
  });

  it('should have ARIA live regions for dynamic content', () => {
    const { container } = render(<App />);

    const errorMessage = container.querySelector('#error-message');
    expect(errorMessage.getAttribute('role')).toBe('alert');
    expect(errorMessage.getAttribute('aria-live')).toBe('polite');

    const dirtyWarning = container.querySelector('#dirty-warning');
    expect(dirtyWarning.getAttribute('role')).toBe('status');
    expect(dirtyWarning.getAttribute('aria-live')).toBe('polite');
  });

  it('should have proper button types to prevent form submission', () => {
    render(<App />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.getAttribute('type')).toBe('button');
    });
  });

  it('should have focusable controls in logical order', () => {
    const { container } = render(<App />);

    const focusableElements = container.querySelectorAll(
      'input:not([disabled]), select:not([disabled]), button:not([disabled])'
    );

    expect(focusableElements.length).toBeGreaterThan(0);

    focusableElements.forEach(el => {
      const tabindex = el.getAttribute('tabindex');
      if (tabindex !== null) {
        expect(parseInt(tabindex)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  it('should have table containers for dynamic content', () => {
    const { container } = render(<App />);

    expect(container.querySelector('#results-table-root')).toBeTruthy();

    expandInputTable();
    expect(container.querySelector('#input-table-root')).toBeTruthy();
  });
});
