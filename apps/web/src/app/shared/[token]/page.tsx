'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Utensils } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { RecipeDetailResponse } from '@recipe-manager/shared';
import { SectionAccordion } from '@/components/recipes/SectionAccordion';
import { InfoGrid } from '@/components/recipes/InfoGrid';
import { IngredientList } from '@/components/recipes/IngredientList';
import { InstructionList } from '@/components/recipes/InstructionList';

export default function SharedRecipePage() {
  const { token } = useParams<{ token: string }>();
  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: ['shared', token],
    queryFn: () => api.get<RecipeDetailResponse>(`/shared/${token}`),
    enabled: Boolean(token),
  });

  return (
    <div>
      {/* Minimal header strip */}
      <div className="bg-sand px-5 py-4 flex items-center gap-2" aria-label="Robotina Cooks">
        <Utensils size={16} className="text-accent" />
        <span className="text-[15px] font-semibold text-foreground">Robotina Cooks</span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="px-5 py-6 space-y-4 animate-pulse">
          <div className="h-[20px] bg-subtle rounded-lg w-1/2" />
          <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
          <div className="h-[20px] bg-subtle rounded-lg w-2/3" />
        </div>
      )}

      {/* Error / invalid token state */}
      {isError && (
        <div className="flex items-center justify-center py-16 px-5">
          <p className="text-[15px] text-secondary text-center">
            Este enlace no es valido o ha expirado.
          </p>
        </div>
      )}

      {/* Recipe detail — read only */}
      {recipe && (
        <>
          {/* Hero image */}
          {recipe.images.length > 0 && (
            <div className="w-full h-[220px] relative">
              <Image
                src={recipe.images[0].url}
                alt={recipe.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Recipe name */}
          <h1 className="text-[20px] font-semibold text-foreground tracking-[-0.3px] px-5 pt-4 pb-3">
            {recipe.name}
          </h1>

          {/* Info grid */}
          <SectionAccordion title="Informacion">
            <InfoGrid
              prepTime={recipe.prepTime}
              cookTime={recipe.cookTime}
              totalTime={recipe.totalTime}
              servingsQty={recipe.servingsQty}
              servingsUnit={recipe.servingsUnit}
            />
          </SectionAccordion>

          {/* Ingredients */}
          <SectionAccordion title="Ingredientes">
            <IngredientList sections={recipe.sections} />
          </SectionAccordion>

          {/* Instructions */}
          <SectionAccordion title="Instrucciones">
            <InstructionList steps={recipe.steps} />
          </SectionAccordion>

          {/* Footer note */}
          <p className="text-[13px] text-secondary italic text-center py-6 px-5">
            Compartido desde Robotina Cooks
          </p>
        </>
      )}
    </div>
  );
}
