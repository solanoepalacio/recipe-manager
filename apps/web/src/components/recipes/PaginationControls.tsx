interface PaginationControlsProps {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationControls({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
}: PaginationControlsProps) {
  const sizes = pageSizeOptions ?? [10, 20, 50];
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="flex items-center justify-between px-5 py-4">
      {/* Prev button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={isFirst}
        className={`flex items-center gap-1 text-[13px] font-semibold ${isFirst ? 'text-placeholder cursor-not-allowed' : 'text-secondary'}`}
      >
        ← Anterior
      </button>

      {/* Page indicator */}
      <span className="text-[13px] text-secondary">
        Página {page} de {totalPages}
      </span>

      {/* Next button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={isLast}
        className={`flex items-center gap-1 text-[13px] font-semibold ${isLast ? 'text-placeholder cursor-not-allowed' : 'text-secondary'}`}
      >
        Siguiente →
      </button>

      {/* Page size selector */}
      <div className="flex items-center gap-1 text-[13px] text-secondary">
        <label htmlFor="page-size">Por página:</label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="text-[13px] text-secondary bg-transparent border-none outline-none"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
