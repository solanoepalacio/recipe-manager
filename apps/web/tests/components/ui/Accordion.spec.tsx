import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion } from '@/components/ui/Accordion';

const items = [
  { title: 'Sección 1', children: <div>Contenido 1</div> },
  { title: 'Sección 2', children: <div>Contenido 2</div> },
  { title: 'Sección 3', children: <div>Contenido 3</div> },
];

describe('Accordion', () => {
  it('renders all item titles', () => {
    render(<Accordion items={items} />);
    expect(screen.getByText('Sección 1')).toBeInTheDocument();
    expect(screen.getByText('Sección 2')).toBeInTheDocument();
    expect(screen.getByText('Sección 3')).toBeInTheDocument();
  });

  it('does not render children initially (collapsed)', () => {
    render(<Accordion items={items} />);
    expect(screen.queryByText('Contenido 1')).not.toBeInTheDocument();
  });

  it('reveals children when item is clicked', () => {
    render(<Accordion items={items} />);
    fireEvent.click(screen.getByText('Sección 1'));
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
  });

  it('collapses item when clicked again', () => {
    render(<Accordion items={items} />);
    const header = screen.getByText('Sección 1');
    fireEvent.click(header);
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText('Contenido 1')).not.toBeInTheDocument();
  });

  it('allows multiple items to be open simultaneously', () => {
    render(<Accordion items={items} />);
    fireEvent.click(screen.getByText('Sección 1'));
    fireEvent.click(screen.getByText('Sección 2'));
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
    expect(screen.getByText('Contenido 2')).toBeInTheDocument();
  });

  it('renders chevron indicator', () => {
    render(<Accordion items={[{ title: 'Test', children: <div>Content</div> }]} />);
    expect(screen.getByTestId('chevron-0')).toBeInTheDocument();
  });
});
