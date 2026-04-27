import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App.jsx';

describe('Persistence load on boot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should restore distance preset from persisted state', () => {
    localStorage.setItem('splitcalc-state', JSON.stringify({
      distancePresetKey: '10K',
      customDistanceValue: null,
      unit: 'km',
      goalTime: { h: 0, m: 45, s: 0 },
      strategyKey: 'even',
      paceInputsById: {}
    }));

    const { container } = render(<App />);

    expect(screen.getByLabelText('Distance').value).toBe('10K');

    const rows = container.querySelectorAll('#input-table-root tbody tr');
    expect(rows.length).toBe(10);
  });

  it('should restore goal time from persisted state', () => {
    localStorage.setItem('splitcalc-state', JSON.stringify({
      distancePresetKey: '5K',
      customDistanceValue: null,
      unit: 'km',
      goalTime: { h: 1, m: 30, s: 45 },
      strategyKey: 'even',
      paceInputsById: {}
    }));

    render(<App />);

    expect(screen.getByLabelText('Goal Time - Hours').value).toBe('1');
    expect(screen.getByLabelText('Goal Time - Minutes').value).toBe('30');
    expect(screen.getByLabelText('Goal Time - Seconds').value).toBe('45');
  });

  it('should restore unit and strategy from persisted state', () => {
    localStorage.setItem('splitcalc-state', JSON.stringify({
      distancePresetKey: 'Half',
      customDistanceValue: null,
      unit: 'mi',
      goalTime: { h: 2, m: 0, s: 0 },
      strategyKey: 'linear-negative',
      paceInputsById: {}
    }));

    render(<App />);

    expect(screen.getByLabelText('Unit').value).toBe('mi');
    expect(screen.getByLabelText('Strategy').value).toBe('linear-negative');
  });

  it('should restore pace inputs from persisted state', () => {
    localStorage.setItem('splitcalc-state', JSON.stringify({
      distancePresetKey: '5K',
      customDistanceValue: null,
      unit: 'km',
      goalTime: { h: 0, m: 25, s: 0 },
      strategyKey: 'even',
      paceInputsById: {
        'km-1': '04:50',
        'km-3': '05:10',
        'km-5': '05:00'
      }
    }));

    const { container } = render(<App />);

    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    expect(paceInputs[0].value).toBe('04:50');
    expect(paceInputs[1].value).toBe('');
    expect(paceInputs[2].value).toBe('05:10');
    expect(paceInputs[3].value).toBe('');
    expect(paceInputs[4].value).toBe('05:00');
  });

  it('should restore custom distance from persisted state', () => {
    localStorage.setItem('splitcalc-state', JSON.stringify({
      distancePresetKey: 'Custom',
      customDistanceValue: 7.5,
      unit: 'mi',
      goalTime: { h: 1, m: 15, s: 0 },
      strategyKey: 'weighted',
      paceInputsById: {}
    }));

    const { container } = render(<App />);

    expect(screen.getByLabelText('Distance').value).toBe('Custom');
    expect(screen.getByLabelText('Custom Distance')).not.toBeDisabled();
    expect(screen.getByLabelText('Custom Distance').value).toBe('7.5');

    const rows = container.querySelectorAll('#input-table-root tbody tr');
    expect(rows.length).toBe(8);
  });

  it('should drop unmatched pace inputs when unit changes', () => {
    localStorage.setItem('splitcalc-state', JSON.stringify({
      distancePresetKey: '5K',
      customDistanceValue: null,
      unit: 'km',
      goalTime: { h: 0, m: 25, s: 0 },
      strategyKey: 'even',
      paceInputsById: {
        'km-1': '05:00',
        'km-3': '05:30'
      }
    }));

    const { container } = render(<App />);

    const initialInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    expect(initialInputs[0].value).toBe('05:00');
    expect(initialInputs[2].value).toBe('05:30');

    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'mi' } });

    const updatedInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    updatedInputs.forEach(input => {
      expect(input.value).toBe('');
    });
  });
});
