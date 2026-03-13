import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/recipes',
  useSearchParams: () => new URLSearchParams(),
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

import RecipesPage from '@/app/(app)/recipes/page';

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
    {
      id: 'r2',
      slug: 'ensalada',
      name: 'Ensalada César',
      description: null,
      prepTime: 5,
      cookTime: 0,
      totalTime: 5,
      servingsQty: 2,
      servingsUnit: 'porciones',
      thumbnailUrl: null,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ],
  total: 2,
  page: 1,
  perPage: 20,
  totalPages: 1,
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Recipes list page (/recipes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue(mockRecipes);
  });

  it('renders recipe cards from query', async () => {
    renderWithQuery(<RecipesPage />);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Ensalada César')).toBeInTheDocument();
    });
  });

  it('renders search bar', async () => {
    renderWithQuery(<RecipesPage />);
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  });

  it('renders sort chips', async () => {
    renderWithQuery(<RecipesPage />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
  });

  it('renders FAB button', async () => {
    renderWithQuery(<RecipesPage />);
    expect(screen.getByTestId('fab-new-recipe')).toBeInTheDocument();
  });

  it('opens new recipe sheet when FAB is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipesPage />);
    await user.click(screen.getByTestId('fab-new-recipe'));
    await waitFor(() => {
      expect(screen.getByTestId('new-recipe-sheet')).toBeInTheDocument();
    });
  });

  it('navigates to recipe detail on card click', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipesPage />);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
    const cards = screen.getAllByRole('button');
    await user.click(cards.find((b) => b.textContent?.includes('Pasta Carbonara'))!);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/recipes/pasta');
    });
  });
});
