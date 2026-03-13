import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/api-client');

jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    <img src={src} alt={alt} {...props} />;
  MockImage.displayName = 'Image';
  return MockImage;
});

import { RecipeEditTabs } from '@/components/recipes/RecipeEditTabs';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

const mockRecipe: RecipeDetailResponse = {
  id: 'r1',
  slug: 'pasta-carbonara',
  name: 'Pasta Carbonara',
  description: 'Deliciosa pasta',
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
    { id: 'st1', title: 'Cocer', body: 'Cocer la pasta en agua con sal.', order: 1 },
    { id: 'st2', title: null, body: 'Mezclar con la salsa.', order: 2 },
  ],
  images: [
    { id: 'img1', url: 'https://example.com/img.jpg', order: 1, createdAt: '2024-01-01T00:00:00.000Z' },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('RecipeEditTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue({ items: [], total: 0 });
    api.post = jest.fn().mockResolvedValue({});
    api.patch = jest.fn().mockResolvedValue(mockRecipe);
    api.delete = jest.fn().mockResolvedValue(undefined);
  });

  it('renders 4 tabs: Ingredientes, Instrucciones, Básico, Fotos', () => {
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    expect(screen.getByRole('tab', { name: /ingredientes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /instrucciones/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /básico/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /fotos/i })).toBeInTheDocument();
  });

  it('shows Ingredientes tab content by default', () => {
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    expect(screen.getByText(/Pasta/)).toBeInTheDocument();
  });

  it('switches to Instrucciones tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /instrucciones/i }));
    await waitFor(() => {
      expect(screen.getByText('Cocer la pasta en agua con sal.')).toBeInTheDocument();
    });
  });

  it('switches to Básico tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /básico/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('switches to Fotos tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /fotos/i }));
    await waitFor(() => {
      expect(screen.getByTestId('photo-upload-zone')).toBeInTheDocument();
    });
  });

  // Ingredients tab
  it('renders ingredient list in Ingredientes tab', () => {
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    expect(screen.getAllByText(/Pasta/).length).toBeGreaterThan(0);
  });

  it('delete ingredient calls API', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    const deleteBtn = screen.getByTestId('delete-ingredient-i1');
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/recipes/r1/sections/s1/ingredients/i1');
    });
  });

  it('opens ingredient picker when Agregar ingrediente is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: /agregar ingrediente/i }));
    await waitFor(() => {
      expect(screen.getByTestId('ingredient-picker-modal')).toBeInTheDocument();
    });
  });

  // Instructions tab
  it('renders steps in Instrucciones tab', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /instrucciones/i }));
    await waitFor(() => {
      expect(screen.getByText('Cocer la pasta en agua con sal.')).toBeInTheDocument();
    });
  });

  it('add step button calls create API', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    api.post = jest.fn().mockResolvedValue({ id: 'st3', title: null, body: '', order: 3 });
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /instrucciones/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /agregar paso/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /agregar paso/i }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/recipes/r1/steps', expect.any(Object));
    });
  });

  it('delete step calls DELETE API', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /instrucciones/i }));
    await waitFor(() => {
      expect(screen.getByTestId('delete-step-st1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('delete-step-st1'));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/recipes/r1/steps/st1');
    });
  });

  // Basic info tab
  it('basic info tab shows name field with current value', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /básico/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('basic info tab save calls PATCH API', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /básico/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/recipes/r1', expect.any(Object));
    });
  });

  // Photos tab
  it('photos tab shows image preview', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /fotos/i }));
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  it('photos tab delete button calls DELETE API', async () => {
    const user = userEvent.setup();
    const { api } = require('@/lib/api-client');
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /fotos/i }));
    await waitFor(() => {
      expect(screen.getByTestId('delete-image-img1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('delete-image-img1'));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/recipes/r1/images/img1');
    });
  });

  it('uploads image file via FormData', async () => {
    const { api } = require('@/lib/api-client');
    api.postForm = jest.fn().mockResolvedValue({ id: 'img2', url: '/uploads/img.jpg', order: 2 });
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={mockRecipe} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /fotos/i }));
    await waitFor(() => {
      expect(screen.getByTestId('photo-upload-zone')).toBeInTheDocument();
    });
    const file = new File(['image content'], 'img.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('photo-upload-zone').querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(api.postForm).toHaveBeenCalledWith('/api/recipes/r1/images', expect.any(FormData));
    });
  });

  it('shows image preview after upload', async () => {
    const { api } = require('@/lib/api-client');
    api.postForm = jest.fn().mockResolvedValue({ id: 'img-new', url: '/uploads/img.jpg', order: 1 });
    const recipeWithNoImages = { ...mockRecipe, images: [] };
    const user = userEvent.setup();
    renderWithQuery(<RecipeEditTabs recipe={recipeWithNoImages} onUpdate={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: /fotos/i }));
    await waitFor(() => {
      expect(screen.getByTestId('photo-upload-zone')).toBeInTheDocument();
    });
    const file = new File(['image content'], 'img.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('photo-upload-zone').querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      const img = screen.getByRole('img', { name: /foto/i });
      expect(img).toHaveAttribute('src', '/uploads/img.jpg');
    });
  });
});
