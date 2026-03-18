'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

interface RecipeSettingsProps {
  recipeId: string;
  slug: string;
  isLocked: boolean;
  onMutationSuccess: () => void;
}

export function RecipeSettings({ recipeId, slug, isLocked, onMutationSuccess }: RecipeSettingsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const toggleLockMutation = useMutation({
    mutationFn: (locked: boolean) => api.patch(`/recipes/${recipeId}`, { isLocked: locked }),
    onSuccess: () => {
      onMutationSuccess();
      toast.success(isLocked ? 'Receta desbloqueada' : 'Receta bloqueada');
    },
    onError: () => toast.error('Error al guardar. Intenta de nuevo.'),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => api.post<RecipeDetailResponse>(`/recipes/${recipeId}/duplicate`, {}),
    onSuccess: (newRecipe) => {
      toast.success('Receta duplicada');
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
      router.push(`/recipes/${newRecipe.slug}?id=${newRecipe.id}`);
    },
    onError: () => toast.error('Error al duplicar la receta.'),
  });

  return (
    <div className="px-5 pt-6 space-y-8">
      {/* Lock section */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] text-foreground font-semibold">Receta bloqueada</p>
          <p className="text-[13px] text-secondary">Cuando esta bloqueada no se puede editar</p>
        </div>
        <button
          role="switch"
          aria-checked={isLocked}
          aria-label="Bloquear receta"
          onClick={() => toggleLockMutation.mutate(!isLocked)}
          className={`w-12 h-7 rounded-full relative transition-colors ${isLocked ? 'bg-accent' : 'bg-border'}`}
        >
          <span
            className={`absolute top-1 ${isLocked ? 'left-6' : 'left-1'} w-5 h-5 rounded-full bg-background shadow transition-all`}
          />
        </button>
      </div>

      {/* Duplicate section */}
      <button
        onClick={() => duplicateMutation.mutate()}
        disabled={duplicateMutation.isPending}
        className="border border-border rounded-[12px] py-4 text-[15px] font-semibold text-foreground w-full disabled:opacity-50"
      >
        {duplicateMutation.isPending ? 'Duplicando...' : 'Duplicar receta'}
      </button>
    </div>
  );
}
