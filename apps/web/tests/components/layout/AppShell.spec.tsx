import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';

// Mock the auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { name: 'Juan García', householdId: 'h-1' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('AppShell', () => {
  it('renders children', () => {
    render(
      <AppShell title="Recetas" variant="standard">
        <div data-testid="page-content">Page content</div>
      </AppShell>
    );
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('renders TopBar with the given title', () => {
    render(
      <AppShell title="Mis Recetas" variant="standard">
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByText('Mis Recetas')).toBeInTheDocument();
  });

  it('drawer is closed initially', () => {
    render(
      <AppShell title="Recetas" variant="standard">
        <div>Content</div>
      </AppShell>
    );
    // Drawer should not be visible
    expect(screen.queryByTestId('drawer-scrim')).not.toBeInTheDocument();
  });

  it('opens drawer when hamburger is clicked', () => {
    render(
      <AppShell title="Recetas" variant="standard">
        <div>Content</div>
      </AppShell>
    );
    fireEvent.click(screen.getByTestId('hamburger-btn'));
    expect(screen.getByTestId('drawer-scrim')).toBeInTheDocument();
  });

  it('closes drawer when scrim is clicked', () => {
    render(
      <AppShell title="Recetas" variant="standard">
        <div>Content</div>
      </AppShell>
    );
    fireEvent.click(screen.getByTestId('hamburger-btn'));
    expect(screen.getByTestId('drawer-scrim')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('drawer-scrim'));
    expect(screen.queryByTestId('drawer-scrim')).not.toBeInTheDocument();
  });

  it('renders detail variant with back button', () => {
    render(
      <AppShell title="Receta" variant="detail" onBack={() => {}}>
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByTestId('back-btn')).toBeInTheDocument();
  });

  it('fires onBack callback', () => {
    const handleBack = jest.fn();
    render(
      <AppShell title="Receta" variant="detail" onBack={handleBack}>
        <div>Content</div>
      </AppShell>
    );
    fireEvent.click(screen.getByTestId('back-btn'));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
