import React from 'react';
import { render, screen } from '@testing-library/react';
import ControllerButtons from "./ControllerButtons";

render(<ControllerButtons />);

test('renders 2 buttons', () => {
  const predictionButton = screen.getByText(/predict/i);
  const clearCanvasButton = screen.getByText(/clear canvas/i);

  expect(predictionButton).toBeInTheDocument();
  expect(clearCanvasButton).toBeInTheDocument();
});
