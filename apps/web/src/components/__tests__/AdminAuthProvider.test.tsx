import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminAuthProvider, useAdminAuth } from '@/components/admin/AdminAuthProvider';
import * as adminApiClient from '@/lib/admin-api-client';

vi.mock('@/lib/admin-api-client', () => ({
  adminApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function AdminConsumer() {
  const { admin, isLoading } = useAdminAuth();
  if (isLoading) return <div data-testid="loading">loading</div>;
  if (!admin) return <div data-testid="no-admin">no admin</div>;
  return <div data-testid="admin-name">{admin.name}</div>;
}

const mockAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminAuthProvider', () => {
  it('calls /admin/auth/me on mount', () => {
    vi.mocked(adminApiClient.adminApi.get).mockReturnValue(new Promise(() => {}));
    render(
      <AdminAuthProvider>
        <AdminConsumer />
      </AdminAuthProvider>,
    );
    expect(vi.mocked(adminApiClient.adminApi.get)).toHaveBeenCalledWith('/admin/auth/me');
  });

  it('shows loading state initially before /admin/auth/me resolves', () => {
    vi.mocked(adminApiClient.adminApi.get).mockReturnValue(new Promise(() => {}));
    render(
      <AdminAuthProvider>
        <AdminConsumer />
      </AdminAuthProvider>,
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('exposes admin when authenticated (200 response)', async () => {
    vi.mocked(adminApiClient.adminApi.get).mockResolvedValueOnce(mockAdmin);
    render(
      <AdminAuthProvider>
        <AdminConsumer />
      </AdminAuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('admin-name')).toHaveTextContent('Admin User'),
    );
  });

  it('exposes null admin when /admin/auth/me returns 401', async () => {
    vi.mocked(adminApiClient.adminApi.get).mockRejectedValueOnce(
      Object.assign(new Error('Unauthorized'), { status: 401 }),
    );
    render(
      <AdminAuthProvider>
        <AdminConsumer />
      </AdminAuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('no-admin')).toBeInTheDocument(),
    );
  });
});
