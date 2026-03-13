'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { NewRecipeSheet } from '@/components/recipes/NewRecipeSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PaginatedResponse, RecipeListItemResponse, RecipeDetailResponse } from '@recipe-manager/shared';

const SORT_OPTIONS = [
  { label: 'Nombre', value: 'name' },
  { label: 'Fecha', value: 'createdAt' },
  { label: 'Aleatorio', value: 'random' },
];

export default function RecipesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.recipes.all({ q: search, sort }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (sort) params.set('sort', sort);
      return api.get<PaginatedResponse<RecipeListItemResponse>>(
        `/api/recipes${params.toString() ? '?' + params.toString() : ''}`,
      );
    },
  });

  const recipes = data?.items ?? [];

  const handleCreated = useCallback(
    (recipe: RecipeDetailResponse) => {
      setSheetOpen(false);
      router.push(`/recipes/${recipe.slug}`);
    },
    [router],
  );

  return (
    <div className="relative min-h-full pb-24">
      {/* Search bar */}
      <div className="px-5 pt-4 pb-2">
        <input
          type="text"
          placeholder="Buscar recetas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-placeholder focus:outline-none"
        />
      </div>

      {/* Sort chips */}
      <div className="flex gap-2 px-5 py-2 overflow-x-auto">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSort(option.value)}
            className={[
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-colors',
              sort === option.value
                ? 'bg-foreground text-background'
                : 'bg-subtle text-foreground',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="px-5 py-3">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <EmptyState message="No hay recetas" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => router.push(`/recipes/${recipe.slug}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        data-testid="fab-new-recipe"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-background text-2xl flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-30"
        aria-label="Nueva receta"
      >
        +
      </button>

      {/* New recipe sheet */}
      <NewRecipeSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
