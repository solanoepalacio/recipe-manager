import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));

// Mock api-client
const mockApiPost = jest.fn();
const mockApiGet = jest.fn();

jest.mock('@/lib/api-client', () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public body: unknown,
    ) {
      super(`API Error ${status}`);
      this.name = 'ApiError';
    }
  },
}));

// Mock auth-context
const mockLogin = jest.fn();
let mockUser: { id: string } | null = null;
let mockLoading = false;

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    login: mockLogin,
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import LoginPage from '@/app/(auth)/login/page';

describe('LoginPage (/login)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockLoading = false;
  });

  it('renders the login form with all fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email o usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('renders the app name', () => {
    render(<LoginPage />);
    expect(screen.getByText(/robotina cooks/i)).toBeInTheDocument();
  });

  it('renders a link to reset password', () => {
    render(<LoginPage />);
    expect(screen.getByText(/olvidaste tu contraseña/i)).toBeInTheDocument();
  });

  it('calls login with form values on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email o usuario/i), 'test@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        login: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to / on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email o usuario/i), 'test@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows inline error on failed login', async () => {
    const { ApiError } = require('@/lib/api-client');
    mockLogin.mockRejectedValueOnce(new ApiError(401, { message: 'Unauthorized' }));
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email o usuario/i), 'test@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('redirects to / if already authenticated', async () => {
    mockUser = { id: 'user-1' } as typeof mockUser;

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
