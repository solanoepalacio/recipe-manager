import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Simple consumer component for testing context values
function AuthConsumer() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div data-testid="loading">loading</div>;
  if (!user) return <div data-testid="no-user">no user</div>;
  return <div data-testid="user-name">{user.name}</div>;
}

const mockUser = {
  id: 'u-1',
  householdId: 'hh-1',
  name: 'Ana',
  email: 'ana@test.com',
  username: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthProvider', () => {
  it('shows loading state initially before /auth/me resolves', () => {
    // api.get never resolves — stays pending
    vi.mocked(apiClient.api.get).mockReturnValue(new Promise(() => {}));
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('sets user when /auth/me returns 200', async () => {
    vi.mocked(apiClient.api.get).mockResolvedValueOnce(mockUser);
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('user-name')).toHaveTextContent('Ana'),
    );
  });

  it('sets user to null when /auth/me returns 401', async () => {
    vi.mocked(apiClient.api.get).mockRejectedValueOnce(
      Object.assign(new Error('Unauthorized'), { status: 401 }),
    );
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('no-user')).toBeInTheDocument(),
    );
  });
});
