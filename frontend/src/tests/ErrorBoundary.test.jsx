import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/common/ErrorBoundary.jsx';

const ProblemChild = () => {
  throw new Error('Test Explosion');
};

describe('ErrorBoundary component', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal Application Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Application Content')).toBeDefined();
  });

  it('should render fallback error UI when a child component throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Something Went Wrong')).toBeDefined();
    expect(screen.getByText('Test Explosion')).toBeDefined();

    consoleSpy.mockRestore();
  });
});
