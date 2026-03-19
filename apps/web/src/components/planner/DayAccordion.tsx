'use client';

import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { MealPlanEntryResponse } from '@recipe-manager/shared';
import { formatDayHeader } from '@/lib/planner-dates';
import { MealEntryRow } from './MealEntryRow';

interface DayAccordionProps {
  date: string;
  entries: MealPlanEntryResponse[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddEntry: () => void;
  onDeleteEntry: (id: string) => void;
  onEditEntry: (entry: MealPlanEntryResponse) => void;
}

export function DayAccordion({
  date,
  entries,
  isExpanded,
  onToggle,
  onAddEntry,
  onDeleteEntry,
  onEditEntry,
}: DayAccordionProps) {
  const { dayName, dateLabel } = formatDayHeader(date);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `day-${date}`,
  });

  if (!isExpanded) {
    return (
      <div
        ref={setDroppableRef}
        className={`py-3 px-4 border-b border-subtle cursor-pointer ${isOver ? 'bg-accent/5' : ''}`}
        onClick={onToggle}
        aria-expanded={false}
      >
        <div className="flex items-center gap-1 min-w-0">
          <ChevronRight size={16} className="shrink-0 text-secondary" />
          <span className="text-[15px] font-semibold text-foreground shrink-0 whitespace-nowrap">{dayName}</span>
          <span className="text-[13px] text-secondary shrink-0 whitespace-nowrap">{dateLabel}</span>
          <span className="text-[13px] text-secondary ml-2 truncate min-w-0">
            {entries.length > 0 ? (
              entries.map((e) => e.recipeName).join(', ')
            ) : (
              <em className="text-placeholder">Sin recetas planificadas</em>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={setDroppableRef} className={isOver ? 'bg-accent/5' : ''}>
      <div
        className="py-3 px-4 bg-subtle border-b border-subtle cursor-pointer flex items-center gap-1"
        onClick={onToggle}
        aria-expanded={true}
      >
        <ChevronDown size={16} className="text-secondary" />
        <span className="text-[15px] font-semibold text-foreground">{dayName}</span>
        <span className="text-[13px] text-secondary">{dateLabel}</span>
      </div>
      <div className={isOver ? 'border-l-2 border-accent' : ''}>
        {entries.length === 0 ? (
          <p className="py-3 px-4 text-[13px] italic text-placeholder">Sin recetas planificadas</p>
        ) : (
          entries.map((entry) => (
            <MealEntryRow
              key={entry.id}
              entry={entry}
              onDelete={onDeleteEntry}
              onEdit={onEditEntry}
            />
          ))
        )}
        <button
          onClick={onAddEntry}
          className="py-3 px-5 flex items-center gap-1 text-accent text-[15px] w-full"
        >
          <Plus size={16} />
          Agregar receta
        </button>
      </div>
    </div>
  );
}
