interface InfoGridProps {
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  servingsQty: number | null;
  servingsUnit: string | null;
}

function formatTime(minutes: number | null): string {
  if (minutes === null) return '\u2014';
  return `${minutes} min`;
}

function formatServings(qty: number | null, unit: string | null): string {
  if (qty === null) return '\u2014';
  return unit ? `${qty} ${unit}` : `${qty}`;
}

export function InfoGrid({ prepTime, cookTime, totalTime, servingsQty, servingsUnit }: InfoGridProps) {
  const cells = [
    { label: 'Preparación', value: formatTime(prepTime) },
    { label: 'Cocción', value: formatTime(cookTime) },
    { label: 'Total', value: formatTime(totalTime) },
    { label: 'Porciones', value: formatServings(servingsQty, servingsUnit) },
  ];

  return (
    <div className="flex px-5 py-3 border-b border-subtle">
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className={`flex-1 text-center${i < 3 ? ' border-r border-border' : ''}`}
        >
          <div className="text-[13px] font-semibold text-secondary mb-1">{cell.label}</div>
          <div className="text-[15px] font-semibold text-foreground">{cell.value}</div>
        </div>
      ))}
    </div>
  );
}
