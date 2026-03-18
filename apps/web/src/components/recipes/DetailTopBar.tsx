import { ArrowLeft, EllipsisVertical } from 'lucide-react';

interface DetailTopBarProps {
  recipeName: string;
  onBack: () => void;
}

export function DetailTopBar({ recipeName, onBack }: DetailTopBarProps) {
  return (
    <div className="flex items-center bg-sand px-5 py-3">
      <button onClick={onBack} aria-label="Volver" className="flex-shrink-0">
        <ArrowLeft size={22} strokeWidth={2} className="text-foreground" />
      </button>
      <span className="flex-1 text-center text-[15px] font-semibold text-foreground tracking-[-0.2px] truncate px-3">
        {recipeName}
      </span>
      <button aria-label="Mas opciones" className="flex-shrink-0">
        <EllipsisVertical size={20} strokeWidth={2} className="text-foreground" />
      </button>
    </div>
  );
}
