import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OneTimeDisplay } from '@/components/admin/OneTimeDisplay';

const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, {
    clipboard: { writeText: mockWriteText },
  });
});

describe('OneTimeDisplay', () => {
  it('renders the label and value', () => {
    render(
      <OneTimeDisplay
        value="tok_abc123"
        label="Copia este token ahora. No se mostrará de nuevo."
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('Copia este token ahora. No se mostrará de nuevo.')).toBeInTheDocument();
    expect(screen.getByText('tok_abc123')).toBeInTheDocument();
  });

  it('calls navigator.clipboard.writeText with the value when Copiar is clicked', async () => {
    render(
      <OneTimeDisplay
        value="tok_abc123"
        label="Copia este token ahora."
        onDismiss={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /copiar/i }));
    expect(mockWriteText).toHaveBeenCalledWith('tok_abc123');
  });

  it('calls onDismiss when Entendido is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <OneTimeDisplay
        value="tok_abc123"
        label="Copia este token ahora."
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /entendido/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
