'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RecipeListItem, RecipeQueryParams, PaginatedResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useDebounce } from '@/hooks/useDebounce';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeListFilters } from '@/components/recipes/RecipeListFilters';
import { PaginationControls } from '@/components/recipes/PaginationControls';
import { Skeleton } from '@/components/ui/Skeleton';

// Sort options
const SORT_OPTIONS = [
  { label: 'Nombre A–Z', value: 'name-asc' },
  { label: 'Nombre Z–A', value: 'name-desc' },
  { label: 'Más recientes', value: 'updatedAt-desc' },
  { label: 'Más antiguos', value: 'updatedAt-asc' },
  { label: 'Aleatorio', value: 'random' },
];

function buildQueryString(params: RecipeQueryParams): string {
  const p = new URLSearchParams();
  if (params.search) p.set('search', params.search);
  if (params.foodId) p.set('foodId', params.foodId);
  if (params.sort) p.set('sort', params.sort);
  if (params.order) p.set('order', params.order);
  if (params.page !== undefined) p.set('page', String(params.page));
  if (params.pageSize !== undefined) p.set('pageSize', String(params.pageSize));
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

function parseSortOption(sortOption: string): { sort: RecipeQueryParams['sort']; order: RecipeQueryParams['order'] } {
  if (sortOption === 'random') {
    return { sort: 'random', order: undefined };
  }
  const lastDash = sortOption.lastIndexOf('-');
  const sort = sortOption.slice(0, lastDash) as RecipeQueryParams['sort'];
  const order = sortOption.slice(lastDash + 1) as RecipeQueryParams['order'];
  return { sort, order };
}

export default function RecipeListPage() {
  // State
  const [searchInput, setSearchInput] = useState('');
  const [sortOption, setSortOption] = useState('updatedAt-desc');
  const [foodId, setFoodId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFoodFilter, setShowFoodFilter] = useState(false);
  const [randomSeed, setRandomSeed] = useState(() => Date.now());

  // Derived values
  const debouncedSearch = useDebounce(searchInput, 300);
  const { sort, order } = parseSortOption(sortOption);

  const queryParams: RecipeQueryParams = {
    search: debouncedSearch || undefined,
    foodId: foodId || undefined,
    sort,
    order,
    page,
    pageSize,
  };

  // Reset page to 1 when search, sort, or food filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortOption, foodId]);

  // Queries
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.recipes.list({
      ...queryParams,
      _seed: sort === 'random' ? randomSeed : undefined,
    }),
    queryFn: () =>
      api.get<PaginatedResponse<RecipeListItem>>(`/recipes${buildQueryString(queryParams)}`),
  });

  const { data: foods } = useQuery({
    queryKey: queryKeys.foods.list(),
    queryFn: () => api.get<{ id: string; name: string }[]>('/foods'),
  });

  // Derived UI state
  const isFilterActive = foodId !== null;
  const isSortActive = sortOption !== 'updatedAt-desc';
  const selectedFood = foods?.find((f) => f.id === foodId);
  const filterLabel = selectedFood ? selectedFood.name : null;
  const sortLabel = 'Ordenar';

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 1;
  const hasFilters = !!debouncedSearch || isFilterActive;

  function handleSortSelect(value: string) {
    setSortOption(value);
    if (value === 'random') {
      setRandomSeed(Date.now());
    }
    setShowSortDropdown(false);
  }

  function handleFoodSelect(id: string | null) {
    setFoodId(id);
    setShowFoodFilter(false);
  }

  function closeDropdowns() {
    setShowSortDropdown(false);
    setShowFoodFilter(false);
  }

  return (
    <div className="bg-background pb-20 relative">
      {/* Backdrop — closes any open dropdown */}
      {(showSortDropdown || showFoodFilter) && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeDropdowns}
          aria-hidden="true"
        />
      )}

      {/* Search bar + filter actions */}
      <RecipeListFilters
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        sortLabel={sortLabel}
        onSortClick={() => {
          setShowSortDropdown((v) => !v);
          setShowFoodFilter(false);
        }}
        filterLabel={filterLabel}
        onFilterClick={() => {
          setShowFoodFilter((v) => !v);
          setShowSortDropdown(false);
        }}
        isSortActive={isSortActive}
        isFilterActive={isFilterActive}
      />

      {/* Sort dropdown */}
      {showSortDropdown && (
        <div className="absolute left-5 right-5 z-50 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortSelect(opt.value)}
              className={`w-full text-left px-5 py-3 text-[13px] text-foreground ${
                sortOption === opt.value ? 'font-semibold bg-subtle' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Food filter dropdown */}
      {showFoodFilter && (
        <div className="absolute left-5 right-5 z-50 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => handleFoodSelect(null)}
            className={`w-full text-left px-5 py-3 text-[13px] text-foreground ${
              foodId === null ? 'font-semibold bg-subtle' : ''
            }`}
          >
            Todos los ingredientes
          </button>
          {foods?.map((food) => (
            <button
              key={food.id}
              onClick={() => handleFoodSelect(food.id)}
              className={`w-full text-left px-5 py-3 text-[13px] text-foreground ${
                foodId === food.id ? 'font-semibold bg-subtle' : ''
              }`}
            >
              {food.name}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <div className="px-5">
        {isLoading && (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 py-[10px] border-b border-subtle">
                <Skeleton className="w-[72px] h-[68px] rounded-[10px]" />
                <div className="flex flex-col gap-2 flex-1 justify-center">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </>
        )}

        {isError && (
          <p className="text-center text-[15px] text-secondary py-8">
            No se pudieron cargar las recetas. Comprueba tu conexión e intenta de nuevo.
          </p>
        )}

        {!isLoading && !isError && data && data.items.length === 0 && (
          <div className="py-8 text-center">
            {hasFilters ? (
              <>
                <p className="text-[15px] font-semibold text-foreground mb-2">Sin resultados</p>
                <p className="text-[13px] text-secondary">
                  No encontramos recetas con esos criterios. Prueba con otra búsqueda o quita los filtros.
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-foreground mb-2">Sin recetas aún</p>
                <p className="text-[13px] text-secondary">
                  Tu hogar no tiene recetas todavía. Toca el botón + para crear la primera.
                </p>
              </>
            )}
          </div>
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <>
            {data.items.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && data && data.total > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
