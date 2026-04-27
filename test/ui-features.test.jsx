import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { expandInputTable } from './helpers.js';

describe('Goal Time Slider', () => {
  it('should render slider with correct range for Half Marathon', () => {
    render(<App />);

    const slider = screen.getByLabelText(/Goal Time Slider/);
    expect(slider).toBeTruthy();
    expect(slider.getAttribute('min')).toBe('3120');
    expect(slider.getAttribute('max')).toBe('11820');
    expect(slider.getAttribute('step')).toBe('60');
  });

  it('should update range when distance preset changes', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });

    const slider = screen.getByLabelText(/Goal Time Slider/);
    expect(slider.getAttribute('min')).toBe('720');
    expect(slider.getAttribute('max')).toBe('2820');
  });

  it('should be disabled when Custom distance is selected', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: 'Custom' } });

    const slider = screen.getByLabelText(/Goal Time Slider/);
    expect(slider).toBeDisabled();
  });

  it('should not be disabled for preset distances', () => {
    render(<App />);

    const slider = screen.getByLabelText(/Goal Time Slider/);
    expect(slider).not.toBeDisabled();
  });

  it('should update goal time fields when slider changes', () => {
    render(<App />);

    const slider = screen.getByLabelText(/Goal Time Slider/);
    fireEvent.change(slider, { target: { value: '5400' } });

    expect(screen.getByLabelText('Goal Time - Hours').value).toBe('1');
    expect(screen.getByLabelText('Goal Time - Minutes').value).toBe('30');
  });

  it('should sync slider value from goal time fields', async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Goal Time - Hours'));
    await user.type(screen.getByLabelText('Goal Time - Hours'), '1');
    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '45');

    const slider = screen.getByLabelText(/Goal Time Slider/);
    expect(slider.value).toBe('6300');
  });

  it('should clear pace inputs when slider changes', async () => {
    const { container } = render(<App />);

    expandInputTable();
    const user = userEvent.setup();
    const paceInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    await user.type(paceInputs[0], '08:00');
    expect(paceInputs[0].value).toBe('08:00');

    const slider = screen.getByLabelText(/Goal Time Slider/);
    fireEvent.change(slider, { target: { value: '5400' } });

    const updatedInputs = container.querySelectorAll('#input-table-root input[type="text"]');
    updatedInputs.forEach(input => {
      expect(input.value).toBe('');
    });
  });

  it('should show range label for preset distances', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });

    const label = screen.getByText(/Goal Time Slider/);
    expect(label.textContent).toContain('0:12:00');
    expect(label.textContent).toContain('0:47:00');
  });
});

describe('Average Pace Display', () => {
  it('should display average pace when goal time is set', async () => {
    render(<App />);
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });
    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

    expect(screen.getByText(/Overall Average Pace/)).toBeTruthy();
    expect(screen.getByText(/05:00/)).toBeTruthy();
  });

  it('should not display average pace when goal time is zero', () => {
    render(<App />);

    const avgPace = screen.queryByText(/Overall Average Pace/);
    expect(avgPace).toBeNull();
  });

  it('should update average pace when slider moves', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Distance'), { target: { value: '5K' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'km' } });

    const slider = screen.getByLabelText(/Goal Time Slider/);
    fireEvent.change(slider, { target: { value: '1500' } });

    expect(screen.getByText(/Overall Average Pace/)).toBeTruthy();
  });

  it('should show correct unit label', async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Goal Time - Hours'));
    await user.type(screen.getByLabelText('Goal Time - Hours'), '2');

    expect(screen.getByText(/\/mi/)).toBeTruthy();
  });
});

describe('Collapsible Input Table', () => {
  it('should hide input table by default', () => {
    const { container } = render(<App />);

    expect(container.querySelector('#input-table-root')).toBeNull();
  });

  it('should show toggle button with aria-expanded=false', () => {
    render(<App />);

    const toggle = screen.getByRole('button', { name: /Pace Input Table/ });
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('should show input table when toggle is clicked', () => {
    const { container } = render(<App />);

    const toggle = screen.getByRole('button', { name: /Pace Input Table/ });
    fireEvent.click(toggle);

    expect(container.querySelector('#input-table-root')).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('should hide input table when toggle is clicked again', () => {
    const { container } = render(<App />);

    const toggle = screen.getByRole('button', { name: /Pace Input Table/ });
    fireEvent.click(toggle);
    expect(container.querySelector('#input-table-root')).toBeTruthy();

    fireEvent.click(toggle);
    expect(container.querySelector('#input-table-root')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('Auto-scroll to Results', () => {
  let scrollSpy;

  beforeEach(() => {
    scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
  });

  it('should scroll to results after successful calculation', async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Goal Time - Minutes'));
    await user.type(screen.getByLabelText('Goal Time - Minutes'), '25');

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    await act(() => new Promise(resolve => setTimeout(resolve, 50)));

    expect(scrollSpy).toHaveBeenCalled();
  });

  it('should not scroll when calculation fails', async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    await act(() => new Promise(resolve => setTimeout(resolve, 50)));

    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
