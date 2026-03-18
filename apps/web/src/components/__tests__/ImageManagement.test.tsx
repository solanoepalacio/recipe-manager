import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ImageResponse } from '@recipe-manager/shared';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { ImageUpload } from '@/components/recipes/editor/ImageUpload';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const mockImage: ImageResponse = {
  id: '1',
  url: '/uploads/test.jpg',
  order: 0,
  createdAt: '2026-01-01',
};

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashed upload zone when no images', () => {
    render(
      <ImageUpload
        recipeId="recipe-1"
        images={[]}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByText('Anadir foto')).toBeInTheDocument();
  });

  it('renders image grid when images exist', () => {
    const { container } = render(
      <ImageUpload
        recipeId="recipe-1"
        images={[mockImage]}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', '/uploads/test.jpg');
  });

  it('delete shows confirmation dialog', () => {
    render(
      <ImageUpload
        recipeId="recipe-1"
        images={[mockImage]}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByText('Eliminar foto'));
    expect(screen.getByText('¿Eliminar esta foto?')).toBeInTheDocument();
  });

  it('file input triggers upload fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '2', url: '/uploads/new.jpg', order: 1, createdAt: '2026-01-02' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <ImageUpload
        recipeId="recipe-1"
        images={[]}
        onMutationSuccess={vi.fn()}
      />,
      { wrapper }
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    // fetch should be called with FormData
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/recipes/recipe-1/images');
    expect(options.body).toBeInstanceOf(FormData);

    vi.unstubAllGlobals();
  });
});

describe('ConfirmDialog', () => {
  it('renders message and buttons', () => {
    render(
      <ConfirmDialog
        message="¿Eliminar?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('¿Eliminar?')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        message="¿Eliminar?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Eliminar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        message="¿Eliminar?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders custom confirmLabel', () => {
    render(
      <ConfirmDialog
        message="¿Borrar?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Borrar"
      />
    );

    expect(screen.getByText('Borrar')).toBeInTheDocument();
  });
});
