import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ slug: 'pollo-al-horno' })),
  useSearchParams: vi.fn(() => new URLSearchParams('id=uuid-123')),
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const mockRecipe: RecipeDetailResponse = {
  id: 'uuid-123',
  householdId: 'hh-1',
  createdById: 'user-1',
  name: 'Pollo al Horno',
  slug: 'pollo-al-horno',
  description: null,
  servingsQty: 4,
  servingsUnit: 'personas',
  prepTime: 15,
  cookTime: 45,
  totalTime: 60,
  performTime: null,
  sourceUrl: null,
  shareToken: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  sections: [
    {
      id: 'sec-1',
      title: null,
      order: 1,
      ingredients: [
        {
          id: 'ing-1',
          foodId: 'food-1',
          foodName: 'Pollo',
          unitId: 'unit-1',
          unitName: 'kg',
          quantity: 1,
          note: null,
          order: 1,
        },
        {
          id: 'ing-2',
          foodId: 'food-2',
          foodName: 'Limon',
          unitId: 'unit-2',
          unitName: 'unidades',
          quantity: 2,
          note: null,
          order: 2,
        },
      ],
    },
  ],
  steps: [
    { id: 'step-1', title: null, body: 'Precalentar el horno', order: 1 },
    { id: 'step-2', title: null, body: 'Sazonar el pollo', order: 2 },
  ],
  images: [],
};

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: mockRecipe,
    isLoading: false,
    isError: false,
  })),
}));

// Import the page after mocks are set up
import RecipeDetailPage from '@/app/(app)/recipes/[slug]/page';

describe('RecipeDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply the mocks after clear
    const { useParams, useSearchParams, useRouter } = vi.mocked(
      await import('next/navigation')
    );
    useParams.mockReturnValue({ slug: 'pollo-al-horno' });
    useSearchParams.mockReturnValue(new URLSearchParams('id=uuid-123'));
    useRouter.mockReturnValue({ push: vi.fn(), back: vi.fn() });

    const { useQuery } = vi.mocked(await import('@tanstack/react-query'));
    useQuery.mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as ReturnType<typeof useQuery>);
  });

  it('renders recipe name', () => {
    render(<RecipeDetailPage />);
    // name appears in both TopBar and sticky header
    expect(screen.getAllByText('Pollo al Horno').length).toBeGreaterThanOrEqual(1);
  });

  it('renders info grid labels', () => {
    render(<RecipeDetailPage />);
    expect(screen.getByText('Preparación')).toBeInTheDocument();
    expect(screen.getByText('Cocción')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Porciones')).toBeInTheDocument();
  });

  it('renders ingredient names', () => {
    render(<RecipeDetailPage />);
    expect(screen.getByText(/Pollo/)).toBeInTheDocument();
    expect(screen.getByText(/Limon/)).toBeInTheDocument();
  });

  it('renders instruction steps', () => {
    render(<RecipeDetailPage />);
    expect(screen.getByText(/Precalentar/)).toBeInTheDocument();
    expect(screen.getByText(/Sazonar/)).toBeInTheDocument();
  });

  it('renders Iniciar receta button', () => {
    render(<RecipeDetailPage />);
    expect(screen.getByText('Iniciar receta')).toBeInTheDocument();
  });
});
