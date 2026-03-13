import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/today',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/lib/api-client');

const mockLogout = jest.fn();
let mockUser: { id: string; name: string } | null = { id: 'u1', name: 'Ana García' };
let mockLoading = false;

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: mockUser, loading: mockLoading, login: jest.fn(), logout: mockLogout }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import TodayPage from '@/app/(app)/today/page';

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Today page (/today)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'u1', name: 'Ana García' };
    mockLoading = false;
  });

  it('renders greeting with user name', async () => {
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue({ entries: [] });

    renderWithQuery(<TodayPage />);
    await waitFor(() => {
      expect(screen.getByText(/Ana García/)).toBeInTheDocument();
    });
  });

  it('renders empty state when no meal plan entries', async () => {
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue({ entries: [] });

    renderWithQuery(<TodayPage />);
    await waitFor(() => {
      expect(screen.getByText(/No hay recetas para hoy/i)).toBeInTheDocument();
    });
  });

  it('renders recipe links when meal plan has entries', async () => {
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue({
      entries: [
        {
          id: 'e1',
          recipeId: 'r1',
          recipeName: 'Pasta Carbonara',
          recipeThumbnailUrl: null,
          date: '2024-01-01',
          mealType: 'dinner',
        },
      ],
    });

    renderWithQuery(<TodayPage />);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('renders 3 stat box placeholders', async () => {
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue({ entries: [] });

    renderWithQuery(<TodayPage />);
    await waitFor(() => {
      const statBoxes = screen.getAllByTestId('stat-box');
      expect(statBoxes).toHaveLength(3);
    });
  });
});
