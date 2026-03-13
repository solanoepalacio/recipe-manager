import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/profile',
}));

jest.mock('@/lib/api-client');

const mockLogout = jest.fn();

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Ana García' },
    loading: false,
    login: jest.fn(),
    logout: mockLogout,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ProfilePage from '@/app/(app)/profile/page';

const mockProfile = {
  id: 'u1',
  name: 'Ana García',
  email: 'ana@example.com',
  username: 'ana',
  gender: null,
  dateOfBirth: null,
  householdId: 'h1',
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Profile page (/profile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue(mockProfile);
    api.post = jest.fn().mockResolvedValue({});
  });

  it('renders user name', async () => {
    renderWithQuery(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });
  });

  it('renders user email', async () => {
    renderWithQuery(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    });
  });

  it('renders logout button', async () => {
    renderWithQuery(<ProfilePage />);
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('calls logout and redirects to /login on logout click', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValueOnce(undefined);
    renderWithQuery(<ProfilePage />);
    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });
});
