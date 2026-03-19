import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/profile',
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import ProfilePage from '@/app/(app)/profile/page';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const mockProfile = {
  id: 'user-1',
  householdId: 'hh-1',
  name: 'Ana Garcia',
  email: 'ana@example.com',
  username: 'anagarcia',
  gender: null,
  dateOfBirth: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile data after loading', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);
    render(<ProfilePage />, { wrapper });
    await waitFor(() => expect(screen.getByDisplayValue('Ana Garcia')).toBeInTheDocument());
    expect(screen.getByDisplayValue('ana@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('anagarcia')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    (api.get as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<ProfilePage />, { wrapper });
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('calls PATCH /profile on save', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);
    (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockProfile, name: 'Ana Updated' });
    render(<ProfilePage />, { wrapper });
    await waitFor(() => expect(screen.getByDisplayValue('Ana Garcia')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('Ana Garcia'), { target: { value: 'Ana Updated' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/profile', expect.objectContaining({ name: 'Ana Updated' })),
    );
  });

  it('shows success toast on save', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);
    (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);
    render(<ProfilePage />, { wrapper });
    await waitFor(() => expect(screen.getByDisplayValue('Ana Garcia')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Perfil actualizado'));
  });

  it('shows error toast on save failure', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);
    (api.patch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Server error'));
    render(<ProfilePage />, { wrapper });
    await waitFor(() => expect(screen.getByDisplayValue('Ana Garcia')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Error al guardar. Intenta de nuevo.'),
    );
  });

  it('reveals password field on Cambiar contrasena click', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);
    render(<ProfilePage />, { wrapper });
    await waitFor(() => expect(screen.getByDisplayValue('Ana Garcia')).toBeInTheDocument());
    expect(screen.queryByLabelText('Nueva contrasena')).toBeNull();
    fireEvent.click(screen.getByText('Cambiar contrasena'));
    expect(screen.getByLabelText('Nueva contrasena')).toBeInTheDocument();
  });
});
