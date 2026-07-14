import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('applies error styles when error is true', () => {
    render(<Input error placeholder="Error input" />);
    const input = screen.getByPlaceholderText('Error input');
    expect(input.className).toContain('border-red-300');
  });

  it('does not apply error styles when error is false', () => {
    render(<Input placeholder="Normal input" />);
    const input = screen.getByPlaceholderText('Normal input');
    expect(input.className).toContain('border-gray-300');
    expect(input.className).not.toContain('border-red-300');
  });
});
