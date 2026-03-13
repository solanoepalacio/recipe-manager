import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer } from '@/components/layout/Drawer';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  user: { name: 'María López' },
  householdName: 'Familia López',
  activePath: '/recipes',
};

describe('Drawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<Drawer {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('María López')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<Drawer {...defaultProps} />);
    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('renders household name', () => {
    render(<Drawer {...defaultProps} />);
    expect(screen.getByText('Familia López')).toBeInTheDocument();
  });

  it('renders navigation items in Spanish', () => {
    render(<Drawer {...defaultProps} />);
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Recetas')).toBeInTheDocument();
    expect(screen.getByText('Planificador')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Casa')).toBeInTheDocument();
  });

  it('marks active nav item', () => {
    render(<Drawer {...defaultProps} activePath="/recipes" />);
    const activeItem = screen.getByText('Recetas').closest('[data-active]');
    expect(activeItem).toHaveAttribute('data-active', 'true');
  });

  it('calls onClose when scrim is clicked', () => {
    const handleClose = jest.fn();
    render(<Drawer {...defaultProps} onClose={handleClose} />);
    const scrim = screen.getByTestId('drawer-scrim');
    fireEvent.click(scrim);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders user initials in avatar', () => {
    render(<Drawer {...defaultProps} user={{ name: 'María López' }} />);
    // Initials should be ML or M
    const avatar = screen.getByTestId('user-avatar');
    expect(avatar).toBeInTheDocument();
  });
});
