import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseholdList } from '@/components/admin/HouseholdList';
import type { AdminHouseholdResponse } from '@recipe-manager/shared';

jest.mock('@/lib/api-client', () => ({
  api: {
    get: jest.fn(),
  },
}));

import { api } from '@/lib/api-client';

const mockHouseholds: AdminHouseholdResponse[] = [
  {
    id: 'hh1',
    name: 'Casa García',
    memberCount: 2,
    members: [
      {
        id: 'u1',
        name: 'Ana García',
        username: null,
        isOwner: false,
        joinedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'u2',
        name: 'Luis García',
        username: null,
        isOwner: true,
        joinedAt: '2024-01-01T00:00:00Z',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'hh2',
    name: 'Casa López',
    memberCount: 1,
    members: [
      {
        id: 'u3',
        name: 'María López',
        username: null,
        isOwner: true,
        joinedAt: '2024-01-01T00:00:00Z',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('HouseholdList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders households list from API', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      items: mockHouseholds,
      total: 2,
      page: 1,
      perPage: 20,
    });

    render(
      <HouseholdList
        onEditUser={jest.fn()}
        onPasswordReset={jest.fn()}
        onApiTokens={jest.fn()}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
      expect(screen.getByText('Casa López')).toBeInTheDocument();
    });
  });

  it('shows member count for each household', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      items: mockHouseholds,
      total: 2,
      page: 1,
      perPage: 20,
    });

    render(
      <HouseholdList
        onEditUser={jest.fn()}
        onPasswordReset={jest.fn()}
        onApiTokens={jest.fn()}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText(/2 miembros/i)).toBeInTheDocument();
      expect(screen.getByText(/1 miembro/i)).toBeInTheDocument();
    });
  });

  it('expands to show members when clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      items: mockHouseholds,
      total: 2,
      page: 1,
      perPage: 20,
    });

    render(
      <HouseholdList
        onEditUser={jest.fn()}
        onPasswordReset={jest.fn()}
        onApiTokens={jest.fn()}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });

    // Members not visible yet
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('Casa García'));

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('Luis García')).toBeInTheDocument();
    });
  });

  it('collapses when clicked again', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      items: mockHouseholds,
      total: 2,
      page: 1,
      perPage: 20,
    });

    render(
      <HouseholdList
        onEditUser={jest.fn()}
        onPasswordReset={jest.fn()}
        onApiTokens={jest.fn()}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });

    // Expand
    fireEvent.click(screen.getByText('Casa García'));
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    // Collapse
    fireEvent.click(screen.getByText('Casa García'));
    await waitFor(() => {
      expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
    });
  });

  it('calls onEditUser when edit icon clicked', async () => {
    const onEditUser = jest.fn();
    (api.get as jest.Mock).mockResolvedValue({
      items: [mockHouseholds[0]],
      total: 1,
      page: 1,
      perPage: 20,
    });

    render(
      <HouseholdList
        onEditUser={onEditUser}
        onPasswordReset={jest.fn()}
        onApiTokens={jest.fn()}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Casa García'));

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    // Click edit button for Ana García
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    fireEvent.click(editButtons[0]);

    expect(onEditUser).toHaveBeenCalledWith(mockHouseholds[0].members[0]);
  });

  it('calls onPasswordReset when password reset icon clicked', async () => {
    const onPasswordReset = jest.fn();
    (api.get as jest.Mock).mockResolvedValue({
      items: [mockHouseholds[0]],
      total: 1,
      page: 1,
      perPage: 20,
    });

    render(
      <HouseholdList
        onEditUser={jest.fn()}
        onPasswordReset={onPasswordReset}
        onApiTokens={jest.fn()}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Casa García'));

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    const resetButtons = screen.getAllByRole('button', { name: /contraseña/i });
    fireEvent.click(resetButtons[0]);

    expect(onPasswordReset).toHaveBeenCalledWith('u1');
  });

  it('calls onApiTokens when tokens icon clicked', async () => {
    const onApiTokens = jest.fn();
    (api.get as jest.Mock).mockResolvedValue({
      items: [mockHouseholds[0]],
      total: 1,
      page: 1,
      perPage: 20,
    });

    render(
      <HouseholdList
        onEditUser={jest.fn()}
        onPasswordReset={jest.fn()}
        onApiTokens={onApiTokens}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Casa García'));

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    const tokenButtons = screen.getAllByRole('button', { name: /tokens/i });
    fireEvent.click(tokenButtons[0]);

    expect(onApiTokens).toHaveBeenCalledWith('u1');
  });

  it('shows loading state', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <HouseholdList
        onEditUser={jest.fn()}
        onPasswordReset={jest.fn()}
        onApiTokens={jest.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });
});
