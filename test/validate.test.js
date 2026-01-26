import { describe, it, expect } from 'vitest';
import { validateFixedPaces } from '../src/engine/validate.js';

describe('Validation', () => {
  const splits = [
    { id: 'km-1', distance: 1.0 },
    { id: 'km-2', distance: 1.0 },
    { id: 'km-3', distance: 1.0 },
    { id: 'km-4', distance: 1.0 },
    { id: 'km-5', distance: 1.0 }
  ];

  describe('validateFixedPaces', () => {
    it('should return ok when fixed paces are less than goal', () => {
      const goalSeconds = 1500; // 25 minutes
      const fixedPaces = {
        'km-1': 300, // 5:00
        'km-2': 300  // 5:00
      };
      // Fixed total: 600 seconds (2 * 300)
      // Remaining: 900 seconds

      const result = validateFixedPaces(goalSeconds, splits, fixedPaces);

      expect(result.ok).toBe(true);
      expect(result.fixedTotalSeconds).toBe(600);
      expect(result.remainingSeconds).toBe(900);
    });

    it('should return error when fixed paces exceed goal', () => {
      const goalSeconds = 1000; // ~16:40
      const fixedPaces = {
        'km-1': 300, // 5:00
        'km-2': 300, // 5:00
        'km-3': 300, // 5:00
        'km-4': 300  // 5:00
      };
      // Fixed total: 1200 seconds (4 * 300)
      // Remaining: -200 seconds

      const result = validateFixedPaces(goalSeconds, splits, fixedPaces);

      expect(result.ok).toBe(false);
      expect(result.errorMessage).toContain('200 seconds');
      expect(result.offendingIds).toEqual(['km-1', 'km-2', 'km-3', 'km-4']);
      expect(result.fixedTotalSeconds).toBe(1200);
      expect(result.remainingSeconds).toBe(-200);
    });

    it('should handle edge case when fixed equals goal', () => {
      const goalSeconds = 1500;
      const fixedPaces = {
        'km-1': 300,
        'km-2': 300,
        'km-3': 300,
        'km-4': 300,
        'km-5': 300
      };
      // Fixed total: 1500 seconds (5 * 300)
      // Remaining: 0 seconds

      const result = validateFixedPaces(goalSeconds, splits, fixedPaces);

      expect(result.ok).toBe(true);
      expect(result.fixedTotalSeconds).toBe(1500);
      expect(result.remainingSeconds).toBe(0);
    });

    it('should handle no fixed paces', () => {
      const goalSeconds = 1500;
      const fixedPaces = {};

      const result = validateFixedPaces(goalSeconds, splits, fixedPaces);

      expect(result.ok).toBe(true);
      expect(result.fixedTotalSeconds).toBe(0);
      expect(result.remainingSeconds).toBe(1500);
    });

    it('should handle partial segments with fixed paces', () => {
      const splitsWithPartial = [
        { id: 'mi-1', distance: 1.0 },
        { id: 'mi-2', distance: 1.0 },
        { id: 'mi-3-partial', distance: 0.5 }
      ];

      const goalSeconds = 1200; // 20 minutes
      const fixedPaces = {
        'mi-1': 400,              // 6:40 for 1.0 mi
        'mi-3-partial': 400       // 6:40 pace, but only 0.5 mi = 200 seconds
      };
      // Fixed total: 400 + 200 = 600
      // Remaining: 600

      const result = validateFixedPaces(goalSeconds, splitsWithPartial, fixedPaces);

      expect(result.ok).toBe(true);
      expect(result.fixedTotalSeconds).toBe(600);
      expect(result.remainingSeconds).toBe(600);
    });

    it('should include all fixed pace IDs in offendingIds when error occurs', () => {
      const goalSeconds = 500;
      const fixedPaces = {
        'km-1': 200,
        'km-3': 200,
        'km-5': 200
      };
      // Fixed total: 600
      // Remaining: -100

      const result = validateFixedPaces(goalSeconds, splits, fixedPaces);

      expect(result.ok).toBe(false);
      expect(result.offendingIds).toHaveLength(3);
      expect(result.offendingIds).toContain('km-1');
      expect(result.offendingIds).toContain('km-3');
      expect(result.offendingIds).toContain('km-5');
    });

    it('should handle float pace values', () => {
      const goalSeconds = 1000;
      const fixedPaces = {
        'km-1': 300.5,
        'km-2': 299.8
      };
      // Fixed total: 600.3
      // Remaining: 399.7

      const result = validateFixedPaces(goalSeconds, splits, fixedPaces);

      expect(result.ok).toBe(true);
      expect(result.fixedTotalSeconds).toBeCloseTo(600.3, 5);
      expect(result.remainingSeconds).toBeCloseTo(399.7, 5);
    });
  });
});
