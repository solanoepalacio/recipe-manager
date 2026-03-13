'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUserResponse, AdminUpdateUserRequest } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface EditUserModalProps {
  user: AdminUserResponse;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth ?? '');
  const [gender, setGender] = useState(user.gender ?? '');

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (body: AdminUpdateUserRequest) =>
      api.patch<AdminUserResponse>(`/api/admin/users/${user.id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households() });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<void>(`/api/admin/users/${user.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households() });
      onClose();
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const body: AdminUpdateUserRequest = {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
    };
    saveMutation.mutate(body);
  }

  function handleDelete() {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    deleteMutation.mutate();
  }

  const isLoading = saveMutation.isPending || deleteMutation.isPending;

  return (
    <Modal isOpen={true} title="Editar usuario" onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-5 px-5 py-6">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName((e.target as HTMLInputElement).value)}
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase text-secondary tracking-wide">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full text-foreground text-sm border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase text-secondary tracking-wide">
            Género
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full text-foreground text-sm border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground"
          >
            <option value="">Seleccionar...</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <Button
          type="submit"
          loading={saveMutation.isPending}
          disabled={isLoading}
          className="w-full"
        >
          Guardar
        </Button>

        <Button
          type="button"
          variant="destructive"
          loading={deleteMutation.isPending}
          disabled={isLoading}
          onClick={handleDelete}
          className="w-full"
        >
          Eliminar usuario
        </Button>
      </form>
    </Modal>
  );
}
