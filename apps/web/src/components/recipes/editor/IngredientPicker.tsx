'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check } from 'lucide-react';

import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client';
import { useDebounce } from '@/hooks/useDebounce';
import type { CreateIngredientRequest } from '@recipe-manager/shared';

interface Food {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

interface IngredientPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ingredient: CreateIngredientRequest) => void;
  recipeId: string;
}

export function IngredientPicker({ isOpen, onClose, onAdd }: IngredientPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unitId, setUnitId] = useState('');
  const [note, setNote] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 200);

  const { data: foods } = useQuery({
    queryKey: queryKeys.foods.list(),
    queryFn: () => api.get<Food[]>('/foods'),
    enabled: isOpen,
  });

  const { data: units } = useQuery({
    queryKey: queryKeys.units.list(),
    queryFn: () => api.get<Unit[]>('/units'),
    enabled: isOpen,
  });

  const filteredFoods = foods?.filter((f) =>
    f.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) ?? [];

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedFoodId(null);
      setQuantity('');
      setUnitId('');
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleConfirm() {
    if (!selectedFoodId) return;
    onAdd({
      foodId: selectedFoodId,
      unitId: unitId || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      note: note || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-background px-5 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-[15px] text-secondary"
        >
          Cancelar
        </button>
        <span className="text-[15px] font-semibold text-foreground">
          Seleccionar alimento
        </span>
        {/* Spacer to balance layout */}
        <span className="text-[15px] text-secondary opacity-0 pointer-events-none">
          Cancelar
        </span>
      </div>

      {/* Search bar */}
      <div className="bg-subtle rounded-xl px-4 py-3 mx-5 mt-2 flex items-center gap-2">
        <Search size={18} className="text-secondary flex-shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar alimentos..."
          autoFocus
          className="bg-transparent text-[15px] text-foreground flex-1 outline-none placeholder:text-placeholder"
        />
      </div>

      {/* Food list */}
      <div className="flex-1 overflow-y-auto mt-2">
        {filteredFoods.map((food) => (
          <button
            key={food.id}
            onClick={() => setSelectedFoodId(food.id)}
            className="w-full px-5 py-3 border-b border-subtle flex items-center justify-between text-left"
          >
            <span className="text-[15px] text-foreground">{food.name}</span>
            {selectedFoodId === food.id && (
              <Check size={16} className="text-accent flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Quantity / unit / note panel (shown when food selected) */}
      {selectedFoodId && (
        <div className="px-5 py-4 border-t border-subtle flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {/* Quantity */}
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Cant."
              className="w-20 border-b border-border pb-2 text-[15px] text-foreground bg-transparent outline-none placeholder:text-placeholder"
            />

            {/* Unit */}
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="border border-border rounded-[8px] px-3 py-2 text-[15px] text-foreground bg-background outline-none flex-1"
            >
              <option value="">Sin unidad</option>
              {units?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.abbreviation})
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota opcional"
            className="border-b border-border pb-2 text-[15px] text-foreground bg-transparent outline-none placeholder:text-placeholder w-full"
          />
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedFoodId}
        className="bg-foreground text-background rounded-[12px] w-[calc(100%-40px)] py-4 text-[15px] font-semibold mx-5 mb-6 disabled:opacity-40"
      >
        Añadir ingrediente
      </button>
    </div>
  );
}
