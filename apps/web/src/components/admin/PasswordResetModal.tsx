'use client';

import React, { useState } from 'react';
import type { PasswordResetUrlResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface PasswordResetModalProps {
  userId: string;
  onClose: () => void;
}

export function PasswordResetModal({ userId, onClose }: PasswordResetModalProps) {
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const data = await api.post<PasswordResetUrlResponse>(
        `/api/admin/users/${userId}/password-reset-url`
      );
      setResetUrl(data.resetUrl);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (resetUrl) {
      await navigator.clipboard.writeText(resetUrl);
    }
  }

  return (
    <Modal isOpen={true} title="Restablecer contraseña" onClose={onClose}>
      <div className="flex flex-col gap-5 px-5 py-6">
        <Button
          onClick={handleGenerate}
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          Generar enlace
        </Button>

        {resetUrl && (
          <div className="flex flex-col gap-2 p-4 bg-subtle rounded-xl border border-border">
            <p className="text-xs text-secondary">
              Enlace de restablecimiento de contraseña:
            </p>
            <code className="text-sm text-foreground break-all">{resetUrl}</code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              Copiar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
