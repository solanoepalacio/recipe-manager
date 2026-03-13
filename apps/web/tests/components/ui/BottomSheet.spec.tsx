import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomSheet } from '@/components/ui/BottomSheet';

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <BottomSheet isOpen={false} onClose={() => {}}>
        <div>Sheet content</div>
      </BottomSheet>
    );
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}}>
        <div>Sheet content</div>
      </BottomSheet>
    );
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('renders drag handle', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}}>
        <div>Content</div>
      </BottomSheet>
    );
    expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
  });

  it('calls onClose when scrim is clicked', () => {
    const handleClose = jest.fn();
    render(
      <BottomSheet isOpen={true} onClose={handleClose}>
        <div>Content</div>
      </BottomSheet>
    );
    const scrim = screen.getByTestId('scrim');
    fireEvent.click(scrim);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders title when provided', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} title="Nueva Receta">
        <div>Content</div>
      </BottomSheet>
    );
    expect(screen.getByText('Nueva Receta')).toBeInTheDocument();
  });
});
