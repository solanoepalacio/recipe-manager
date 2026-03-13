import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiTokensModal } from '@/components/admin/ApiTokensModal';
import type { AdminTokenResponse } from '@recipe-manager/shared';

jest.mock('@/lib/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from '@/lib/api-client';

const mockTokens: AdminTokenResponse[] = [
  {
    id: 'tok1',
    name: 'Mi Token',
    userId: 'u1',
    userName: 'Ana García',
    createdAt: '2024-01-01T00:00:00Z',
    lastUsedAt: null,
  },
  {
    id: 'tok2',
    name: 'Otro Token',
    userId: 'u1',
    userName: 'Ana García',
    createdAt: '2024-02-01T00:00:00Z',
    lastUsedAt: '2024-03-01T00:00:00Z',
  },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('ApiTokensModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders modal title "Tokens de API"', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockTokens);

    render(<ApiTokensModal userId="u1" onClose={jest.fn()} />, { wrapper });

    expect(screen.getByText('Tokens de API')).toBeInTheDocument();
  });

  it('lists tokens from API', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockTokens);

    render(<ApiTokensModal userId="u1" onClose={jest.fn()} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Mi Token')).toBeInTheDocument();
      expect(screen.getByText('Otro Token')).toBeInTheDocument();
    });
  });

  it('renders "Revocar" button for each token', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockTokens);

    render(<ApiTokensModal userId="u1" onClose={jest.fn()} />, { wrapper });

    await waitFor(() => {
      const revokeButtons = screen.getAllByRole('button', { name: /revocar/i });
      expect(revokeButtons).toHaveLength(2);
    });
  });

  it('calls DELETE /api/admin/tokens/:id when Revocar clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockTokens);
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    render(<ApiTokensModal userId="u1" onClose={jest.fn()} />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /revocar/i })).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /revocar/i })[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/admin/tokens/tok1');
    });
  });

  it('renders "Crear token" button', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockTokens);

    render(<ApiTokensModal userId="u1" onClose={jest.fn()} />, { wrapper });

    expect(screen.getByRole('button', { name: /crear token/i })).toBeInTheDocument();
  });

  it('shows create form when "Crear token" clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockTokens);

    render(<ApiTokensModal userId="u1" onClose={jest.fn()} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear token/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nombre del token/i)).toBeInTheDocument();
    });
  });

  it('calls POST /api/admin/tokens and shows raw token on create', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);
    (api.post as jest.Mock).mockResolvedValue({
      id: 'tok3',
      name: 'Nuevo Token',
      token: 'raw-secret-token-123',
    });

    render(<ApiTokensModal userId="u1" onClose={jest.fn()} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear token/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nombre del token/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/nombre del token/i), {
      target: { value: 'Nuevo Token' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/admin/tokens', {
        name: 'Nuevo Token',
        userId: 'u1',
      });
      expect(screen.getByText('raw-secret-token-123')).toBeInTheDocument();
    });
  });

  it('copies token to clipboard on copy button click', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);
    (api.post as jest.Mock).mockResolvedValue({
      id: 'tok3',
      name: 'Nuevo Token',
      token: 'raw-secret-token-123',
    });

    render(<ApiTokensModal userId="u1" onClose={jest.fn()} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear token/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nombre del token/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/nombre del token/i), {
      target: { value: 'Nuevo Token' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(screen.getByText('raw-secret-token-123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copiar/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('raw-secret-token-123');
    });
  });
});
