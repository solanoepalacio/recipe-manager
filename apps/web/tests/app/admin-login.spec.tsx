import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));

const mockApiPost = jest.fn();

jest.mock('@/lib/api-client', () => ({
  api: {
    get: jest.fn(),
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

import AdminLoginPage from '@/app/(admin)/admin/login/page';

describe('AdminLoginPage (/admin/login)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the admin login form', () => {
    render(<AdminLoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('calls the admin auth API on submit', async () => {
    mockApiPost.mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    const user = userEvent.setup();

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/admin/auth/login', {
        email: 'admin@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to /admin on successful login', async () => {
    mockApiPost.mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    const user = userEvent.setup();

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('shows inline error on failed login', async () => {
    const { ApiError } = require('@/lib/api-client');
    mockApiPost.mockRejectedValueOnce(new ApiError(401, { message: 'Unauthorized' }));
    const user = userEvent.setup();

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
