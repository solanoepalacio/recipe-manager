import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { toast } from 'sonner';
import Providers from '@/components/Providers';

// Wrap children in Providers which mounts <Toaster>
function TestWrapper({ children }: { children?: React.ReactNode }) {
  return <Providers>{children ?? <div />}</Providers>;
}

describe('Toast notifications (UX-03)', () => {
  it('Toaster is mounted when Providers renders', () => {
    render(<TestWrapper />);
    // Sonner v2 renders a <section aria-label="Notifications alt+T"> as the toast region
    const toastRegion = document.querySelector('section[aria-label]');
    expect(toastRegion).not.toBeNull();
  });

  it('toast.success renders a notification with the provided message', async () => {
    render(<TestWrapper />);
    act(() => {
      toast.success('Receta guardada');
    });
    const notification = await screen.findByText('Receta guardada');
    expect(notification).toBeInTheDocument();
  });

  it('toast.error renders a notification with the provided message', async () => {
    render(<TestWrapper />);
    act(() => {
      toast.error('Correo o contraseña incorrectos', { duration: 6000 });
    });
    const notification = await screen.findByText('Correo o contraseña incorrectos');
    expect(notification).toBeInTheDocument();
  });

  it('toast.info renders an info notification', async () => {
    render(<TestWrapper />);
    act(() => {
      toast.info('Sesión iniciada');
    });
    const notification = await screen.findByText('Sesión iniciada');
    expect(notification).toBeInTheDocument();
  });
});
