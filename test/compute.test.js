import { describe, it, expect } from 'vitest';
import { segmentTimeSeconds, cumulativeTimes } from '../src/engine/compute.js';

describe('Computation helpers', () => {
  describe('segmentTimeSeconds', () => {
    it('should calculate segment time for full unit', () => {
      const pace = 300; // 5:00 per unit
      const distance = 1.0;

      expect(segmentTimeSeconds(pace, distance)).toBe(300);
    });

    it('should calculate segment time for partial unit', () => {
      const pace = 300; // 5:00 per unit
      const distance = 0.5;

      expect(segmentTimeSeconds(pace, distance)).toBe(150);
    });

    it('should handle float precision correctly', () => {
      const pace = 330.5; // 5:30.5 per unit
      const distance = 0.25;

      const result = segmentTimeSeconds(pace, distance);
      expect(result).toBeCloseTo(82.625, 5);
    });

    it('should work with different pace values', () => {
      expect(segmentTimeSeconds(480, 1.0)).toBe(480); // 8:00 pace
      expect(segmentTimeSeconds(360, 1.0)).toBe(360); // 6:00 pace
      expect(segmentTimeSeconds(240, 0.1)).toBe(24);   // 4:00 pace, 0.1 distance
    });
  });

  describe('cumulativeTimes', () => {
    it('should calculate cumulative times correctly', () => {
      const segments = [300, 300, 300]; // Three 5-minute segments
      const cumulative = cumulativeTimes(segments);

      expect(cumulative).toEqual([300, 600, 900]);
    });

    it('should handle varying segment times', () => {
      const segments = [300, 310, 290, 305];
      const cumulative = cumulativeTimes(segments);

      expect(cumulative).toEqual([300, 610, 900, 1205]);
    });

    it('should handle float values correctly', () => {
      const segments = [300.5, 299.5, 301.2];
      const cumulative = cumulativeTimes(segments);

      expect(cumulative[0]).toBeCloseTo(300.5, 5);
      expect(cumulative[1]).toBeCloseTo(600.0, 5);
      expect(cumulative[2]).toBeCloseTo(901.2, 5);
    });

    it('should handle single segment', () => {
      const segments = [450];
      const cumulative = cumulativeTimes(segments);

      expect(cumulative).toEqual([450]);
    });

    it('should handle empty array', () => {
      const segments = [];
      const cumulative = cumulativeTimes(segments);

      expect(cumulative).toEqual([]);
    });

    it('should maintain precision for small differences', () => {
      const segments = [100.1, 100.2, 100.3];
      const cumulative = cumulativeTimes(segments);

      expect(cumulative[0]).toBeCloseTo(100.1, 5);
      expect(cumulative[1]).toBeCloseTo(200.3, 5);
      expect(cumulative[2]).toBeCloseTo(300.6, 5);
    });
  });

  describe('integration of segment and cumulative', () => {
    it('should work together for realistic scenario', () => {
      const pace = 300; // 5:00 per unit
      const distances = [1.0, 1.0, 1.0, 0.5]; // 3.5 units total

      const segments = distances.map(d => segmentTimeSeconds(pace, d));
      const cumulative = cumulativeTimes(segments);

      expect(segments).toEqual([300, 300, 300, 150]);
      expect(cumulative).toEqual([300, 600, 900, 1050]);
    });

    it('should handle varying paces', () => {
      const paces = [300, 310, 295]; // Different paces per segment
      const distances = [1.0, 1.0, 1.0];

      const segments = paces.map((pace, i) => segmentTimeSeconds(pace, distances[i]));
      const cumulative = cumulativeTimes(segments);

      expect(segments).toEqual([300, 310, 295]);
      expect(cumulative).toEqual([300, 610, 905]);
    });
  });
});
