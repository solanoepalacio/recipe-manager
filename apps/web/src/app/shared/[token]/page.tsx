'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { api } from '@/lib/api-client';
import { Accordion } from '@/components/ui/Accordion';
import type { SharedRecipeResponse, InstructionStepResponse } from '@recipe-manager/shared';

function CookModeView({ steps }: { steps: InstructionStepResponse[] }) {
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

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

  const firstUncheckedId = steps.find((s) => !checkedSteps.has(s.id))?.id;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 bg-canvas text-background">
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
                  <span className="w-7 h-7 rounded-full bg-background/20 text-background flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {isChecked ? '✓' : step.order}
                  </span>
                  {!isChecked && (
                    <div>
                      {step.title && <p className="text-sm font-semibold mb-1">{step.title}</p>}
                      <p className="text-sm text-background/80">{step.body}</p>
                    </div>
                  )}
                </div>
              </button>
              {isCurrent && (
                <div className="text-xs text-accent text-center mt-1">Aquí estás</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function SharedRecipePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const [cookMode, setCookMode] = useState(false);

  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: ['shared', token],
    queryFn: () => api.get<SharedRecipeResponse>(`/api/recipes/shared/${token}`),
    enabled: !!token,
    retry: false,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Branding banner */}
      <header
        data-testid="branding-banner"
        className="bg-canvas text-background px-5 py-4 flex items-center gap-3"
      >
        <span className="text-lg font-bold tracking-tight">Robotina Cooks</span>
      </header>

      {/* Content */}
      <main className="flex-1">
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-secondary">Receta no encontrada</p>
          </div>
        )}

        {recipe && !cookMode && (
          <div className="pb-10">
            {/* Hero image */}
            {recipe.images[0] && (
              <div className="relative w-full aspect-video bg-subtle">
                <Image
                  src={recipe.images[0].url}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="px-5 py-4">
              <h1 className="text-2xl font-semibold text-foreground mb-2">{recipe.name}</h1>
              {recipe.description && (
                <p className="text-sm text-secondary mb-4">{recipe.description}</p>
              )}

              {/* Times */}
              <div className="flex gap-4 mb-6">
                {recipe.prepTime != null && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-secondary">Preparación</span>
                    <span className="text-sm font-semibold text-foreground">{recipe.prepTime} min</span>
                  </div>
                )}
                {recipe.cookTime != null && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-secondary">Cocción</span>
                    <span className="text-sm font-semibold text-foreground">{recipe.cookTime} min</span>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              {recipe.sections.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-2">Ingredientes</h2>
                  <Accordion
                    items={recipe.sections.map((section) => ({
                      title: section.title ?? 'Ingredientes',
                      children: (
                        <ul className="px-5 py-2">
                          {section.ingredients.map((ing) => (
                            <li key={ing.id} className="py-2 border-b border-border last:border-0">
                              <span className="text-sm text-foreground">
                                {ing.quantity != null ? `${ing.quantity} ` : ''}
                                {ing.unitAbbreviation ?? ing.unitName ?? ''}
                                {ing.quantity != null || ing.unitName ? ' ' : ''}
                                {ing.foodName}
                                {ing.note ? ` — ${ing.note}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ),
                    }))}
                  />
                </div>
              )}

              {/* Steps */}
              {recipe.steps.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">Instrucciones</h2>
                  <ol className="flex flex-col gap-4">
                    {recipe.steps.map((step) => (
                      <li key={step.id} className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {step.order}
                        </span>
                        <div className="flex-1">
                          {step.title && <p className="text-sm font-semibold mb-1">{step.title}</p>}
                          <p className="text-sm text-foreground">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Cook mode button */}
              <button
                type="button"
                onClick={() => setCookMode(true)}
                className="w-full bg-foreground text-background rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                aria-label="Modo cocina"
              >
                Modo cocina
              </button>
            </div>
          </div>
        )}

        {recipe && cookMode && (
          <div className="flex flex-col min-h-screen bg-canvas">
            <div className="flex items-center justify-between px-5 py-4 border-b border-background/20">
              <h1 className="text-base font-semibold text-background">{recipe.name}</h1>
              <button
                type="button"
                onClick={() => setCookMode(false)}
                className="text-background/80 text-sm"
              >
                Volver
              </button>
            </div>
            <CookModeView steps={recipe.steps} />
          </div>
        )}
      </main>

      {/* Branding footer */}
      <footer
        data-testid="branding-footer"
        className="bg-subtle px-5 py-4 text-center"
      >
        <p className="text-xs text-secondary">Hecho con Robotina Cooks</p>
      </footer>
    </div>
  );
}
