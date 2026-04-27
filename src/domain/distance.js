/**
 * Distance presets for common race distances
 * Each preset includes both km and mile equivalents
 */

export const PRESETS = {
  '5K': {
    km: 5.0,
    mi: 3.106856 // 5km in miles
  },
  '10K': {
    km: 10.0,
    mi: 6.213712 // 10km in miles
  },
  'Half': {
    km: 21.0975,
    mi: 13.1 // Half marathon
  },
  'Full': {
    km: 42.195,
    mi: 26.2 // Full marathon
  }
};

export const SLIDER_RANGES = {
  '5K':   { min: 720,   max: 2820  },
  '10K':  { min: 1500,  max: 5580  },
  'Half': { min: 3120,  max: 11820 },
  'Full': { min: 6300,  max: 23580 },
};

/**
 * Get the distance value for a preset in the specified unit
 * @param {string} presetKey - One of '5K', '10K', 'Half', 'Full'
 * @param {string} unit - 'km' or 'mi'
 * @returns {number} Distance in the specified unit
 */
export function getPresetDistance(presetKey, unit) {
  const preset = PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetKey}`);
  }
  if (unit !== 'km' && unit !== 'mi') {
    throw new Error(`Invalid unit: ${unit}`);
  }
  return preset[unit];
}

/**
 * Resolve distance based on preset selection or custom input
 * @param {string} presetKey - Selected preset ('5K', '10K', 'Half', 'Full', 'Custom')
 * @param {number|null} customValue - Custom distance value (only used if preset is 'Custom')
 * @param {string} unit - 'km' or 'mi'
 * @returns {number} Distance in the specified unit
 */
export function resolveDistance(presetKey, customValue, unit) {
  if (presetKey === 'Custom') {
    if (!customValue || customValue <= 0) {
      throw new Error('Custom distance must be positive');
    }
    return customValue;
  }
  return getPresetDistance(presetKey, unit);
}
