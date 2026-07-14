import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders message correctly', () => {
    render(<Alert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('applies error type styles by default', () => {
    render(<Alert message="Error message" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-red-50');
  });

  it('applies success type styles', () => {
    render(<Alert type="success" message="Success message" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-green-50');
  });

  it('applies info type styles', () => {
    render(<Alert type="info" message="Info message" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-blue-50');
  });

  it('has alert role', () => {
    render(<Alert message="Test" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
