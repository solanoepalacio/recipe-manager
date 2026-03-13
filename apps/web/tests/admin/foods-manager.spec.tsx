import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FoodsManager } from '@/components/admin/FoodsManager';
import type { FoodResponse } from '@recipe-manager/shared';

jest.mock('@/lib/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from '@/lib/api-client';

const mockFoods: FoodResponse[] = [
  { id: 'f1', name: 'Manzana' },
  { id: 'f2', name: 'Plátano' },
  { id: 'f3', name: 'Naranja' },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('FoodsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders foods list from API', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      items: mockFoods,
      total: 3,
      page: 1,
      perPage: 20,
    });

    render(<FoodsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Manzana')).toBeInTheDocument();
      expect(screen.getByText('Plátano')).toBeInTheDocument();
      expect(screen.getByText('Naranja')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockFoods, total: 3, page: 1, perPage: 20 });

    render(<FoodsManager />, { wrapper });

    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  });

  it('filters foods by search term', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockFoods, total: 3, page: 1, perPage: 20 });

    render(<FoodsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Manzana')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar/i), {
      target: { value: 'Manz' },
    });

    await waitFor(() => {
      expect(screen.getByText('Manzana')).toBeInTheDocument();
      expect(screen.queryByText('Plátano')).not.toBeInTheDocument();
      expect(screen.queryByText('Naranja')).not.toBeInTheDocument();
    });
  });

  it('renders "Crear alimento" button', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, perPage: 20 });

    render(<FoodsManager />, { wrapper });

    expect(screen.getByRole('button', { name: /crear alimento/i })).toBeInTheDocument();
  });

  it('shows create form when "Crear alimento" clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, perPage: 20 });

    render(<FoodsManager />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear alimento/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nombre del alimento/i)).toBeInTheDocument();
    });
  });

  it('calls POST /api/admin/foods on create', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, perPage: 20 });
    (api.post as jest.Mock).mockResolvedValue({ id: 'f4', name: 'Fresa' });

    render(<FoodsManager />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear alimento/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nombre del alimento/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/nombre del alimento/i), {
      target: { value: 'Fresa' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/admin/foods', { name: 'Fresa' });
    });
  });

  it('renders edit button for each food', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockFoods, total: 3, page: 1, perPage: 20 });

    render(<FoodsManager />, { wrapper });

    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /editar/i });
      expect(editButtons).toHaveLength(3);
    });
  });

  it('renders delete button for each food', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockFoods, total: 3, page: 1, perPage: 20 });

    render(<FoodsManager />, { wrapper });

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      expect(deleteButtons).toHaveLength(3);
    });
  });

  it('enables inline edit when edit button clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockFoods, total: 3, page: 1, perPage: 20 });

    render(<FoodsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Manzana')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Manzana')).toBeInTheDocument();
    });
  });

  it('calls PATCH /api/admin/foods/:id on save edit', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockFoods, total: 3, page: 1, perPage: 20 });
    (api.patch as jest.Mock).mockResolvedValue({ id: 'f1', name: 'Manzana Verde' });

    render(<FoodsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Manzana')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Manzana')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Manzana'), {
      target: { value: 'Manzana Verde' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/admin/foods/f1', { name: 'Manzana Verde' });
    });
  });

  it('calls DELETE /api/admin/foods/:id on delete', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockFoods, total: 3, page: 1, perPage: 20 });
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    window.confirm = jest.fn().mockReturnValue(true);

    render(<FoodsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Manzana')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/admin/foods/f1');
    });
  });
});
