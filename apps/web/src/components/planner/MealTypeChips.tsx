'use client';

import { MealType } from '@recipe-manager/shared';
import { MEAL_TYPE_LABELS } from '@/lib/planner-dates';

interface MealTypeChipsProps {
  selected: MealType;
  onChange: (type: MealType) => void;
}

export function MealTypeChips({ selected, onChange }: MealTypeChipsProps) {
  return (
    <div role="group" aria-label="Tipo de comida" className="flex gap-2 overflow-x-auto px-4 py-2">
      {Object.values(MealType).map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={
            selected === type
              ? 'bg-foreground text-background rounded-[16px] px-3 py-1 text-[12px] uppercase tracking-widest whitespace-nowrap'
              : 'border border-border text-secondary rounded-[16px] px-3 py-1 text-[12px] uppercase tracking-widest whitespace-nowrap'
          }
        >
          {MEAL_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}
