'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type {
  MealPlanResponse,
  MealPlanEntryResponse,
  PaginatedResponse,
  RecipeListItemResponse,
  CreateMealPlanEntryRequest,
} from '@recipe-manager/shared';
import { MealType } from '@recipe-manager/shared';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getWeekDates(weekOffset: number): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Monday = 0, adjust so week starts on Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// RecipePicker bottom sheet
interface RecipePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipe: RecipeListItemResponse) => void;
}

function RecipePickerSheet({ isOpen, onClose, onSelect }: RecipePickerSheetProps) {
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: queryKeys.recipes.all({ q: search }),
    queryFn: () =>
      api.get<PaginatedResponse<RecipeListItemResponse>>(
        `/api/recipes${search ? `?q=${encodeURIComponent(search)}` : ''}`,
      ),
    enabled: isOpen,
  });

  const recipes = data?.items ?? [];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Agregar receta">
      <div data-testid="recipe-picker-sheet" className="px-5 py-3">
        <input
          type="text"
          placeholder="Buscar receta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-placeholder focus:outline-none mb-3"
        />
        <div className="flex flex-col">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => onSelect(recipe)}
              className="flex items-center justify-between py-3 border-b border-border text-left hover:bg-subtle"
            >
              <span className="text-sm font-medium text-foreground">{recipe.name}</span>
              {recipe.totalTime != null && (
                <span className="text-xs text-secondary ml-2">{recipe.totalTime} min</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

// Day row component
interface DayRowProps {
  date: Date;
  entries: MealPlanEntryResponse[];
  onAdd: () => void;
  onDelete: (entryId: string) => void;
}

function DayRow({ date, entries, onAdd, onDelete }: DayRowProps) {
  const [expanded, setExpanded] = useState(false);
  const dayName = DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const dateStr = date.getDate().toString().padStart(2, '0');
  const summary =
    entries.length > 0
      ? entries.map((e) => e.recipeName).join(', ')
      : 'Sin recetas';

  return (
    <div className="border-b border-border">
      <button
        type="button"
        data-testid="planner-day-row"
        className="w-full flex items-center justify-between px-5 py-3 text-left"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 flex flex-col items-center">
            <span className="text-xs text-secondary">{dayName}</span>
            <span className="text-base font-semibold text-foreground">{dateStr}</span>
          </div>
          <span className="text-sm text-secondary truncate max-w-[180px]">{summary}</span>
        </div>
        <span className="text-secondary">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-foreground">{entry.recipeName}</span>
              <button
                type="button"
                data-testid={`delete-entry-${entry.id}`}
                aria-label="Eliminar entrada"
                onClick={() => onDelete(entry.id)}
                className="text-destructive text-sm ml-2"
              >
                ✕
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onAdd}
            aria-label="Agregar"
          >
            Agregar
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [pickerDay, setPickerDay] = useState<Date | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const from = toIsoDate(weekDates[0]);
  const to = toIsoDate(weekDates[6]);

  const { data } = useQuery({
    queryKey: queryKeys.mealPlan.range(from, to),
    queryFn: () => api.get<MealPlanResponse>(`/api/meal-plan?from=${from}&to=${to}`),
  });

  const entries = data?.entries ?? [];

  const addEntryMutation = useMutation({
    mutationFn: (req: CreateMealPlanEntryRequest) =>
      api.post('/api/meal-plan/entries', req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mealPlan.range(from, to) });
      setPickerDay(null);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/meal-plan/entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mealPlan.range(from, to) });
    },
  });

  function handleSelectRecipe(recipe: RecipeListItemResponse) {
    if (!pickerDay) return;
    addEntryMutation.mutate({
      recipeId: recipe.id,
      date: toIsoDate(pickerDay),
      mealType: MealType.Dinner,
    });
  }

  function getEntriesForDate(date: Date): MealPlanEntryResponse[] {
    const iso = toIsoDate(date);
    return entries.filter((e) => e.date === iso);
  }

  return (
    <div className="pb-10">
      {/* Week navigation */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          className="text-sm text-foreground px-3 py-1.5 rounded-lg hover:bg-subtle"
          aria-label="Anterior"
        >
          ← Anterior
        </button>
        <span className="text-sm font-semibold text-foreground">
          {weekDates[0].getDate()} — {weekDates[6].getDate()}
        </span>
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w + 1)}
          className="text-sm text-foreground px-3 py-1.5 rounded-lg hover:bg-subtle"
          aria-label="Siguiente"
        >
          Siguiente →
        </button>
      </div>

      {/* Day rows */}
      <div>
        {weekDates.map((date) => (
          <DayRow
            key={toIsoDate(date)}
            date={date}
            entries={getEntriesForDate(date)}
            onAdd={() => setPickerDay(date)}
            onDelete={(id) => deleteEntryMutation.mutate(id)}
          />
        ))}
      </div>

      {/* Recipe picker */}
      <RecipePickerSheet
        isOpen={pickerDay !== null}
        onClose={() => setPickerDay(null)}
        onSelect={handleSelectRecipe}
      />
    </div>
  );
}
