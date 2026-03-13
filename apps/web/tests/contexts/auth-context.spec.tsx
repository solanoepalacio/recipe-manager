import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api-client';
import type { MeResponse } from '@recipe-manager/shared';

jest.mock('@/lib/api-client');

const mockUser: MeResponse = {
  id: 'user-1',
  name: 'Juan García',
  email: 'juan@example.com',
  username: 'juan',
  householdId: 'household-1',
};

// Helper component to expose auth context values
function AuthConsumer() {
  const auth = useAuth();
  if (auth.loading) return <div data-testid="loading">loading</div>;
  if (!auth.user) return <div data-testid="no-user">no user</div>;
  return (
    <div>
      <div data-testid="user-name">{auth.user.name}</div>
      <div data-testid="user-email">{auth.user.email}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('loads user on mount', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(mockUser);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Juan García');
    });
  });

  it('sets user to null when /me returns 401', async () => {
    const { ApiError } = await import('@/lib/api-client');
    (api.get as jest.Mock).mockRejectedValueOnce(new ApiError(401, {}));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument();
    });
  });

  it('login calls api.post and updates user', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('not logged in'));
    (api.post as jest.Mock).mockResolvedValueOnce(mockUser);
    (api.get as jest.Mock).mockResolvedValueOnce(mockUser);

    function LoginConsumer() {
      const auth = useAuth();
      if (auth.loading) return <div data-testid="loading">loading</div>;
      return (
        <div>
          {auth.user ? (
            <div data-testid="user-name">{auth.user.name}</div>
          ) : (
            <button
              data-testid="login-btn"
              onClick={() => auth.login({ login: 'juan@example.com', password: 'secret' })}
            >
              Login
            </button>
          )}
        </div>
      );
    }

    render(
      <AuthProvider>
        <LoginConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      login: 'juan@example.com',
      password: 'secret',
    });
  });

  it('logout calls api.post and clears user', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(mockUser);
    (api.post as jest.Mock).mockResolvedValueOnce({ message: 'ok' });

    function LogoutConsumer() {
      const auth = useAuth();
      if (auth.loading) return <div data-testid="loading">loading</div>;
      return (
        <div>
          {auth.user ? (
            <button
              data-testid="logout-btn"
              onClick={() => auth.logout()}
            >
              Logout
            </button>
          ) : (
            <div data-testid="no-user">no user</div>
          )}
        </div>
      );
    }

    render(
      <AuthProvider>
        <LogoutConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/logout');

    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument();
    });
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    function BadConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow();
    consoleError.mockRestore();
  });
});
