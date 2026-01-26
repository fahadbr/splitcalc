/**
 * Time and pace conversion utilities
 */

/**
 * Round to nearest second
 * @param {number} seconds - Seconds (can be float)
 * @returns {number} Integer seconds
 */
export function roundToNearestSecond(seconds) {
  return Math.round(seconds);
}

/**
 * Convert time components to total seconds
 * @param {Object} time - Time components
 * @param {number|string|null|undefined} time.h - Hours
 * @param {number|string|null|undefined} time.m - Minutes
 * @param {number|string|null|undefined} time.s - Seconds
 * @returns {number} Total seconds (integer)
 */
export function toSeconds({ h, m, s }) {
  const hours = Number(h) || 0;
  const minutes = Number(m) || 0;
  const seconds = Number(s) || 0;

  if (hours < 0 || minutes < 0 || seconds < 0) {
    throw new Error('Time components cannot be negative');
  }

  return Math.floor(hours * 3600 + minutes * 60 + seconds);
}

/**
 * Format total seconds as H:MM:SS
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Formatted time string
 */
export function formatHMS(totalSeconds) {
  const absSeconds = Math.abs(Math.floor(totalSeconds));

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hours}:${mm}:${ss}`;
}

/**
 * Parse pace string in MM:SS format
 * @param {string} paceStr - Pace string (e.g., "8:30")
 * @returns {number} Seconds per unit
 */
export function parsePace(paceStr) {
  if (!paceStr || typeof paceStr !== 'string') {
    throw new Error('Pace must be a non-empty string');
  }

  const trimmed = paceStr.trim();
  const parts = trimmed.split(':');

  if (parts.length !== 2) {
    throw new Error('Pace must be in MM:SS format');
  }

  const minutes = parts[0];
  const seconds = parts[1];

  // Validate format - both parts must be present and numeric
  if (!/^\d+$/.test(minutes) || !/^\d{2}$/.test(seconds)) {
    throw new Error('Pace must be in MM:SS format (seconds must be 2 digits)');
  }

  const m = parseInt(minutes, 10);
  const s = parseInt(seconds, 10);

  if (s >= 60) {
    throw new Error('Seconds must be less than 60');
  }

  return m * 60 + s;
}

/**
 * Format pace (seconds per unit) as MM:SS
 * @param {number} secondsPerUnit - Seconds per unit (can be float)
 * @returns {string} Formatted pace string
 */
export function formatPace(secondsPerUnit) {
  const rounded = roundToNearestSecond(secondsPerUnit);

  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${mm}:${ss}`;
}
