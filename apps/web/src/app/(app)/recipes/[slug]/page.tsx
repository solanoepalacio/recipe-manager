'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ExternalLink, CookingPot } from 'lucide-react';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client';
import type { RecipeDetailResponse, UpdateRecipeRequest } from '@recipe-manager/shared';
import { DetailTopBar } from '@/components/recipes/DetailTopBar';
import { SectionAccordion } from '@/components/recipes/SectionAccordion';
import { InfoGrid } from '@/components/recipes/InfoGrid';
import { IngredientList } from '@/components/recipes/IngredientList';
import { InstructionList } from '@/components/recipes/InstructionList';
import { Skeleton } from '@/components/ui/Skeleton';
import { EditorTabs } from '@/components/recipes/editor/EditorTabs';
import { MetadataForm, MetadataFormRef } from '@/components/recipes/editor/MetadataForm';
import { IngredientSectionEditor } from '@/components/recipes/editor/IngredientSectionEditor';
import { StepEditor } from '@/components/recipes/editor/StepEditor';
import { ImageUpload } from '@/components/recipes/editor/ImageUpload';

export default function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('id');
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('Ingredientes');
  const metadataFormRef = useRef<MetadataFormRef>(null);

  // Enter edit mode when ?edit=1 is present on load
  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setIsEditMode(true);
    }
  }, []);

  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: queryKeys.recipes.detail(slug),
    queryFn: () => api.get<RecipeDetailResponse>(`/recipes/${recipeId}`),
    enabled: Boolean(recipeId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRecipeRequest) =>
      api.patch<RecipeDetailResponse>(`/recipes/${recipeId}`, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.recipes.detail(slug), updated);
      toast.success('Guardado');
    },
    onError: () => toast.error('Error al guardar. Intenta de nuevo.'),
  });

  const handleSave = useCallback(() => {
    if (metadataFormRef.current) {
      updateMutation.mutate(metadataFormRef.current.getValues());
    }
  }, [updateMutation]);

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

      {/* Hero image — hidden in edit mode */}
      {!isEditMode && recipe.images.length > 0 && (
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

          {/* Iniciar receta — hidden in edit mode */}
          {!isEditMode && (
            <Link
              href={`/recipes/${slug}/cook?id=${recipeId}`}
              className="bg-foreground text-background rounded-[20px] px-5 py-2 text-[13px] font-semibold flex items-center gap-2"
            >
              <CookingPot size={16} strokeWidth={2} />
              Iniciar receta
            </Link>
          )}

          {/* Edit toggle button */}
          <button
            onClick={() => setIsEditMode((v) => !v)}
            className="border border-border text-foreground rounded-[20px] px-5 py-2 text-[13px] font-semibold"
          >
            {isEditMode ? 'Listo' : 'Editar receta'}
          </button>
        </div>
      </div>

      {/* Edit mode: tab editor */}
      {isEditMode && (
        <>
          <EditorTabs activeTab={activeTab} onTabChange={setActiveTab} isNewRecipe={false} />

          {/* Tab content */}
          {activeTab === 'Ingredientes' && (
            <IngredientSectionEditor
              recipeId={recipeId!}
              sections={recipe.sections}
              onMutationSuccess={() => queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(slug) })}
            />
          )}
          {activeTab === 'Instrucciones' && (
            <StepEditor
              recipeId={recipeId!}
              steps={recipe.steps}
              onMutationSuccess={() => queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(slug) })}
            />
          )}
          {activeTab === 'Básico' && (
            <MetadataForm
              ref={metadataFormRef}
              recipe={recipe}
              onSave={() => {}}
              isSaving={updateMutation.isPending}
            />
          )}
          {activeTab === 'Fotos' && (
            <ImageUpload
              recipeId={recipeId!}
              images={recipe.images}
              onMutationSuccess={() => queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(slug) })}
            />
          )}
          {activeTab === 'Ajustes' && (
            <div className="px-5 py-8 text-center text-[15px] text-secondary">
              Ajustes (Plan 09-05)
            </div>
          )}

          {/* Guardar pill — visible on Básico tab only */}
          {activeTab === 'Básico' && (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="fixed bottom-8 right-5 z-30 bg-foreground text-background rounded-full px-6 py-3 text-[15px] font-semibold shadow-md disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </>
      )}

      {/* View mode: accordion sections */}
      {!isEditMode && (
        <>
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
        </>
      )}
    </div>
  );
}
