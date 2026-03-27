'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MealType,
  PaginatedResponse,
  RecipeListItem,
  CreateMealPlanEntryRequest,
  MealPlanEntryResponse,
} from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useDebounce } from '@/hooks/useDebounce';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { MealTypeChips } from './MealTypeChips';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDayHeader } from '@/lib/planner-dates';
import { toast } from 'sonner';

interface RecipePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onEntryCreated: () => void;
}

export function RecipePickerSheet({
  isOpen,
  onClose,
  date,
  onEntryCreated,
}: RecipePickerSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MealType.Lunch);
  const pendingRecipeRef = useRef<RecipeListItem | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Reset search and meal type when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedMealType(MealType.Lunch);
    }
  }, [isOpen]);

  const { data: recipesData, isLoading: recipesLoading } = useQuery({
    queryKey: queryKeys.recipes.list({ search: debouncedSearch, pageSize: 50 }),
    queryFn: () =>
      api.get<PaginatedResponse<RecipeListItem>>(
        `/recipes?search=${encodeURIComponent(debouncedSearch)}&pageSize=50`
      ),
    enabled: isOpen,
  });

  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (body: CreateMealPlanEntryRequest) =>
      api.post<MealPlanEntryResponse>('/meal-plan/entries', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
      if (pendingRecipeRef.current) {
        window.umami?.track('meal-plan-add', {
          recipeId: pendingRecipeRef.current.id,
          recipeName: pendingRecipeRef.current.name,
        });
        pendingRecipeRef.current = null;
      }
      toast.success('Receta agregada al planificador.');
      onEntryCreated();
      onClose();
    },
    onError: () => {
      toast.error('No se pudo agregar la receta. Intentalo de nuevo.');
    },
  });

  function handleSelectRecipe(recipe: RecipeListItem) {
    pendingRecipeRef.current = recipe;
    createMutation.mutate({
      recipeId: recipe.id,
      date,
      mealType: selectedMealType,
    });
  }

  const { dayName, dateLabel } = formatDayHeader(date);
  const title = `Anadir receta a ${dayName}, ${dateLabel}`;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      {/* Search bar */}
      <div className="px-4 mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar receta..."
          className="w-full bg-subtle rounded-[10px] px-3 py-2 text-[15px] text-foreground placeholder:text-placeholder outline-none"
        />
      </div>

      {/* Meal type chips */}
      <MealTypeChips selected={selectedMealType} onChange={setSelectedMealType} />

      {/* Recipe list */}
      <div className="max-h-[60vh] overflow-y-auto pb-6">
        {recipesLoading ? (
          <div className="flex flex-col gap-1 px-4 py-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[48px] w-full rounded-[8px]" />
            ))}
          </div>
        ) : (recipesData?.items ?? []).length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[15px] font-semibold text-foreground">Ninguna receta encontrada</p>
            <p className="text-[13px] text-secondary mt-1">No hay recetas que coincidan con tu busqueda.</p>
          </div>
        ) : (
          (recipesData?.items ?? []).map(recipe => (
            <button
              key={recipe.id}
              onClick={() => handleSelectRecipe(recipe)}
              disabled={createMutation.isPending}
              className="w-full text-left py-3 px-4 border-b border-subtle text-[15px] text-foreground hover:bg-subtle disabled:opacity-50"
            >
              {recipe.name}
            </button>
          ))
        )}
      </div>
    </BottomSheet>
  );
}
