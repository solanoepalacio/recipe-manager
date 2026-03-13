'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AdminTokenResponse,
  AdminCreateTokenRequest,
  AdminCreateTokenResponse,
} from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ApiTokensModalProps {
  userId: string;
  onClose: () => void;
}

export function ApiTokensModal({ userId, onClose }: ApiTokensModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: tokens = [] } = useQuery<AdminTokenResponse[]>({
    queryKey: queryKeys.admin.tokens(),
    queryFn: () => api.get<AdminTokenResponse[]>('/api/admin/tokens'),
  });

  const revokeMutation = useMutation({
    mutationFn: (tokenId: string) => api.delete<void>(`/api/admin/tokens/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tokens() });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: AdminCreateTokenRequest) =>
      api.post<AdminCreateTokenResponse>('/api/admin/tokens', body),
    onSuccess: (data) => {
      setCreatedToken(data.token);
      setNewTokenName('');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tokens() });
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    createMutation.mutate({ name: newTokenName.trim(), userId });
  }

  async function handleCopy() {
    if (createdToken) {
      await navigator.clipboard.writeText(createdToken);
    }
  }

  return (
    <Modal isOpen={true} title="Tokens de API" onClose={onClose}>
      <div className="flex flex-col gap-4 px-5 py-6">
        {/* Token list */}
        {tokens.map((token) => (
          <div
            key={token.id}
            className="flex items-center justify-between py-3 border-b border-border"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{token.name}</span>
              <span className="text-xs text-secondary">
                {new Date(token.createdAt).toLocaleDateString('es-ES')}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              loading={revokeMutation.isPending}
              onClick={() => revokeMutation.mutate(token.id)}
              aria-label={`Revocar ${token.name}`}
            >
              Revocar
            </Button>
          </div>
        ))}

        {/* Created token display */}
        {createdToken && (
          <div className="flex flex-col gap-2 p-4 bg-subtle rounded-xl border border-border">
            <p className="text-xs text-secondary">
              Copia este token ahora. No se mostrará de nuevo.
            </p>
            <code className="text-sm text-foreground break-all">{createdToken}</code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              Copiar
            </Button>
          </div>
        )}

        {/* Create form */}
        {showCreateForm && !createdToken && (
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nombre del token"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full text-foreground text-sm border border-border rounded-md px-3 py-2 bg-transparent focus:outline-none focus:border-foreground"
            />
            <Button type="submit" loading={createMutation.isPending}>
              Crear
            </Button>
          </form>
        )}

        {/* Create button */}
        {!showCreateForm && !createdToken && (
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(true)}
          >
            Crear token
          </Button>
        )}
      </div>
    </Modal>
  );
}
