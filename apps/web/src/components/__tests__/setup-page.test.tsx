import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SetupPage from '@/app/(admin)/setup/page';
import * as apiClient from '@/lib/api-client';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

describe('SetupPage', () => {
  it('calls GET /setup on mount', () => {
    vi.mocked(apiClient.api.get).mockReturnValue(new Promise(() => {}));
    render(<SetupPage />, { wrapper: Wrapper });
    expect(vi.mocked(apiClient.api.get)).toHaveBeenCalledWith('/setup');
  });

  it('redirects to /admin/login when required is false', async () => {
    vi.mocked(apiClient.api.get).mockResolvedValueOnce({ required: false });
    render(<SetupPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/admin/login'),
    );
  });

  it('shows setup form when required is true', async () => {
    vi.mocked(apiClient.api.get).mockResolvedValueOnce({ required: true });
    render(<SetupPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /crear cuenta de administrador/i }),
      ).toBeInTheDocument(),
    );
  });
});
