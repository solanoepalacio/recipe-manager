import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
const mockReplace = vi.fn();
const mockGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => ({ get: mockGet }),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from '@/lib/api-client';
const mockPost = vi.mocked(api.post);

import ResetPasswordPage from '@/app/(auth)/reset-password/page';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ResetPasswordPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ResetPasswordPage — missing token', () => {
  it('shows invalid link message when token query param is absent', () => {
    mockGet.mockReturnValue(null);
    renderPage();
    expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir al inicio/i })).toBeInTheDocument();
  });

  it('navigates to login when "Ir al inicio de sesión" is clicked', () => {
    mockGet.mockReturnValue(null);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /ir al inicio/i }));
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});

describe('ResetPasswordPage — with valid token', () => {
  beforeEach(() => {
    mockGet.mockReturnValue('abc123');
  });

  it('renders the new password form', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Nueva contraseña' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Repite la contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actualizar contraseña/i })).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), {
      target: { value: 'different123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('shows validation error when password is too short', async () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('al menos 8 caracteres');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('calls POST /auth/reset-password with token and newPassword on valid submit', async () => {
    mockPost.mockResolvedValue({ message: 'Contraseña actualizada correctamente' } as never);
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'newpassword1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), {
      target: { value: 'newpassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'abc123',
        newPassword: 'newpassword1',
      });
    });
  });

  it('shows success message after successful reset', async () => {
    mockPost.mockResolvedValue({ message: 'Contraseña actualizada correctamente' } as never);
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'newpassword1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), {
      target: { value: 'newpassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));

    expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument();
  });

  it('shows API error message when token is invalid or expired', async () => {
    mockPost.mockRejectedValue(
      Object.assign(new Error('Token de restablecimiento no válido o ya utilizado'), { status: 400 }),
    );
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'newpassword1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), {
      target: { value: 'newpassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token de restablecimiento no válido o ya utilizado',
    );
  });
});
