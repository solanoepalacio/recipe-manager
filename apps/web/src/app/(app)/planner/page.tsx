'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MealPlanResponse, MealPlanEntryResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import {
  getWeekRange,
  getMonthRange,
  formatWeekLabel,
  isToday,
} from '@/lib/planner-dates';
import { WeekNav } from '@/components/planner/WeekNav';
import { WeekToggle } from '@/components/planner/WeekToggle';
import { DayAccordion } from '@/components/planner/DayAccordion';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

// Suppress unused import warning — isToday used for initial expandedDays logic below
void isToday;

export default function PlannerPage() {
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<1 | 4>(1);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    () => new Set([new Date().toISOString().slice(0, 10)])
  );
  const [pickerDate, setPickerDate] = useState<string | null>(null);

  // Suppress unused variable warning — pickerDate wired in Plan 10-02
  void pickerDate;

  const range = useMemo(() => {
    if (viewMode === 1) {
      return getWeekRange(anchor);
    }
    return getMonthRange(anchor);
  }, [anchor, viewMode]);

  const allDays = useMemo(() => {
    if (viewMode === 1) return (range as ReturnType<typeof getWeekRange>).days;
    return (range as ReturnType<typeof getMonthRange>).weeks.flatMap((w) => w.days);
  }, [range, viewMode]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.mealPlan.week(range.from, range.to),
    queryFn: () => api.get<MealPlanResponse>(`/meal-plan?from=${range.from}&to=${range.to}`),
  });

  const entriesByDate = useMemo(() => {
    const map: Record<string, MealPlanEntryResponse[]> = {};
    data?.entries.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [data]);

  const handlePrev = useCallback(() => {
    setAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - (viewMode === 1 ? 7 : 28));
      return d;
    });
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (viewMode === 1 ? 7 : 28));
      return d;
    });
  }, [viewMode]);

  const toggleDay = useCallback((date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }, []);

  const queryClient = useQueryClient();
  const weekKey = queryKeys.mealPlan.week(range.from, range.to);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/meal-plan/entries/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: weekKey });
      const snapshot = queryClient.getQueryData<MealPlanResponse>(weekKey);
      queryClient.setQueryData<MealPlanResponse>(weekKey, (old) => ({
        entries: (old?.entries ?? []).filter((e) => e.id !== id),
      }));
      return { snapshot };
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(weekKey, ctx.snapshot);
      toast.error('No se pudo eliminar la entrada. Intentalo de nuevo.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: weekKey }),
    onSuccess: () => toast.success('Entrada eliminada.'),
  });

  return (
    <div>
      {/* Week toggle */}
      <WeekToggle value={viewMode} onChange={setViewMode} />

      {viewMode === 1 ? (
        <>
          <WeekNav
            label={formatWeekLabel(range.from, range.to)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          {isLoading ? (
            <div className="flex flex-col gap-1 px-4 py-2">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-[52px] w-full rounded-[8px]" />
              ))}
            </div>
          ) : (
            allDays.map((day) => (
              <DayAccordion
                key={day}
                date={day}
                entries={entriesByDate[day] ?? []}
                isExpanded={expandedDays.has(day)}
                onToggle={() => toggleDay(day)}
                onAddEntry={() => setPickerDate(day)}
                onDeleteEntry={(id) => deleteMutation.mutate(id)}
                onEditEntry={() => {
                  /* wired in Plan 10-03 */
                }}
              />
            ))
          )}
        </>
      ) : (
        <>
          <WeekNav
            label={formatWeekLabel(range.from, range.to)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          {isLoading ? (
            <div className="flex flex-col gap-1 px-4 py-2">
              {Array.from({ length: 28 }, (_, i) => (
                <Skeleton key={i} className="h-[52px] w-full rounded-[8px]" />
              ))}
            </div>
          ) : (
            (range as ReturnType<typeof getMonthRange>).weeks.map((week, wi) => (
              <div key={week.from}>
                {wi > 0 && (
                  <div className="py-2 px-4 text-[13px] font-semibold text-secondary border-b border-border">
                    {formatWeekLabel(week.from, week.to)}
                  </div>
                )}
                {week.days.map((day) => (
                  <DayAccordion
                    key={day}
                    date={day}
                    entries={entriesByDate[day] ?? []}
                    isExpanded={expandedDays.has(day)}
                    onToggle={() => toggleDay(day)}
                    onAddEntry={() => setPickerDate(day)}
                    onDeleteEntry={(id) => deleteMutation.mutate(id)}
                    onEditEntry={() => {
                      /* wired in Plan 10-03 */
                    }}
                  />
                ))}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
