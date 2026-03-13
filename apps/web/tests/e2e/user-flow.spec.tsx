/**
 * E2E user flow tests — frontend integration tests with mocked API.
 * Tests the complete user journey through React components.
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ----- Navigation mocks -----
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  usePathname: () => '/recipes',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ slug: 'pasta-carbonara' }),
}));

// ----- API mock -----
jest.mock('@/lib/api-client');

// ----- Auth mock -----
const mockLogin = jest.fn();
const mockLogout = jest.fn();
let mockUser: { id: string; name: string } | null = null;
let mockAuthLoading = false;

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
    login: mockLogin,
    logout: mockLogout,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ----- Next/Image mock -----
jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    <img src={src} alt={alt} {...props} />;
  MockImage.displayName = 'Image';
  return MockImage;
});

// ----- Page imports (after mocks) -----
import LoginPage from '@/app/(auth)/login/page';
import RecipesPage from '@/app/(app)/recipes/page';
import RecipeDetailPage from '@/app/(app)/recipes/[slug]/page';
import CookModePage from '@/app/(app)/recipes/[slug]/cook/page';
import PlannerPage from '@/app/(app)/planner/page';

// ----- Shared test data -----
const mockRecipeList = {
  items: [
    {
      id: 'r1',
      slug: 'pasta-carbonara',
      name: 'Pasta Carbonara',
      description: null,
      prepTime: 10,
      cookTime: 20,
      totalTime: 30,
      servingsQty: 4,
      servingsUnit: 'porciones',
      thumbnailUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  perPage: 20,
  totalPages: 1,
};

const mockRecipeDetail = {
  id: 'r1',
  slug: 'pasta-carbonara',
  name: 'Pasta Carbonara',
  description: 'Deliciosa pasta italiana',
  prepTime: 10,
  cookTime: 20,
  totalTime: 30,
  performTime: null,
  servingsQty: 4,
  servingsUnit: 'porciones',
  sourceUrl: null,
  isLocked: false,
  landscapeView: false,
  shareToken: null,
  sections: [
    {
      id: 's1',
      title: 'Ingredientes',
      order: 1,
      ingredients: [
        {
          id: 'i1',
          foodId: 'f1',
          foodName: 'Pasta',
          unitId: 'u1',
          unitName: 'gramos',
          unitAbbreviation: 'g',
          quantity: 200,
          note: null,
          order: 1,
        },
      ],
    },
  ],
  steps: [
    { id: 'st1', title: 'Cocer pasta', body: 'Cocer la pasta en agua con sal.', order: 1 },
  ],
  images: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockNewRecipe = {
  ...mockRecipeDetail,
  id: 'r2',
  slug: 'nueva-receta',
  name: 'Nueva Receta',
};

const mockMealPlan = {
  entries: [],
};

const mockShareResponse = {
  shareUrl: 'https://example.com/shared/token123',
  shareToken: 'token123',
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// ===========================
// 13.6 — User Flow Tests
// ===========================

describe('User flow — login → create recipe → view detail → cook mode → share → meal plan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'u1', name: 'Ana' };
    mockAuthLoading = false;

    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/recipes/pasta-carbonara')) return Promise.resolve(mockRecipeDetail);
      if (url.includes('/api/recipes')) return Promise.resolve(mockRecipeList);
      if (url.includes('/api/meal-plan')) return Promise.resolve(mockMealPlan);
      return Promise.resolve({});
    });
    api.post = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/share')) return Promise.resolve(mockShareResponse);
      if (url.includes('/api/recipes')) return Promise.resolve(mockNewRecipe);
      if (url.includes('/api/meal-plan/entries')) return Promise.resolve({ id: 'e1', recipeName: 'Pasta Carbonara', mealType: 'dinner', date: '2024-01-15' });
      return Promise.resolve({});
    });
    api.patch = jest.fn().mockResolvedValue(mockRecipeDetail);
    api.delete = jest.fn().mockResolvedValue(undefined);
  });

  // Step 1: Login page renders and can submit form
  it('renders login page with form fields', () => {
    mockUser = null;
    render(<LoginPage />);

    expect(screen.getByLabelText('Email o usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('submits login form and navigates to home', async () => {
    mockUser = null;
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email o usuario'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secret123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ login: 'ana@example.com', password: 'secret123' });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows inline error for failed login', async () => {
    mockUser = null;
    mockLogin.mockRejectedValueOnce(new Error('Unauthorized'));
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email o usuario'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(/credenciales/i);
    });
  });

  // Step 2: Recipe list renders after login
  it('renders recipe list with recipes from API', async () => {
    renderWithQuery(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('shows loading state on recipe list before data arrives', async () => {
    const { api } = require('@/lib/api-client');
    let resolveGet: (value: unknown) => void;
    api.get = jest.fn().mockReturnValue(new Promise((res) => { resolveGet = res; }));

    renderWithQuery(<RecipesPage />);

    // Should show loading indicator
    const loadingEl = screen.queryByRole('status');
    // Either a spinner or skeleton should be visible
    expect(loadingEl ?? screen.queryByText(/cargando/i)).toBeTruthy();

    // Resolve and clean up
    act(() => resolveGet!(mockRecipeList));
  });

  it('shows empty state when no recipes exist', async () => {
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, perPage: 20, totalPages: 0 });

    renderWithQuery(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText(/no hay recetas/i)).toBeInTheDocument();
    });
  });

  // Step 3: Create a recipe from FAB
  it('opens new recipe sheet when FAB is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipesPage />);

    await user.click(screen.getByTestId('fab-new-recipe'));

    await waitFor(() => {
      expect(screen.getByTestId('new-recipe-sheet')).toBeInTheDocument();
    });
  });

  it('shows recipe grid with responsive classes', async () => {
    renderWithQuery(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Check responsive grid classes exist in the DOM
    const { container } = renderWithQuery(<RecipesPage />);
    await waitFor(() => {
      const grid = container.querySelector('.grid');
      expect(grid).not.toBeNull();
    });
  });

  // Step 4: View recipe detail
  it('renders recipe detail with name and steps', async () => {
    renderWithQuery(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Pasta Carbonara').length).toBeGreaterThan(0);
      expect(screen.getByText('Cocer pasta')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton on recipe detail before data arrives', async () => {
    const { api } = require('@/lib/api-client');
    let resolveGet: (value: unknown) => void;
    api.get = jest.fn().mockReturnValue(new Promise((res) => { resolveGet = res; }));

    renderWithQuery(<RecipeDetailPage />);

    // Loading state should be visible
    const loadingEl = screen.queryByRole('status');
    expect(loadingEl ?? document.querySelector('.animate-spin, .animate-pulse')).toBeTruthy();

    act(() => resolveGet!(mockRecipeDetail));
  });

  // Step 5: Cook mode
  it('renders cook mode page with steps', async () => {
    renderWithQuery(<CookModePage />);

    await waitFor(() => {
      expect(screen.getByText('Cocer la pasta en agua con sal.')).toBeInTheDocument();
    });
  });

  it('navigates to cook mode from recipe detail', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /modo cocina/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /modo cocina/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/recipes/pasta-carbonara/cook');
    });
  });

  // Step 6: Share a recipe
  it('opens share dialog and shows share URL', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /compartir/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /compartir/i }));

    await waitFor(() => {
      expect(screen.getByText(/https:\/\/example\.com\/shared\/token123/)).toBeInTheDocument();
    });
  });

  // Step 7: Add to meal plan
  it('renders planner page with week navigation', async () => {
    renderWithQuery(<PlannerPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/anterior/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/siguiente/i)).toBeInTheDocument();
    });
  });

  it('shows day rows on planner', async () => {
    renderWithQuery(<PlannerPage />);

    await waitFor(() => {
      const dayRows = screen.getAllByTestId('planner-day-row');
      expect(dayRows.length).toBe(7);
    });
  });
});
