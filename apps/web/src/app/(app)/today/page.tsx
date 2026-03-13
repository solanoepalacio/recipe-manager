'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { MealPlanResponse, MealPlanEntryResponse } from '@recipe-manager/shared';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda',
  dessert: 'Postre',
};

export default function TodayPage() {
  const { user } = useAuth();
  const today = getTodayDate();

  const { data } = useQuery({
    queryKey: queryKeys.mealPlan.range(today, today),
    queryFn: () => api.get<MealPlanResponse>(`/api/meal-plan?from=${today}&to=${today}`),
  });

  const entries: MealPlanEntryResponse[] = data?.entries ?? [];

  return (
    <div className="px-5 py-6">
      {/* Greeting */}
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        ¡Hola, {user?.name ?? ''}!
      </h2>

      {/* Stat boxes placeholder */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Recetas', value: '0' },
          { label: 'Esta semana', value: '0' },
          { label: 'Favoritas', value: '0' },
        ].map((stat) => (
          <div
            key={stat.label}
            data-testid="stat-box"
            className="bg-subtle rounded-xl p-3 flex flex-col items-center"
          >
            <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            <span className="text-xs text-secondary mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Today's recipes */}
      <h3 className="text-base font-semibold text-foreground mb-3">
        Recetas de hoy
      </h3>

      {entries.length === 0 ? (
        <p className="text-sm text-secondary">No hay recetas para hoy</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 bg-subtle rounded-xl px-4 py-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{entry.recipeName}</p>
                <p className="text-xs text-secondary">
                  {MEAL_TYPE_LABELS[entry.mealType] ?? entry.mealType}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
