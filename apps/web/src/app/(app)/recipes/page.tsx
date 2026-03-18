'use client';
import { Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

// Recipe list — populated in Phase 8
export default function RecipeListPage() {
  return (
    <>
      {/* Search + filter row */}
      <div className="px-4 pt-2 pb-0">
        <div className="bg-subtle rounded-[12px] py-3 px-4 flex items-center gap-2">
          <Search size={18} strokeWidth={2} className="text-secondary shrink-0" />
          <span className="text-[15px] text-placeholder">Buscar recetas...</span>
        </div>
      </div>
      <div className="px-4 pb-3 pt-1 flex gap-4">
        <button className="flex items-center gap-1 text-[13px] text-secondary">
          <ArrowUpDown size={14} strokeWidth={2} />
          <span>Ordenar recetas</span>
        </button>
        <button className="flex items-center gap-1 text-[13px] text-secondary">
          <SlidersHorizontal size={14} strokeWidth={2} />
          <span>Filtrar por ingredientes</span>
        </button>
      </div>

      {/* Empty state */}
      <div className="py-4">
        <p className="text-center text-[15px] text-secondary py-8">Sin recetas aún</p>
        <p className="text-center text-[13px] text-placeholder">Crea tu primera receta con el botón +</p>
      </div>
    </>
  );
}
