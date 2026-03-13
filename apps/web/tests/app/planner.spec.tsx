import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/planner',
}));

jest.mock('@/lib/api-client');

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Ana' }, loading: false, login: jest.fn(), logout: jest.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    <img src={src} alt={alt} {...props} />;
  MockImage.displayName = 'Image';
  return MockImage;
});

import PlannerPage from '@/app/(app)/planner/page';

const mockMealPlan = {
  entries: [
    {
      id: 'e1',
      recipeId: 'r1',
      recipeName: 'Pasta Carbonara',
      recipeThumbnailUrl: null,
      date: '2024-01-08',
      mealType: 'dinner',
    },
  ],
};

const emptyMealPlan = { entries: [] };

const mockRecipes = {
  items: [
    {
      id: 'r1',
      slug: 'pasta',
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

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Meal planner page (/planner)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockImplementation((path: string) => {
      if (path.startsWith('/api/meal-plan')) return Promise.resolve(mockMealPlan);
      if (path.startsWith('/api/recipes')) return Promise.resolve(mockRecipes);
      return Promise.resolve({});
    });
    api.post = jest.fn().mockResolvedValue({ id: 'e2', recipeId: 'r1', recipeName: 'Pasta', date: '2024-01-08', mealType: 'dinner', recipeThumbnailUrl: null });
    api.delete = jest.fn().mockResolvedValue(undefined);
  });

  it('renders 7 day rows', async () => {
    renderWithQuery(<PlannerPage />);
    await waitFor(() => {
      const dayRows = screen.getAllByTestId('planner-day-row');
      expect(dayRows).toHaveLength(7);
    });
  });

  it('renders week navigation buttons', async () => {
    renderWithQuery(<PlannerPage />);
    expect(screen.getByRole('button', { name: /anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
  });

  it('changes week when navigation buttons are clicked', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<PlannerPage />);
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it('expands day row when clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<PlannerPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('planner-day-row').length).toBe(7);
    });
    const dayRows = screen.getAllByTestId('planner-day-row');
    await user.click(dayRows[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /agregar/i })).toBeInTheDocument();
    });
  });

  it('opens recipe picker when Agregar is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<PlannerPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('planner-day-row').length).toBe(7);
    });
    const dayRows = screen.getAllByTestId('planner-day-row');
    await user.click(dayRows[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /agregar/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /agregar/i }));
    await waitFor(() => {
      expect(screen.getByTestId('recipe-picker-sheet')).toBeInTheDocument();
    });
  });

  it('recipe picker calls add entry API on recipe tap', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<PlannerPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('planner-day-row').length).toBe(7);
    });
    const dayRows = screen.getAllByTestId('planner-day-row');
    await user.click(dayRows[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /agregar/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /agregar/i }));
    await waitFor(() => {
      expect(screen.getByTestId('recipe-picker-sheet')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Pasta Carbonara'));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/meal-plan/entries', expect.objectContaining({ recipeId: 'r1' }));
    });
  });

  it('delete entry button calls DELETE API', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<PlannerPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('planner-day-row').length).toBe(7);
    });
    // Find the day row with the entry
    const dayRows = screen.getAllByTestId('planner-day-row');
    // Click the one that has the entry
    for (const row of dayRows) {
      await user.click(row);
      const deleteBtn = screen.queryByTestId('delete-entry-e1');
      if (deleteBtn) {
        await user.click(deleteBtn);
        await waitFor(() => {
          expect(api.delete).toHaveBeenCalledWith('/api/meal-plan/entries/e1');
        });
        return;
      }
    }
  });
});
