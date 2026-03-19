import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ token: 'abc123' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/shared/abc123',
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

// Mock next/image to render a plain img
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, priority, ...rest } = props;
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

import { api } from '@/lib/api-client';
import SharedRecipePage from '@/app/shared/[token]/page';

const mockRecipe = {
  id: 'recipe-1',
  householdId: 'hh-1',
  createdById: 'user-1',
  name: 'Ensalada Cesar',
  slug: 'ensalada-cesar',
  description: null,
  servingsQty: 4,
  servingsUnit: 'porciones',
  prepTime: 15,
  cookTime: 0,
  totalTime: 15,
  performTime: null,
  sourceUrl: null,
  shareToken: 'abc123',
  isLocked: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sections: [
    {
      id: 'sec-1',
      title: 'Principal',
      order: 0,
      ingredients: [
        {
          id: 'ing-1',
          foodId: 'f1',
          foodName: 'lechuga',
          unitId: 'u1',
          unitName: 'unidad',
          quantity: 1,
          note: null,
          order: 0,
        },
      ],
    },
  ],
  steps: [
    { id: 'step-1', title: null, body: 'Lavar la lechuga', order: 0 },
  ],
  images: [],
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SharedRecipePage', () => {
  it('renders recipe name after loading', async () => {
    vi.mocked(api.get).mockResolvedValue(mockRecipe);
    render(<SharedRecipePage />, { wrapper });
    await waitFor(() => expect(screen.getByText('Ensalada Cesar')).toBeInTheDocument());
  });

  it('renders Robotina Cooks header', async () => {
    vi.mocked(api.get).mockResolvedValue(mockRecipe);
    render(<SharedRecipePage />, { wrapper });
    await waitFor(() => expect(screen.getByText('Robotina Cooks')).toBeInTheDocument());
  });

  it('renders footer note', async () => {
    vi.mocked(api.get).mockResolvedValue(mockRecipe);
    render(<SharedRecipePage />, { wrapper });
    await waitFor(() =>
      expect(screen.getByText('Compartido desde Robotina Cooks')).toBeInTheDocument(),
    );
  });

  it('fetches from /shared/:token', async () => {
    vi.mocked(api.get).mockResolvedValue(mockRecipe);
    render(<SharedRecipePage />, { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/shared/abc123'));
  });

  it('shows error message for invalid token', async () => {
    vi.mocked(api.get).mockRejectedValue(
      Object.assign(new Error('Not found'), { status: 404 }),
    );
    render(<SharedRecipePage />, { wrapper });
    await waitFor(() =>
      expect(screen.getByText(/Este enlace no es/)).toBeInTheDocument(),
    );
  });

  it('shows loading skeleton', async () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    render(<SharedRecipePage />, { wrapper });
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });
});
