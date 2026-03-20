import { useState } from 'react';
import { ArrowLeft, EllipsisVertical, Trash2, Loader2 } from 'lucide-react';

interface DetailTopBarProps {
  recipeName: string;
  onBack: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function DetailTopBar({ recipeName, onBack, onDelete, isDeleting }: DetailTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center bg-sand px-5 py-3">
      <button onClick={onBack} aria-label="Volver" className="flex-shrink-0">
        <ArrowLeft size={22} strokeWidth={2} className="text-foreground" />
      </button>
      <span className="flex-1 text-center text-[15px] font-semibold text-foreground tracking-[-0.2px] truncate px-3">
        {recipeName}
      </span>
      <div className="relative flex-shrink-0">
        <button
          aria-label="Mas opciones"
          onClick={() => onDelete && setMenuOpen((v) => !v)}
        >
          <EllipsisVertical size={20} strokeWidth={2} className="text-foreground" />
        </button>
        {menuOpen && onDelete && (
          <>
            {/* Backdrop to close menu on outside click */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-[8px] shadow-md py-1 min-w-[160px] z-50">
              <button
                className="flex items-center gap-2 px-4 py-2.5 text-[15px] text-destructive font-semibold w-full"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
