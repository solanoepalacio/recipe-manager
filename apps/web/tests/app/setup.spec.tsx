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

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('@/lib/api-client', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
  ApiError: class ApiError extends Error {
    public status: number;
    public body: unknown;
    constructor(status: number, body: unknown) {
      super(`API Error ${status}`);
      this.name = 'ApiError';
      this.status = status;
      this.body = body;
    }
  },
}));

import SetupPage from '@/app/(auth)/setup/page';

describe('SetupPage (/setup)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login if setup is not required', async () => {
    mockGet.mockResolvedValueOnce({ required: false });

    render(<SetupPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('renders the setup form when setup is required', async () => {
    mockGet.mockResolvedValueOnce({ required: true });

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    mockGet.mockResolvedValueOnce({ required: true });
    const user = userEvent.setup();

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Nombre'), 'Admin');
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'different');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('calls the setup API with correct data on submit', async () => {
    mockGet.mockResolvedValueOnce({ required: true });
    mockPost.mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    const user = userEvent.setup();

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Nombre'), 'Admin');
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/setup', {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to /admin/login after successful setup', async () => {
    mockGet.mockResolvedValueOnce({ required: true });
    mockPost.mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    const user = userEvent.setup();

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Nombre'), 'Admin');
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('shows inline error on API failure', async () => {
    mockGet.mockResolvedValueOnce({ required: true });
    mockPost.mockRejectedValueOnce(new Error('Bad request'));
    const user = userEvent.setup();

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Nombre'), 'Admin');
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
