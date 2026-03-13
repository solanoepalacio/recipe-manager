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

import SetupPage from '@/app/(auth)/setup/page';

describe('SetupPage (/setup)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login if setup is not required', async () => {
    mockApiGet.mockResolvedValueOnce({ required: false });

    render(<SetupPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('renders the setup form when setup is required', async () => {
    mockApiGet.mockResolvedValueOnce({ required: true });

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    mockApiGet.mockResolvedValueOnce({ required: true });
    const user = userEvent.setup();

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'Admin');
    await user.type(screen.getByLabelText(/^email$/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'different');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('calls the setup API with correct data on submit', async () => {
    mockApiGet.mockResolvedValueOnce({ required: true });
    mockApiPost.mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    const user = userEvent.setup();

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'Admin');
    await user.type(screen.getByLabelText(/^email$/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/setup', {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to /admin/login after successful setup', async () => {
    mockApiGet.mockResolvedValueOnce({ required: true });
    mockApiPost.mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
    const user = userEvent.setup();

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'Admin');
    await user.type(screen.getByLabelText(/^email$/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('shows inline error on API failure', async () => {
    mockApiGet.mockResolvedValueOnce({ required: true });
    const { ApiError } = require('@/lib/api-client');
    mockApiPost.mockRejectedValueOnce(new ApiError(400, { message: 'Bad request' }));
    const user = userEvent.setup();

    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/nombre/i), 'Admin');
    await user.type(screen.getByLabelText(/^email$/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
