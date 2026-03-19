'use client';

import { X } from 'lucide-react';
import type { MealPlanEntryResponse } from '@recipe-manager/shared';
import { MEAL_TYPE_LABELS } from '@/lib/planner-dates';

interface MealEntryRowProps {
  entry: MealPlanEntryResponse;
  onDelete: (id: string) => void;
  onEdit: (entry: MealPlanEntryResponse) => void;
}

export function MealEntryRow({ entry, onDelete, onEdit }: MealEntryRowProps) {
  return (
    <div className="py-3 px-4 border-b border-subtle flex items-center justify-between">
      <div className="flex-1 cursor-pointer" onClick={() => onEdit(entry)}>
        <p className="text-[15px] text-foreground">{entry.recipeName}</p>
        <span className="text-[12px] text-secondary uppercase tracking-widest">
          {MEAL_TYPE_LABELS[entry.mealType]}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(entry.id);
        }}
        aria-label="Eliminar entrada"
        className="w-11 h-11 flex items-center justify-center text-secondary hover:text-destructive"
      >
        <X size={16} />
      </button>
    </div>
  );
}
