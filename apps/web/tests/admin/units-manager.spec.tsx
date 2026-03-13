import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnitsManager } from '@/components/admin/UnitsManager';
import type { UnitResponse } from '@recipe-manager/shared';

jest.mock('@/lib/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from '@/lib/api-client';

const mockUnits: UnitResponse[] = [
  { id: 'un1', name: 'Kilogramo', abbreviation: 'kg' },
  { id: 'un2', name: 'Gramo', abbreviation: 'g' },
  { id: 'un3', name: 'Litro', abbreviation: 'L' },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('UnitsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders units list from API', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      items: mockUnits,
      total: 3,
      page: 1,
      perPage: 20,
    });

    render(<UnitsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Kilogramo')).toBeInTheDocument();
      expect(screen.getByText('Gramo')).toBeInTheDocument();
      expect(screen.getByText('Litro')).toBeInTheDocument();
    });
  });

  it('renders abbreviation for each unit', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockUnits, total: 3, page: 1, perPage: 20 });

    render(<UnitsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('kg')).toBeInTheDocument();
      expect(screen.getByText('g')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
    });
  });

  it('renders search input', () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockUnits, total: 3, page: 1, perPage: 20 });

    render(<UnitsManager />, { wrapper });

    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  });

  it('filters units by search term', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockUnits, total: 3, page: 1, perPage: 20 });

    render(<UnitsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Kilogramo')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar/i), {
      target: { value: 'Kilo' },
    });

    await waitFor(() => {
      expect(screen.getByText('Kilogramo')).toBeInTheDocument();
      expect(screen.queryByText('Gramo')).not.toBeInTheDocument();
      expect(screen.queryByText('Litro')).not.toBeInTheDocument();
    });
  });

  it('renders "Crear unidad" button', () => {
    (api.get as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, perPage: 20 });

    render(<UnitsManager />, { wrapper });

    expect(screen.getByRole('button', { name: /crear unidad/i })).toBeInTheDocument();
  });

  it('shows create form with name and abbreviation fields', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, perPage: 20 });

    render(<UnitsManager />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear unidad/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nombre de la unidad/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/abreviatura/i)).toBeInTheDocument();
    });
  });

  it('calls POST /api/admin/units on create', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, perPage: 20 });
    (api.post as jest.Mock).mockResolvedValue({ id: 'un4', name: 'Mililitro', abbreviation: 'mL' });

    render(<UnitsManager />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear unidad/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nombre de la unidad/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/nombre de la unidad/i), {
      target: { value: 'Mililitro' },
    });
    fireEvent.change(screen.getByPlaceholderText(/abreviatura/i), {
      target: { value: 'mL' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/admin/units', {
        name: 'Mililitro',
        abbreviation: 'mL',
      });
    });
  });

  it('renders edit button for each unit', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockUnits, total: 3, page: 1, perPage: 20 });

    render(<UnitsManager />, { wrapper });

    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /editar/i });
      expect(editButtons).toHaveLength(3);
    });
  });

  it('renders delete button for each unit', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockUnits, total: 3, page: 1, perPage: 20 });

    render(<UnitsManager />, { wrapper });

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      expect(deleteButtons).toHaveLength(3);
    });
  });

  it('enables inline edit when edit button clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockUnits, total: 3, page: 1, perPage: 20 });

    render(<UnitsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Kilogramo')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Kilogramo')).toBeInTheDocument();
    });
  });

  it('calls PATCH /api/admin/units/:id on save edit', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockUnits, total: 3, page: 1, perPage: 20 });
    (api.patch as jest.Mock).mockResolvedValue({ id: 'un1', name: 'Kilogramo Actualizado', abbreviation: 'kg' });

    render(<UnitsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Kilogramo')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Kilogramo')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Kilogramo'), {
      target: { value: 'Kilogramo Actualizado' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/admin/units/un1', expect.objectContaining({
        name: 'Kilogramo Actualizado',
      }));
    });
  });

  it('calls DELETE /api/admin/units/:id on delete', async () => {
    (api.get as jest.Mock).mockResolvedValue({ items: mockUnits, total: 3, page: 1, perPage: 20 });
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    window.confirm = jest.fn().mockReturnValue(true);

    render(<UnitsManager />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Kilogramo')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/admin/units/un1');
    });
  });
});
