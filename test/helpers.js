import { screen, fireEvent } from '@testing-library/react';

export function expandInputTable() {
  const toggle = screen.getByRole('button', { name: /Pace Input Table/ });
  fireEvent.click(toggle);
}
