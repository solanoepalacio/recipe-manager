import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecipeListPage from '@/app/(app)/recipes/page';
import { RecipeListItem, PaginatedResponse } from '@recipe-manager/shared';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/recipes',
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
}));

// Mock next/link to render <a> with href
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockRecipes: RecipeListItem[] = [
  {
    id: 'recipe-1',
    name: 'Paella Valenciana',
    slug: 'paella-valenciana',
    description: 'Arroz con mariscos',
    servingsQty: 4,
    servingsUnit: 'porciones',
    shareToken: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    imageCount: 0,
  },
  {
    id: 'recipe-2',
    name: 'Tortilla Española',
    slug: 'tortilla-espanola',
    description: null,
    servingsQty: null,
    servingsUnit: null,
    shareToken: null,
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
    imageCount: 1,
  },
];

const mockPaginatedResponse: PaginatedResponse<RecipeListItem> = {
  items: mockRecipes,
  total: 2,
  page: 1,
  perPage: 20,
};

const mockFoods = [
  { id: 'food-1', name: 'Arroz' },
  { id: 'food-2', name: 'Tomate' },
];

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryKey }: { queryKey: readonly unknown[] }) => {
    // Return recipes data for recipes queries, foods data for foods queries
    if (Array.isArray(queryKey) && queryKey[0] === 'foods') {
      return { data: mockFoods, isLoading: false, isError: false };
    }
    return { data: mockPaginatedResponse, isLoading: false, isError: false };
  }),
}));

describe('RecipeListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(<RecipeListPage />);
    expect(screen.getByPlaceholderText('Buscar recetas...')).toBeInTheDocument();
  });

  it('renders sort button', () => {
    render(<RecipeListPage />);
    expect(screen.getByText('Ordenar')).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(<RecipeListPage />);
    expect(screen.getByText('Filtrar por ingredientes')).toBeInTheDocument();
  });

  it('renders recipe cards from data', () => {
    render(<RecipeListPage />);
    expect(screen.getByText(mockRecipes[0].name)).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    render(<RecipeListPage />);
    expect(screen.getByText(/Página 1 de/)).toBeInTheDocument();
  });
});
