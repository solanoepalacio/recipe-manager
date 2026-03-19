'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import type { ProfileResponse, UpdateProfileRequest } from '@recipe-manager/shared';
import { Gender } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => api.patch<ProfileResponse>('/profile', data),
    onSuccess: () => {
      toast.success('Contrasena actualizada');
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Error al cambiar la contrasena';
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (!currentPassword || !newPassword) return;
    mutation.mutate({ currentPassword, password: newPassword });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-background rounded-t-[24px] px-5 pt-5 pb-8 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-foreground" style={{ letterSpacing: '-0.2px' }}>
            Cambiar contrasena
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="current-password" className="text-[13px] text-secondary mb-1 block">
              Contrasena actual
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="text-[13px] text-secondary mb-1 block">
              Nueva contrasena
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground focus:outline-none focus:border-foreground"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending || !currentPassword || !newPassword}
          className="w-full bg-foreground text-background rounded-[20px] py-4 text-[15px] font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            'Confirmar'
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => api.get<ProfileResponse>('/profile'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => api.patch<ProfileResponse>('/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success('Perfil actualizado');
    },
    onError: () => toast.error('Error al guardar. Intenta de nuevo.'),
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.Male);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setEmail(profile.email ?? '');
      setGender(profile.gender);
      setDateOfBirth(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '');
    }
  }, [profile]);

  const handleSave = () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Formato de correo invalido');
      return;
    }
    setEmailError('');

    const payload: UpdateProfileRequest = { name };
    if (email) payload.email = email;
    if (gender) payload.gender = gender;
    if (dateOfBirth) payload.dateOfBirth = dateOfBirth;

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="px-5 py-6 space-y-4 animate-pulse">
        <div className="h-[48px] w-[48px] bg-subtle rounded-full" />
        <div className="h-[20px] bg-subtle rounded-lg w-1/2" />
        <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
        <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
      </div>
    );
  }

  return (
    <>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

      <div className="px-5 py-6 space-y-6">
        {/* Avatar + name header */}
        <div className="flex items-center gap-4">
          <div
            className="w-[48px] h-[48px] rounded-full bg-subtle flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-[20px] font-semibold text-foreground">
              {profile?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p
              className="text-[20px] font-semibold text-foreground"
              style={{ letterSpacing: '-0.3px' }}
            >
              {profile?.name}
            </p>
            {profile?.email && (
              <p className="text-[13px] text-secondary">{profile.email}</p>
            )}
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="profile-name" className="text-[13px] text-secondary mb-1 block">
              Nombre
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder focus:outline-none focus:border-foreground"
            />
          </div>

          {/* Correo electronico */}
          <div>
            <label htmlFor="profile-email" className="text-[13px] text-secondary mb-1 block">
              Correo electronico
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder focus:outline-none focus:border-foreground"
            />
            {emailError && <p className="text-[13px] text-destructive mt-1">{emailError}</p>}
          </div>

          {/* Genero */}
          <div>
            <label htmlFor="profile-gender" className="text-[13px] text-secondary mb-1 block">
              Genero
            </label>
            <select
              id="profile-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground focus:outline-none focus:border-foreground"
            >
              <option value={Gender.Male}>Masculino</option>
              <option value={Gender.Female}>Femenino</option>
              <option value={Gender.Other}>Otro</option>
            </select>
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label htmlFor="profile-dob" className="text-[13px] text-secondary mb-1 block">
              Fecha de nacimiento
            </label>
            <input
              id="profile-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          {/* Change password */}
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="text-[13px] text-accent"
          >
            Cambiar contrasena
          </button>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-foreground text-background rounded-[20px] py-4 text-[15px] font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>
    </>
  );
}
