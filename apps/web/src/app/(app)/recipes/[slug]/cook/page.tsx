'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client';
import type { RecipeDetailResponse } from '@recipe-manager/shared';
import { CookStep } from '@/components/recipes/CookStep';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CookModePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('id');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const cookModeTracked = useRef(false);

  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: queryKeys.recipes.detail(slug),
    queryFn: () => api.get<RecipeDetailResponse>(`/recipes/${recipeId}`),
    enabled: Boolean(recipeId),
  });

  useEffect(() => {
    if (recipe && !cookModeTracked.current) {
      cookModeTracked.current = true;
      window.umami?.track('cook-mode-start', { recipeId: recipe.id, recipeName: recipe.name });
    }
  }, [recipe]);

  const steps = recipe?.steps ?? [];
  const isComplete = currentStep >= steps.length && steps.length > 0;
  const markDone = () => setCurrentStep((i) => Math.min(i + 1, steps.length));

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center bg-background border-b border-border px-5 py-3">
        <button
          onClick={() => router.back()}
          className="text-[13px] text-secondary tracking-[-0.1px]"
        >
          × Salir
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-foreground tracking-[-0.2px] truncate px-3">
          {recipe?.name ?? ''}
        </span>
        <span className="w-[52px]" />
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto py-2 relative">
        {isLoading && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-5 border-b border-subtle items-start">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </>
        )}

        {!isLoading && (isError || !recipeId) && (
          <div className="flex-1 flex flex-col items-center justify-center px-5 mt-20">
            <p className="text-[15px] text-secondary text-center">
              Receta no encontrada. Vuelve a la lista de recetas.
            </p>
            <Link
              href="/recipes"
              className="text-[13px] text-accent font-semibold mt-4"
            >
              Ir a recetas
            </Link>
          </div>
        )}

        {!isLoading && !isError && recipeId && isComplete && (
          <div className="flex flex-col items-center justify-center px-5 mt-20">
            <p className="text-[20px] font-semibold text-foreground mb-2">¡Listo!</p>
            <p className="text-[15px] text-secondary mb-6">
              Has completado todos los pasos.
            </p>
            <button
              onClick={() => router.back()}
              className="bg-foreground text-background rounded-[20px] px-5 py-2 text-[13px] font-semibold"
            >
              Volver a la receta
            </button>
          </div>
        )}

        {!isLoading && !isError && recipeId && !isComplete && steps.length > 0 && (
          <>
            {/* Done steps */}
            {steps.slice(0, currentStep).map((step, i) => (
              <CookStep key={step.id} step={step} stepNumber={i + 1} status="done" />
            ))}

            {/* Divider between done and pending */}
            {currentStep > 0 && <div className="h-px bg-border" />}

            {/* Current and pending steps */}
            {steps.slice(currentStep).map((step, i) => (
              <CookStep
                key={step.id}
                step={step}
                stepNumber={currentStep + i + 1}
                status={i === 0 ? 'current' : 'pending'}
                onDone={i === 0 ? markDone : undefined}
              />
            ))}
          </>
        )}

        {/* Bottom fade gradient */}
        <div className="sticky bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
