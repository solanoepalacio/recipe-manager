'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { AdminForm } from '@/components/admin/AdminForm';
import { OneTimeDisplay } from '@/components/admin/OneTimeDisplay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { PaginationControls } from '@/components/recipes/PaginationControls';
import { adminApi } from '@/lib/admin-api-client';
import { queryKeys } from '@/lib/query-keys';
import type {
  AdminHouseholdResponse,
  AdminHouseholdDetailResponse,
  AdminUserResponse,
} from '@recipe-manager/shared';
import type { PaginatedResponse } from '@recipe-manager/shared';
import { Gender, UserType } from '@recipe-manager/shared';

// ---------------------------------------------------------------------------
// Types for form mode
// ---------------------------------------------------------------------------
type FormMode =
  | { type: 'createHousehold' }
  | { type: 'editHousehold'; household: AdminHouseholdResponse }
  | { type: 'createMember'; householdId: string; householdName: string }
  | { type: 'editMember'; user: AdminUserResponse };

function UserTypeBadge({ userType }: { userType: string }) {
  const labels: Record<string, { label: string; className: string }> = {
    [UserType.Normal]: { label: 'adulto', className: 'bg-blue-50 text-blue-600' },
    [UserType.Kid]: { label: 'nino', className: 'bg-green-50 text-green-600' },
    [UserType.Agent]: { label: 'agente', className: 'bg-purple-50 text-purple-600' },
  };
  const config = labels[userType] ?? labels[UserType.Normal];
  return (
    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] ${config.className}`}>
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Household row with collapsible members
// ---------------------------------------------------------------------------
function HouseholdRow({
  household,
  onEdit,
  onDelete,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onResetPassword,
  resetUrl,
  onDismissResetUrl,
}: {
  household: AdminHouseholdResponse;
  onEdit: (h: AdminHouseholdResponse) => void;
  onDelete: (h: AdminHouseholdResponse) => void;
  onAddMember: (householdId: string, householdName: string) => void;
  onEditMember: (user: AdminUserResponse) => void;
  onDeleteMember: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  resetUrl: string | null;
  onDismissResetUrl: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const { data: detail, isLoading: loadingMembers } = useQuery({
    queryKey: ['admin', 'households', 'detail', household.id],
    queryFn: () => adminApi.get<AdminHouseholdDetailResponse>(`/admin/households/${household.id}`),
    enabled: expanded,
  });

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Household header row */}
      <div className="flex items-center gap-3 px-4 py-3 min-h-[52px] hover:bg-subtle/60 transition-colors">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-secondary flex-shrink-0"
          aria-label={expanded ? 'Colapsar' : 'Expandir'}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-[15px] font-medium text-foreground">{household.name}</span>
          <span className="ml-2 text-[13px] text-secondary">
            {household.memberCount} {household.memberCount === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[13px] text-secondary hidden sm:block">
            {new Date(household.createdAt).toLocaleDateString('es')}
          </span>
          <button
            className="text-[13px] text-foreground"
            onClick={() => onEdit(household)}
          >
            Editar
          </button>
          <button
            className="text-[13px] text-destructive"
            onClick={() => onDelete(household)}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Expanded members list */}
      {expanded && (
        <div className="bg-subtle/40 border-t border-border/50">
          {/* Password reset URL one-time display */}
          {resetUrl && (
            <div className="px-8 pt-3">
              <OneTimeDisplay
                value={resetUrl}
                label="Comparte esta URL con el usuario de forma segura. Expira tras su uso."
                onDismiss={onDismissResetUrl}
              />
            </div>
          )}

          {loadingMembers ? (
            <div className="px-8 py-3 flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[36px] w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Members */}
              {(detail?.members ?? []).length === 0 && (
                <div className="px-8 py-3 text-[13px] text-secondary italic">Sin miembros.</div>
              )}
              {(detail?.members ?? []).map((member) => {
                const memberUserType = member.userType ?? UserType.Normal;
                const isNormal = memberUserType === UserType.Normal;
                return (
                  <div key={member.id} className="border-b border-border/50 last:border-b-0">
                    <div className="flex items-center gap-3 px-8 py-2 min-h-[44px]">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-[14px] text-foreground">{member.name}</span>
                        <UserTypeBadge userType={memberUserType} />
                        {member.email && (
                          <span className="text-[13px] text-secondary">{member.email}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          className="text-[13px] text-foreground"
                          onClick={() => onEditMember(member)}
                        >
                          Editar
                        </button>
                        {isNormal && (
                          <button
                            type="button"
                            className="text-[13px] text-secondary"
                            onClick={() => onResetPassword(member.id)}
                          >
                            Restablecer contrasena
                          </button>
                        )}
                        <button
                          className="text-[13px] text-destructive"
                          onClick={() => setDeletingMemberId(member.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {deletingMemberId === member.id && (
                      <div className="px-8 pb-2">
                        <ConfirmDialog
                          message="Eliminar este usuario? Esta accion no se puede deshacer."
                          onConfirm={() => {
                            onDeleteMember(member.id);
                            setDeletingMemberId(null);
                          }}
                          onCancel={() => setDeletingMemberId(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add member row */}
              <div className="px-8 py-2 min-h-[44px] flex items-center">
                <button
                  className="text-[13px] text-accent font-medium"
                  onClick={() => onAddMember(household.id, household.name)}
                >
                  + Agregar miembro
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminHouseholdsPage() {
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Form state
  const [formMode, setFormMode] = useState<FormMode | null>(null);

  // Household confirm delete
  const [deletingHouseholdId, setDeletingHouseholdId] = useState<string | null>(null);
  const [pendingDeleteHousehold, setPendingDeleteHousehold] = useState<AdminHouseholdResponse | null>(null);

  // Password reset URL
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [resetUrlForHousehold, setResetUrlForHousehold] = useState<string | null>(null);

  // Household form fields
  const [formHouseholdName, setFormHouseholdName] = useState('');

  // Member form fields
  const [formMemberUserType, setFormMemberUserType] = useState<string>(UserType.Normal);
  const [formMemberName, setFormMemberName] = useState('');
  const [formMemberEmail, setFormMemberEmail] = useState('');
  const [formMemberPassword, setFormMemberPassword] = useState('');
  const [formMemberUsername, setFormMemberUsername] = useState('');
  const [formMemberGender, setFormMemberGender] = useState<string>(Gender.Male);
  const [formMemberDateOfBirth, setFormMemberDateOfBirth] = useState('');

  // Households query
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.households.list({ page, perPage }),
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminHouseholdResponse>>(
        `/admin/households?page=${page}&perPage=${perPage}`,
      ),
  });

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 1;

  // --- Household mutations ---
  const createHousehold = useMutation({
    mutationFn: (body: { name: string }) =>
      adminApi.post<AdminHouseholdResponse>('/admin/households', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      closeForm();
      toast.success('Hogar creado.');
    },
  });

  const updateHousehold = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string } }) =>
      adminApi.patch<AdminHouseholdResponse>(`/admin/households/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      closeForm();
      toast.success('Hogar actualizado.');
    },
  });

  const deleteHousehold = useMutation({
    mutationFn: (id: string) => adminApi.delete<void>(`/admin/households/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      setDeletingHouseholdId(null);
      setPendingDeleteHousehold(null);
      toast.success('Hogar eliminado.');
    },
  });

  // --- Member mutations ---
  const createMember = useMutation({
    mutationFn: (body: Record<string, string>) =>
      adminApi.post<AdminUserResponse>('/admin/users', body),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'households', 'detail', vars.householdId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      closeForm();
      toast.success('Miembro agregado.');
    },
  });

  const updateMember = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, string | undefined> }) =>
      adminApi.patch<AdminUserResponse>(`/admin/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      // Invalidate all detail queries since we don't know which household
      queryClient.invalidateQueries({ queryKey: ['admin', 'households', 'detail'] });
      closeForm();
      toast.success('Miembro actualizado.');
    },
  });

  const deleteMember = useMutation({
    mutationFn: (id: string) => adminApi.delete<void>(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'households', 'detail'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households.all });
      toast.success('Miembro eliminado.');
    },
  });

  const resetPassword = useMutation({
    mutationFn: ({ userId }: { userId: string; householdId: string }) =>
      adminApi.post<{ resetUrl: string }>(`/admin/users/${userId}/password-reset-url`, {}),
    onSuccess: (data, vars) => {
      setResetUrl(data.resetUrl);
      setResetUrlForHousehold(vars.householdId);
    },
    onError: () => {
      toast.error('No se pudo generar la URL de restablecimiento.');
    },
  });

  // --- Form helpers ---
  function closeForm() {
    setFormMode(null);
    setFormHouseholdName('');
    setFormMemberUserType(UserType.Normal);
    setFormMemberName('');
    setFormMemberEmail('');
    setFormMemberPassword('');
    setFormMemberUsername('');
    setFormMemberGender(Gender.Male);
    setFormMemberDateOfBirth('');
  }

  function handleOpenCreateHousehold() {
    setFormHouseholdName('');
    setFormMode({ type: 'createHousehold' });
  }

  function handleOpenEditHousehold(household: AdminHouseholdResponse) {
    setFormHouseholdName(household.name);
    setFormMode({ type: 'editHousehold', household });
  }

  function handleOpenDeleteHousehold(household: AdminHouseholdResponse) {
    setPendingDeleteHousehold(household);
    setDeletingHouseholdId(household.id);
  }

  function handleOpenAddMember(householdId: string, householdName: string) {
    setFormMemberUserType(UserType.Normal);
    setFormMemberName('');
    setFormMemberEmail('');
    setFormMemberPassword('');
    setFormMemberGender(Gender.Male);
    setFormMemberDateOfBirth('');
    setFormMode({ type: 'createMember', householdId, householdName });
  }

  function handleOpenEditMember(user: AdminUserResponse) {
    const ut = user.userType ?? UserType.Normal;
    setFormMemberUserType(ut);
    setFormMemberName(user.name);
    setFormMemberEmail(user.email ?? '');
    setFormMemberUsername(user.username ?? '');
    setFormMemberPassword('');
    setFormMemberGender(user.gender ?? Gender.Male);
    setFormMemberDateOfBirth(user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '');
    setFormMode({ type: 'editMember', user });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formMode) return;

    if (formMode.type === 'createHousehold') {
      createHousehold.mutate({ name: formHouseholdName });
    } else if (formMode.type === 'editHousehold') {
      updateHousehold.mutate({ id: formMode.household.id, body: { name: formHouseholdName } });
    } else if (formMode.type === 'createMember') {
      // Build payload based on userType — omit empty/irrelevant fields
      const base: Record<string, string> = {
        userType: formMemberUserType,
        name: formMemberName,
        householdId: formMode.householdId,
      };
      if (formMemberUserType === UserType.Normal) {
        base.email = formMemberEmail;
        base.password = formMemberPassword;
        base.gender = formMemberGender;
        base.dateOfBirth = formMemberDateOfBirth;
      } else if (formMemberUserType === UserType.Kid) {
        if (formMemberDateOfBirth) base.dateOfBirth = formMemberDateOfBirth;
        if (formMemberGender) base.gender = formMemberGender;
      }
      // agent: only name + householdId + userType
      createMember.mutate(base);
    } else if (formMode.type === 'editMember') {
      const body: Record<string, string | undefined> = {
        userType: formMemberUserType,
        name: formMemberName,
      };
      if (formMemberUserType === UserType.Normal) {
        body.email = formMemberEmail || undefined;
        body.gender = formMemberGender;
        body.dateOfBirth = formMemberDateOfBirth || undefined;
      } else if (formMemberUserType === UserType.Kid) {
        body.dateOfBirth = formMemberDateOfBirth || undefined;
        body.gender = formMemberGender || undefined;
      }
      updateMember.mutate({ id: formMode.user.id, body });
    }
  }

  const isPending =
    createHousehold.isPending ||
    updateHousehold.isPending ||
    createMember.isPending ||
    updateMember.isPending;

  const isMemberForm =
    formMode?.type === 'createMember' || formMode?.type === 'editMember';
  const isNormalMember = formMemberUserType === UserType.Normal;
  const isKidMember = formMemberUserType === UserType.Kid;

  const rows = data?.items ?? [];

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
          onClick={handleOpenCreateHousehold}
          className="bg-accent text-background rounded-[20px] py-2 px-5 text-[15px] font-semibold"
        >
          Crear hogar
        </button>
      </div>

      {/* Create/Edit form */}
      {formMode && (
        <div className="mb-6">
          <AdminForm
            title={
              formMode.type === 'createHousehold' ? 'Crear hogar' :
              formMode.type === 'editHousehold' ? 'Editar hogar' :
              formMode.type === 'createMember' ? `Agregar miembro — ${formMode.householdName}` :
              'Editar miembro'
            }
            onSubmit={handleSubmit}
            onCancel={closeForm}
            submitLabel={
              formMode.type === 'createHousehold' || formMode.type === 'createMember'
                ? 'Crear'
                : 'Guardar'
            }
            isPending={isPending}
          >
            {(formMode.type === 'createHousehold' || formMode.type === 'editHousehold') && (
              <div className="flex flex-col gap-2">
                <label htmlFor="household-name" className="text-[13px] text-foreground">
                  Nombre *
                </label>
                <input
                  id="household-name"
                  type="text"
                  required
                  value={formHouseholdName}
                  onChange={(e) => setFormHouseholdName(e.target.value)}
                  className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
                  placeholder="Nombre del hogar"
                />
              </div>
            )}

            {isMemberForm && (
              <>
                {/* Type selector — always first */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="member-type" className="text-[13px] text-foreground">
                    Tipo de miembro *
                  </label>
                  <select
                    id="member-type"
                    value={formMemberUserType}
                    onChange={(e) => setFormMemberUserType(e.target.value)}
                    className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground outline-none"
                  >
                    <option value={UserType.Normal}>Adulto</option>
                    <option value={UserType.Kid}>Nino/a</option>
                    <option value={UserType.Agent}>Agente</option>
                  </select>
                </div>

                {/* Name — always shown */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="member-name" className="text-[13px] text-foreground">
                    Nombre *
                  </label>
                  <input
                    id="member-name"
                    type="text"
                    required
                    value={formMemberName}
                    onChange={(e) => setFormMemberName(e.target.value)}
                    className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
                    placeholder="Nombre completo"
                  />
                </div>

                {/* Email — normal only */}
                {isNormalMember && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="member-email" className="text-[13px] text-foreground">
                      Correo *
                    </label>
                    <input
                      id="member-email"
                      type="email"
                      required={isNormalMember && formMode.type === 'createMember'}
                      value={formMemberEmail}
                      onChange={(e) => setFormMemberEmail(e.target.value)}
                      className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                )}

                {/* Password — normal + createMember only */}
                {isNormalMember && formMode.type === 'createMember' && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="member-password" className="text-[13px] text-foreground">
                      Contrasena *
                    </label>
                    <input
                      id="member-password"
                      type="password"
                      required
                      value={formMemberPassword}
                      onChange={(e) => setFormMemberPassword(e.target.value)}
                      className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
                      placeholder="Contrasena inicial"
                    />
                  </div>
                )}

                {/* Gender — normal (required) + kid (optional) */}
                {(isNormalMember || isKidMember) && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="member-gender" className="text-[13px] text-foreground">
                      {isNormalMember ? 'Genero *' : 'Genero'}
                    </label>
                    <select
                      id="member-gender"
                      value={formMemberGender}
                      onChange={(e) => setFormMemberGender(e.target.value)}
                      required={isNormalMember}
                      className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground outline-none"
                    >
                      <option value={Gender.Male}>Masculino</option>
                      <option value={Gender.Female}>Femenino</option>
                      <option value={Gender.Other}>Otro</option>
                    </select>
                  </div>
                )}

                {/* Date of birth — normal (required) + kid (required) */}
                {(isNormalMember || isKidMember) && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="member-dob" className="text-[13px] text-foreground">
                      Fecha de nacimiento *
                    </label>
                    <input
                      id="member-dob"
                      type="date"
                      value={formMemberDateOfBirth}
                      onChange={(e) => setFormMemberDateOfBirth(e.target.value)}
                      required
                      className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground outline-none"
                    />
                  </div>
                )}

                {/* Username — editMember only */}
                {formMode.type === 'editMember' && isNormalMember && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="member-username" className="text-[13px] text-foreground">
                      Usuario
                    </label>
                    <input
                      id="member-username"
                      type="text"
                      value={formMemberUsername}
                      onChange={(e) => setFormMemberUsername(e.target.value)}
                      className="bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
                      placeholder="Nombre de usuario"
                    />
                  </div>
                )}
              </>
            )}
          </AdminForm>
        </div>
      )}

      {/* Household delete confirm */}
      {deletingHouseholdId && pendingDeleteHousehold && (
        <div className="mb-4">
          <ConfirmDialog
            message="Eliminar este hogar? Se eliminaran todas sus recetas y planes."
            onConfirm={() => deleteHousehold.mutate(deletingHouseholdId)}
            onCancel={() => {
              setDeletingHouseholdId(null);
              setPendingDeleteHousehold(null);
            }}
          />
        </div>
      )}

      {/* Households list */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[52px] w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-[15px] text-secondary">
          Sin hogares registrados.
        </div>
      ) : (
        <div className="border border-border rounded-[8px] overflow-hidden">
          {rows.map((household) => (
            <HouseholdRow
              key={household.id}
              household={household}
              onEdit={handleOpenEditHousehold}
              onDelete={handleOpenDeleteHousehold}
              onAddMember={handleOpenAddMember}
              onEditMember={handleOpenEditMember}
              onDeleteMember={(userId) => deleteMember.mutate(userId)}
              onResetPassword={(userId) =>
                resetPassword.mutate({ userId, householdId: household.id })
              }
              resetUrl={resetUrlForHousehold === household.id ? resetUrl : null}
              onDismissResetUrl={() => {
                setResetUrl(null);
                setResetUrlForHousehold(null);
              }}
            />
          ))}
        </div>
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
