/**
 * DOM utilities and selectors
 */

// Control elements
export const controls = {
  distancePreset: null,
  customDistance: null,
  unit: null,
  goalHours: null,
  goalMinutes: null,
  goalSeconds: null,
  strategy: null,
  calculateBtn: null,
  copyBtn: null,
  clearBtn: null
};

// Container elements
export const containers = {
  inputTableRoot: null,
  resultsTableRoot: null,
  errorMessage: null,
  dirtyWarning: null
};

/**
 * Initialize DOM references
 */
export function initializeDOMRefs() {
  // Controls
  controls.distancePreset = document.getElementById('distance-preset');
  controls.customDistance = document.getElementById('custom-distance');
  controls.unit = document.getElementById('unit');
  controls.goalHours = document.getElementById('goal-hours');
  controls.goalMinutes = document.getElementById('goal-minutes');
  controls.goalSeconds = document.getElementById('goal-seconds');
  controls.strategy = document.getElementById('strategy');
  controls.calculateBtn = document.getElementById('calculate-btn');
  controls.copyBtn = document.getElementById('copy-btn');
  controls.clearBtn = document.getElementById('clear-btn');

  // Containers
  containers.inputTableRoot = document.getElementById('input-table-root');
  containers.resultsTableRoot = document.getElementById('results-table-root');
  containers.errorMessage = document.getElementById('error-message');
  containers.dirtyWarning = document.getElementById('dirty-warning');
}

/**
 * Create element helper
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Attributes object
 * @param {Array|string} children - Children elements or text content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue;
      }
    } else {
      element.setAttribute(key, value);
    }
  }

  // Append children
  if (typeof children === 'string') {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child) {
        element.appendChild(child);
      }
    });
  }

  return element;
}
