'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onLabelClick: () => void;
}

export function WeekNav({ label, onPrev, onNext, onLabelClick }: WeekNavProps) {
  return (
    <div className="py-3 px-4 border-b border-border flex items-center justify-between">
      <button
        onClick={onPrev}
        aria-label="Semana anterior"
        className="w-11 h-11 flex items-center justify-center"
      >
        <ChevronLeft size={20} className="text-foreground" />
      </button>
      <button
        onClick={onLabelClick}
        className="text-[15px] font-semibold text-foreground underline decoration-dotted decoration-secondary underline-offset-4 bg-transparent border-0 p-0 cursor-pointer"
      >
        {label}
      </button>
      <button
        onClick={onNext}
        aria-label="Semana siguiente"
        className="w-11 h-11 flex items-center justify-center"
      >
        <ChevronRight size={20} className="text-foreground" />
      </button>
    </div>
  );
}
