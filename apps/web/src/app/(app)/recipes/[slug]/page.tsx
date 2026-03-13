'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { RecipeEditTabs } from '@/components/recipes/RecipeEditTabs';
import { ShareDialog } from '@/components/recipes/ShareDialog';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editingName, setEditingName] = useState('');

  const { data: recipe, isLoading } = useQuery({
    queryKey: queryKeys.recipes.detail(slug),
    queryFn: () => api.get<RecipeDetailResponse>(`/api/recipes/${slug}`),
    enabled: !!slug,
  });

  const updateNameMutation = useMutation({
    mutationFn: (name: string) =>
      api.patch<RecipeDetailResponse>(`/api/recipes/${recipe!.id}`, { name }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.recipes.detail(slug), updated);
    },
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: ({
      sectionId,
      ingredientId,
    }: {
      sectionId: string;
      ingredientId: string;
    }) =>
      api.delete<void>(
        `/api/recipes/${recipe!.id}/sections/${sectionId}/ingredients/${ingredientId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(slug) });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      api.delete<void>(`/api/recipes/${recipe!.id}/steps/${stepId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(slug) });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm text-secondary">Receta no encontrada</p>
      </div>
    );
  }

  const heroImage = recipe.images[0];

  return (
    <div className="pb-20">
      {/* Hero image */}
      <div className="relative w-full aspect-video bg-subtle">
        {heroImage ? (
          <Image
            src={heroImage.url}
            alt={recipe.name}
            fill
            className="object-cover"
          />
        ) : null}
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-foreground text-lg mr-3"
          aria-label="Volver"
        >
          ←
        </button>
        {editMode ? (
          <input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => {
              if (editingName && editingName !== recipe.name) {
                updateNameMutation.mutate(editingName);
              }
            }}
            className="flex-1 text-base font-semibold text-foreground bg-transparent border-b border-border focus:outline-none"
          />
        ) : (
          <h1 className="flex-1 text-base font-semibold text-foreground truncate">
            {recipe.name}
          </h1>
        )}
        <div className="flex items-center gap-2 ml-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!editMode) {
                setEditingName(recipe.name);
              }
              setEditMode((prev) => !prev);
            }}
          >
            {editMode ? 'Listo' : 'Editar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
          >
            Compartir
          </Button>
        </div>
      </div>

      {/* Times row */}
      <div className="flex gap-4 px-5 py-4 border-b border-border">
        {recipe.prepTime != null && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-secondary">Preparación</span>
            <span className="text-sm font-semibold text-foreground">
              {recipe.prepTime} min
            </span>
          </div>
        )}
        {recipe.cookTime != null && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-secondary">Cocción</span>
            <span className="text-sm font-semibold text-foreground">
              {recipe.cookTime} min
            </span>
          </div>
        )}
        {recipe.totalTime != null && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-secondary">Total</span>
            <span className="text-sm font-semibold text-foreground">
              {recipe.totalTime} min
            </span>
          </div>
        )}
      </div>

      {/* Edit tabs or view mode */}
      {editMode ? (
        <RecipeEditTabs
          recipe={recipe}
          onUpdate={(updated) => {
            queryClient.setQueryData(queryKeys.recipes.detail(slug), updated);
          }}
        />
      ) : (
        <>
          {/* Ingredient sections */}
          {recipe.sections.length > 0 && (
            <div className="mt-4">
              <h2 className="px-5 text-sm font-semibold text-secondary uppercase tracking-wide mb-2">
                Ingredientes
              </h2>
              <Accordion
                items={recipe.sections.map((section) => ({
                  title: section.title ?? 'Ingredientes',
                  children: (
                    <ul className="px-5 py-2">
                      {section.ingredients.map((ing) => (
                        <li
                          key={ing.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <span className="text-sm text-foreground">
                            {ing.quantity != null ? `${ing.quantity} ` : ''}
                            {ing.unitAbbreviation ?? ing.unitName ?? ''}
                            {ing.quantity != null || ing.unitName ? ' ' : ''}
                            {ing.foodName}
                            {ing.note ? ` — ${ing.note}` : ''}
                          </span>
                          {editMode && (
                            <button
                              type="button"
                              aria-label="Eliminar"
                              data-testid={`delete-ingredient-${ing.id}`}
                              onClick={() =>
                                deleteIngredientMutation.mutate({
                                  sectionId: section.id,
                                  ingredientId: ing.id,
                                })
                              }
                              className="text-destructive text-sm ml-2"
                            >
                              ✕
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ),
                }))}
              />
            </div>
          )}

          {/* Instruction steps */}
          {recipe.steps.length > 0 && (
            <div className="mt-4 px-5">
              <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">
                Instrucciones
              </h2>
              <ol className="flex flex-col gap-4">
                {recipe.steps.map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step.order}
                    </span>
                    <div className="flex-1">
                      {step.title && (
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {step.title}
                        </p>
                      )}
                      <p className="text-sm text-foreground">{step.body}</p>
                    </div>
                    {editMode && (
                      <button
                        type="button"
                        aria-label="Eliminar"
                        data-testid={`delete-step-${step.id}`}
                        onClick={() => deleteStepMutation.mutate(step.id)}
                        className="text-destructive text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Cook mode button */}
          <div className="px-5 mt-8">
            <Button
              type="button"
              className="w-full"
              onClick={() => router.push(`/recipes/${slug}/cook`)}
            >
              Modo cocina
            </Button>
          </div>
        </>
      )}

      {/* Share dialog */}
      <ShareDialog
        recipeId={recipe.id}
        existingShareToken={recipe.shareToken}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
