'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { RecipeDetailResponse, CreateRecipeRequest } from '@recipe-manager/shared';

export interface NewRecipeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (recipe: RecipeDetailResponse) => void;
}

export function NewRecipeSheet({ isOpen, onClose, onCreated }: NewRecipeSheetProps) {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (req: CreateRecipeRequest) =>
      api.post<RecipeDetailResponse>('/api/recipes', req),
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all() });
      setName('');
      onCreated(recipe);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutate({ name: name.trim() });
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Nueva receta">
      <div data-testid="new-recipe-sheet" className="px-5 py-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nombre de la receta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Pasta Carbonara"
            autoFocus
          />
          {error && (
            <p className="text-xs text-destructive">Error al crear la receta. Inténtalo de nuevo.</p>
          )}
          <Button
            type="submit"
            loading={isPending}
            disabled={!name.trim()}
            className="w-full"
          >
            Crear
          </Button>
        </form>
      </div>
    </BottomSheet>
  );
}
