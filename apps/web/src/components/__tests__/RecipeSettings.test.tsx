import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
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

import { RecipeSettings } from '@/components/recipes/editor/RecipeSettings';
import { api } from '@/lib/api-client';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const defaultProps = {
  recipeId: 'recipe-123',
  slug: 'my-recipe',
  isLocked: false,
  onMutationSuccess: vi.fn(),
};

describe('RecipeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lock toggle in off state', () => {
    render(<RecipeSettings {...defaultProps} isLocked={false} />, { wrapper });
    const toggle = screen.getByRole('switch', { name: /bloquear receta/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('renders lock toggle in on state', () => {
    render(<RecipeSettings {...defaultProps} isLocked={true} />, { wrapper });
    const toggle = screen.getByRole('switch', { name: /bloquear receta/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('toggle calls PATCH with isLocked', async () => {
    (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({});
    render(<RecipeSettings {...defaultProps} isLocked={false} />, { wrapper });
    const toggle = screen.getByRole('switch', { name: /bloquear receta/i });
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/recipes/recipe-123', { isLocked: true });
    });
  });

  it('duplicate button calls POST /recipes/:id/duplicate', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-id', slug: 'my-recipe-copia' });
    render(<RecipeSettings {...defaultProps} />, { wrapper });
    const btn = screen.getByText('Duplicar receta');
    fireEvent.click(btn);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('duplicate'),
        expect.anything(),
      );
    });
  });

  it('shows loading state on duplicate', async () => {
    let resolveDuplicate: (value: unknown) => void;
    (api.post as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveDuplicate = resolve;
      }),
    );
    render(<RecipeSettings {...defaultProps} />, { wrapper });
    const btn = screen.getByText('Duplicar receta');
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Duplicando...')).toBeInTheDocument();
    });
    resolveDuplicate!({ id: 'new-id', slug: 'my-recipe-copia' });
  });
});
