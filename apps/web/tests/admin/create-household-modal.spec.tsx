import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateHouseholdModal } from '@/components/admin/CreateHouseholdModal';

jest.mock('@/lib/api-client', () => ({
  api: {
    post: jest.fn(),
  },
}));

import { api } from '@/lib/api-client';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('CreateHouseholdModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title "Nueva casa"', () => {
    render(<CreateHouseholdModal isOpen={true} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByText('Nueva casa')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<CreateHouseholdModal isOpen={false} onClose={jest.fn()} />, { wrapper });
    expect(screen.queryByText('Nueva casa')).not.toBeInTheDocument();
  });

  it('renders "Nombre" input field', () => {
    render(<CreateHouseholdModal isOpen={true} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('renders "Crear" submit button', () => {
    render(<CreateHouseholdModal isOpen={true} onClose={jest.fn()} />, { wrapper });
    expect(screen.getByRole('button', { name: /crear/i })).toBeInTheDocument();
  });

  it('does not submit when name is empty', async () => {
    render(<CreateHouseholdModal isOpen={true} onClose={jest.fn()} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  it('calls POST /api/admin/households with name when submitted', async () => {
    (api.post as jest.Mock).mockResolvedValue({ id: 'new', name: 'Casa Nueva', memberCount: 0, members: [], createdAt: '', updatedAt: '' });
    const onClose = jest.fn();

    render(<CreateHouseholdModal isOpen={true} onClose={onClose} />, { wrapper });

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Casa Nueva' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/admin/households', { name: 'Casa Nueva' });
    });
  });

  it('closes modal after successful creation', async () => {
    (api.post as jest.Mock).mockResolvedValue({ id: 'new', name: 'Casa Nueva', memberCount: 0, members: [], createdAt: '', updatedAt: '' });
    const onClose = jest.fn();

    render(<CreateHouseholdModal isOpen={true} onClose={onClose} />, { wrapper });

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Casa Nueva' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<CreateHouseholdModal isOpen={true} onClose={onClose} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
