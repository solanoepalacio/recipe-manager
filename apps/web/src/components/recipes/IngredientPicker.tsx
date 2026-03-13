'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type {
  FoodListResponse,
  FoodResponse,
  UnitListResponse,
  CreateIngredientRequest,
  RecipeIngredientResponse,
} from '@recipe-manager/shared';

export interface IngredientPickerProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  sectionId: string;
  onAdded: (ingredient: RecipeIngredientResponse) => void;
}

export function IngredientPicker({
  isOpen,
  onClose,
  recipeId,
  sectionId,
  onAdded,
}: IngredientPickerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodResponse | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unitId, setUnitId] = useState('');
  const [note, setNote] = useState('');

  const { data: foodsData } = useQuery({
    queryKey: [...queryKeys.foods.all(), search],
    queryFn: () =>
      api.get<FoodListResponse>(`/api/foods${search ? `?q=${encodeURIComponent(search)}` : ''}`),
    enabled: isOpen,
  });

  const { data: unitsData } = useQuery({
    queryKey: queryKeys.units.all(),
    queryFn: () => api.get<UnitListResponse>('/api/units'),
    enabled: isOpen,
  });

  const createFoodMutation = useMutation({
    mutationFn: (name: string) =>
      api.post<FoodResponse>('/api/foods', { name }),
    onSuccess: (food) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.foods.all() });
      setSelectedFood(food);
      setSearch('');
    },
  });

  const addIngredientMutation = useMutation({
    mutationFn: (req: CreateIngredientRequest) =>
      api.post<RecipeIngredientResponse>(
        `/api/recipes/${recipeId}/sections/${sectionId}/ingredients`,
        req,
      ),
    onSuccess: (ingredient) => {
      onAdded(ingredient);
      handleClose();
    },
  });

  function handleClose() {
    setSearch('');
    setSelectedFood(null);
    setQuantity('');
    setUnitId('');
    setNote('');
    onClose();
  }

  const foods = foodsData?.items ?? [];
  const units = unitsData?.items ?? [];

  const filteredFoods = search
    ? foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : foods;

  const hasExactMatch = filteredFoods.some(
    (f) => f.name.toLowerCase() === search.toLowerCase(),
  );

  function handleConfirm() {
    if (!selectedFood) return;
    const req: CreateIngredientRequest = { foodId: selectedFood.id };
    if (quantity) req.quantity = Number(quantity);
    if (unitId) req.unitId = unitId;
    if (note) req.note = note;
    addIngredientMutation.mutate(req);
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Agregar ingrediente"
      onClose={handleClose}
      onBack={selectedFood ? () => setSelectedFood(null) : undefined}
    >
      <div data-testid="ingredient-picker-modal" className="flex flex-col">
        {!selectedFood ? (
          <>
            {/* Search */}
            <div className="px-5 py-3 border-b border-border">
              <input
                type="text"
                placeholder="Buscar alimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-placeholder focus:outline-none"
              />
            </div>

            {/* Food list */}
            <div className="flex-1 overflow-y-auto">
              {search && !hasExactMatch && (
                <button
                  type="button"
                  onClick={() => createFoodMutation.mutate(search)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left border-b border-border hover:bg-subtle"
                >
                  <span className="text-accent font-semibold">+</span>
                  <span className="text-sm text-foreground">
                    Crear &ldquo;{search}&rdquo;
                  </span>
                </button>
              )}
              {filteredFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setSelectedFood(food)}
                  className="w-full flex items-center px-5 py-3 text-left border-b border-border hover:bg-subtle"
                >
                  <span className="text-sm text-foreground">{food.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="px-5 py-4 flex flex-col gap-4">
            <div className="bg-subtle rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{selectedFood.name}</p>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Cantidad"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium uppercase text-secondary tracking-wide block mb-1">
                  Unidad
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground"
                >
                  <option value="">Sin unidad</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.abbreviation ?? unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Nota (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. picado fino"
            />

            <Button
              type="button"
              className="w-full"
              loading={addIngredientMutation.isPending}
              onClick={handleConfirm}
            >
              Confirmar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
