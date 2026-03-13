import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/household',
}));

jest.mock('@/lib/api-client');

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Ana García' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import HouseholdPage from '@/app/(app)/household/page';

const mockHousehold = {
  id: 'h1',
  name: 'Casa García',
  members: [
    {
      id: 'u1',
      name: 'Ana García',
      email: 'ana@example.com',
      username: 'ana',
      gender: null,
      dateOfBirth: null,
      canLogin: true,
    },
    {
      id: 'u2',
      name: 'Carlos García',
      email: null,
      username: null,
      gender: null,
      dateOfBirth: null,
      canLogin: false,
    },
  ],
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Household page (/household)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue(mockHousehold);
  });

  it('renders household name', async () => {
    renderWithQuery(<HouseholdPage />);
    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });
  });

  it('renders all members', async () => {
    renderWithQuery(<HouseholdPage />);
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('Carlos García')).toBeInTheDocument();
    });
  });

  it('marks current user with (tú)', async () => {
    renderWithQuery(<HouseholdPage />);
    await waitFor(() => {
      expect(screen.getByText(/tú/i)).toBeInTheDocument();
    });
  });

  it('does not mark other members with (tú)', async () => {
    renderWithQuery(<HouseholdPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/Carlos García/).length).toBeGreaterThan(0);
      const carlosElements = screen.getAllByText(/Carlos García/);
      carlosElements.forEach((el) => {
        expect(el.textContent).not.toMatch(/tú/i);
      });
    });
  });
});
