import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditUserModal } from '@/components/admin/EditUserModal';
import type { AdminUserResponse } from '@recipe-manager/shared';

jest.mock('@/lib/api-client', () => ({
  api: {
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from '@/lib/api-client';

const mockUser: AdminUserResponse = {
  id: 'u1',
  name: 'Ana García',
  email: 'ana@example.com',
  username: null,
  gender: 'female',
  dateOfBirth: '1990-05-15',
  householdId: 'hh1',
  householdName: 'Casa García',
  canLogin: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('EditUserModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title "Editar usuario"', () => {
    render(<EditUserModal user={mockUser} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByText('Editar usuario')).toBeInTheDocument();
  });

  it('pre-fills user name', () => {
    render(<EditUserModal user={mockUser} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByDisplayValue('Ana García')).toBeInTheDocument();
  });

  it('pre-fills user email', () => {
    render(<EditUserModal user={mockUser} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByDisplayValue('ana@example.com')).toBeInTheDocument();
  });

  it('pre-fills date of birth', () => {
    render(<EditUserModal user={mockUser} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByDisplayValue('1990-05-15')).toBeInTheDocument();
  });

  it('renders "Guardar" button', () => {
    render(<EditUserModal user={mockUser} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('renders "Eliminar usuario" button', () => {
    render(<EditUserModal user={mockUser} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByRole('button', { name: /eliminar usuario/i })).toBeInTheDocument();
  });

  it('calls PATCH /api/admin/users/:id on save', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ ...mockUser, name: 'Ana Updated' });
    const onClose = jest.fn();

    render(<EditUserModal user={mockUser} onClose={onClose} />, { wrapper });

    const nameInput = screen.getByDisplayValue('Ana García');
    fireEvent.change(nameInput, { target: { value: 'Ana Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/admin/users/u1',
        expect.objectContaining({ name: 'Ana Updated' })
      );
    });
  });

  it('closes after save', async () => {
    (api.patch as jest.Mock).mockResolvedValue(mockUser);
    const onClose = jest.fn();

    render(<EditUserModal user={mockUser} onClose={onClose} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls DELETE /api/admin/users/:id on delete', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);
    const onClose = jest.fn();

    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);

    render(<EditUserModal user={mockUser} onClose={onClose} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /eliminar usuario/i }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/admin/users/u1');
    });
  });

  it('shows confirmation before delete', () => {
    window.confirm = jest.fn().mockReturnValue(false);

    render(<EditUserModal user={mockUser} onClose={jest.fn()} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /eliminar usuario/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('renders gender select field', () => {
    render(<EditUserModal user={mockUser} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
