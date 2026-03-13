'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ShareRecipeResponse } from '@recipe-manager/shared';

export interface ShareDialogProps {
  recipeId: string;
  existingShareToken: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({
  recipeId,
  existingShareToken,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const queryClient = useQueryClient();
  const [shareUrl, setShareUrl] = useState<string | null>(
    existingShareToken
      ? window.location.origin + '/shared/' + existingShareToken
      : null,
  );
  const [copied, setCopied] = useState(false);

  const shareMutation = useMutation({
    mutationFn: () => api.post<ShareRecipeResponse>(`/api/recipes/${recipeId}/share`),
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipeId) });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () => api.delete<void>(`/api/recipes/${recipeId}/share`),
    onSuccess: () => {
      setShareUrl(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipeId) });
      onClose();
    },
  });

  // Auto-share when dialog opens (if not already shared)
  const shareMutateRef = React.useRef(shareMutation.mutate);
  shareMutateRef.current = shareMutation.mutate;

  React.useEffect(() => {
    if (isOpen && !shareUrl && !existingShareToken) {
      shareMutateRef.current();
    }
  }, [isOpen, shareUrl, existingShareToken]);

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayUrl = shareUrl;

  return (
    <Modal isOpen={isOpen} title="Compartir receta" onClose={onClose}>
      <div data-testid="share-dialog" className="px-5 py-6 flex flex-col gap-4">
        {shareMutation.isPending ? (
          <p className="text-sm text-secondary">Generando enlace...</p>
        ) : displayUrl ? (
          <>
            <div className="bg-subtle rounded-xl p-3 break-all">
              <p className="text-sm text-foreground">{displayUrl}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? 'Copiado' : 'Copiar enlace'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              loading={revokeMutation.isPending}
              onClick={() => revokeMutation.mutate()}
              aria-label="Revocar"
            >
              Revocar enlace
            </Button>
          </>
        ) : (
          <Button
            type="button"
            className="w-full"
            loading={shareMutation.isPending}
            onClick={() => shareMutation.mutate()}
          >
            Generar enlace
          </Button>
        )}
      </div>
    </Modal>
  );
}
