'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MealPlanEntryResponse, UpdateMealPlanEntryRequest } from '@recipe-manager/shared';
import { MealType } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { MealTypeChips } from './MealTypeChips';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

interface EditEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  entry: MealPlanEntryResponse | null;
  from: string;
  to: string;
}

export function EditEntrySheet({ isOpen, onClose, entry, from, to }: EditEntrySheetProps) {
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    entry?.mealType ?? MealType.Lunch
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (entry) {
      setSelectedMealType(entry.mealType);
      setShowDeleteConfirm(false);
    }
  }, [entry]);

  const queryClient = useQueryClient();
  const weekKey = queryKeys.mealPlan.week(from, to);

  const saveMutation = useMutation({
    mutationFn: (body: UpdateMealPlanEntryRequest) =>
      api.patch<MealPlanEntryResponse>(`/meal-plan/entries/${entry!.id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weekKey });
      toast.success('Cambios guardados.');
      onClose();
    },
    onError: () => {
      toast.error('No se pudo guardar los cambios. Intentalo de nuevo.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<void>(`/meal-plan/entries/${entry!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weekKey });
      window.umami?.track('meal-plan-remove', { recipeId: entry!.recipeId, recipeName: entry!.recipeName });
      toast.success('Entrada eliminada.');
      onClose();
    },
    onError: () => {
      toast.error('No se pudo eliminar la entrada. Intentalo de nuevo.');
    },
  });

  function handleSave() {
    if (!entry) return;
    const updates: UpdateMealPlanEntryRequest = {};
    if (selectedMealType !== entry.mealType) updates.mealType = selectedMealType;
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }
    saveMutation.mutate(updates);
  }

  if (!entry) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Editar entrada">
      {/* Current recipe name (read-only display) */}
      <div className="px-4 py-3 border-b border-subtle">
        <p className="text-[13px] text-secondary uppercase tracking-widest mb-1">Receta</p>
        <p className="text-[15px] text-foreground">{entry.recipeName}</p>
      </div>

      {/* Meal type selector */}
      <div className="py-3">
        <p className="text-[13px] text-secondary uppercase tracking-widest mb-2 px-4">Tipo de comida</p>
        <MealTypeChips selected={selectedMealType} onChange={setSelectedMealType} />
      </div>

      {/* Save button */}
      <div className="px-4 pt-2">
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full bg-foreground text-background rounded-[20px] px-6 py-3 text-[15px] font-semibold disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Delete link */}
      <div className="px-4 pt-4 pb-6 text-center">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-[15px] text-destructive"
        >
          Eliminar entrada
        </button>

        {showDeleteConfirm && (
          <ConfirmDialog
            message="¿Eliminar esta entrada del planificador?"
            confirmLabel="Eliminar entrada"
            cancelLabel="Mantener entrada"
            onConfirm={() => deleteMutation.mutate()}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </BottomSheet>
  );
}
