'use client';

import { X, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { MealPlanEntryResponse } from '@recipe-manager/shared';
import { MEAL_TYPE_LABELS } from '@/lib/planner-dates';

interface MealEntryRowProps {
  entry: MealPlanEntryResponse;
  onDelete: (id: string) => void;
  onEdit: (entry: MealPlanEntryResponse) => void;
}

export function MealEntryRow({ entry, onDelete, onEdit }: MealEntryRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    data: { entry },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`py-3 px-4 border-b border-subtle flex items-center justify-between touch-none ${isDragging ? 'z-50 shadow-md' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing text-secondary touch-none"
      >
        <GripVertical size={16} />
      </div>

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
