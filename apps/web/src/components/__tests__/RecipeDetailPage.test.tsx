import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

const mockBack = vi.fn();
const mockPush = vi.fn();

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'pollo-al-horno' }),
  useSearchParams: () => new URLSearchParams('id=uuid-123'),
  useRouter: () => ({ push: mockPush, back: mockBack }),
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

const mockInvalidateQueries = vi.fn();

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: mockRecipe,
    isLoading: false,
    isError: false,
  }),
  useMutation: ({ mutationFn }: { mutationFn: () => Promise<unknown>; onSuccess?: (data: unknown) => void; onError?: () => void }) => ({
    mutate: vi.fn().mockImplementation(() => { mutationFn(); }),
    isPending: false,
  }),
  useQueryClient: () => ({
    setQueryData: vi.fn(),
    invalidateQueries: mockInvalidateQueries,
  }),
}));

// Import after mocks are set up
import RecipeDetailPage from '@/app/(app)/recipes/[slug]/page';

describe('RecipeDetailPage', () => {
  it('renders recipe name', () => {
    render(<RecipeDetailPage />);
    // name appears in both DetailTopBar and sticky header
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
    // "Pollo" appears in recipe name too, so use getAllByText and assert at least one ingredient row
    expect(screen.getAllByText(/Pollo/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Limon/)).toBeInTheDocument();
  });

  it('renders instruction steps', () => {
    render(<RecipeDetailPage />);
    expect(screen.getByText(/Precalentar/)).toBeInTheDocument();
    expect(screen.getByText(/Sazonar/)).toBeInTheDocument();
  });

  it('renders Cocinar button', () => {
    render(<RecipeDetailPage />);
    expect(screen.getByText('Cocinar')).toBeInTheDocument();
  });

  it('deletes recipe after confirmation', async () => {
    const { api } = await import('@/lib/api-client');
    vi.mocked(api.delete).mockResolvedValue({ id: 'uuid-123' });

    render(<RecipeDetailPage />);

    // Click the ellipsis button to open dropdown
    const ellipsisButton = screen.getByLabelText('Mas opciones');
    fireEvent.click(ellipsisButton);

    // Click "Eliminar" in the dropdown
    const eliminateButtons = screen.getAllByText('Eliminar');
    fireEvent.click(eliminateButtons[0]);

    // ConfirmDialog should now appear with confirmation message
    expect(screen.getByText(/Seguro que quieres eliminar/)).toBeInTheDocument();

    // Click the confirm "Eliminar" button in the dialog
    const confirmButtons = screen.getAllByText('Eliminar');
    // The last one should be the confirm button in the dialog
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    // Assert api.delete was called with /recipes/uuid-123
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/recipes/uuid-123');
    });
  });
});
