'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FoodResponse, PaginatedResponse, AdminFoodRequest } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/Button';

function FoodRow({
  food,
  onSave,
  onDelete,
}: {
  food: FoodResponse;
  onSave: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(food.name);

  function handleSave() {
    onSave(food.id, editName);
    setIsEditing(false);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0">
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 text-sm text-foreground border border-border rounded-md px-3 py-1.5 bg-transparent focus:outline-none focus:border-foreground mr-3"
        />
      ) : (
        <span className="text-sm text-foreground flex-1">{food.name}</span>
      )}

      <div className="flex items-center gap-2">
        {isEditing ? (
          <Button size="sm" onClick={handleSave} aria-label="Guardar cambios">
            Guardar
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditName(food.name);
              setIsEditing(true);
            }}
            aria-label={`Editar ${food.name}`}
          >
            Editar
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(food.id)}
          aria-label={`Eliminar ${food.name}`}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export function FoodsManager() {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');

  const queryClient = useQueryClient();

  const { data } = useQuery<PaginatedResponse<FoodResponse>>({
    queryKey: queryKeys.admin.foods(),
    queryFn: () => api.get<PaginatedResponse<FoodResponse>>('/api/admin/foods'),
  });

  const createMutation = useMutation({
    mutationFn: (body: AdminFoodRequest) =>
      api.post<FoodResponse>('/api/admin/foods', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.foods() });
      setNewFoodName('');
      setShowCreateForm(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdminFoodRequest }) =>
      api.patch<FoodResponse>(`/api/admin/foods/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.foods() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/admin/foods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.foods() });
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newFoodName.trim()) return;
    createMutation.mutate({ name: newFoodName.trim() });
  }

  function handleSave(id: string, name: string) {
    editMutation.mutate({ id, body: { name } });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este alimento?')) return;
    deleteMutation.mutate(id);
  }

  const foods = data?.items ?? [];
  const filtered = search.trim()
    ? foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : foods;

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Create button row */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar alimentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm text-foreground border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground"
        />
        <Button onClick={() => setShowCreateForm(true)}>
          Crear alimento
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Nombre del alimento"
            value={newFoodName}
            onChange={(e) => setNewFoodName(e.target.value)}
            className="flex-1 text-sm text-foreground border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground"
          />
          <Button type="submit" loading={createMutation.isPending}>
            Crear
          </Button>
        </form>
      )}

      {/* Foods list */}
      <div className="border border-border rounded-xl overflow-hidden">
        {filtered.map((food) => (
          <FoodRow
            key={food.id}
            food={food}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-secondary text-sm">
            {search ? 'Sin resultados' : 'No hay alimentos'}
          </div>
        )}
      </div>
    </div>
  );
}
