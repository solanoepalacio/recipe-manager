'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import { api } from '@/lib/api-client';
import type { StepResponse, UpdateStepRequest } from '@recipe-manager/shared';
import { StepRow } from './StepRow';

interface StepEditorProps {
  recipeId: string;
  steps: StepResponse[];
  onMutationSuccess: () => void;
}

export function StepEditor({ recipeId, steps, onMutationSuccess }: StepEditorProps) {
  const [newStepBody, setNewStepBody] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const addStepMutation = useMutation({
    mutationFn: () =>
      api.post(`/recipes/${recipeId}/steps`, { body: newStepBody.trim() }),
    onSuccess: () => {
      setNewStepBody('');
      setShowAddForm(false);
      onMutationSuccess();
    },
    onError: () => toast.error('Error al guardar. Intenta de nuevo.'),
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: UpdateStepRequest }) =>
      api.patch(`/recipes/${recipeId}/steps/${stepId}`, data),
    onSuccess: () => onMutationSuccess(),
    onError: () => toast.error('Error al guardar. Intenta de nuevo.'),
  });

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      api.delete(`/recipes/${recipeId}/steps/${stepId}`),
    onSuccess: () => onMutationSuccess(),
    onError: () => toast.error('Error al guardar. Intenta de nuevo.'),
  });

  const reorderStepsMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.put(`/recipes/${recipeId}/steps/reorder`, { ids }),
    onSuccess: () => onMutationSuccess(),
    onError: () => toast.error('Error al reordenar. Intenta de nuevo.'),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex);
    reorderStepsMutation.mutate(reordered.map((s) => s.id));
  }

  return (
    <div>
      {/* Empty state */}
      {steps.length === 0 && !showAddForm && (
        <div className="px-5 py-8 text-center">
          <p className="text-[15px] text-secondary">Sin pasos aun</p>
          <p className="text-[13px] text-secondary">
            Usa &apos;+ Anadir paso&apos; para comenzar.
          </p>
        </div>
      )}

      {/* Step list */}
      {steps.length > 0 && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {steps.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                index={index}
                onDelete={(id) => deleteStepMutation.mutate(id)}
                onUpdate={(id, data) => updateStepMutation.mutate({ stepId: id, data })}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Add step form */}
      {showAddForm && (
        <div className="px-5 py-3 border-t border-subtle flex flex-col gap-2">
          <textarea
            className="border border-border rounded-[8px] px-3 py-2 text-[15px] text-foreground bg-transparent outline-none w-full min-h-[64px] resize-none focus:ring-2 focus:ring-accent"
            placeholder="Descripcion del paso"
            value={newStepBody}
            onChange={(e) => setNewStepBody(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => addStepMutation.mutate()}
              disabled={newStepBody.trim() === '' || addStepMutation.isPending}
              className="bg-foreground text-background rounded-[20px] px-5 py-2 text-[13px] font-semibold disabled:opacity-50"
            >
              {addStepMutation.isPending ? 'Anadiendo...' : 'Anadir'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewStepBody('');
              }}
              className="border border-border text-foreground rounded-[20px] px-5 py-2 text-[13px] font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Add step button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="text-[15px] text-secondary font-semibold py-3 px-5 w-full border-t border-subtle text-left"
        >
          + Anadir paso
        </button>
      )}
    </div>
  );
}
