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
const mockPost = vi.mocked(adminApi.post);
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
      <AdminHouseholdsPage />
    </QueryClientProvider>,
  );
}

const mockHousehold = {
  id: 'h1',
  name: 'Familia García',
  memberCount: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockHouseholdsResponse = {
  items: [mockHousehold],
  total: 1,
  page: 1,
  perPage: 10,
};

const mockHouseholdDetail = {
  id: 'h1',
  name: 'Familia García',
  members: [
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
  ],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

function setupMocks() {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/admin/households/h1')) return Promise.resolve(mockHouseholdDetail);
    return Promise.resolve(mockHouseholdsResponse);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue({ items: [], total: 0, page: 1, perPage: 10 } as never);
  mockDelete.mockResolvedValue(undefined as never);
});

describe('Household members (add member flow)', () => {
  it('shows "Agregar miembro" button when a household row is expanded', async () => {
    setupMocks();
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Familia García')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /expandir/i }));
    await waitFor(() => {
      expect(screen.getByText(/agregar miembro/i)).toBeInTheDocument();
    });
  });

  it('shows add-member form with household name in title when "Agregar miembro" is clicked', async () => {
    setupMocks();
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Familia García')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /expandir/i }));
    await waitFor(() => {
      expect(screen.getByText(/agregar miembro/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/agregar miembro/i));
    expect(
      screen.getByText('Agregar miembro — Familia García', { selector: 'h3' }),
    ).toBeInTheDocument();
  });

  it('add-member form has no household dropdown — householdId is fixed', async () => {
    setupMocks();
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Familia García')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /expandir/i }));
    await waitFor(() => {
      expect(screen.getByText(/agregar miembro/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/agregar miembro/i));
    expect(screen.queryByLabelText(/Hogar/i)).not.toBeInTheDocument();
  });

  it('submits create-member with fixed householdId', async () => {
    setupMocks();
    mockPost.mockResolvedValue({
      id: 'u2',
      householdId: 'h1',
      name: 'Luis',
      email: 'luis@test.com',
      username: null,
      gender: null,
      dateOfBirth: null,
      createdAt: '2025-03-01T00:00:00Z',
      updatedAt: '2025-03-01T00:00:00Z',
    } as never);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Familia García')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /expandir/i }));
    await waitFor(() => {
      expect(screen.getByText(/agregar miembro/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/agregar miembro/i));

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Luis' } });
    fireEvent.change(screen.getByLabelText(/Correo/i), { target: { value: 'luis@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'pass123' } });

    fireEvent.click(screen.getByRole('button', { name: /^Crear$/ }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/admin/users', {
        name: 'Luis',
        email: 'luis@test.com',
        password: 'pass123',
        householdId: 'h1',
      });
    });
  });

  it('shows member delete confirmation when member Eliminar is clicked', async () => {
    setupMocks();
    mockDelete.mockResolvedValue(undefined as never);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Familia García')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /expandir/i }));
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });
    // Both the household row and the member row have an "Eliminar" button.
    // The member's Eliminar is the last one in the DOM.
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(
      screen.getByText('Eliminar este usuario? Esta accion no se puede deshacer.'),
    ).toBeInTheDocument();
  });
});
