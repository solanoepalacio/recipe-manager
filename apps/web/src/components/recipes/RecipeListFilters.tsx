import { Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

interface RecipeListFiltersProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  sortLabel: string;
  onSortClick: () => void;
  filterLabel: string | null;
  onFilterClick: () => void;
  isSortActive: boolean;
  isFilterActive: boolean;
}

export function RecipeListFilters({
  searchValue,
  onSearchChange,
  sortLabel,
  onSortClick,
  filterLabel,
  onFilterClick,
  isSortActive,
  isFilterActive,
}: RecipeListFiltersProps) {
  return (
    <>
      {/* Search bar */}
      <div className="px-5 pb-3">
        <div className="bg-subtle rounded-xl px-4 py-3 flex items-center gap-2">
          <Search size={18} strokeWidth={2} className="text-secondary" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar recetas..."
            className="text-[15px] text-foreground placeholder:text-placeholder bg-transparent border-none outline-none flex-1"
          />
        </div>
      </div>

      {/* Filter actions row */}
      <div className="flex gap-4 px-5 pb-3 pt-1">
        <button
          onClick={onSortClick}
          className={`flex items-center gap-1 text-[13px] font-semibold ${isSortActive ? 'text-foreground' : 'text-secondary'}`}
        >
          <ArrowUpDown size={14} strokeWidth={2} />
          {sortLabel}
        </button>
        <button
          onClick={onFilterClick}
          className={`flex items-center gap-1 text-[13px] font-semibold ${isFilterActive ? 'text-foreground' : 'text-secondary'}`}
        >
          <SlidersHorizontal size={14} strokeWidth={2} />
          {filterLabel ?? 'Filtrar por ingredientes'}
        </button>
      </div>
    </>
  );
}
