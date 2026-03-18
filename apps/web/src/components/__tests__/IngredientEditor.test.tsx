import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IngredientResponse, SectionResponse } from '@recipe-manager/shared';

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

// Mock @dnd-kit/core — DndContext as passthrough
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
  })),
}));

// Mock @dnd-kit/sortable — SortableContext as passthrough, useSortable stub
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  }),
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

import { api } from '@/lib/api-client';
import { IngredientRow } from '@/components/recipes/editor/IngredientRow';
import { IngredientSectionEditor } from '@/components/recipes/editor/IngredientSectionEditor';
import { IngredientPicker } from '@/components/recipes/editor/IngredientPicker';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const mockIngredient: IngredientResponse = {
  id: 'ing-1',
  foodId: 'food-1',
  foodName: 'Tomate',
  unitId: 'unit-1',
  unitName: 'g',
  quantity: 200,
  note: 'bien maduros',
  order: 0,
};

const mockSection: SectionResponse = {
  id: 'sec-1',
  title: 'Verduras',
  order: 0,
  ingredients: [mockIngredient],
};

describe('IngredientRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders food name, quantity, unit, and note', () => {
    render(
      <IngredientRow
        ingredient={mockIngredient}
        onDelete={vi.fn()}
        sectionId="sec-1"
      />,
      { wrapper }
    );

    expect(screen.getByText('Tomate')).toBeInTheDocument();
    expect(screen.getByText('200 g')).toBeInTheDocument();
    expect(screen.getByText('bien maduros')).toBeInTheDocument();
  });

  it('delete button calls onDelete with ingredient id', () => {
    const onDelete = vi.fn();
    render(
      <IngredientRow
        ingredient={mockIngredient}
        onDelete={onDelete}
        sectionId="sec-1"
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar ingrediente' }));
    expect(onDelete).toHaveBeenCalledWith('ing-1');
  });
});

describe('IngredientSectionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section titles', () => {
    render(
      <IngredientSectionEditor
        recipeId="recipe-1"
        sections={[mockSection]}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    const input = screen.getByPlaceholderText('Nombre de la sección (opcional)');
    expect(input).toBeInTheDocument();
    // The section title should be populated as default value
    expect((input as HTMLInputElement).value).toBe('Verduras');
  });

  it('shows empty state when no sections', () => {
    render(
      <IngredientSectionEditor
        recipeId="recipe-1"
        sections={[]}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByText('Sin ingredientes aún')).toBeInTheDocument();
  });
});

describe('IngredientPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders food list from API', async () => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === '/foods') {
        return Promise.resolve([
          { id: 'food-1', name: 'Tomate' },
          { id: 'food-2', name: 'Cebolla' },
        ]);
      }
      if (path === '/units') {
        return Promise.resolve([
          { id: 'unit-1', name: 'gramo', abbreviation: 'g' },
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <IngredientPicker
        isOpen={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        recipeId="recipe-1"
      />,
      { wrapper }
    );

    expect(screen.getByText('Seleccionar alimento')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Tomate')).toBeInTheDocument());
    expect(screen.getByText('Cebolla')).toBeInTheDocument();
  });

  it('filters foods by search term', async () => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === '/foods') {
        return Promise.resolve([
          { id: 'food-1', name: 'Tomate' },
          { id: 'food-2', name: 'Cebolla' },
          { id: 'food-3', name: 'Tomillo' },
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <IngredientPicker
        isOpen={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        recipeId="recipe-1"
      />,
      { wrapper }
    );

    await waitFor(() => expect(screen.getByText('Tomate')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Buscar alimentos...');
    fireEvent.change(searchInput, { target: { value: 'Tom' } });

    await waitFor(() => {
      expect(screen.getByText('Tomate')).toBeInTheDocument();
      expect(screen.getByText('Tomillo')).toBeInTheDocument();
      expect(screen.queryByText('Cebolla')).not.toBeInTheDocument();
    });
  });
});
