'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { ProfileResponse, UpdateProfileRequest } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setEmail(profile.email ?? '');
      setUsername(profile.username ?? '');
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
    if (username) payload.username = username;
    if (showPasswordField && password) payload.password = password;

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="px-5 py-6 space-y-4 animate-pulse">
        <div className="h-[48px] w-[48px] bg-subtle rounded-full" />
        <div className="h-[20px] bg-subtle rounded-lg w-1/2" />
        <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
        <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
        <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Avatar initial */}
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
          <p className="text-[13px] text-secondary">{profile?.username || profile?.email}</p>
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

        {/* Usuario */}
        <div>
          <label htmlFor="profile-username" className="text-[13px] text-secondary mb-1 block">
            Usuario
          </label>
          <input
            id="profile-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder focus:outline-none focus:border-foreground"
          />
        </div>

        {/* Password reveal pattern */}
        {!showPasswordField ? (
          <button
            type="button"
            onClick={() => setShowPasswordField(true)}
            className="text-[13px] text-accent"
          >
            Cambiar contrasena
          </button>
        ) : (
          <div>
            <label htmlFor="profile-password" className="text-[13px] text-secondary mb-1 block">
              Nueva contrasena
            </label>
            <input
              id="profile-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder focus:outline-none focus:border-foreground"
            />
          </div>
        )}
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
  );
}
