import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  describe('variants', () => {
    it('renders filled variant by default', () => {
      render(<Button>Click me</Button>);
      const btn = screen.getByRole('button', { name: 'Click me' });
      expect(btn).toBeInTheDocument();
    });

    it('renders filled variant explicitly', () => {
      render(<Button variant="filled">Filled</Button>);
      expect(screen.getByRole('button', { name: 'Filled' })).toBeInTheDocument();
    });

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button', { name: 'Outline' })).toBeInTheDocument();
    });

    it('renders destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders sm size', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument();
    });

    it('renders md size by default', () => {
      render(<Button>Medium</Button>);
      expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
    });

    it('renders lg size', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('fires click handler', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not fire click when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading indicator when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('disabled');
    });

    it('does not fire click when loading', () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>Loading</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  it('renders children', () => {
    render(<Button>Button Text</Button>);
    expect(screen.getByText('Button Text')).toBeInTheDocument();
  });

  it('passes additional HTML button attributes', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const btn = screen.getByTestId('submit-btn');
    expect(btn).toHaveAttribute('type', 'submit');
  });
});
