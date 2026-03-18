import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';

// Mock next/navigation (used by Drawer)
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUser = { name: 'Ana', householdId: 'hh-1' };

describe('AppShell', () => {
  it('renders TopBar with hamburger aria-label', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()}><div /></AppShell>);
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
  });

  it('drawer is not visible initially (has -translate-x-full class)', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()}><div /></AppShell>);
    const drawer = screen.getByRole('complementary'); // <aside>
    expect(drawer.className).toContain('-translate-x-full');
  });

  it('drawer becomes visible after hamburger click', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()}><div /></AppShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const drawer = screen.getByRole('complementary');
    expect(drawer.className).toContain('translate-x-0');
    expect(drawer.className).not.toContain('-translate-x-full');
  });

  it('renders nav items: Hoy, Recetas, Planificador', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()}><div /></AppShell>);
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    // "Recetas" appears in both the TopBar title and the nav — getAllByText asserts at least one
    expect(screen.getAllByText('Recetas').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Planificador')).toBeInTheDocument();
  });

  it('renders Cerrar sesión logout button', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()}><div /></AppShell>);
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });
});
