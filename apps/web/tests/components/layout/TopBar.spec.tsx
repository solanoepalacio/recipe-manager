import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '@/components/layout/TopBar';

describe('TopBar', () => {
  describe('standard variant', () => {
    it('renders title', () => {
      render(<TopBar variant="standard" title="Recetas" onHamburger={() => {}} />);
      expect(screen.getByText('Recetas')).toBeInTheDocument();
    });

    it('renders hamburger button', () => {
      render(<TopBar variant="standard" title="Recetas" onHamburger={() => {}} />);
      expect(screen.getByTestId('hamburger-btn')).toBeInTheDocument();
    });

    it('fires onHamburger callback when hamburger is clicked', () => {
      const handleHamburger = jest.fn();
      render(<TopBar variant="standard" title="Recetas" onHamburger={handleHamburger} />);
      fireEvent.click(screen.getByTestId('hamburger-btn'));
      expect(handleHamburger).toHaveBeenCalledTimes(1);
    });

    it('does not render back button', () => {
      render(<TopBar variant="standard" title="Recetas" onHamburger={() => {}} />);
      expect(screen.queryByTestId('back-btn')).not.toBeInTheDocument();
    });

    it('does not render overflow button', () => {
      render(<TopBar variant="standard" title="Recetas" onHamburger={() => {}} />);
      expect(screen.queryByTestId('overflow-btn')).not.toBeInTheDocument();
    });
  });

  describe('detail variant', () => {
    it('renders title', () => {
      render(<TopBar variant="detail" title="Pasta Boloñesa" onBack={() => {}} />);
      expect(screen.getByText('Pasta Boloñesa')).toBeInTheDocument();
    });

    it('renders back button', () => {
      render(<TopBar variant="detail" title="Pasta Boloñesa" onBack={() => {}} />);
      expect(screen.getByTestId('back-btn')).toBeInTheDocument();
    });

    it('fires onBack callback when back is clicked', () => {
      const handleBack = jest.fn();
      render(<TopBar variant="detail" title="Pasta Boloñesa" onBack={handleBack} />);
      fireEvent.click(screen.getByTestId('back-btn'));
      expect(handleBack).toHaveBeenCalledTimes(1);
    });

    it('renders overflow button when onOverflow is provided', () => {
      render(
        <TopBar
          variant="detail"
          title="Pasta Boloñesa"
          onBack={() => {}}
          onOverflow={() => {}}
        />
      );
      expect(screen.getByTestId('overflow-btn')).toBeInTheDocument();
    });

    it('fires onOverflow callback', () => {
      const handleOverflow = jest.fn();
      render(
        <TopBar
          variant="detail"
          title="Pasta Boloñesa"
          onBack={() => {}}
          onOverflow={handleOverflow}
        />
      );
      fireEvent.click(screen.getByTestId('overflow-btn'));
      expect(handleOverflow).toHaveBeenCalledTimes(1);
    });

    it('does not render hamburger button', () => {
      render(<TopBar variant="detail" title="Test" onBack={() => {}} />);
      expect(screen.queryByTestId('hamburger-btn')).not.toBeInTheDocument();
    });
  });
});
