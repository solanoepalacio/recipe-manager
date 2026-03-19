import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLoginPage from '@/app/(admin)/admin/login/page';
import * as adminApiClient from '@/lib/admin-api-client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/admin-api-client', () => ({
  adminApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminLoginPage', () => {
  it('renders email and password fields', () => {
    render(<AdminLoginPage />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('renders submit button with correct text', () => {
    render(<AdminLoginPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('calls POST /admin/auth/login on submit', async () => {
    vi.mocked(adminApiClient.adminApi.post).mockResolvedValueOnce({ message: 'Admin authenticated' });
    render(<AdminLoginPage />, { wrapper: Wrapper });

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(vi.mocked(adminApiClient.adminApi.post)).toHaveBeenCalledWith(
        '/admin/auth/login',
        { email: 'admin@example.com', password: 'password123' },
      ),
    );
  });

  it('shows inline error on 401 response', async () => {
    vi.mocked(adminApiClient.adminApi.post).mockRejectedValueOnce(
      Object.assign(new Error('Unauthorized'), { status: 401 }),
    );
    render(<AdminLoginPage />, { wrapper: Wrapper });

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument(),
    );
  });
});
