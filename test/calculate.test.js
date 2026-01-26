import { describe, it, expect } from 'vitest';
import { calculateSplits } from '../src/engine/calculate.js';

describe('Calculation engine', () => {
  const splits5K = [
    { id: 'km-1', distance: 1.0, label: 'KM 1 (1.0 km)' },
    { id: 'km-2', distance: 1.0, label: 'KM 2 (1.0 km)' },
    { id: 'km-3', distance: 1.0, label: 'KM 3 (1.0 km)' },
    { id: 'km-4', distance: 1.0, label: 'KM 4 (1.0 km)' },
    { id: 'km-5', distance: 1.0, label: 'KM 5 (1.0 km)' }
  ];

  describe('no fixed paces + even strategy', () => {
    it('should distribute evenly across all splits', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500, // 25:00
        strategyKey: 'even',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(true);
      expect(result.rows).toHaveLength(5);

      // All paces should be 300 seconds (5:00 per km)
      result.rows.forEach(row => {
        expect(row.paceSecondsPerUnit).toBe(300);
        expect(row.paceDisplay).toBe('05:00');
      });

      // Cumulative times should increase
      expect(result.rows[0].cumulativeSeconds).toBe(300);
      expect(result.rows[1].cumulativeSeconds).toBe(600);
      expect(result.rows[2].cumulativeSeconds).toBe(900);
      expect(result.rows[3].cumulativeSeconds).toBe(1200);
      expect(result.rows[4].cumulativeSeconds).toBe(1500);

      // Last cumulative should match goal
      expect(result.rows[4].cumulativeDisplay).toBe('0:25:00');
    });
  });

  describe('fixed pace anchors + blanks computed', () => {
    it('should use fixed paces and distribute remaining time', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500, // 25:00
        strategyKey: 'even',
        fixedPaceStringsById: {
          'km-1': '04:00', // 240 seconds
          'km-3': '04:00'  // 240 seconds
        }
      });

      expect(result.ok).toBe(true);

      // Fixed paces should be preserved
      expect(result.rows[0].paceDisplay).toBe('04:00');
      expect(result.rows[2].paceDisplay).toBe('04:00');

      // Remaining: 1500 - 480 = 1020 seconds for 3 km
      // Even pace: 1020 / 3 = 340 seconds per km (5:40)
      expect(result.rows[1].paceSecondsPerUnit).toBeCloseTo(340, 5);
      expect(result.rows[3].paceSecondsPerUnit).toBeCloseTo(340, 5);
      expect(result.rows[4].paceSecondsPerUnit).toBeCloseTo(340, 5);

      // Last cumulative should match goal
      expect(result.rows[4].cumulativeSeconds).toBeCloseTo(1500, 1);
    });
  });

  describe('partial segment handling', () => {
    it('should handle partial segments correctly', () => {
      const splitsWithPartial = [
        { id: 'mi-1', distance: 1.0, label: 'Mile 1 (1.0 mi)' },
        { id: 'mi-2', distance: 1.0, label: 'Mile 2 (1.0 mi)' },
        { id: 'mi-3', distance: 1.0, label: 'Mile 3 (1.0 mi)' },
        { id: 'mi-4-partial', distance: 0.11, label: 'Last segment (0.11 mi)' }
      ];

      const result = calculateSplits({
        splits: splitsWithPartial,
        goalSeconds: 1800, // 30:00
        strategyKey: 'even',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(true);
      expect(result.rows).toHaveLength(4);

      // Even pace across all: 1800 / 3.11 ≈ 578.8 seconds per mile
      const expectedPace = 1800 / 3.11;

      result.rows.forEach((row, i) => {
        expect(row.paceSecondsPerUnit).toBeCloseTo(expectedPace, 1);

        if (i < 3) {
          // Full miles
          expect(row.segmentSeconds).toBeCloseTo(expectedPace, 1);
        } else {
          // Partial mile
          expect(row.segmentSeconds).toBeCloseTo(expectedPace * 0.11, 1);
        }
      });

      // Last cumulative should match goal
      expect(result.rows[3].cumulativeSeconds).toBeCloseTo(1800, 1);
    });
  });

  describe('error handling', () => {
    it('should return error when fixed paces exceed goal', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1000, // 16:40
        strategyKey: 'even',
        fixedPaceStringsById: {
          'km-1': '04:00',
          'km-2': '04:00',
          'km-3': '04:00',
          'km-4': '04:00',
          'km-5': '04:00'
        }
      });
      // Fixed total: 5 * 240 = 1200 seconds > 1000

      expect(result.ok).toBe(false);
      expect(result.errorMessage).toContain('exceed goal time');
      expect(result.offendingIds).toHaveLength(5);
    });

    it('should return error for invalid pace format', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500,
        strategyKey: 'even',
        fixedPaceStringsById: {
          'km-1': 'invalid'
        }
      });

      expect(result.ok).toBe(false);
      expect(result.errorMessage).toContain('Invalid pace');
    });

    it('should return error for unknown strategy', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500,
        strategyKey: 'unknown-strategy',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(false);
      expect(result.errorMessage).toContain('Unknown strategy');
    });
  });

  describe('different strategies', () => {
    it('should apply linear negative split strategy', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500,
        strategyKey: 'linear-negative',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(true);

      // First pace should be slower (higher) than last pace
      const firstPace = result.rows[0].paceSecondsPerUnit;
      const lastPace = result.rows[4].paceSecondsPerUnit;

      expect(firstPace).toBeGreaterThan(lastPace);

      // Total should match goal
      expect(result.rows[4].cumulativeSeconds).toBeCloseTo(1500, 1);
    });

    it('should apply linear positive split strategy', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500,
        strategyKey: 'linear-positive',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(true);

      // First pace should be faster (lower) than last pace
      const firstPace = result.rows[0].paceSecondsPerUnit;
      const lastPace = result.rows[4].paceSecondsPerUnit;

      expect(firstPace).toBeLessThan(lastPace);

      // Total should match goal
      expect(result.rows[4].cumulativeSeconds).toBeCloseTo(1500, 1);
    });

    it('should apply weighted exponential strategy', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500,
        strategyKey: 'weighted',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(true);

      // Should have variation in paces
      const paces = result.rows.map(r => r.paceSecondsPerUnit);
      const allSame = paces.every(p => p === paces[0]);
      expect(allSame).toBe(false);

      // Total should match goal
      expect(result.rows[4].cumulativeSeconds).toBeCloseTo(1500, 1);
    });
  });

  describe('display formatting', () => {
    it('should format segment times as MM:SS when less than 1 hour', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500,
        strategyKey: 'even',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(true);

      // Each segment is 300 seconds = 5:00
      result.rows.forEach(row => {
        expect(row.segmentDisplay).toBe('05:00');
      });
    });

    it('should format cumulative times as H:MM:SS', () => {
      const result = calculateSplits({
        splits: splits5K,
        goalSeconds: 1500,
        strategyKey: 'even',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(true);

      expect(result.rows[0].cumulativeDisplay).toBe('0:05:00');
      expect(result.rows[1].cumulativeDisplay).toBe('0:10:00');
      expect(result.rows[2].cumulativeDisplay).toBe('0:15:00');
      expect(result.rows[3].cumulativeDisplay).toBe('0:20:00');
      expect(result.rows[4].cumulativeDisplay).toBe('0:25:00');
    });

    it('should round display values to nearest second', () => {
      const result = calculateSplits({
        splits: [
          { id: 'km-1', distance: 1.0, label: 'KM 1' },
          { id: 'km-2', distance: 1.0, label: 'KM 2' },
          { id: 'km-3', distance: 1.0, label: 'KM 3' }
        ],
        goalSeconds: 901, // Doesn't divide evenly
        strategyKey: 'even',
        fixedPaceStringsById: {}
      });

      expect(result.ok).toBe(true);

      // Pace should be ~300.33 seconds, displayed as 05:00
      result.rows.forEach(row => {
        expect(row.paceDisplay).toBe('05:00');
      });
    });
  });
});
