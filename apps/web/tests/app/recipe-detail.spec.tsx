import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  usePathname: () => '/recipes/pasta',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ slug: 'pasta-carbonara' }),
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

import RecipeDetailPage from '@/app/(app)/recipes/[slug]/page';

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
      title: 'Ingredientes principales',
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
    { id: 'st2', title: null, body: 'Mezclar con la salsa.', order: 2 },
  ],
  images: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Recipe detail page (/recipes/:slug)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue(mockRecipeDetail);
    api.post = jest.fn().mockResolvedValue({ shareUrl: 'https://example.com/shared/token123', shareToken: 'token123' });
    api.patch = jest.fn().mockResolvedValue(mockRecipeDetail);
    api.delete = jest.fn().mockResolvedValue(undefined);
  });

  it('renders recipe name', async () => {
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Pasta Carbonara').length).toBeGreaterThan(0);
    });
  });

  it('renders prep and cook times', async () => {
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument();
      expect(screen.getByText(/20/)).toBeInTheDocument();
    });
  });

  it('renders ingredient sections', async () => {
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Ingredientes principales')).toBeInTheDocument();
    });
  });

  it('renders instruction steps', async () => {
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Cocer pasta')).toBeInTheDocument();
    });
  });

  it('toggles to edit mode when Editar button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /listo/i })).toBeInTheDocument();
    });
  });

  it('shows delete buttons in edit mode', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it('opens share dialog when Compartir button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /compartir/i }));
    await waitFor(() => {
      expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    });
  });

  it('share dialog calls POST share API', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /compartir/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /compartir/i }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/recipes/r1/share');
    });
  });

  it('share dialog shows share URL', async () => {
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

  it('copy button writes share URL to clipboard', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /compartir/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /compartir/i }));
    await waitFor(() => {
      expect(screen.getByText(/https:\/\/example\.com\/shared\/token123/)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /copiar enlace/i }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/shared/token123');
    });
  });

  it('revoke button calls DELETE share API', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<RecipeDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /compartir/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /compartir/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /revocar/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /revocar/i }));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/recipes/r1/share');
    });
  });
});
