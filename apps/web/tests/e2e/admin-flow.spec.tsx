/**
 * E2E admin flow tests — frontend integration tests with mocked API.
 * Tests the complete admin journey through React components.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ----- Navigation mocks -----
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

// ----- API mock -----
jest.mock('@/lib/api-client');

// ----- Page imports (after mocks) -----
import SetupPage from '@/app/(auth)/setup/page';
import AdminLoginPage from '@/app/(admin)/admin/login/page';
import AdminPage from '@/app/(admin)/admin/page';

// ----- Test data -----
const mockHouseholds = {
  items: [
    {
      id: 'h1',
      name: 'Casa García',
      memberCount: 2,
      members: [
        {
          id: 'u1',
          name: 'Ana García',
          email: 'ana@example.com',
          username: 'ana',
          gender: null,
          dateOfBirth: null,
          canLogin: true,
        },
        {
          id: 'u2',
          name: 'Carlos García',
          email: null,
          username: 'carlos',
          gender: null,
          dateOfBirth: null,
          canLogin: false,
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  perPage: 20,
  totalPages: 1,
};

const mockNewHousehold = {
  id: 'h2',
  name: 'Casa Nueva',
  memberCount: 0,
  members: [],
  createdAt: '2024-01-15T00:00:00.000Z',
};

const mockPasswordResetResponse = {
  resetUrl: 'https://example.com/reset-password?token=abc123',
};

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// ===========================
// 13.7 — Admin Flow Tests
// ===========================

describe('Admin flow — setup wizard → admin login → create household → generate token', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/setup')) return Promise.resolve({ required: true });
      if (url.includes('/api/admin/households')) return Promise.resolve(mockHouseholds);
      if (url.includes('/api/admin/tokens')) return Promise.resolve({ tokens: [] });
      return Promise.resolve({});
    });
    api.post = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/setup')) return Promise.resolve({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
      if (url.includes('/api/admin/auth/login')) return Promise.resolve({ id: 'admin-1', name: 'Admin', email: 'admin@example.com' });
      if (url.includes('/api/admin/households')) return Promise.resolve(mockNewHousehold);
      if (url.includes('/api/admin/users') && url.includes('/password-reset')) return Promise.resolve(mockPasswordResetResponse);
      if (url.includes('/api/admin/tokens')) return Promise.resolve({ id: 'tk1', token: 'secret-token', name: 'Agent', createdAt: '2024-01-01T00:00:00.000Z' });
      return Promise.resolve({});
    });
    api.delete = jest.fn().mockResolvedValue(undefined);
    api.patch = jest.fn().mockResolvedValue({});
  });

  // Step 1: Setup page — shows when setup is required
  it('shows setup page with form fields', async () => {
    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    });
  });

  it('redirects to login when setup is not required', async () => {
    const { api } = require('@/lib/api-client');
    api.get = jest.fn().mockResolvedValue({ required: false });

    render(<SetupPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Nombre'), 'Admin User');
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'different');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/contraseñas no coinciden/i);
    });
  });

  it('submits setup form and redirects to admin login', async () => {
    const user = userEvent.setup();
    render(<SetupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Nombre'), 'Admin User');
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /crear administrador/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });

  // Step 2: Admin login page
  it('renders admin login page with email and password fields', () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('submits admin login and navigates to /admin', async () => {
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('shows inline error on failed admin login', async () => {
    const { api } = require('@/lib/api-client');
    api.post = jest.fn().mockRejectedValueOnce(new Error('Unauthorized'));
    const user = userEvent.setup();

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // Step 3: Admin panel — household list
  it('renders admin panel with household list title', async () => {
    renderWithQuery(<AdminPage />);

    expect(screen.getAllByText(/hogares/i).length).toBeGreaterThan(0);
  });

  it('renders create household button', async () => {
    renderWithQuery(<AdminPage />);

    expect(screen.getByRole('button', { name: /nueva casa/i })).toBeInTheDocument();
  });

  it('renders households from API', async () => {
    renderWithQuery(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });
  });

  // Step 4: Create a household
  it('opens create household modal when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<AdminPage />);

    await user.click(screen.getByRole('button', { name: /nueva casa/i }));

    await waitFor(() => {
      expect(screen.getByTestId('create-household-modal')).toBeInTheDocument();
    });
  });

  // Step 5: Generate password reset link
  it('shows members after expanding a household row', async () => {
    const user = userEvent.setup();
    renderWithQuery(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });

    // Click to expand the household row
    await user.click(screen.getByText('Casa García'));

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });
  });

  it('opens password reset modal for a user', async () => {
    const user = userEvent.setup();
    renderWithQuery(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Casa García')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Casa García'));

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    const passwordButtons = screen.getAllByRole('button', { name: /contraseña/i });
    await user.click(passwordButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('password-reset-modal')).toBeInTheDocument();
    });
  });
});
