import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  describe('rendering', () => {
    it('renders text input by default', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Nombre" placeholder="Enter name" />);
      expect(screen.getByText('Nombre')).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(<Input error="Este campo es requerido" />);
      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument();
    });

    it('renders helper text', () => {
      render(<Input helperText="Máximo 50 caracteres" />);
      expect(screen.getByText('Máximo 50 caracteres')).toBeInTheDocument();
    });

    it('renders bordered variant', () => {
      render(<Input variant="bordered" data-testid="input" />);
      expect(screen.getByTestId('input')).toBeInTheDocument();
    });

    it('renders underline variant', () => {
      render(<Input variant="underline" data-testid="input" />);
      expect(screen.getByTestId('input')).toBeInTheDocument();
    });

    it('renders password type', () => {
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number type', () => {
      render(<Input type="number" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('renders textarea', () => {
      render(<Input type="textarea" data-testid="input" />);
      expect(screen.getByTestId('input').tagName).toBe('TEXTAREA');
    });
  });

  describe('password toggle', () => {
    it('shows password toggle button for password type', () => {
      render(<Input type="password" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
      render(<Input type="password" data-testid="password-input" />);
      const input = screen.getByTestId('password-input');
      const toggleBtn = screen.getByRole('button');

      expect(input).toHaveAttribute('type', 'password');
      fireEvent.click(toggleBtn);
      expect(input).toHaveAttribute('type', 'text');
      fireEvent.click(toggleBtn);
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('interactions', () => {
    it('fires onChange when value changes', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      fireEvent.change(screen.getByTestId('input'), { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('displays current value', () => {
      render(<Input value="hello" onChange={() => {}} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveValue('hello');
    });
  });
});
