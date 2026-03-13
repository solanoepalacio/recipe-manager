import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '@/lib/api-client';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
  redirect: jest.fn(),
}));

jest.mock('@/lib/api-client');

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

    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cambiar contraseña/i })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    mockSearchParams = new URLSearchParams('token=abc123');
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'different');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('calls the reset API with token and new password', async () => {
    mockSearchParams = new URLSearchParams('token=abc123');
    (api.post as jest.Mock).mockResolvedValueOnce({});
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'abc123',
        password: 'newpassword123',
      });
    });
  });

  it('shows success message and redirects to /login after successful reset', async () => {
    jest.useFakeTimers();
    mockSearchParams = new URLSearchParams('token=abc123');
    (api.post as jest.Mock).mockResolvedValueOnce({});
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/contraseña cambiada/i)).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    jest.useRealTimers();
  });

  it('shows inline error on API failure', async () => {
    mockSearchParams = new URLSearchParams('token=abc123');
    const { ApiError } = require('@/lib/api-client');
    (api.post as jest.Mock).mockRejectedValueOnce(new ApiError(400, { message: 'Invalid token' }));
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
