import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminTokensPage from '@/app/(admin)/admin/panel/tokens/page';

// Mock adminApi
vi.mock('@/lib/admin-api-client', () => ({
  adminApi: {
    get: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, perPage: 10 }),
    post: vi.fn(),
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
      <AdminTokensPage />
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
  ],
  total: 1,
  page: 1,
  perPage: 100,
};

const mockTokensResponse = {
  items: [
    {
      id: 't1',
      name: 'Mi Token',
      userId: 'u1',
      createdById: 'admin1',
      createdAt: '2025-01-01T00:00:00Z',
      lastUsedAt: '2025-03-01T00:00:00Z',
    },
    {
      id: 't2',
      name: 'Otro Token',
      userId: 'u1',
      createdById: 'admin1',
      createdAt: '2025-02-01T00:00:00Z',
      lastUsedAt: null,
    },
  ],
  total: 2,
  page: 1,
  perPage: 10,
};

const emptyResponse = {
  items: [],
  total: 0,
  page: 1,
  perPage: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue(emptyResponse as never);
  mockDelete.mockResolvedValue(undefined as never);
});

describe('AdminTokensPage', () => {
  it('renders "Tokens" heading', async () => {
    renderPage();
    expect(screen.getByText('Tokens')).toBeInTheDocument();
  });

  it('renders token rows with name, user, dates', async () => {
    mockGet.mockImplementation((path: string) => {
      if (path.startsWith('/admin/tokens')) {
        return Promise.resolve(mockTokensResponse as never);
      }
      return Promise.resolve(mockUsersResponse as never);
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mi Token')).toBeInTheDocument();
      expect(screen.getByText('Otro Token')).toBeInTheDocument();
    });
    // lastUsedAt null shows 'Nunca'
    expect(screen.getByText('Nunca')).toBeInTheDocument();
  });

  it('shows create form when "Crear token" button is clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Crear token'));
    expect(screen.getByText('Crear token', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Usuario/i)).toBeInTheDocument();
  });

  it('after create mutation success, OneTimeDisplay renders with raw token value', async () => {
    const rawToken = 'raw-token-value-abc123';
    mockPost.mockResolvedValue({
      id: 't3',
      name: 'New Token',
      userId: 'u1',
      createdById: 'admin1',
      createdAt: '2025-04-01T00:00:00Z',
      lastUsedAt: null,
      token: rawToken,
    } as never);
    mockGet.mockImplementation((path: string) => {
      if (path.startsWith('/admin/users')) {
        return Promise.resolve(mockUsersResponse as never);
      }
      return Promise.resolve(emptyResponse as never);
    });

    renderPage();

    // Open create form
    fireEvent.click(screen.getByText('Crear token'));

    // Fill in token name
    const nameInput = screen.getByLabelText(/Nombre/i);
    fireEvent.change(nameInput, { target: { value: 'New Token' } });

    // Wait for users data to load (options appear in select)
    await waitFor(() => {
      const select = screen.getByLabelText(/Usuario/i) as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toContain('u1');
    });
    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'u1' } });

    // Submit form — fire submit on the AdminForm element directly
    const form = screen.getByRole('button', { name: /Cancelar/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/admin/tokens', {
        name: 'New Token',
        userId: 'u1',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(rawToken)).toBeInTheDocument();
      expect(
        screen.getByText('Copia este token ahora. No se mostrara de nuevo.'),
      ).toBeInTheDocument();
    });
  });

  it('after dismissing OneTimeDisplay (clicking "Entendido"), token is no longer visible', async () => {
    const rawToken = 'raw-token-dismiss-test';
    mockPost.mockResolvedValue({
      id: 't4',
      name: 'Dismiss Token',
      userId: 'u1',
      createdById: 'admin1',
      createdAt: '2025-04-01T00:00:00Z',
      lastUsedAt: null,
      token: rawToken,
    } as never);
    mockGet.mockImplementation((path: string) => {
      if (path.startsWith('/admin/users')) {
        return Promise.resolve(mockUsersResponse as never);
      }
      return Promise.resolve(emptyResponse as never);
    });

    renderPage();

    // Open create form and submit
    fireEvent.click(screen.getByText('Crear token'));
    const nameInput = screen.getByLabelText(/Nombre/i);
    fireEvent.change(nameInput, { target: { value: 'Dismiss Token' } });
    await waitFor(() => {
      const select = screen.getByLabelText(/Usuario/i) as HTMLSelectElement;
      expect(Array.from(select.options).map((o) => o.value)).toContain('u1');
    });
    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'u1' } });
    fireEvent.submit(screen.getByLabelText(/Nombre/i).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(rawToken)).toBeInTheDocument();
    });

    // Dismiss the OneTimeDisplay
    fireEvent.click(screen.getByText('Entendido'));

    expect(screen.queryByText(rawToken)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Copia este token ahora. No se mostrara de nuevo.'),
    ).not.toBeInTheDocument();
  });

  it('shows ConfirmDialog with "Revocar" when revoke clicked', async () => {
    const singleTokenResponse = {
      items: [mockTokensResponse.items[0]],
      total: 1,
      page: 1,
      perPage: 10,
    };
    mockGet.mockResolvedValue(singleTokenResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mi Token')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Revocar'));
    expect(screen.getByText('Revocar este token de acceso?')).toBeInTheDocument();
  });

  it('calls delete mutation on confirm', async () => {
    const singleTokenResponse = {
      items: [mockTokensResponse.items[0]],
      total: 1,
      page: 1,
      perPage: 10,
    };
    mockGet.mockResolvedValue(singleTokenResponse as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mi Token')).toBeInTheDocument();
    });
    // Click Revocar to show dialog
    fireEvent.click(screen.getByText('Revocar'));
    await waitFor(() => {
      expect(screen.getByText('Revocar este token de acceso?')).toBeInTheDocument();
    });
    // After ConfirmDialog renders, click the confirm Revocar button
    const allRevocar = screen.getAllByText('Revocar');
    fireEvent.click(allRevocar[allRevocar.length - 1]);
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/admin/tokens/t1');
    });
  });
});
