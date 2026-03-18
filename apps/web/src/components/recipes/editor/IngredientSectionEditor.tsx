'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import type { DragEndEvent } from '@dnd-kit/core';

import { api } from '@/lib/api-client';
import { IngredientRow } from './IngredientRow';
import { IngredientPicker } from './IngredientPicker';
import type { SectionResponse, CreateIngredientRequest } from '@recipe-manager/shared';

interface IngredientSectionEditorProps {
  recipeId: string;
  sections: SectionResponse[];
  onMutationSuccess: () => void;
}

export function IngredientSectionEditor({
  recipeId,
  sections,
  onMutationSuccess,
}: IngredientSectionEditorProps) {
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);

  // Add section
  const addSectionMutation = useMutation({
    mutationFn: () => api.post(`/recipes/${recipeId}/sections`, { title: null }),
    onSuccess: onMutationSuccess,
    onError: () => toast.error('Error al añadir la sección. Intenta de nuevo.'),
  });

  // Update section title
  const updateSectionTitleMutation = useMutation({
    mutationFn: ({ sectionId, title }: { sectionId: string; title: string | null }) =>
      api.patch(`/recipes/${recipeId}/sections/${sectionId}`, { title }),
    onSuccess: onMutationSuccess,
    onError: () => toast.error('Error al actualizar la sección. Intenta de nuevo.'),
  });

  // Delete section
  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) =>
      api.delete(`/recipes/${recipeId}/sections/${sectionId}`),
    onSuccess: onMutationSuccess,
    onError: () => toast.error('Error al eliminar la sección. Intenta de nuevo.'),
  });

  // Add ingredient
  const addIngredientMutation = useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: string;
      data: CreateIngredientRequest;
    }) => api.post(`/recipes/${recipeId}/sections/${sectionId}/ingredients`, data),
    onSuccess: onMutationSuccess,
    onError: () => toast.error('Error al añadir el ingrediente. Intenta de nuevo.'),
  });

  // Delete ingredient
  const deleteIngredientMutation = useMutation({
    mutationFn: ({
      sectionId,
      ingredientId,
    }: {
      sectionId: string;
      ingredientId: string;
    }) =>
      api.delete(
        `/recipes/${recipeId}/sections/${sectionId}/ingredients/${ingredientId}`
      ),
    onSuccess: onMutationSuccess,
    onError: () => toast.error('Error al eliminar el ingrediente. Intenta de nuevo.'),
  });

  // Reorder ingredients
  const reorderIngredientsMutation = useMutation({
    mutationFn: ({ sectionId, ids }: { sectionId: string; ids: string[] }) =>
      api.put(`/recipes/${recipeId}/sections/${sectionId}/ingredients/reorder`, { ids }),
    onSuccess: onMutationSuccess,
    onError: () => toast.error('Error al reordenar. Intenta de nuevo.'),
  });

  function handleDragEnd(event: DragEndEvent, section: SectionResponse) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = section.ingredients.findIndex((i) => i.id === active.id);
    const newIndex = section.ingredients.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(section.ingredients, oldIndex, newIndex).map((i) => i.id);
    reorderIngredientsMutation.mutate({ sectionId: section.id, ids: newOrder });
  }

  // Empty state
  if (sections.length === 0) {
    return (
      <div>
        <div className="px-5 py-8 text-center">
          <p className="text-[15px] text-secondary">Sin ingredientes aún</p>
          <p className="text-[13px] text-secondary mt-1">
            Usa &lsquo;+ Añadir ingrediente&rsquo; para comenzar.
          </p>
        </div>
        <button
          onClick={() => addSectionMutation.mutate()}
          disabled={addSectionMutation.isPending}
          className="text-[15px] text-secondary font-semibold py-3 px-5 w-full border-t border-subtle text-left disabled:opacity-50"
        >
          + Añadir sección
        </button>
      </div>
    );
  }

  return (
    <div>
      {sections.map((section) => (
        <div key={section.id}>
          {/* Section header */}
          <div className="flex items-center px-5 py-3 border-b border-subtle gap-2">
            <input
              type="text"
              defaultValue={section.title ?? ''}
              onBlur={(e) => {
                const newTitle = e.target.value.trim() || null;
                updateSectionTitleMutation.mutate({
                  sectionId: section.id,
                  title: newTitle,
                });
              }}
              placeholder="Nombre de la sección (opcional)"
              className="text-[13px] font-semibold border-b border-border pb-1 bg-transparent outline-none flex-1 placeholder:text-placeholder placeholder:font-normal"
            />
            {section.ingredients.length === 0 && (
              <button
                onClick={() => deleteSectionMutation.mutate(section.id)}
                disabled={deleteSectionMutation.isPending}
                aria-label="Eliminar sección"
                className="text-destructive flex-shrink-0 disabled:opacity-50"
              >
                ×
              </button>
            )}
          </div>

          {/* Ingredient rows with drag-and-drop */}
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, section)}
          >
            <SortableContext
              items={section.ingredients.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {section.ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className={
                    reorderIngredientsMutation.isPending
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                >
                  <IngredientRow
                    ingredient={ingredient}
                    sectionId={section.id}
                    onDelete={(id) =>
                      deleteIngredientMutation.mutate({
                        sectionId: section.id,
                        ingredientId: id,
                      })
                    }
                  />
                </div>
              ))}
            </SortableContext>
          </DndContext>

          {/* Add ingredient button */}
          <button
            onClick={() => setPickerSectionId(section.id)}
            className="text-[15px] text-secondary font-semibold py-3 px-5 w-full border-t border-subtle text-left"
          >
            + Añadir ingrediente
          </button>
        </div>
      ))}

      {/* Add section button */}
      <button
        onClick={() => addSectionMutation.mutate()}
        disabled={addSectionMutation.isPending}
        className="text-[15px] text-secondary font-semibold py-3 px-5 w-full border-t border-subtle text-left disabled:opacity-50"
      >
        + Añadir sección
      </button>

      {/* Ingredient picker modal */}
      {pickerSectionId && (
        <IngredientPicker
          isOpen={Boolean(pickerSectionId)}
          onClose={() => setPickerSectionId(null)}
          recipeId={recipeId}
          onAdd={(ingredient) => {
            addIngredientMutation.mutate({
              sectionId: pickerSectionId,
              data: ingredient,
            });
          }}
        />
      )}
    </div>
  );
}
