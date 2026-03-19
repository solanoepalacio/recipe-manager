import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ slug: 'test-recipe' }),
  useSearchParams: () => new URLSearchParams('id=recipe-123'),
  usePathname: () => '/recipes/test-recipe',
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
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

import RecipeDetailPage from '@/app/(app)/recipes/[slug]/page';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

const mockRecipe = {
  id: 'recipe-123',
  householdId: 'hh-1',
  createdById: 'user-1',
  name: 'Test Recipe',
  slug: 'test-recipe',
  description: null,
  servingsQty: 4,
  servingsUnit: 'porciones',
  prepTime: 10,
  cookTime: 20,
  totalTime: 30,
  performTime: null,
  sourceUrl: null,
  shareToken: null,
  isLocked: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sections: [],
  steps: [],
  images: [],
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('ShareLinkFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockRecipe);
  });

  it('renders Compartir button', async () => {
    render(<RecipeDetailPage />, { wrapper });
    await waitFor(() => expect(screen.getByText('Compartir')).toBeInTheDocument());
  });

  it('calls POST /recipes/:id/share when Compartir clicked', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ shareToken: 'abc123' });
    render(<RecipeDetailPage />, { wrapper });
    await waitFor(() => expect(screen.getByText('Compartir')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Compartir'));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/recipes/recipe-123/share', {})
    );
  });

  it('opens BottomSheet with share URL after token generated', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ shareToken: 'abc123' });
    render(<RecipeDetailPage />, { wrapper });
    await waitFor(() => expect(screen.getByText('Compartir')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Compartir'));
    await waitFor(() =>
      expect(screen.getByText('Enlace para compartir')).toBeInTheDocument()
    );
    expect(screen.getByText(/\/shared\/abc123/)).toBeInTheDocument();
  });

  it('shows Copiar enlace button in share sheet', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ shareToken: 'abc123' });
    render(<RecipeDetailPage />, { wrapper });
    await waitFor(() => expect(screen.getByText('Compartir')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Compartir'));
    await waitFor(() =>
      expect(screen.getByText('Copiar enlace')).toBeInTheDocument()
    );
  });

  it('shows error toast when share generation fails', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    render(<RecipeDetailPage />, { wrapper });
    await waitFor(() => expect(screen.getByText('Compartir')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Compartir'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('No se pudo generar el enlace. Intenta de nuevo.')
    );
  });
});
