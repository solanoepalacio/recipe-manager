import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordResetModal } from '@/components/admin/PasswordResetModal';

jest.mock('@/lib/api-client', () => ({
  api: {
    post: jest.fn(),
  },
}));

import { api } from '@/lib/api-client';

describe('PasswordResetModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders modal title "Restablecer contraseña"', () => {
    render(<PasswordResetModal userId="u1" onClose={jest.fn()} />);
    expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument();
  });

  it('renders "Generar enlace" button', () => {
    render(<PasswordResetModal userId="u1" onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: /generar enlace/i })).toBeInTheDocument();
  });

  it('calls POST /api/admin/users/:id/password-reset-url on generate', async () => {
    (api.post as jest.Mock).mockResolvedValue({ resetUrl: 'https://example.com/reset/abc123' });

    render(<PasswordResetModal userId="u1" onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /generar enlace/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/admin/users/u1/password-reset-url');
    });
  });

  it('displays the URL after generation', async () => {
    (api.post as jest.Mock).mockResolvedValue({ resetUrl: 'https://example.com/reset/abc123' });

    render(<PasswordResetModal userId="u1" onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /generar enlace/i }));

    await waitFor(() => {
      expect(screen.getByText('https://example.com/reset/abc123')).toBeInTheDocument();
    });
  });

  it('copies URL to clipboard on copy button click', async () => {
    (api.post as jest.Mock).mockResolvedValue({ resetUrl: 'https://example.com/reset/abc123' });

    render(<PasswordResetModal userId="u1" onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /generar enlace/i }));

    await waitFor(() => {
      expect(screen.getByText('https://example.com/reset/abc123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copiar/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/reset/abc123'
      );
    });
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<PasswordResetModal userId="u1" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading state while generating', async () => {
    (api.post as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<PasswordResetModal userId="u1" onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /generar enlace/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generar enlace/i })).toBeDisabled();
    });
  });
});
