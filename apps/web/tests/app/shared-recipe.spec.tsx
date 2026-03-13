import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ token: 'share-token-123' }),
}));

jest.mock('@/lib/api-client');

jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    <img src={src} alt={alt} {...props} />;
  MockImage.displayName = 'Image';
  return MockImage;
});

import SharedRecipePage from '@/app/shared/[token]/page';

const mockSharedRecipe = {
  id: 'r1',
  slug: 'pasta-carbonara',
  name: 'Pasta Carbonara',
  description: 'Deliciosa pasta italiana',
  prepTime: 10,
  cookTime: 20,
  totalTime: 30,
  servingsQty: 4,
  servingsUnit: 'porciones',
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
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Shared recipe page (/shared/:token)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue(mockSharedRecipe);
  });

  it('renders the recipe name', async () => {
    renderWithQuery(<SharedRecipePage />);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('renders app branding banner', async () => {
    renderWithQuery(<SharedRecipePage />);
    expect(screen.getByTestId('branding-banner')).toBeInTheDocument();
  });

  it('renders branding footer', async () => {
    renderWithQuery(<SharedRecipePage />);
    expect(screen.getByTestId('branding-footer')).toBeInTheDocument();
  });

  it('does not show edit button', async () => {
    renderWithQuery(<SharedRecipePage />);
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  it('renders cook mode button', async () => {
    renderWithQuery(<SharedRecipePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /modo cocina|cook/i })).toBeInTheDocument();
    });
  });

  it('shows error state when token is invalid', async () => {
    const { api } = require('@/lib/api-client');
    const { ApiError } = require('@/lib/api-client');
    api.get = jest.fn().mockRejectedValue(new ApiError(404, { message: 'Not found' }));
    renderWithQuery(<SharedRecipePage />);
    await waitFor(() => {
      expect(screen.getByText(/receta no encontrada/i)).toBeInTheDocument();
    });
  });

  it('calls public shared recipe API with token', async () => {
    const { api } = require('@/lib/api-client');
    renderWithQuery(<SharedRecipePage />);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/recipes/shared/share-token-123');
    });
  });
});
