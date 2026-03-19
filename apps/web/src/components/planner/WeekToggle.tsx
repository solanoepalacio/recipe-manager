'use client';

interface WeekToggleProps {
  value: 1 | 4;
  onChange: (value: 1 | 4) => void;
}

export function WeekToggle({ value, onChange }: WeekToggleProps) {
  return (
    <div className="flex justify-center py-2 px-4">
      <div className="flex bg-subtle rounded-[20px] overflow-hidden">
        <button
          aria-pressed={value === 1}
          onClick={() => onChange(1)}
          className={
            value === 1
              ? 'bg-foreground text-background px-4 py-1.5 text-[13px] rounded-[20px]'
              : 'text-secondary px-4 py-1.5 text-[13px]'
          }
        >
          1 semana
        </button>
        <button
          aria-pressed={value === 4}
          onClick={() => onChange(4)}
          className={
            value === 4
              ? 'bg-foreground text-background px-4 py-1.5 text-[13px] rounded-[20px]'
              : 'text-secondary px-4 py-1.5 text-[13px]'
          }
        >
          4 semanas
        </button>
      </div>
    </div>
  );
}
