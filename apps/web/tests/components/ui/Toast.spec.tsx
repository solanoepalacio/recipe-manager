import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function ToastTrigger({ message, type }: { message: string; type?: 'error' | 'success' | 'info' }) {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast(message, type)}>
      Mostrar toast
    </button>
  );
}

function Wrapper({ message, type }: { message: string; type?: 'error' | 'success' | 'info' }) {
  return (
    <ToastProvider>
      <ToastTrigger message={message} type={type} />
    </ToastProvider>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows error toast when triggered', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Wrapper message="Error de prueba" type="error" />);

    await user.click(screen.getByText('Mostrar toast'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Error de prueba');
  });

  it('shows success toast with success styling', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Wrapper message="Operación exitosa" type="success" />);

    await user.click(screen.getByText('Mostrar toast'));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Operación exitosa');
    expect(alert.className).toContain('bg-green-500');
  });

  it('shows info toast with dark styling', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Wrapper message="Información" type="info" />);

    await user.click(screen.getByText('Mostrar toast'));

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-stone-900');
  });

  it('defaults to error type when no type provided', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Wrapper message="Error por defecto" />);

    await user.click(screen.getByText('Mostrar toast'));

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-red-500');
  });

  it('dismisses toast after 4 seconds', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Wrapper message="Temporal" type="info" />);

    await user.click(screen.getByText('Mostrar toast'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4001);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('throws when useToast is used outside ToastProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useToast();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useToast must be used within ToastProvider'
    );

    consoleError.mockRestore();
  });
});
