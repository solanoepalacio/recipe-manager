'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekNav({ label, onPrev, onNext }: WeekNavProps) {
  return (
    <div className="py-3 px-4 border-b border-border flex items-center justify-between">
      <button
        onClick={onPrev}
        aria-label="Semana anterior"
        className="w-11 h-11 flex items-center justify-center"
      >
        <ChevronLeft size={20} className="text-foreground" />
      </button>
      <span className="text-[15px] font-semibold text-foreground">{label}</span>
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
