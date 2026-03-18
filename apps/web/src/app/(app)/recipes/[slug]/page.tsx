'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ExternalLink, CookingPot } from 'lucide-react';

import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client';
import type { RecipeDetailResponse } from '@recipe-manager/shared';
import { DetailTopBar } from '@/components/recipes/DetailTopBar';
import { SectionAccordion } from '@/components/recipes/SectionAccordion';
import { InfoGrid } from '@/components/recipes/InfoGrid';
import { IngredientList } from '@/components/recipes/IngredientList';
import { InstructionList } from '@/components/recipes/InstructionList';
import { Skeleton } from '@/components/ui/Skeleton';

export default function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('id');
  const router = useRouter();

  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: queryKeys.recipes.detail(slug),
    queryFn: () => api.get<RecipeDetailResponse>(`/recipes/${recipeId}`),
    enabled: Boolean(recipeId),
  });

  // No recipeId in query params — show navigation error
  if (!recipeId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <p className="text-[15px] text-secondary text-center">
          Receta no encontrada. Vuelve a la{' '}
          <Link href="/recipes" className="text-accent underline">
            lista de recetas
          </Link>
          .
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <DetailTopBar recipeName="" onBack={() => router.back()} />
        <div className="px-5 pt-4 pb-3 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="px-5 space-y-2 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[48px] rounded-lg" />
          ))}
        </div>
      </>
    );
  }

  // Error state
  if (isError || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <p className="text-[15px] text-secondary text-center">
          No se pudo cargar esta receta. Comprueba tu conexion e intenta de nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Detail top bar */}
      <DetailTopBar recipeName={recipe.name} onBack={() => router.back()} />

      {/* Hero image */}
      {recipe.images.length > 0 && (
        <div className="w-full h-[220px]">
          <img
            src={recipe.images[0].url}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Sticky recipe header */}
      <div className="sticky top-0 z-10 bg-background px-5 pt-4 pb-3">
        <h1 className="text-[20px] font-semibold text-foreground tracking-[-0.3px] mb-3">
          {recipe.name}
        </h1>
        <div className="flex items-center justify-between">
          {/* Share */}
          <button className="flex items-center gap-1 text-[13px] font-semibold text-accent">
            <ExternalLink size={14} strokeWidth={2} />
            Compartir
          </button>

          {/* Iniciar receta */}
          <Link
            href={`/recipes/${slug}/cook?id=${recipeId}`}
            className="bg-foreground text-background rounded-[20px] px-5 py-2 text-[13px] font-semibold flex items-center gap-2"
          >
            <CookingPot size={16} strokeWidth={2} />
            Iniciar receta
          </Link>

          {/* Editar receta — disabled placeholder for Phase 9 */}
          <span className="border border-subtle text-placeholder rounded-[20px] px-5 py-2 text-[13px] font-semibold cursor-not-allowed">
            Editar receta
          </span>
        </div>
      </div>

      {/* Accordion sections */}
      <SectionAccordion title="Información">
        <InfoGrid
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          totalTime={recipe.totalTime}
          servingsQty={recipe.servingsQty}
          servingsUnit={recipe.servingsUnit}
        />
      </SectionAccordion>

      <SectionAccordion title="Ingredientes">
        <IngredientList sections={recipe.sections} />
      </SectionAccordion>

      <SectionAccordion title="Instrucciones">
        <InstructionList steps={recipe.steps} />
      </SectionAccordion>
    </div>
  );
}
