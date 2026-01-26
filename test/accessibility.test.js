import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Accessibility', () => {
  let dom;
  let document;

  beforeEach(() => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  it('should have proper labels for all form controls', () => {
    // Check that every input/select has an associated label
    const inputs = document.querySelectorAll('input:not([type="button"]):not([type="submit"]), select');

    inputs.forEach(input => {
      const id = input.getAttribute('id');
      expect(id).toBeTruthy();

      const label = document.querySelector(`label[for="${id}"]`);
      expect(label).toBeTruthy();
      expect(label.textContent.trim()).not.toBe('');
    });
  });

  it('should have inputmode attributes on numeric inputs', () => {
    const goalHours = document.getElementById('goal-hours');
    const goalMinutes = document.getElementById('goal-minutes');
    const goalSeconds = document.getElementById('goal-seconds');
    const customDistance = document.getElementById('custom-distance');

    expect(goalHours.getAttribute('inputmode')).toBe('numeric');
    expect(goalMinutes.getAttribute('inputmode')).toBe('numeric');
    expect(goalSeconds.getAttribute('inputmode')).toBe('numeric');
    expect(customDistance.getAttribute('inputmode')).toBe('decimal');
  });

  it('should have semantic HTML structure', () => {
    expect(document.querySelector('header')).toBeTruthy();
    expect(document.querySelector('main')).toBeTruthy();
    expect(document.querySelector('h1')).toBeTruthy();
  });

  it('should have ARIA live regions for dynamic content', () => {
    const errorMessage = document.getElementById('error-message');
    const dirtyWarning = document.getElementById('dirty-warning');

    expect(errorMessage.getAttribute('role')).toBe('alert');
    expect(errorMessage.getAttribute('aria-live')).toBe('polite');

    expect(dirtyWarning.getAttribute('role')).toBe('status');
    expect(dirtyWarning.getAttribute('aria-live')).toBe('polite');
  });

  it('should have proper button types to prevent form submission', () => {
    const buttons = document.querySelectorAll('button');

    buttons.forEach(button => {
      // All buttons should have type="button" to prevent form submission
      expect(button.getAttribute('type')).toBe('button');
    });
  });

  it('should have lang attribute on html element', () => {
    const html = document.documentElement;
    expect(html.getAttribute('lang')).toBe('en');
  });

  it('should have proper meta viewport for mobile', () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport).toBeTruthy();
    expect(viewport.getAttribute('content')).toContain('width=device-width');
  });

  it('should have iOS-specific meta tags for PWA', () => {
    const appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');

    expect(appleCapable).toBeTruthy();
    expect(appleCapable.getAttribute('content')).toBe('yes');

    expect(appleTitle).toBeTruthy();
    expect(appleTitle.getAttribute('content')).toBeTruthy();
  });

  it('should have manifest link for PWA', () => {
    const manifest = document.querySelector('link[rel="manifest"]');
    expect(manifest).toBeTruthy();
    expect(manifest.getAttribute('href')).toContain('manifest');
  });

  it('should have theme-color meta tag', () => {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    expect(themeColor).toBeTruthy();
    expect(themeColor.getAttribute('content')).toBe('#2563eb');
  });

  describe('Keyboard navigation', () => {
    it('should have focusable controls in logical order', () => {
      const focusableElements = document.querySelectorAll(
        'input:not([disabled]), select:not([disabled]), button:not([disabled])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // Verify no negative tabindex (which would remove from tab order)
      focusableElements.forEach(el => {
        const tabindex = el.getAttribute('tabindex');
        if (tabindex !== null) {
          expect(parseInt(tabindex)).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Table accessibility', () => {
    it('should have table containers for dynamic content', () => {
      // Tables are created dynamically, but containers should exist
      const inputTableRoot = document.getElementById('input-table-root');
      const resultsTableRoot = document.getElementById('results-table-root');

      expect(inputTableRoot).toBeTruthy();
      expect(resultsTableRoot).toBeTruthy();
    });
  });
});
