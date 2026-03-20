'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MealPlanResponse, MealPlanEntryResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { localDateString, MEAL_TYPE_LABELS } from '@/lib/planner-dates';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

export default function HoyPage() {
  const { user } = useAuth();
  const today = useMemo(() => localDateString(new Date()), []);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.mealPlan.today(today),
    queryFn: () => api.get<MealPlanResponse>(`/meal-plan?from=${today}&to=${today}`),
  });

  const todayEntries: MealPlanEntryResponse[] = useMemo(
    () => data?.entries.filter((e) => e.date === today) ?? [],
    [data, today]
  );

  return (
    <div className="py-6 px-0">
      {/* Greeting */}
      <p className="text-[22px] font-semibold text-foreground px-5 pb-6" style={{ letterSpacing: '-0.3px' }}>
        Hola{user?.name ? `, ${user.name}` : ''} 👋
      </p>

      {/* Recetas de hoy */}
      <p className="text-[14px] font-semibold text-foreground px-5 pb-2">Recetas de hoy</p>
      <div className="h-px bg-border mx-5 mb-1" />

      {isLoading ? (
        <div className="flex flex-col gap-2 px-5 py-2">
          <Skeleton className="h-[48px] w-full rounded-[8px]" />
          <Skeleton className="h-[48px] w-full rounded-[8px]" />
        </div>
      ) : todayEntries.length === 0 ? (
        <p className="text-[14px] text-placeholder italic px-5 py-3">No hay recetas para hoy</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {todayEntries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-[12px] text-secondary bg-subtle rounded-full px-2 py-0.5 shrink-0">
                {MEAL_TYPE_LABELS[entry.mealType]}
              </span>
              <Link
                href={`/recipes/${entry.recipeSlug}?id=${entry.recipeId}`}
                className="text-[14px] font-medium text-foreground hover:text-accent transition-colors truncate"
              >
                {entry.recipeName}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Tu actividad */}
      <p className="text-[14px] font-semibold text-foreground px-5 pt-4 pb-2">Tu actividad</p>
      <div className="h-px bg-border mx-5 mb-3" />
      <div className="flex gap-2.5 px-5">
        <div className="flex-1 bg-subtle rounded-[12px] p-4">
          <p className="text-[24px] font-bold text-foreground leading-none">—</p>
          <p className="text-[13px] text-secondary mt-1 leading-snug">recetas cocinadas este mes</p>
        </div>
        <div className="flex-1 bg-subtle rounded-[12px] p-4">
          <p className="text-[24px] font-bold text-foreground leading-none">—</p>
          <p className="text-[13px] text-secondary mt-1 leading-snug">recetas guardadas</p>
        </div>
      </div>
      <p className="text-[11px] text-placeholder italic px-5 pt-3">Próximamente: más estadísticas</p>
    </div>
  );
}
