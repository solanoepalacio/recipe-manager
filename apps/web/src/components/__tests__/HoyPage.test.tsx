import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  useAuth: vi.fn(() => ({ user: { name: 'María' }, isLoading: false })),
}));

import { api } from '@/lib/api-client';
import HoyPage from '@/app/(app)/page';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('HoyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders greeting with user name', async () => {
    vi.mocked(api.get).mockResolvedValue({ entries: [] });
    renderWithProviders(<HoyPage />);

    await screen.findByText(/Hola/);
    expect(screen.getByText(/María/)).toBeInTheDocument();
  });

  it('shows empty state when there are no entries for today', async () => {
    vi.mocked(api.get).mockResolvedValue({ entries: [] });
    renderWithProviders(<HoyPage />);

    await screen.findByText('No hay recetas para hoy');
  });

  it('renders recipe entries when data exists', async () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.mocked(api.get).mockResolvedValue({
      entries: [
        {
          id: 'entry-1',
          date: today,
          mealType: 'lunch',
          recipeId: 'r1',
          recipeName: 'Tacos de pollo',
          recipeSlug: 'tacos-de-pollo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    renderWithProviders(<HoyPage />);

    await screen.findByText('Tacos de pollo');
  });

  it('shows meal type label in Spanish for each entry', async () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.mocked(api.get).mockResolvedValue({
      entries: [
        {
          id: 'entry-1',
          date: today,
          mealType: 'breakfast',
          recipeId: 'r1',
          recipeName: 'Tostadas',
          recipeSlug: 'tostadas',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    renderWithProviders(<HoyPage />);

    // MEAL_TYPE_LABELS maps breakfast => 'Desayuno'
    await screen.findByText('Desayuno');
  });

  it('calls the meal plan API with today as both from and to params', async () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.mocked(api.get).mockResolvedValue({ entries: [] });

    renderWithProviders(<HoyPage />);

    await screen.findByText('No hay recetas para hoy');

    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining(`from=${today}`)
    );
    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining(`to=${today}`)
    );
  });

  it('shows "Recetas de hoy" section heading', async () => {
    vi.mocked(api.get).mockResolvedValue({ entries: [] });
    renderWithProviders(<HoyPage />);

    await screen.findByText('Recetas de hoy');
  });
});
