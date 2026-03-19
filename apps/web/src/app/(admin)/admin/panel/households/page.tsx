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
import type { AdminHouseholdResponse } from '@recipe-manager/shared';
import type { PaginatedResponse } from '@recipe-manager/shared';

export default function AdminHouseholdsPage() {
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<AdminHouseholdResponse | null>(null);

  // Inline confirm dialog
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form field state
  const [formName, setFormName] = useState('');

  // Households query
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.households.list({ page, perPage }),
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminHouseholdResponse>>(
        `/admin/households?page=${page}&perPage=${perPage}`,
      ),
  });

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 1;

  // Create household mutation
  const createHousehold = useMutation({
    mutationFn: (body: { name: string }) =>
      adminApi.post<AdminHouseholdResponse>('/admin/households', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      setShowForm(false);
      resetForm();
      toast.success('Hogar creado.');
    },
  });

  // Update household mutation
  const updateHousehold = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string } }) =>
      adminApi.patch<AdminHouseholdResponse>(`/admin/households/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      setShowForm(false);
      setEditingHousehold(null);
      resetForm();
      toast.success('Hogar actualizado.');
    },
  });

  // Delete household mutation
  const deleteHousehold = useMutation({
    mutationFn: (id: string) => adminApi.delete<void>(`/admin/households/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      setDeletingId(null);
      toast.success('Hogar eliminado.');
    },
  });

  function resetForm() {
    setFormName('');
  }

  function handleOpenCreate() {
    setEditingHousehold(null);
    resetForm();
    setShowForm(true);
  }

  function handleOpenEdit(household: AdminHouseholdResponse) {
    setEditingHousehold(household);
    setFormName(household.name);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingHousehold(null);
    resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingHousehold) {
      updateHousehold.mutate({ id: editingHousehold.id, body: { name: formName } });
    } else {
      createHousehold.mutate({ name: formName });
    }
  }

  const columns = [
    { key: 'name', label: 'Nombre' },
    {
      key: 'memberCount',
      label: 'Miembros',
      render: (h: AdminHouseholdResponse) => String(h.memberCount),
    },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (h: AdminHouseholdResponse) => new Date(h.createdAt).toLocaleDateString('es'),
    },
  ];

  const rows = data?.items ?? [];
  const isPending = createHousehold.isPending || updateHousehold.isPending;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[22px] font-semibold text-foreground"
          style={{ letterSpacing: '-0.3px' }}
        >
          Hogares
        </h1>
        <button
          onClick={handleOpenCreate}
          className="bg-accent text-background rounded-[20px] py-2 px-5 text-[15px] font-semibold"
        >
          Crear hogar
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <AdminForm
          title={editingHousehold ? 'Editar hogar' : 'Crear hogar'}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          submitLabel={editingHousehold ? 'Guardar' : 'Crear'}
          isPending={isPending}
        >
          {/* Name field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="household-name" className="text-[13px] text-foreground">
              Nombre *
            </label>
            <input
              id="household-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              placeholder="Nombre del hogar"
            />
          </div>
        </AdminForm>
      )}

      {/* Households table */}
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
          getRowKey={(h) => h.id}
          emptyMessage="Sin hogares registrados."
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
                  message="Eliminar este hogar? Se eliminaran todas sus recetas y planes."
                  onConfirm={() => deleteHousehold.mutate(row.id)}
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
