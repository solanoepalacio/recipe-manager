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
import type { AdminTokenResponse, AdminTokenCreatedResponse, AdminUserResponse } from '@recipe-manager/shared';
import type { PaginatedResponse } from '@recipe-manager/shared';

export default function AdminTokensPage() {
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Form state
  const [showForm, setShowForm] = useState(false);

  // Inline confirm dialog
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Raw token one-time display — local state ONLY, never cached in TanStack Query
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  // Form field state
  const [formName, setFormName] = useState('');
  const [formUserId, setFormUserId] = useState('');

  // Tokens query
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.tokens.list({ page, perPage }),
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminTokenResponse>>(
        `/admin/tokens?page=${page}&perPage=${perPage}`,
      ),
  });

  // Agent users query for the create form dropdown — only agent-type users can have tokens
  const { data: agentUsersData } = useQuery({
    queryKey: ['admin', 'users', 'agents'],
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminUserResponse>>('/admin/users?userType=agent&page=1&perPage=100'),
    enabled: showForm,
  });

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 1;

  // Create token mutation
  const createToken = useMutation({
    mutationFn: (body: { name: string; userId: string }) =>
      adminApi.post<AdminTokenCreatedResponse>('/admin/tokens', body),
    onSuccess: (data) => {
      // CRITICAL: raw token stored ONLY in createdToken useState — never in query cache
      setCreatedToken(data.token);
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tokens.all });
      toast.success('Token creado.');
    },
  });

  // Delete (revoke) token mutation
  const deleteToken = useMutation({
    mutationFn: (id: string) => adminApi.delete<void>(`/admin/tokens/${id}`),
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tokens.all });
      toast.success('Token revocado.');
    },
  });

  function resetForm() {
    setFormName('');
    setFormUserId('');
  }

  function handleOpenCreate() {
    resetForm();
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createToken.mutate({ name: formName, userId: formUserId });
  }

  const columns = [
    { key: 'name', label: 'Nombre' },
    {
      key: 'userId',
      label: 'Usuario',
      // Use userName + householdName from token response (populated server-side)
      render: (t: AdminTokenResponse) =>
        t.userName
          ? `${t.userName}${t.householdName ? ` (${t.householdName})` : ''}`
          : t.userId,
    },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (t: AdminTokenResponse) => new Date(t.createdAt).toLocaleDateString('es'),
    },
    {
      key: 'lastUsedAt',
      label: 'Ultimo uso',
      render: (t: AdminTokenResponse) =>
        t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString('es') : 'Nunca',
    },
  ];

  const rows = data?.items ?? [];

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[22px] font-semibold text-foreground"
          style={{ letterSpacing: '-0.3px' }}
        >
          Tokens
        </h1>
        <button
          onClick={handleOpenCreate}
          className="bg-accent text-background rounded-[20px] py-2 px-5 text-[15px] font-semibold"
        >
          Crear token
        </button>
      </div>

      {/* Raw token one-time display */}
      {createdToken !== null && (
        <div className="mb-4">
          <OneTimeDisplay
            value={createdToken}
            label="Copia este token ahora. No se mostrara de nuevo."
            onDismiss={() => setCreatedToken(null)}
          />
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <AdminForm
          title="Crear token"
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          submitLabel="Crear token"
          isPending={createToken.isPending}
        >
          {/* Name field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="token-name" className="text-[13px] text-foreground">
              Nombre *
            </label>
            <input
              id="token-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              placeholder="Nombre del token"
            />
          </div>

          {/* User field — only agent users */}
          <div className="flex flex-col gap-2">
            <label htmlFor="token-user" className="text-[13px] text-foreground">
              Agente *
            </label>
            <select
              id="token-user"
              required
              value={formUserId}
              onChange={(e) => setFormUserId(e.target.value)}
              className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground outline-none"
            >
              <option value="">Seleccionar agente</option>
              {agentUsersData?.items.map((u: AdminUserResponse) => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.householdName ? ` — ${u.householdName}` : ''}
                </option>
              ))}
            </select>
            {agentUsersData?.items.length === 0 && (
              <p className="text-[12px] text-secondary">
                No hay agentes disponibles. Crea un miembro de tipo Agente primero.
              </p>
            )}
          </div>
        </AdminForm>
      )}

      {/* Tokens table */}
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
          getRowKey={(t) => t.id}
          emptyMessage="Sin tokens activos."
          actions={(row) => (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <button
                  className="text-[13px] text-destructive"
                  onClick={() => setDeletingId(row.id)}
                >
                  Revocar
                </button>
              </div>
              {deletingId === row.id && (
                <ConfirmDialog
                  message="Revocar este token de acceso?"
                  confirmLabel="Revocar"
                  onConfirm={() => deleteToken.mutate(row.id)}
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
