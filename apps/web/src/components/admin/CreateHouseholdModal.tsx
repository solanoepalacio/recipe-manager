'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminCreateHouseholdRequest, AdminHouseholdResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface CreateHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateHouseholdModal({ isOpen, onClose }: CreateHouseholdModalProps) {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: AdminCreateHouseholdRequest) =>
      api.post<AdminHouseholdResponse>('/api/admin/households', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.households() });
      setName('');
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate({ name: name.trim() });
  }

  return (
    <Modal isOpen={isOpen} title="Nueva casa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-5 py-6">
        <Input
          id="household-name"
          label="Nombre"
          value={name}
          onChange={(e) => setName((e.target as HTMLInputElement).value)}
          placeholder="Nombre del hogar"
          required
        />

        <Button
          type="submit"
          loading={mutation.isPending}
          className="w-full"
        >
          Crear
        </Button>
      </form>
    </Modal>
  );
}
