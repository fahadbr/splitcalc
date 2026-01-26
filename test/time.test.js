import { describe, it, expect } from 'vitest';
import {
  toSeconds,
  formatHMS,
  parsePace,
  formatPace,
  roundToNearestSecond
} from '../src/engine/time.js';

describe('Time utilities', () => {
  describe('roundToNearestSecond', () => {
    it('should round to nearest integer', () => {
      expect(roundToNearestSecond(300.4)).toBe(300);
      expect(roundToNearestSecond(300.5)).toBe(301);
      expect(roundToNearestSecond(300.6)).toBe(301);
      expect(roundToNearestSecond(299.4)).toBe(299);
    });
  });

  describe('toSeconds', () => {
    it('should convert time components to seconds', () => {
      expect(toSeconds({ h: 1, m: 30, s: 45 })).toBe(5445);
      expect(toSeconds({ h: 0, m: 5, s: 30 })).toBe(330);
      expect(toSeconds({ h: 2, m: 0, s: 0 })).toBe(7200);
    });

    it('should handle blank/undefined fields as zero', () => {
      expect(toSeconds({ h: 1, m: undefined, s: null })).toBe(3600);
      expect(toSeconds({ h: '', m: 5, s: '' })).toBe(300);
      expect(toSeconds({ h: 0, m: 0, s: 0 })).toBe(0);
    });

    it('should handle string inputs', () => {
      expect(toSeconds({ h: '1', m: '30', s: '45' })).toBe(5445);
    });

    it('should throw error for negative values', () => {
      expect(() => toSeconds({ h: -1, m: 0, s: 0 })).toThrow();
      expect(() => toSeconds({ h: 0, m: -5, s: 0 })).toThrow();
      expect(() => toSeconds({ h: 0, m: 0, s: -10 })).toThrow();
    });

    it('should floor fractional seconds', () => {
      expect(toSeconds({ h: 0, m: 0, s: 30.7 })).toBe(30);
    });
  });

  describe('formatHMS', () => {
    it('should format seconds as H:MM:SS', () => {
      expect(formatHMS(5445)).toBe('1:30:45');
      expect(formatHMS(330)).toBe('0:05:30');
      expect(formatHMS(7200)).toBe('2:00:00');
      expect(formatHMS(3661)).toBe('1:01:01');
    });

    it('should pad minutes and seconds to 2 digits', () => {
      expect(formatHMS(65)).toBe('0:01:05');
      expect(formatHMS(5)).toBe('0:00:05');
    });

    it('should handle hours >= 10', () => {
      expect(formatHMS(36000)).toBe('10:00:00');
      expect(formatHMS(359999)).toBe('99:59:59');
    });

    it('should handle zero', () => {
      expect(formatHMS(0)).toBe('0:00:00');
    });
  });

  describe('parsePace', () => {
    it('should parse valid MM:SS pace strings', () => {
      expect(parsePace('08:30')).toBe(510);
      expect(parsePace('04:05')).toBe(245);
      expect(parsePace('10:00')).toBe(600);
      expect(parsePace('00:45')).toBe(45);
    });

    it('should handle paces without leading zero on minutes', () => {
      expect(parsePace('8:30')).toBe(510);
      expect(parsePace('5:15')).toBe(315);
    });

    it('should reject invalid formats', () => {
      expect(() => parsePace('4:5')).toThrow(); // seconds not 2 digits
      expect(() => parsePace('aa:bb')).toThrow();
      expect(() => parsePace('8:30:00')).toThrow(); // too many parts
      expect(() => parsePace('830')).toThrow(); // no colon
      expect(() => parsePace('')).toThrow();
      expect(() => parsePace('8:')).toThrow();
      expect(() => parsePace(':30')).toThrow();
    });

    it('should reject seconds >= 60', () => {
      expect(() => parsePace('8:60')).toThrow();
      expect(() => parsePace('5:99')).toThrow();
    });

    it('should handle whitespace trimming', () => {
      expect(parsePace(' 08:30 ')).toBe(510);
    });
  });

  describe('formatPace', () => {
    it('should format seconds per unit as MM:SS', () => {
      expect(formatPace(510)).toBe('08:30');
      expect(formatPace(245)).toBe('04:05');
      expect(formatPace(600)).toBe('10:00');
      expect(formatPace(45)).toBe('00:45');
    });

    it('should round to nearest second', () => {
      expect(formatPace(300.4)).toBe('05:00');
      expect(formatPace(300.5)).toBe('05:01');
      expect(formatPace(300.6)).toBe('05:01');
    });

    it('should pad both minutes and seconds', () => {
      expect(formatPace(5)).toBe('00:05');
      expect(formatPace(65)).toBe('01:05');
    });

    it('should handle large values', () => {
      expect(formatPace(3600)).toBe('60:00');
      expect(formatPace(5999)).toBe('99:59');
    });
  });

  describe('round-trip parsing and formatting', () => {
    it('should be consistent for valid paces', () => {
      const paces = ['08:30', '04:05', '10:00', '12:45'];

      paces.forEach(pace => {
        const seconds = parsePace(pace);
        const formatted = formatPace(seconds);
        expect(formatted).toBe(pace);
      });
    });
  });
});
