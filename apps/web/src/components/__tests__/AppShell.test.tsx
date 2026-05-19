import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';
import { AppFooter } from '@/components/layout/AppFooter';

// Mock next/navigation (used by Drawer)
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUser = { name: 'Ana', householdId: 'hh-1' };

describe('AppShell', () => {
  it('renders TopBar with hamburger aria-label', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()} householdName=""><div /></AppShell>);
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
  });

  it('drawer is not visible initially (has -translate-x-full class)', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()} householdName=""><div /></AppShell>);
    const drawer = screen.getByRole('complementary'); // <aside>
    expect(drawer.className).toContain('-translate-x-full');
  });

  it('drawer becomes visible after hamburger click', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()} householdName=""><div /></AppShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const drawer = screen.getByRole('complementary');
    expect(drawer.className).toContain('translate-x-0');
    expect(drawer.className).not.toContain('-translate-x-full');
  });

  it('renders nav items: Hoy, Recetas, Planificador', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()} householdName=""><div /></AppShell>);
    // pathname='/' → title is "Hoy", so "Hoy" appears in both TopBar and nav
    expect(screen.getAllByText('Hoy').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Recetas')).toBeInTheDocument();
    expect(screen.getByText('Planificador')).toBeInTheDocument();
  });

  it('renders Cerrar sesión logout button', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()} householdName=""><div /></AppShell>);
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('outer container is viewport-locked so the document does not scroll', () => {
    const { container } = render(
      <AppShell user={mockUser} onLogout={vi.fn()} householdName=""><div /></AppShell>,
    );
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain('h-dvh');
    expect(outer.className).toContain('overflow-hidden');
  });

  it('main is the scroll container (overflow-y-auto, flex-1)', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()} householdName=""><div data-testid="child" /></AppShell>);
    const main = screen.getByRole('main');
    expect(main.className).toContain('overflow-y-auto');
    expect(main.className).toContain('flex-1');
  });

  it('does not render a footer region when no child registers one', () => {
    render(<AppShell user={mockUser} onLogout={vi.fn()} householdName=""><div /></AppShell>);
    expect(screen.queryByTestId('app-footer')).not.toBeInTheDocument();
  });

  it('renders footer node registered via <AppFooter> outside the main scroll area', () => {
    function PageWithFooter() {
      return (
        <>
          <div>page body</div>
          <AppFooter>
            <div data-testid="page-footer">PAGINATION</div>
          </AppFooter>
        </>
      );
    }
    render(
      <AppShell user={mockUser} onLogout={vi.fn()} householdName="">
        <PageWithFooter />
      </AppShell>,
    );
    const footerRegion = screen.getByTestId('app-footer');
    const main = screen.getByRole('main');
    expect(footerRegion).toBeInTheDocument();
    expect(footerRegion.textContent).toContain('PAGINATION');
    // Footer must not be inside the scroll container, otherwise it would scroll away.
    expect(main.contains(footerRegion)).toBe(false);
  });

  it('hides the footer region when the registering child unmounts', () => {
    function PageWithFooter() {
      return (
        <AppFooter>
          <div>FOOTER</div>
        </AppFooter>
      );
    }
    const { rerender } = render(
      <AppShell user={mockUser} onLogout={vi.fn()} householdName="">
        <PageWithFooter />
      </AppShell>,
    );
    expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    rerender(
      <AppShell user={mockUser} onLogout={vi.fn()} householdName="">
        <div>no footer here</div>
      </AppShell>,
    );
    expect(screen.queryByTestId('app-footer')).not.toBeInTheDocument();
  });
});
