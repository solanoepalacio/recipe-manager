import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { StepResponse } from '@recipe-manager/shared';

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

import { StepRow } from '@/components/recipes/editor/StepRow';
import { StepEditor } from '@/components/recipes/editor/StepEditor';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const mockStep: StepResponse = {
  id: '1',
  title: 'Prep',
  body: 'Chop onions',
  order: 0,
};

const mockSteps: StepResponse[] = [
  { id: '1', title: 'Paso 1', body: 'Descripcion del paso 1', order: 0 },
  { id: '2', title: 'Paso 2', body: 'Descripcion del paso 2', order: 1 },
  { id: '3', title: 'Paso 3', body: 'Descripcion del paso 3', order: 2 },
];

describe('StepRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step number, title, and body', () => {
    render(
      <StepRow
        step={mockStep}
        index={0}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />,
      { wrapper }
    );

    // Step number badge
    expect(screen.getByText('1')).toBeInTheDocument();
    // Title input
    const titleInput = screen.getByPlaceholderText('Titulo del paso (opcional)');
    expect(titleInput).toBeInTheDocument();
    expect((titleInput as HTMLInputElement).value).toBe('Prep');
    // Body textarea
    const bodyTextarea = screen.getByPlaceholderText('Descripcion del paso');
    expect(bodyTextarea).toBeInTheDocument();
    expect((bodyTextarea as HTMLTextAreaElement).value).toBe('Chop onions');
  });

  it('delete button calls onDelete with step id', () => {
    const onDelete = vi.fn();
    render(
      <StepRow
        step={mockStep}
        index={0}
        onDelete={onDelete}
        onUpdate={vi.fn()}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar paso' }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});

describe('StepEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no steps', () => {
    render(
      <StepEditor
        recipeId="recipe-1"
        steps={[]}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByText('Sin pasos aun')).toBeInTheDocument();
  });

  it('renders add step button', () => {
    render(
      <StepEditor
        recipeId="recipe-1"
        steps={[]}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByText('+ Anadir paso')).toBeInTheDocument();
  });

  it('renders steps with sequential numbers', () => {
    render(
      <StepEditor
        recipeId="recipe-1"
        steps={mockSteps}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
