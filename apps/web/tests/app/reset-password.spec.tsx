import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
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

import ResetPasswordPage from '@/app/(auth)/reset-password/page';

describe('ResetPasswordPage (/reset-password)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('shows invalid link message when no token is present', () => {
    mockSearchParams = new URLSearchParams();

    render(<ResetPasswordPage />);

    expect(screen.getByText(/enlace inválido/i)).toBeInTheDocument();
  });

  it('renders the form when token is present in URL', () => {
    mockSearchParams = new URLSearchParams('token=abc123');

    render(<ResetPasswordPage />);

    expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cambiar contraseña/i })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    mockSearchParams = new URLSearchParams('token=abc123');
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'different');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('calls the reset API with token and new password', async () => {
    mockSearchParams = new URLSearchParams('token=abc123');
    mockApiPost.mockResolvedValueOnce({});
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'abc123',
        password: 'newpassword123',
      });
    });
  });

  it('shows success message and redirects to /login after successful reset', async () => {
    mockSearchParams = new URLSearchParams('token=abc123');
    mockApiPost.mockResolvedValueOnce({});
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/contraseña cambiada/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    }, { timeout: 4000 });
  });

  it('shows inline error on API failure', async () => {
    mockSearchParams = new URLSearchParams('token=abc123');
    const { ApiError } = require('@/lib/api-client');
    mockApiPost.mockRejectedValueOnce(new ApiError(400, { message: 'Invalid token' }));
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
