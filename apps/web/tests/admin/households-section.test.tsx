import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminHouseholdsPage from '@/app/(admin)/admin/panel/households/page';

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

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderPage() {
  const client = makeClient();
  return render(
    <QueryClientProvider client={client}>
      <AdminHouseholdsPage />
    </QueryClientProvider>,
  );
}

const mockHouseholdsResponse = {
  items: [
    {
      id: 'h1',
      name: 'Familia García',
      memberCount: 3,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'h2',
      name: 'Casa López',
      memberCount: 1,
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  perPage: 10,
};

const emptyHouseholdsResponse = {
  items: [],
  total: 0,
  page: 1,
  perPage: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue(emptyHouseholdsResponse as never);
  vi.mocked(adminApi.delete).mockResolvedValue(undefined as never);
});

describe('AdminHouseholdsPage', () => {
  it('renders "Hogares" heading', async () => {
    renderPage();
    expect(screen.getByText('Hogares')).toBeInTheDocument();
  });

  it('renders household rows with member count', async () => {
    mockGet.mockResolvedValue(mockHouseholdsResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Familia García')).toBeInTheDocument();
      expect(screen.getByText('Casa López')).toBeInTheDocument();
      // Member counts rendered as strings
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('shows cascade warning in ConfirmDialog when Eliminar is clicked', async () => {
    mockGet.mockResolvedValue(mockHouseholdsResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Familia García')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    expect(
      screen.getByText('Eliminar este hogar? Se eliminaran todas sus recetas y planes.'),
    ).toBeInTheDocument();
  });

  it('shows create form with name field when "Crear hogar" is clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Crear hogar'));
    expect(screen.getByText('Crear hogar', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
  });
});
