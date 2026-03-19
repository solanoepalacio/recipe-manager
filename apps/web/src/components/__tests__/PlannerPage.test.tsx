import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MealPlanEntryResponse } from '@recipe-manager/shared';

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

// Mock @dnd-kit/core — DndContext as passthrough, useDraggable/useDroppable stubs
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  })),
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  closestCenter: vi.fn(),
}));

import { api } from '@/lib/api-client';
import PlannerPage from '@/app/(app)/planner/page';

const todayStr = new Date().toISOString().slice(0, 10);

function createMockEntry(overrides: Partial<MealPlanEntryResponse> = {}): MealPlanEntryResponse {
  return {
    id: 'entry-1',
    date: '2026-03-16',
    mealType: 'lunch' as MealPlanEntryResponse['mealType'],
    recipeId: 'r1',
    recipeName: 'Pasta',
    recipeSlug: 'pasta',
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z',
    ...overrides,
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('PlannerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 7 day accordion rows for the current week', async () => {
    vi.mocked(api.get).mockResolvedValue({ entries: [] });
    renderWithProviders(<PlannerPage />);

    // Wait for at least one day name to appear
    await screen.findByText('Lunes');

    // All 7 Spanish day names should appear
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Martes')).toBeInTheDocument();
    expect(screen.getByText('Miercoles')).toBeInTheDocument();
    expect(screen.getByText('Jueves')).toBeInTheDocument();
    expect(screen.getByText('Viernes')).toBeInTheDocument();
    expect(screen.getByText('Sabado')).toBeInTheDocument();
    expect(screen.getByText('Domingo')).toBeInTheDocument();
  });

  it('shows week navigation label and prev/next buttons', async () => {
    vi.mocked(api.get).mockResolvedValue({ entries: [] });
    renderWithProviders(<PlannerPage />);

    await screen.findByLabelText('Semana anterior');
    await screen.findByLabelText('Semana siguiente');

    expect(screen.getByText(/Semana del/)).toBeInTheDocument();
  });

  it('shows 1 semana / 4 semanas toggle', async () => {
    vi.mocked(api.get).mockResolvedValue({ entries: [] });
    renderWithProviders(<PlannerPage />);

    expect(screen.getByText('1 semana')).toBeInTheDocument();
    expect(screen.getByText('4 semanas')).toBeInTheDocument();
  });

  it('displays entry recipe name in expanded day row', async () => {
    vi.mocked(api.get).mockResolvedValue({
      entries: [createMockEntry({ date: todayStr, recipeName: 'Tacos' })],
    });
    renderWithProviders(<PlannerPage />);

    await screen.findByText('Tacos');
  });

  it('shows empty state text when no entries', async () => {
    vi.mocked(api.get).mockResolvedValue({ entries: [] });
    renderWithProviders(<PlannerPage />);

    // Multiple days show "Sin recetas planificadas" (collapsed preview + expanded empty state)
    const empties = await screen.findAllByText('Sin recetas planificadas');
    expect(empties.length).toBeGreaterThan(0);
  });

  it('renders "+ Anadir receta" button in expanded day', async () => {
    vi.mocked(api.get).mockResolvedValue({ entries: [] });
    renderWithProviders(<PlannerPage />);

    await screen.findByText('Anadir receta');
  });

  it('renders meal type label on entry rows', async () => {
    vi.mocked(api.get).mockResolvedValue({
      entries: [createMockEntry({ date: todayStr, mealType: 'breakfast' as MealPlanEntryResponse['mealType'] })],
    });
    renderWithProviders(<PlannerPage />);

    // MEAL_TYPE_LABELS maps breakfast => 'Desayuno'
    await screen.findByText('Desayuno');
  });

  it('opens recipe picker sheet when "+ Anadir receta" is tapped', async () => {
    // PLAN-02: picker opens on add button tap
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('meal-plan')) return Promise.resolve({ entries: [] });
      if (url.includes('recipes'))
        return Promise.resolve({
          items: [{ id: 'r1', name: 'Tacos', slug: 'tacos' }],
          total: 1,
          page: 1,
          perPage: 50,
        });
      return Promise.resolve({});
    });

    renderWithProviders(<PlannerPage />);

    // Today's day is auto-expanded; wait for add button
    const addBtn = await screen.findByText('Anadir receta');
    fireEvent.click(addBtn);

    // Picker sheet opened — search bar placeholder visible
    await screen.findByPlaceholderText('Buscar receta...');
  });

  it('calls api.post to create entry when recipe is selected in picker', async () => {
    // PLAN-02: selecting a recipe creates entry via POST
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('meal-plan')) return Promise.resolve({ entries: [] });
      if (url.includes('recipes'))
        return Promise.resolve({
          items: [{ id: 'r1', name: 'Tacos', slug: 'tacos' }],
          total: 1,
          page: 1,
          perPage: 50,
        });
      return Promise.resolve({});
    });
    vi.mocked(api.post).mockResolvedValue({
      id: 'new-entry',
      date: todayStr,
      mealType: 'lunch',
      recipeId: 'r1',
      recipeName: 'Tacos',
      recipeSlug: 'tacos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    renderWithProviders(<PlannerPage />);

    // Open picker
    const addBtn = await screen.findByText('Anadir receta');
    fireEvent.click(addBtn);

    // Wait for recipe to appear in picker list
    const recipeBtn = await screen.findByText('Tacos');
    fireEvent.click(recipeBtn);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/meal-plan/entries',
        expect.objectContaining({ recipeId: 'r1' })
      )
    );
  });

  it('calls api.delete when X button on entry row is clicked', async () => {
    // PLAN-04: delete entry from row
    vi.mocked(api.get).mockResolvedValue({
      entries: [createMockEntry({ date: todayStr, id: 'entry-del' })],
    });
    vi.mocked(api.delete).mockResolvedValue(undefined);

    renderWithProviders(<PlannerPage />);

    // Wait for entry to appear (today is auto-expanded)
    await screen.findByText('Pasta');

    // Click the delete button
    const deleteBtn = screen.getByLabelText('Eliminar entrada');
    fireEvent.click(deleteBtn);

    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(
        expect.stringContaining('/meal-plan/entries/')
      )
    );
  });
});
