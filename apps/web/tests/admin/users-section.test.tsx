import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminUsersPage from '@/app/(admin)/admin/panel/users/page';

// Mock adminApi
vi.mock('@/lib/admin-api-client', () => ({
  adminApi: {
    get: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, perPage: 10 }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { adminApi } from '@/lib/admin-api-client';
const mockGet = vi.mocked(adminApi.get);
const mockDelete = vi.mocked(adminApi.delete);

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderPage() {
  const client = makeClient();
  return render(
    <QueryClientProvider client={client}>
      <AdminUsersPage />
    </QueryClientProvider>,
  );
}

const mockUsersResponse = {
  items: [
    {
      id: 'u1',
      householdId: 'h1',
      name: 'Ana García',
      email: 'ana@test.com',
      username: 'ana',
      gender: null,
      dateOfBirth: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'u2',
      householdId: 'h1',
      name: 'Carlos López',
      email: 'carlos@test.com',
      username: null,
      gender: null,
      dateOfBirth: null,
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  perPage: 10,
};

const emptyUsersResponse = {
  items: [],
  total: 0,
  page: 1,
  perPage: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue(emptyUsersResponse as never);
  mockDelete.mockResolvedValue(undefined as never);
});

describe('AdminUsersPage', () => {
  it('renders "Usuarios" heading', async () => {
    renderPage();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
  });

  it('renders user rows when data is returned', async () => {
    mockGet.mockResolvedValue(mockUsersResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });
  });

  it('shows create form when "Crear usuario" button is clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Crear usuario'));
    expect(screen.getByText('Crear usuario', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
  });

  it('shows ConfirmDialog when "Eliminar" button is clicked', async () => {
    mockGet.mockResolvedValue(mockUsersResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    expect(
      screen.getByText('Eliminar este usuario? Esta accion no se puede deshacer.'),
    ).toBeInTheDocument();
  });

  it('calls delete mutation on confirm', async () => {
    // Use single-row response so ConfirmDialog's Eliminar is unambiguous
    const singleRowResponse = {
      items: [mockUsersResponse.items[0]],
      total: 1,
      page: 1,
      perPage: 10,
    };
    mockGet.mockResolvedValue(singleRowResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });
    // Click the row's Eliminar button
    fireEvent.click(screen.getByText('Eliminar'));
    await waitFor(() => {
      expect(
        screen.getByText('Eliminar este usuario? Esta accion no se puede deshacer.'),
      ).toBeInTheDocument();
    });
    // After ConfirmDialog renders, there are 2 Eliminar buttons — click the confirm one
    const allEliminar = screen.getAllByText('Eliminar');
    fireEvent.click(allEliminar[allEliminar.length - 1]);
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/admin/users/u1');
    });
  });
});
