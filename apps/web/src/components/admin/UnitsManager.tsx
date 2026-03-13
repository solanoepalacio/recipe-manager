'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UnitResponse, PaginatedResponse, AdminUnitRequest } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/Button';

function UnitRow({
  unit,
  onSave,
  onDelete,
}: {
  unit: UnitResponse;
  onSave: (id: string, name: string, abbreviation: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(unit.name);
  const [editAbbreviation, setEditAbbreviation] = useState(unit.abbreviation ?? '');

  function handleSave() {
    onSave(unit.id, editName, editAbbreviation);
    setIsEditing(false);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0">
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1 mr-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 text-sm text-foreground border border-border rounded-md px-3 py-1.5 bg-transparent focus:outline-none focus:border-foreground"
          />
          <input
            type="text"
            value={editAbbreviation}
            onChange={(e) => setEditAbbreviation(e.target.value)}
            className="w-20 text-sm text-foreground border border-border rounded-md px-3 py-1.5 bg-transparent focus:outline-none focus:border-foreground"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm text-foreground">{unit.name}</span>
          {unit.abbreviation && (
            <span className="text-xs text-secondary bg-subtle px-2 py-0.5 rounded">
              {unit.abbreviation}
            </span>
          )}
        </div>
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
              setEditName(unit.name);
              setEditAbbreviation(unit.abbreviation ?? '');
              setIsEditing(true);
            }}
            aria-label={`Editar ${unit.name}`}
          >
            Editar
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(unit.id)}
          aria-label={`Eliminar ${unit.name}`}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export function UnitsManager() {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitAbbreviation, setNewUnitAbbreviation] = useState('');

  const queryClient = useQueryClient();

  const { data } = useQuery<PaginatedResponse<UnitResponse>>({
    queryKey: queryKeys.admin.units(),
    queryFn: () => api.get<PaginatedResponse<UnitResponse>>('/api/admin/units'),
  });

  const createMutation = useMutation({
    mutationFn: (body: AdminUnitRequest) =>
      api.post<UnitResponse>('/api/admin/units', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.units() });
      setNewUnitName('');
      setNewUnitAbbreviation('');
      setShowCreateForm(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdminUnitRequest }) =>
      api.patch<UnitResponse>(`/api/admin/units/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.units() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/admin/units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.units() });
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    const body: AdminUnitRequest = {
      name: newUnitName.trim(),
      abbreviation: newUnitAbbreviation.trim() || undefined,
    };
    createMutation.mutate(body);
  }

  function handleSave(id: string, name: string, abbreviation: string) {
    const body: AdminUnitRequest = {
      name,
      abbreviation: abbreviation || undefined,
    };
    editMutation.mutate({ id, body });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta unidad?')) return;
    deleteMutation.mutate(id);
  }

  const units = data?.items ?? [];
  const filtered = search.trim()
    ? units.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          (u.abbreviation?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : units;

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Create button row */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar unidades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm text-foreground border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground"
        />
        <Button onClick={() => setShowCreateForm(true)}>
          Crear unidad
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Nombre de la unidad"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            className="flex-1 text-sm text-foreground border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground"
          />
          <input
            type="text"
            placeholder="Abreviatura"
            value={newUnitAbbreviation}
            onChange={(e) => setNewUnitAbbreviation(e.target.value)}
            className="w-28 text-sm text-foreground border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground"
          />
          <Button type="submit" loading={createMutation.isPending}>
            Crear
          </Button>
        </form>
      )}

      {/* Units list */}
      <div className="border border-border rounded-xl overflow-hidden">
        {filtered.map((unit) => (
          <UnitRow
            key={unit.id}
            unit={unit}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-secondary text-sm">
            {search ? 'Sin resultados' : 'No hay unidades'}
          </div>
        )}
      </div>
    </div>
  );
}
