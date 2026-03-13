import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { RecipeListItemResponse } from '@recipe-manager/shared';

jest.mock('next/image', () => {
  const MockImage = ({
    src,
    alt,
    fill,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...props} />;
  MockImage.displayName = 'Image';
  return MockImage;
});

import { RecipeCard } from '@/components/recipes/RecipeCard';

const baseRecipe: RecipeListItemResponse = {
  id: 'r1',
  slug: 'pasta-carbonara',
  name: 'Pasta Carbonara',
  description: 'Delicious pasta',
  prepTime: 10,
  cookTime: 20,
  totalTime: 30,
  servingsQty: 4,
  servingsUnit: 'porciones',
  thumbnailUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('RecipeCard', () => {
  it('renders recipe name', () => {
    render(<RecipeCard recipe={baseRecipe} onClick={jest.fn()} />);
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
  });

  it('renders total time when available', () => {
    render(<RecipeCard recipe={baseRecipe} onClick={jest.fn()} />);
    expect(screen.getByText(/30 min/)).toBeInTheDocument();
  });

  it('renders placeholder when no thumbnail', () => {
    render(<RecipeCard recipe={baseRecipe} onClick={jest.fn()} />);
    // No image src - placeholder div rendered
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders thumbnail image when thumbnailUrl is provided', () => {
    const recipeWithImage = {
      ...baseRecipe,
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    render(<RecipeCard recipe={recipeWithImage} onClick={jest.fn()} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = jest.fn();
    render(<RecipeCard recipe={baseRecipe} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not show time when totalTime is null', () => {
    const recipeNoTime = { ...baseRecipe, totalTime: null };
    render(<RecipeCard recipe={recipeNoTime} onClick={jest.fn()} />);
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });
});
