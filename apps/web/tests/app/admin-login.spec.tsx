import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '@/lib/api-client';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));

jest.mock('@/lib/api-client');

import AdminLoginPage from '@/app/(admin)/admin/login/page';

describe('AdminLoginPage (/admin/login)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the admin login form', () => {
    render(<AdminLoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('calls the admin auth API on submit', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    const user = userEvent.setup();

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/admin/auth/login', {
        email: 'admin@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to /admin on successful login', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    const user = userEvent.setup();

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('shows inline error on failed login', async () => {
    const { ApiError } = require('@/lib/api-client');
    (api.post as jest.Mock).mockRejectedValueOnce(new ApiError(401, { message: 'Unauthorized' }));
    const user = userEvent.setup();

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
