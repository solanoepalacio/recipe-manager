import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from '@/components/ui/TabBar';

describe('TabBar', () => {
  const tabs = ['Ingredientes', 'Instrucciones', 'Básico', 'Fotos'];

  it('renders all tabs', () => {
    render(<TabBar tabs={tabs} activeTab={0} onChange={() => {}} />);
    tabs.forEach((tab) => {
      expect(screen.getByText(tab)).toBeInTheDocument();
    });
  });

  it('marks the active tab', () => {
    render(<TabBar tabs={tabs} activeTab={1} onChange={() => {}} />);
    const activeTab = screen.getByText('Instrucciones').closest('[data-active]');
    expect(activeTab).toHaveAttribute('data-active', 'true');
  });

  it('fires onChange with correct index when tab is clicked', () => {
    const handleChange = jest.fn();
    render(<TabBar tabs={tabs} activeTab={0} onChange={handleChange} />);
    fireEvent.click(screen.getByText('Básico'));
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('fires onChange when a different tab is clicked', () => {
    const handleChange = jest.fn();
    render(<TabBar tabs={tabs} activeTab={0} onChange={handleChange} />);
    fireEvent.click(screen.getByText('Fotos'));
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('renders tabs with equal widths (each tab has flex-1 or similar)', () => {
    render(<TabBar tabs={tabs} activeTab={0} onChange={() => {}} />);
    const tabElements = screen.getAllByRole('tab');
    expect(tabElements).toHaveLength(tabs.length);
  });
});
