'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

import type { IngredientResponse } from '@recipe-manager/shared';

interface IngredientRowProps {
  ingredient: IngredientResponse;
  onDelete: (id: string) => void;
  sectionId: string;
}

export function IngredientRow({ ingredient, onDelete }: IngredientRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ingredient.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const qtyUnit = [ingredient.quantity?.toString(), ingredient.unitName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center px-5 py-3 border-b border-subtle gap-3"
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        aria-label="Arrastrar ingrediente"
        className="flex-shrink-0 flex items-center justify-center touch-none"
      >
        <GripVertical size={18} className="text-placeholder" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-[15px] text-foreground">{ingredient.foodName}</span>
        {qtyUnit && (
          <span className="text-[15px] text-secondary ml-2">{qtyUnit}</span>
        )}
        {ingredient.note && (
          <span className="text-[13px] text-secondary italic block">{ingredient.note}</span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(ingredient.id)}
        aria-label="Eliminar ingrediente"
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
      >
        <X size={16} className="text-destructive" />
      </button>
    </div>
  );
}
