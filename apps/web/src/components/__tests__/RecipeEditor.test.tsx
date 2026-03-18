import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

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

import { api } from '@/lib/api-client';
import { RecipeNamePrompt } from '@/components/recipes/editor/RecipeNamePrompt';
import { MetadataForm } from '@/components/recipes/editor/MetadataForm';
import { EditorTabs } from '@/components/recipes/editor/EditorTabs';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const mockRecipe: RecipeDetailResponse = {
  id: 'recipe-1',
  householdId: 'hh-1',
  createdById: 'user-1',
  name: 'Pollo al Horno',
  slug: 'pollo-al-horno',
  description: 'Una receta clásica',
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
  sections: [],
  steps: [],
  images: [],
};

describe('RecipeNamePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and disabled Crear button when empty', () => {
    render(
      <RecipeNamePrompt isOpen={true} onClose={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByText('¿Cómo se llama la receta?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled();
  });

  it('enables Crear when name entered', () => {
    render(
      <RecipeNamePrompt isOpen={true} onClose={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    const input = screen.getByPlaceholderText('Nombre de la receta');
    fireEvent.change(input, { target: { value: 'Mi receta' } });
    expect(screen.getByRole('button', { name: 'Crear' })).not.toBeDisabled();
  });

  it('calls api.post on Crear click', async () => {
    const mockPost = vi.mocked(api.post);
    mockPost.mockResolvedValue({ id: '1', slug: 'mi-receta', name: 'Mi receta' });
    const onCreated = vi.fn();

    render(
      <RecipeNamePrompt isOpen={true} onClose={vi.fn()} onCreated={onCreated} />,
      { wrapper }
    );

    const input = screen.getByPlaceholderText('Nombre de la receta');
    fireEvent.change(input, { target: { value: 'Mi receta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/recipes', { name: 'Mi receta' })
    );
  });
});

describe('MetadataForm', () => {
  it('renders all field labels', () => {
    render(
      <MetadataForm recipe={mockRecipe} onSave={vi.fn()} isSaving={false} />,
      { wrapper }
    );
    expect(screen.getByText('NOMBRE')).toBeInTheDocument();
    expect(screen.getByText('DESCRIPCION')).toBeInTheDocument();
    expect(screen.getByText('PORCIONES')).toBeInTheDocument();
    expect(screen.getByText('PREPARACION')).toBeInTheDocument();
    expect(screen.getByText('COCCION')).toBeInTheDocument();
    expect(screen.getByText('URL FUENTE')).toBeInTheDocument();
  });
});

describe('EditorTabs', () => {
  it('renders 4 tabs for new recipe (no Ajustes)', () => {
    render(
      <EditorTabs activeTab="Ingredientes" onTabChange={vi.fn()} isNewRecipe={true} />,
      { wrapper }
    );
    const tabs = screen.getAllByRole('button');
    expect(tabs).toHaveLength(4);
    expect(screen.queryByText('Ajustes')).not.toBeInTheDocument();
  });

  it('renders 5 tabs for existing recipe', () => {
    render(
      <EditorTabs activeTab="Ingredientes" onTabChange={vi.fn()} isNewRecipe={false} />,
      { wrapper }
    );
    const tabs = screen.getAllByRole('button');
    expect(tabs).toHaveLength(5);
    expect(screen.getByText('Ajustes')).toBeInTheDocument();
  });
});
