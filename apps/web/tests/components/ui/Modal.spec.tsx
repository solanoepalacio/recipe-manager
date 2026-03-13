import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} title="Test Modal" onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(
      <Modal isOpen={true} title="Test Modal" onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders title when open', () => {
    render(
      <Modal isOpen={true} title="Mi Modal" onClose={() => {}}>
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByText('Mi Modal')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} title="Test" onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );
    const closeBtn = screen.getByRole('button', { name: /cerrar|close|×/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders back button when onBack is provided', () => {
    const handleBack = jest.fn();
    render(
      <Modal isOpen={true} title="Test" onClose={() => {}} onBack={handleBack}>
        <div>Content</div>
      </Modal>
    );
    const backBtn = screen.getByRole('button', { name: /volver|back|←/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders right action when provided', () => {
    render(
      <Modal
        isOpen={true}
        title="Test"
        onClose={() => {}}
        rightAction={<button>Guardar</button>}
      >
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });
});
