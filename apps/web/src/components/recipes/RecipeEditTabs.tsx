'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TabBar } from '@/components/ui/TabBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IngredientPicker } from './IngredientPicker';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type {
  RecipeDetailResponse,
  UpdateRecipeRequest,
  RecipeIngredientResponse,
  InstructionStepResponse,
  CreateStepRequest,
} from '@recipe-manager/shared';

export interface RecipeEditTabsProps {
  recipe: RecipeDetailResponse;
  onUpdate: (recipe: RecipeDetailResponse) => void;
}

const TABS = ['Ingredientes', 'Instrucciones', 'Básico', 'Fotos'];

// ---------- Ingredients tab ----------
function IngredientsTab({
  recipe,
  onUpdate,
}: {
  recipe: RecipeDetailResponse;
  onUpdate: (r: RecipeDetailResponse) => void;
}) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  // Use first section or null
  const section = recipe.sections[0] ?? null;
  const sectionId = section?.id ?? '';

  const deleteIngredientMutation = useMutation({
    mutationFn: ({ sectionId, ingredientId }: { sectionId: string; ingredientId: string }) =>
      api.delete<void>(`/api/recipes/${recipe.id}/sections/${sectionId}/ingredients/${ingredientId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipe.id) });
    },
  });

  const moveUpMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) =>
      api.put<RecipeDetailResponse>(`/api/recipes/${recipe.id}/sections/${sectionId}/ingredients/reorder`, { ids }),
    onSuccess: (updated) => onUpdate(updated),
  });

  function handleAdded(_ingredient: RecipeIngredientResponse) {
    queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipe.id) });
    setPickerOpen(false);
  }

  const ingredients = section?.ingredients ?? [];

  return (
    <div className="px-5 py-4">
      {ingredients.map((ing, idx) => (
        <div
          key={ing.id}
          className="flex items-center justify-between py-2 border-b border-border last:border-0"
        >
          <div className="flex items-center gap-2 flex-1">
            {/* Move up button for reorder */}
            {idx > 0 && (
              <button
                type="button"
                aria-label="Subir"
                className="text-secondary text-xs px-1"
                onClick={() => {
                  const ids = ingredients.map((i) => i.id);
                  const newIds = [...ids];
                  [newIds[idx - 1], newIds[idx]] = [newIds[idx], newIds[idx - 1]];
                  moveUpMutation.mutate({ ids: newIds });
                }}
              >
                ↑
              </button>
            )}
            <span className="text-sm text-foreground">
              {ing.quantity != null ? `${ing.quantity} ` : ''}
              {ing.unitAbbreviation ?? ing.unitName ?? ''}
              {ing.quantity != null || ing.unitName ? ' ' : ''}
              {ing.foodName}
              {ing.note ? ` — ${ing.note}` : ''}
            </span>
          </div>
          <button
            type="button"
            data-testid={`delete-ingredient-${ing.id}`}
            aria-label="Eliminar"
            onClick={() =>
              deleteIngredientMutation.mutate({ sectionId: section!.id, ingredientId: ing.id })
            }
            className="text-destructive text-sm ml-2"
          >
            ✕
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full mt-4"
        onClick={() => setPickerOpen(true)}
        aria-label="Agregar ingrediente"
      >
        Agregar ingrediente
      </Button>

      {section && (
        <IngredientPicker
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          recipeId={recipe.id}
          sectionId={section.id}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}

// ---------- Instructions tab ----------
function InstructionsTab({
  recipe,
  onUpdate,
}: {
  recipe: RecipeDetailResponse;
  onUpdate: (r: RecipeDetailResponse) => void;
}) {
  const queryClient = useQueryClient();

  const addStepMutation = useMutation({
    mutationFn: (req: CreateStepRequest) =>
      api.post<InstructionStepResponse>(`/api/recipes/${recipe.id}/steps`, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipe.id) });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      api.delete<void>(`/api/recipes/${recipe.id}/steps/${stepId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipe.id) });
    },
  });

  const reorderStepsMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.put<RecipeDetailResponse>(`/api/recipes/${recipe.id}/steps/reorder`, { ids }),
    onSuccess: (updated) => onUpdate(updated),
  });

  const steps = recipe.steps;

  return (
    <div className="px-5 py-4">
      {steps.map((step, idx) => (
        <div
          key={step.id}
          className="flex items-start gap-3 py-3 border-b border-border last:border-0"
        >
          <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
            {step.order}
          </span>
          <div className="flex-1">
            {step.title && (
              <p className="text-sm font-semibold text-foreground mb-1">{step.title}</p>
            )}
            <p className="text-sm text-secondary">{step.body}</p>
          </div>
          <div className="flex flex-col gap-1">
            {idx > 0 && (
              <button
                type="button"
                aria-label="Subir paso"
                className="text-secondary text-xs"
                onClick={() => {
                  const ids = steps.map((s) => s.id);
                  const newIds = [...ids];
                  [newIds[idx - 1], newIds[idx]] = [newIds[idx], newIds[idx - 1]];
                  reorderStepsMutation.mutate(newIds);
                }}
              >
                ↑
              </button>
            )}
            <button
              type="button"
              data-testid={`delete-step-${step.id}`}
              aria-label="Eliminar paso"
              onClick={() => deleteStepMutation.mutate(step.id)}
              className="text-destructive text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full mt-4"
        loading={addStepMutation.isPending}
        onClick={() => addStepMutation.mutate({ body: '' })}
        aria-label="Agregar paso"
      >
        Agregar paso
      </Button>
    </div>
  );
}

// ---------- Basic info tab ----------
function BasicInfoTab({
  recipe,
  onUpdate,
}: {
  recipe: RecipeDetailResponse;
  onUpdate: (r: RecipeDetailResponse) => void;
}) {
  const [name, setName] = useState(recipe.name);
  const [description, setDescription] = useState(recipe.description ?? '');
  const [prepTime, setPrepTime] = useState(recipe.prepTime?.toString() ?? '');
  const [cookTime, setCookTime] = useState(recipe.cookTime?.toString() ?? '');
  const [servingsQty, setServingsQty] = useState(recipe.servingsQty?.toString() ?? '');
  const [servingsUnit, setServingsUnit] = useState(recipe.servingsUnit ?? '');

  const saveMutation = useMutation({
    mutationFn: (req: UpdateRecipeRequest) =>
      api.patch<RecipeDetailResponse>(`/api/recipes/${recipe.id}`, req),
    onSuccess: (updated) => onUpdate(updated),
  });

  function handleSave() {
    const req: UpdateRecipeRequest = { name };
    if (description) req.description = description;
    if (prepTime) req.prepTime = Number(prepTime);
    if (cookTime) req.cookTime = Number(cookTime);
    if (servingsQty) req.servingsQty = Number(servingsQty);
    if (servingsUnit) req.servingsUnit = servingsUnit;
    saveMutation.mutate(req);
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Descripción"
        type="textarea"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe la receta..."
      />
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Tiempo de preparación (min)"
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex-1">
          <Input
            label="Tiempo de cocción (min)"
            type="number"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Porciones"
            type="number"
            value={servingsQty}
            onChange={(e) => setServingsQty(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex-1">
          <Input
            label="Unidad de porción"
            value={servingsUnit}
            onChange={(e) => setServingsUnit(e.target.value)}
            placeholder="Ej. porciones"
          />
        </div>
      </div>
      <Button
        type="button"
        className="w-full"
        loading={saveMutation.isPending}
        onClick={handleSave}
        aria-label="Guardar"
      >
        Guardar
      </Button>
    </div>
  );
}

// ---------- Photos tab ----------
function PhotosTab({
  recipe,
  onUpdate: _onUpdate,
}: {
  recipe: RecipeDetailResponse;
  onUpdate: (r: RecipeDetailResponse) => void;
}) {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/recipes/${recipe.id}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }).then((r) => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipe.id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) =>
      api.delete<void>(`/api/recipes/${recipe.id}/images/${imageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipe.id) });
    },
  });

  return (
    <div className="px-5 py-4">
      {/* Upload zone */}
      <label
        data-testid="photo-upload-zone"
        className="block w-full border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-subtle transition-colors"
      >
        <p className="text-sm text-secondary">Toca para subir foto</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadMutation.mutate(file);
          }}
        />
      </label>

      {/* Image previews */}
      {recipe.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {recipe.images.map((img) => (
            <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden bg-subtle">
              <img
                src={img.url}
                alt="Foto de la receta"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                data-testid={`delete-image-${img.id}`}
                aria-label="Eliminar foto"
                onClick={() => deleteMutation.mutate(img.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 text-destructive flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Main component ----------
export function RecipeEditTabs({ recipe, onUpdate }: RecipeEditTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col">
      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 0 && <IngredientsTab recipe={recipe} onUpdate={onUpdate} />}
      {activeTab === 1 && <InstructionsTab recipe={recipe} onUpdate={onUpdate} />}
      {activeTab === 2 && <BasicInfoTab recipe={recipe} onUpdate={onUpdate} />}
      {activeTab === 3 && <PhotosTab recipe={recipe} onUpdate={onUpdate} />}
    </div>
  );
}
