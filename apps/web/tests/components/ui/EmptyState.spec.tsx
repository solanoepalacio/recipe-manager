import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders the message text', () => {
    render(<EmptyState message="No hay recetas" />);
    expect(screen.getByText('No hay recetas')).toBeInTheDocument();
  });

  it('renders without an action by default', () => {
    render(<EmptyState message="Sin datos" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an optional action', () => {
    render(
      <EmptyState
        message="Sin recetas"
        action={<button>Crear receta</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Crear receta' })).toBeInTheDocument();
  });

  it('renders with center alignment', () => {
    const { container } = render(<EmptyState message="Vacío" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('items-center');
    expect(wrapper.className).toContain('justify-center');
  });
});
