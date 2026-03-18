'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

import type { StepResponse, UpdateStepRequest } from '@recipe-manager/shared';

interface StepRowProps {
  step: StepResponse;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: UpdateStepRequest) => void;
}

export function StepRow({ step, index, onDelete, onUpdate }: StepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start px-5 py-3 border-b border-subtle gap-3"
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        aria-label="Arrastrar paso"
        className="flex-shrink-0 flex items-center justify-center touch-none pt-1"
      >
        <GripVertical size={16} className="text-placeholder" />
      </button>

      {/* Step number badge */}
      <div className="w-6 h-6 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center justify-center flex-shrink-0 mt-1">
        {index + 1}
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <input
          className="text-[13px] text-secondary border-b border-border pb-1 bg-transparent outline-none w-full"
          placeholder="Titulo del paso (opcional)"
          defaultValue={step.title ?? ''}
          onBlur={(e) => onUpdate(step.id, { title: e.target.value || null })}
        />
        <textarea
          className="border border-border rounded-[8px] px-3 py-2 text-[15px] text-foreground bg-transparent outline-none w-full min-h-[64px] resize-none focus:ring-2 focus:ring-accent"
          placeholder="Descripcion del paso"
          defaultValue={step.body}
          onBlur={(e) => {
            if (e.target.value.trim()) onUpdate(step.id, { body: e.target.value });
          }}
        />
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(step.id)}
        aria-label="Eliminar paso"
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
      >
        <X size={16} className="text-destructive" />
      </button>
    </div>
  );
}
