'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminForm } from '@/components/admin/AdminForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { PaginationControls } from '@/components/recipes/PaginationControls';
import { adminApi } from '@/lib/admin-api-client';
import { queryKeys } from '@/lib/query-keys';
import type { AdminUnitResponse } from '@recipe-manager/shared';
import type { PaginatedResponse } from '@recipe-manager/shared';

export default function AdminUnitsPage() {
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<AdminUnitResponse | null>(null);

  // Inline confirm dialog
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form field state
  const [formName, setFormName] = useState('');
  const [formAbbreviation, setFormAbbreviation] = useState('');

  // Units query
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.units.list({ page, perPage }),
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminUnitResponse>>(
        `/admin/units?page=${page}&perPage=${perPage}`,
      ),
  });

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 1;

  // Create unit mutation
  const createUnit = useMutation({
    mutationFn: (body: { name: string; abbreviation: string | null }) =>
      adminApi.post<AdminUnitResponse>('/admin/units', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.units.all });
      setShowForm(false);
      resetForm();
      toast.success('Unidad creada.');
    },
  });

  // Update unit mutation
  const updateUnit = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; abbreviation?: string | null };
    }) => adminApi.patch<AdminUnitResponse>(`/admin/units/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.units.all });
      setShowForm(false);
      setEditingUnit(null);
      resetForm();
      toast.success('Unidad actualizada.');
    },
  });

  // Delete unit mutation
  const deleteUnit = useMutation({
    mutationFn: (id: string) => adminApi.delete<void>(`/admin/units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.units.all });
      setDeletingId(null);
      toast.success('Unidad eliminada.');
    },
  });

  function resetForm() {
    setFormName('');
    setFormAbbreviation('');
  }

  function handleOpenCreate() {
    setEditingUnit(null);
    resetForm();
    setShowForm(true);
  }

  function handleOpenEdit(unit: AdminUnitResponse) {
    setEditingUnit(unit);
    setFormName(unit.name);
    setFormAbbreviation(unit.abbreviation ?? '');
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingUnit(null);
    resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingUnit) {
      updateUnit.mutate({
        id: editingUnit.id,
        body: { name: formName, abbreviation: formAbbreviation || null },
      });
    } else {
      createUnit.mutate({ name: formName, abbreviation: formAbbreviation || null });
    }
  }

  const columns = [
    { key: 'name', label: 'Nombre' },
    {
      key: 'abbreviation',
      label: 'Abreviatura',
      render: (u: AdminUnitResponse) => u.abbreviation ?? '—',
    },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (u: AdminUnitResponse) => new Date(u.createdAt).toLocaleDateString('es'),
    },
  ];

  const rows = data?.items ?? [];
  const isPending = createUnit.isPending || updateUnit.isPending;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[22px] font-semibold text-foreground"
          style={{ letterSpacing: '-0.3px' }}
        >
          Unidades
        </h1>
        <button
          onClick={handleOpenCreate}
          className="bg-accent text-background rounded-[20px] py-2 px-5 text-[15px] font-semibold"
        >
          Crear unidad
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <AdminForm
          title={editingUnit ? 'Editar unidad' : 'Crear unidad'}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          submitLabel={editingUnit ? 'Guardar' : 'Crear'}
          isPending={isPending}
        >
          {/* Name field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="unit-name" className="text-[13px] text-foreground">
              Nombre *
            </label>
            <input
              id="unit-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              placeholder="Nombre de la unidad"
            />
          </div>

          {/* Abbreviation field (optional) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="unit-abbreviation" className="text-[13px] text-foreground">
              Abreviatura
            </label>
            <input
              id="unit-abbreviation"
              type="text"
              value={formAbbreviation}
              onChange={(e) => setFormAbbreviation(e.target.value)}
              className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              placeholder="Ej: g, ml, taza"
            />
          </div>
        </AdminForm>
      )}

      {/* Units table */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[44px] w-full" />
          ))}
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={rows}
          getRowKey={(u) => u.id}
          emptyMessage="Sin unidades. Anade las primeras."
          actions={(row) => (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <button
                  className="text-[13px] text-foreground"
                  onClick={() => handleOpenEdit(row)}
                >
                  Editar
                </button>
                <button
                  className="text-[13px] text-destructive"
                  onClick={() => setDeletingId(row.id)}
                >
                  Eliminar
                </button>
              </div>
              {deletingId === row.id && (
                <ConfirmDialog
                  message="Eliminar esta unidad?"
                  onConfirm={() => deleteUnit.mutate(row.id)}
                  onCancel={() => setDeletingId(null)}
                />
              )}
            </div>
          )}
        />
      )}

      {/* Pagination */}
      {data && totalPages > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          pageSize={perPage}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPerPage(s);
            setPage(1);
          }}
          pageSizeOptions={[10, 25, 50]}
        />
      )}
    </div>
  );
}
