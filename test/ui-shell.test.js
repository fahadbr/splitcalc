import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

describe('UI Shell', () => {
  let dom;
  let document;

  beforeEach(() => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  it('should have all required control elements', () => {
    expect(document.getElementById('distance-preset')).toBeTruthy();
    expect(document.getElementById('custom-distance')).toBeTruthy();
    expect(document.getElementById('unit')).toBeTruthy();
    expect(document.getElementById('goal-hours')).toBeTruthy();
    expect(document.getElementById('goal-minutes')).toBeTruthy();
    expect(document.getElementById('goal-seconds')).toBeTruthy();
    expect(document.getElementById('strategy')).toBeTruthy();
  });

  it('should have Calculate button with type="button"', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    expect(calculateBtn).toBeTruthy();
    expect(calculateBtn.tagName).toBe('BUTTON');
    expect(calculateBtn.getAttribute('type')).toBe('button');
  });

  it('should have Copy and Clear buttons', () => {
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');

    expect(copyBtn).toBeTruthy();
    expect(copyBtn.getAttribute('type')).toBe('button');

    expect(clearBtn).toBeTruthy();
    expect(clearBtn.getAttribute('type')).toBe('button');
  });

  it('should have message and table containers', () => {
    expect(document.getElementById('error-message')).toBeTruthy();
    expect(document.getElementById('dirty-warning')).toBeTruthy();
    expect(document.getElementById('input-table-root')).toBeTruthy();
    expect(document.getElementById('results-table-root')).toBeTruthy();
  });

  it('should have custom distance input disabled by default', () => {
    const customDistance = document.getElementById('custom-distance');
    expect(customDistance.hasAttribute('disabled')).toBe(true);
  });

  it('should have proper label associations', () => {
    const distanceLabel = document.querySelector('label[for="distance-preset"]');
    const unitLabel = document.querySelector('label[for="unit"]');
    const hoursLabel = document.querySelector('label[for="goal-hours"]');

    expect(distanceLabel).toBeTruthy();
    expect(unitLabel).toBeTruthy();
    expect(hoursLabel).toBeTruthy();
  });
});
