'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminForm } from '@/components/admin/AdminForm';
import { OneTimeDisplay } from '@/components/admin/OneTimeDisplay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { PaginationControls } from '@/components/recipes/PaginationControls';
import { adminApi } from '@/lib/admin-api-client';
import { queryKeys } from '@/lib/query-keys';
import type { AdminUserResponse, AdminHouseholdResponse } from '@recipe-manager/shared';
import type { PaginatedResponse } from '@recipe-manager/shared';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);

  // Inline confirm dialog
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Password reset URL one-time display
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  // Form field state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formHouseholdId, setFormHouseholdId] = useState('');
  const [formUsername, setFormUsername] = useState('');

  // Users query
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.users.list({ page, perPage }),
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminUserResponse>>(
        `/admin/users?page=${page}&perPage=${perPage}`,
      ),
  });

  // Households query for the create form dropdown
  const { data: householdsData } = useQuery({
    queryKey: ['admin', 'households', 'dropdown'],
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminHouseholdResponse>>(
        '/admin/households?page=1&perPage=100',
      ),
    enabled: showForm && editingUser === null,
  });

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 1;

  // Create user mutation
  const createUser = useMutation({
    mutationFn: (body: { name: string; email: string; password: string; householdId: string }) =>
      adminApi.post<AdminUserResponse>('/admin/users', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
      setShowForm(false);
      resetForm();
      toast.success('Usuario creado.');
    },
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; email?: string; username?: string } }) =>
      adminApi.patch<AdminUserResponse>(`/admin/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
      setShowForm(false);
      setEditingUser(null);
      resetForm();
      toast.success('Usuario actualizado.');
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: (id: string) => adminApi.delete<void>(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
      setDeletingId(null);
      toast.success('Usuario eliminado.');
    },
  });

  // Password reset mutation
  const resetPassword = useMutation({
    mutationFn: (id: string) =>
      adminApi.post<{ url: string }>(`/admin/users/${id}/password-reset-url`, {}),
    onSuccess: (data) => {
      setResetUrl(data.url);
    },
  });

  function resetForm() {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormHouseholdId('');
    setFormUsername('');
  }

  function handleOpenCreate() {
    setEditingUser(null);
    resetForm();
    setShowForm(true);
  }

  function handleOpenEdit(user: AdminUserResponse) {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email ?? '');
    setFormUsername(user.username ?? '');
    setFormPassword('');
    setFormHouseholdId('');
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingUser(null);
    resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingUser) {
      updateUser.mutate({
        id: editingUser.id,
        body: { name: formName, email: formEmail, username: formUsername },
      });
    } else {
      createUser.mutate({
        name: formName,
        email: formEmail,
        password: formPassword,
        householdId: formHouseholdId,
      });
    }
  }

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo', render: (u: AdminUserResponse) => u.email ?? '—' },
    { key: 'username', label: 'Usuario', render: (u: AdminUserResponse) => u.username ?? '—' },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (u: AdminUserResponse) => new Date(u.createdAt).toLocaleDateString('es'),
    },
  ];

  const rows = data?.items ?? [];
  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[22px] font-semibold text-foreground"
          style={{ letterSpacing: '-0.3px' }}
        >
          Usuarios
        </h1>
        <button
          onClick={handleOpenCreate}
          className="bg-accent text-background rounded-[20px] py-2 px-5 text-[15px] font-semibold"
        >
          Crear usuario
        </button>
      </div>

      {/* Password reset URL one-time display */}
      {resetUrl && (
        <div className="mb-4">
          <OneTimeDisplay
            value={resetUrl}
            label="Comparte esta URL con el usuario de forma segura. Expira tras su uso."
            onDismiss={() => setResetUrl(null)}
          />
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <AdminForm
          title={editingUser ? 'Editar usuario' : 'Crear usuario'}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          submitLabel={editingUser ? 'Guardar' : 'Crear'}
          isPending={isPending}
        >
          {/* Name field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="user-name" className="text-[13px] text-foreground">
              Nombre *
            </label>
            <input
              id="user-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              placeholder="Nombre completo"
            />
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="user-email" className="text-[13px] text-foreground">
              Correo *
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              placeholder="correo@ejemplo.com"
            />
          </div>

          {/* Password field — create only */}
          {!editingUser && (
            <div className="flex flex-col gap-2">
              <label htmlFor="user-password" className="text-[13px] text-foreground">
                Contraseña *
              </label>
              <input
                id="user-password"
                type="password"
                required
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
                placeholder="Contraseña inicial"
              />
            </div>
          )}

          {/* Household field — create only */}
          {!editingUser && (
            <div className="flex flex-col gap-2">
              <label htmlFor="user-household" className="text-[13px] text-foreground">
                Hogar *
              </label>
              <select
                id="user-household"
                required
                value={formHouseholdId}
                onChange={(e) => setFormHouseholdId(e.target.value)}
                className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground outline-none"
              >
                <option value="">Seleccionar hogar</option>
                {householdsData?.items.map((h: AdminHouseholdResponse) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Username field — edit only */}
          {editingUser && (
            <div className="flex flex-col gap-2">
              <label htmlFor="user-username" className="text-[13px] text-foreground">
                Usuario
              </label>
              <input
                id="user-username"
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
                placeholder="Nombre de usuario"
              />
            </div>
          )}
        </AdminForm>
      )}

      {/* Users table */}
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
          emptyMessage="Sin usuarios. Crea el primero para empezar."
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
                  className="text-[13px] text-secondary"
                  onClick={() => resetPassword.mutate(row.id)}
                >
                  Restablecer contrasena
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
                  message="Eliminar este usuario? Esta accion no se puede deshacer."
                  onConfirm={() => deleteUser.mutate(row.id)}
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
