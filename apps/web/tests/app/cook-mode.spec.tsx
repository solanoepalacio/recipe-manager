import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => '/recipes/pasta-carbonara/cook',
  useParams: () => ({ slug: 'pasta-carbonara' }),
}));

jest.mock('@/lib/api-client');

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Ana' }, loading: false, login: jest.fn(), logout: jest.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CookModePage from '@/app/(app)/recipes/[slug]/cook/page';

const mockRecipeDetail = {
  id: 'r1',
  slug: 'pasta-carbonara',
  name: 'Pasta Carbonara',
  description: null,
  prepTime: 10,
  cookTime: 20,
  totalTime: 30,
  performTime: null,
  servingsQty: 4,
  servingsUnit: 'porciones',
  sourceUrl: null,
  isLocked: false,
  landscapeView: false,
  shareToken: null,
  sections: [],
  steps: [
    { id: 'st1', title: 'Cocer pasta', body: 'Cocer la pasta en agua con sal durante 10 minutos.', order: 1 },
    { id: 'st2', title: 'Preparar salsa', body: 'Mezclar huevos con queso parmesano.', order: 2 },
    { id: 'st3', title: 'Mezclar', body: 'Combinar pasta con la salsa.', order: 3 },
  ],
  images: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('Cook mode page (/recipes/:slug/cook)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue(mockRecipeDetail);
  });

  it('renders all steps', async () => {
    renderWithQuery(<CookModePage />);
    await waitFor(() => {
      expect(screen.getByText('Cocer pasta')).toBeInTheDocument();
      expect(screen.getByText('Preparar salsa')).toBeInTheDocument();
      expect(screen.getByText('Mezclar')).toBeInTheDocument();
    });
  });

  it('renders exit/back button', async () => {
    renderWithQuery(<CookModePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /salir|volver/i })).toBeInTheDocument();
    });
  });

  it('exit button navigates back', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CookModePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /salir|volver/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /salir|volver/i }));
    expect(mockBack).toHaveBeenCalled();
  });

  it('marks first unchecked step as current', async () => {
    renderWithQuery(<CookModePage />);
    await waitFor(() => {
      expect(screen.getByTestId('current-step-indicator')).toBeInTheDocument();
    });
  });

  it('checks and collapses a step when tapped', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CookModePage />);
    await waitFor(() => {
      expect(screen.getByText('Cocer pasta')).toBeInTheDocument();
    });
    const stepButton = screen.getByTestId('step-item-st1');
    await user.click(stepButton);
    await waitFor(() => {
      expect(stepButton).toHaveAttribute('data-checked', 'true');
    });
  });
});
