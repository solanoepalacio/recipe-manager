'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

export default function CookModePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

  const { data: recipe, isLoading } = useQuery({
    queryKey: queryKeys.recipes.detail(slug),
    queryFn: () => api.get<RecipeDetailResponse>(`/api/recipes/${slug}`),
    enabled: !!slug,
  });

  function toggleStep(stepId: string) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }

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

  const steps = recipe.steps;
  const firstUncheckedId = steps.find((s) => !checkedSteps.has(s.id))?.id;

  return (
    <div className="min-h-screen bg-canvas text-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-background/20">
        <h1 className="text-base font-semibold">{recipe.name}</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-background/80 text-sm hover:text-background transition-colors"
          aria-label="Salir"
        >
          Salir
        </button>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {steps.length === 0 ? (
          <p className="text-background/60 text-sm text-center py-12">
            Sin instrucciones
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {steps.map((step) => {
              const isChecked = checkedSteps.has(step.id);
              const isCurrent = step.id === firstUncheckedId;

              return (
                <li key={step.id}>
                  <button
                    type="button"
                    data-testid={`step-item-${step.id}`}
                    data-checked={isChecked}
                    onClick={() => toggleStep(step.id)}
                    className={[
                      'w-full text-left rounded-xl p-4 transition-all',
                      isChecked
                        ? 'bg-background/10 opacity-50'
                        : isCurrent
                          ? 'bg-background/20 ring-2 ring-accent'
                          : 'bg-background/10',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={[
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                          isChecked
                            ? 'bg-accent text-background'
                            : 'bg-background/20 text-background',
                        ].join(' ')}
                      >
                        {isChecked ? '✓' : step.order}
                      </span>
                      {!isChecked && (
                        <div className="flex-1">
                          {step.title && (
                            <p className="text-sm font-semibold mb-1">{step.title}</p>
                          )}
                          <p className="text-sm text-background/80">{step.body}</p>
                        </div>
                      )}
                      {isChecked && (
                        <p className="text-sm font-semibold line-through opacity-60">
                          {step.title ?? step.body}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* "You are here" indicator */}
                  {isCurrent && (
                    <div
                      data-testid="current-step-indicator"
                      className="text-xs text-accent text-center mt-1"
                    >
                      Aquí estás
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
