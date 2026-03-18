import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

const mockBack = vi.fn();
const mockPush = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'pollo-al-horno' }),
  useSearchParams: () => new URLSearchParams('id=uuid-123'),
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const mockRecipe: RecipeDetailResponse = {
  id: 'uuid-123',
  householdId: 'hh-1',
  createdById: 'user-1',
  name: 'Pollo al Horno',
  slug: 'pollo-al-horno',
  description: null,
  servingsQty: 4,
  servingsUnit: 'personas',
  prepTime: 15,
  cookTime: 45,
  totalTime: 60,
  performTime: null,
  sourceUrl: null,
  shareToken: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  sections: [],
  steps: [
    { id: 's1', title: null, body: 'Precalentar el horno a 200 grados', order: 1 },
    { id: 's2', title: null, body: 'Sazonar el pollo con especias', order: 2 },
    { id: 's3', title: null, body: 'Hornear durante 45 minutos', order: 3 },
  ],
  images: [],
};

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: mockRecipe,
    isLoading: false,
    isError: false,
  }),
}));

// Import after mocks are set up
import CookModePage from '@/app/(app)/recipes/[slug]/cook/page';

describe('CookModePage', () => {
  it('renders recipe name in top bar', () => {
    render(<CookModePage />);
    expect(screen.getByText('Pollo al Horno')).toBeInTheDocument();
  });

  it('renders exit button', () => {
    render(<CookModePage />);
    expect(screen.getByText(/Salir/)).toBeInTheDocument();
  });

  it('renders all step texts', () => {
    render(<CookModePage />);
    expect(screen.getByText('Precalentar el horno a 200 grados')).toBeInTheDocument();
    expect(screen.getByText('Sazonar el pollo con especias')).toBeInTheDocument();
    expect(screen.getByText('Hornear durante 45 minutos')).toBeInTheDocument();
  });

  it('first step is current (has clickable role)', () => {
    render(<CookModePage />);
    expect(screen.getByRole('button', { name: /Marcar paso 1/ })).toBeInTheDocument();
  });

  it('clicking current step advances to next', () => {
    render(<CookModePage />);
    const step1Button = screen.getByRole('button', { name: /Marcar paso 1/ });
    fireEvent.click(step1Button);
    expect(screen.getByRole('button', { name: /Marcar paso 2/ })).toBeInTheDocument();
  });

  it('done steps show truncated text after advancing', () => {
    render(<CookModePage />);
    const step1Button = screen.getByRole('button', { name: /Marcar paso 1/ });
    fireEvent.click(step1Button);
    // step 1 text still visible (now in done/truncated state)
    expect(screen.getByText('Precalentar el horno a 200 grados')).toBeInTheDocument();
  });
});
