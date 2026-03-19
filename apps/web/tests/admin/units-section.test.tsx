import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminUnitsPage from '@/app/(admin)/admin/panel/units/page';

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
      <AdminUnitsPage />
    </QueryClientProvider>,
  );
}

const mockUnitsResponse = {
  items: [
    {
      id: 'u1',
      name: 'Gramo',
      abbreviation: 'g',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'u2',
      name: 'Mililitro',
      abbreviation: null,
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  perPage: 10,
};

const emptyUnitsResponse = {
  items: [],
  total: 0,
  page: 1,
  perPage: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue(emptyUnitsResponse as never);
  mockDelete.mockResolvedValue(undefined as never);
});

describe('AdminUnitsPage', () => {
  it('renders "Unidades" heading', () => {
    renderPage();
    expect(screen.getByText('Unidades')).toBeInTheDocument();
  });

  it('renders unit rows with abbreviation column', async () => {
    mockGet.mockResolvedValue(mockUnitsResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Gramo')).toBeInTheDocument();
      expect(screen.getByText('Mililitro')).toBeInTheDocument();
      expect(screen.getByText('g')).toBeInTheDocument();
      // null abbreviation renders as em dash
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('create form has name and abbreviation fields', () => {
    renderPage();
    fireEvent.click(screen.getByText('Crear unidad'));
    expect(screen.getByText('Crear unidad', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Abreviatura/i)).toBeInTheDocument();
  });

  it('delete shows ConfirmDialog', async () => {
    // Use single-row response so ConfirmDialog's Eliminar is unambiguous
    const singleRowResponse = {
      items: [mockUnitsResponse.items[0]],
      total: 1,
      page: 1,
      perPage: 10,
    };
    mockGet.mockResolvedValue(singleRowResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Gramo')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Eliminar'));
    expect(screen.getByText('Eliminar esta unidad?')).toBeInTheDocument();
  });
});
