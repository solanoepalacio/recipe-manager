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
import type { AdminFoodResponse } from '@recipe-manager/shared';
import type { PaginatedResponse } from '@recipe-manager/shared';

export default function AdminFoodsPage() {
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<AdminFoodResponse | null>(null);

  // Inline confirm dialog
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form field state
  const [formName, setFormName] = useState('');

  // Foods query
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.foods.list({ page, perPage }),
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminFoodResponse>>(
        `/admin/foods?page=${page}&perPage=${perPage}`,
      ),
  });

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 1;

  // Create food mutation
  const createFood = useMutation({
    mutationFn: (body: { name: string }) =>
      adminApi.post<AdminFoodResponse>('/admin/foods', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.foods.all });
      setShowForm(false);
      resetForm();
      toast.success('Alimento creado.');
    },
  });

  // Update food mutation
  const updateFood = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string } }) =>
      adminApi.patch<AdminFoodResponse>(`/admin/foods/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.foods.all });
      setShowForm(false);
      setEditingFood(null);
      resetForm();
      toast.success('Alimento actualizado.');
    },
  });

  // Delete food mutation
  const deleteFood = useMutation({
    mutationFn: (id: string) => adminApi.delete<void>(`/admin/foods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.foods.all });
      setDeletingId(null);
      toast.success('Alimento eliminado.');
    },
  });

  function resetForm() {
    setFormName('');
  }

  function handleOpenCreate() {
    setEditingFood(null);
    resetForm();
    setShowForm(true);
  }

  function handleOpenEdit(food: AdminFoodResponse) {
    setEditingFood(food);
    setFormName(food.name);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingFood(null);
    resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingFood) {
      updateFood.mutate({ id: editingFood.id, body: { name: formName } });
    } else {
      createFood.mutate({ name: formName });
    }
  }

  const columns = [
    { key: 'name', label: 'Nombre' },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (f: AdminFoodResponse) => new Date(f.createdAt).toLocaleDateString('es'),
    },
  ];

  const rows = data?.items ?? [];
  const isPending = createFood.isPending || updateFood.isPending;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[22px] font-semibold text-foreground"
          style={{ letterSpacing: '-0.3px' }}
        >
          Alimentos
        </h1>
        <button
          onClick={handleOpenCreate}
          className="bg-accent text-background rounded-[20px] py-2 px-5 text-[15px] font-semibold"
        >
          Crear alimento
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <AdminForm
          title={editingFood ? 'Editar alimento' : 'Crear alimento'}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          submitLabel={editingFood ? 'Guardar' : 'Crear'}
          isPending={isPending}
        >
          {/* Name field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="food-name" className="text-[13px] text-foreground">
              Nombre *
            </label>
            <input
              id="food-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              placeholder="Nombre del alimento"
            />
          </div>
        </AdminForm>
      )}

      {/* Foods table */}
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
          getRowKey={(f) => f.id}
          emptyMessage="Sin alimentos. Anade los primeros."
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
                  message="Eliminar este alimento?"
                  onConfirm={() => deleteFood.mutate(row.id)}
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
