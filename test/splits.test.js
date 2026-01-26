import { describe, it, expect } from 'vitest';
import { generateSplits } from '../src/domain/splits.js';
import { PRESETS, getPresetDistance } from '../src/domain/distance.js';

describe('Split generation', () => {
  it('should generate 5 full km splits for 5K race in km', () => {
    const distance = PRESETS['5K'].km;
    const splits = generateSplits(distance, 'km');

    expect(splits).toHaveLength(5);
    expect(splits.every(s => !s.isPartial)).toBe(true);
    expect(splits[0].label).toBe('KM 1 (1.0 km)');
    expect(splits[4].label).toBe('KM 5 (1.0 km)');
  });

  it('should generate full miles + partial for 5K race in miles', () => {
    const distance = PRESETS['5K'].mi;
    const splits = generateSplits(distance, 'mi');

    expect(splits.length).toBeGreaterThan(3);

    const fullSplits = splits.filter(s => !s.isPartial);
    const partialSplits = splits.filter(s => s.isPartial);

    expect(fullSplits.length).toBe(3);
    expect(partialSplits.length).toBe(1);
    expect(partialSplits[0].label).toMatch(/Last segment/);
    expect(partialSplits[0].distance).toBeLessThan(1.0);
  });

  it('should not generate partial for exact integer distance', () => {
    const splits = generateSplits(10.0, 'km');

    expect(splits).toHaveLength(10);
    expect(splits.every(s => !s.isPartial)).toBe(true);
  });

  it('should generate partial for fractional custom distance', () => {
    const splits = generateSplits(7.5, 'mi');

    expect(splits).toHaveLength(8);

    const partialSplit = splits.find(s => s.isPartial);
    expect(partialSplit).toBeTruthy();
    expect(partialSplit.distance).toBeCloseTo(0.5, 5);
    expect(partialSplit.label).toMatch(/Last segment \(0\.50 mi\)/);
  });

  it('should generate stable unique IDs', () => {
    const splits = generateSplits(5.5, 'km');

    const ids = splits.map(s => s.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(splits.length);
    expect(ids[0]).toBe('km-1');
    expect(ids[4]).toBe('km-5');
    expect(ids[5]).toBe('km-6-partial');
  });

  it('should handle half marathon distance', () => {
    const distance = getPresetDistance('Half', 'mi');
    const splits = generateSplits(distance, 'mi');

    expect(splits.length).toBeGreaterThan(13);

    const fullSplits = splits.filter(s => !s.isPartial);
    expect(fullSplits.length).toBe(13);

    const partialSplit = splits.find(s => s.isPartial);
    expect(partialSplit).toBeTruthy();
    expect(partialSplit.distance).toBeCloseTo(0.1, 5);
  });

  it('should handle very small remainder (< epsilon) as no partial', () => {
    // Simulating a distance that rounds to exact integer
    const splits = generateSplits(5.0000000001, 'km');

    expect(splits).toHaveLength(5);
    expect(splits.every(s => !s.isPartial)).toBe(true);
  });

  it('should throw error for invalid distance', () => {
    expect(() => generateSplits(0, 'km')).toThrow();
    expect(() => generateSplits(-5, 'km')).toThrow();
  });

  it('should throw error for invalid unit', () => {
    expect(() => generateSplits(5, 'invalid')).toThrow();
  });
});
