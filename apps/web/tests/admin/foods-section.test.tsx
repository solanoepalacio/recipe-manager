import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminFoodsPage from '@/app/(admin)/admin/panel/foods/page';

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
      <AdminFoodsPage />
    </QueryClientProvider>,
  );
}

const mockFoodsResponse = {
  items: [
    {
      id: 'f1',
      name: 'Pollo',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'f2',
      name: 'Arroz',
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  perPage: 10,
};

const emptyFoodsResponse = {
  items: [],
  total: 0,
  page: 1,
  perPage: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue(emptyFoodsResponse as never);
  mockDelete.mockResolvedValue(undefined as never);
});

describe('AdminFoodsPage', () => {
  it('renders "Alimentos" heading', () => {
    renderPage();
    expect(screen.getByText('Alimentos')).toBeInTheDocument();
  });

  it('renders food rows when data is returned', async () => {
    mockGet.mockResolvedValue(mockFoodsResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Pollo')).toBeInTheDocument();
      expect(screen.getByText('Arroz')).toBeInTheDocument();
    });
  });

  it('shows create form with name field when "Crear alimento" button is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByText('Crear alimento'));
    expect(screen.getByText('Crear alimento', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
  });

  it('shows ConfirmDialog when "Eliminar" button is clicked', async () => {
    // Use single-row response so ConfirmDialog's Eliminar is unambiguous
    const singleRowResponse = {
      items: [mockFoodsResponse.items[0]],
      total: 1,
      page: 1,
      perPage: 10,
    };
    mockGet.mockResolvedValue(singleRowResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Pollo')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Eliminar'));
    expect(screen.getByText('Eliminar este alimento?')).toBeInTheDocument();
  });
});
