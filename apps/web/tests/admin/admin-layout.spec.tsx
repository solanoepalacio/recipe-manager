import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/api-client', () => ({
  api: {
    post: jest.fn(),
  },
}));

import { api } from '@/lib/api-client';

describe('AdminTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Administración" title', () => {
    render(<AdminTopBar />);
    expect(screen.getByText('Administración')).toBeInTheDocument();
  });

  it('renders "Cerrar sesión" button', () => {
    render(<AdminTopBar />);
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('calls admin auth logout endpoint on logout click', async () => {
    (api.post as jest.Mock).mockResolvedValue(undefined);
    render(<AdminTopBar />);

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/admin/auth/logout');
    });
  });

  it('redirects to /admin/login after logout', async () => {
    (api.post as jest.Mock).mockResolvedValue(undefined);
    render(<AdminTopBar />);

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });
});
