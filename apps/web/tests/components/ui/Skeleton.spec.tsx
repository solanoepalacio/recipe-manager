import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with status role and loading label', () => {
    render(<Skeleton />);
    const el = screen.getByRole('status', { name: 'Cargando...' });
    expect(el).toBeInTheDocument();
  });

  it('renders with default classes', () => {
    render(<Skeleton />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('animate-pulse');
  });

  it('accepts additional className', () => {
    render(<Skeleton className="h-4 w-32" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-32');
  });
});
