import { describe, it, expect } from 'vitest';
import { distributeEven, distributeLinear, distributeWeighted } from '../src/engine/strategies.js';
import { segmentTimeSeconds } from '../src/engine/compute.js';

describe('Strategy distributions', () => {
  describe('distributeEven', () => {
    it('should distribute evenly with equal distances', () => {
      const blankIds = ['km-1', 'km-2', 'km-3'];
      const blankDistances = [1.0, 1.0, 1.0];
      const remainingSeconds = 900; // 15 minutes

      const result = distributeEven({ blankIds, blankDistances, remainingSeconds });

      expect(result['km-1']).toBe(300);
      expect(result['km-2']).toBe(300);
      expect(result['km-3']).toBe(300);

      // Verify total matches
      const total = blankDistances.reduce((sum, d, i) => {
        return sum + segmentTimeSeconds(result[blankIds[i]], d);
      }, 0);
      expect(total).toBeCloseTo(remainingSeconds, 5);
    });

    it('should distribute evenly with varying distances', () => {
      const blankIds = ['mi-1', 'mi-2', 'mi-3'];
      const blankDistances = [1.0, 1.0, 0.5];
      const remainingSeconds = 750; // 12:30

      const result = distributeEven({ blankIds, blankDistances, remainingSeconds });

      // All should have same pace (seconds per unit)
      const pace = 750 / 2.5; // 300 seconds per mile
      expect(result['mi-1']).toBe(pace);
      expect(result['mi-2']).toBe(pace);
      expect(result['mi-3']).toBe(pace);

      // Verify total
      const total = blankDistances.reduce((sum, d, i) => {
        return sum + segmentTimeSeconds(result[blankIds[i]], d);
      }, 0);
      expect(total).toBeCloseTo(remainingSeconds, 5);
    });

    it('should handle single blank', () => {
      const blankIds = ['km-1'];
      const blankDistances = [1.0];
      const remainingSeconds = 300;

      const result = distributeEven({ blankIds, blankDistances, remainingSeconds });

      expect(result['km-1']).toBe(300);
    });

    it('should return empty object for empty blanks', () => {
      const result = distributeEven({
        blankIds: [],
        blankDistances: [],
        remainingSeconds: 300
      });

      expect(result).toEqual({});
    });
  });

  describe('distributeLinear', () => {
    it('should create negative split (pace decreases toward end)', () => {
      const blankIds = ['km-1', 'km-2', 'km-3'];
      const blankDistances = [1.0, 1.0, 1.0];
      const remainingSeconds = 900;

      const result = distributeLinear({
        mode: 'negative',
        blankIds,
        blankDistances,
        remainingSeconds
      });

      // First pace should be slower than last
      expect(result['km-1']).toBeGreaterThan(result['km-3']);

      // Verify total matches
      const total = blankDistances.reduce((sum, d, i) => {
        return sum + segmentTimeSeconds(result[blankIds[i]], d);
      }, 0);
      expect(total).toBeCloseTo(remainingSeconds, 2);

      // All paces should be positive
      blankIds.forEach(id => {
        expect(result[id]).toBeGreaterThan(0);
      });
    });

    it('should create positive split (pace increases toward end)', () => {
      const blankIds = ['km-1', 'km-2', 'km-3'];
      const blankDistances = [1.0, 1.0, 1.0];
      const remainingSeconds = 900;

      const result = distributeLinear({
        mode: 'positive',
        blankIds,
        blankDistances,
        remainingSeconds
      });

      // First pace should be faster than last
      expect(result['km-1']).toBeLessThan(result['km-3']);

      // Verify total matches
      const total = blankDistances.reduce((sum, d, i) => {
        return sum + segmentTimeSeconds(result[blankIds[i]], d);
      }, 0);
      expect(total).toBeCloseTo(remainingSeconds, 2);

      // All paces should be positive
      blankIds.forEach(id => {
        expect(result[id]).toBeGreaterThan(0);
      });
    });

    it('should handle varying distances', () => {
      const blankIds = ['mi-1', 'mi-2', 'mi-3'];
      const blankDistances = [1.0, 1.0, 0.5];
      const remainingSeconds = 750;

      const result = distributeLinear({
        mode: 'negative',
        blankIds,
        blankDistances,
        remainingSeconds
      });

      // Verify total matches
      const total = blankDistances.reduce((sum, d, i) => {
        return sum + segmentTimeSeconds(result[blankIds[i]], d);
      }, 0);
      expect(total).toBeCloseTo(remainingSeconds, 2);
    });

    it('should return error for invalid mode', () => {
      expect(() => {
        distributeLinear({
          mode: 'invalid',
          blankIds: ['km-1'],
          blankDistances: [1.0],
          remainingSeconds: 300
        });
      }).toThrow();
    });
  });

  describe('distributeWeighted', () => {
    it('should create weighted distribution with bias toward end', () => {
      const blankIds = ['km-1', 'km-2', 'km-3', 'km-4'];
      const blankDistances = [1.0, 1.0, 1.0, 1.0];
      const remainingSeconds = 1200;

      const result = distributeWeighted({
        blankIds,
        blankDistances,
        remainingSeconds,
        exponent: 2
      });

      // Earlier paces should differ from later ones (monotonic trend)
      const paces = blankIds.map(id => result[id]);

      // With negative split weighting, later segments should be faster (lower pace)
      // This is a general check that there's variation
      const firstHalf = (paces[0] + paces[1]) / 2;
      const secondHalf = (paces[2] + paces[3]) / 2;
      expect(firstHalf).not.toBe(secondHalf);

      // Verify total matches
      const total = blankDistances.reduce((sum, d, i) => {
        return sum + segmentTimeSeconds(result[blankIds[i]], d);
      }, 0);
      expect(total).toBeCloseTo(remainingSeconds, 2);

      // All paces should be positive
      blankIds.forEach(id => {
        expect(result[id]).toBeGreaterThan(0);
      });
    });

    it('should handle varying distances', () => {
      const blankIds = ['mi-1', 'mi-2', 'mi-3'];
      const blankDistances = [1.0, 1.0, 0.5];
      const remainingSeconds = 750;

      const result = distributeWeighted({
        blankIds,
        blankDistances,
        remainingSeconds,
        exponent: 2
      });

      // Verify total matches
      const total = blankDistances.reduce((sum, d, i) => {
        return sum + segmentTimeSeconds(result[blankIds[i]], d);
      }, 0);
      expect(total).toBeCloseTo(remainingSeconds, 2);
    });

    it('should use default exponent if not provided', () => {
      const blankIds = ['km-1', 'km-2'];
      const blankDistances = [1.0, 1.0];
      const remainingSeconds = 600;

      const result = distributeWeighted({
        blankIds,
        blankDistances,
        remainingSeconds
      });

      // Should work without error
      expect(result['km-1']).toBeDefined();
      expect(result['km-2']).toBeDefined();

      // Verify total
      const total = blankDistances.reduce((sum, d, i) => {
        return sum + segmentTimeSeconds(result[blankIds[i]], d);
      }, 0);
      expect(total).toBeCloseTo(remainingSeconds, 2);
    });
  });

  describe('common edge cases', () => {
    it('all strategies should handle single segment', () => {
      const blankIds = ['km-1'];
      const blankDistances = [1.0];
      const remainingSeconds = 300;

      const even = distributeEven({ blankIds, blankDistances, remainingSeconds });
      const linear = distributeLinear({ mode: 'negative', blankIds, blankDistances, remainingSeconds });
      const weighted = distributeWeighted({ blankIds, blankDistances, remainingSeconds });

      // All should converge to same pace for single segment
      expect(even['km-1']).toBe(300);
      expect(linear['km-1']).toBeCloseTo(300, 1);
      expect(weighted['km-1']).toBeCloseTo(300, 1);
    });
  });
});
