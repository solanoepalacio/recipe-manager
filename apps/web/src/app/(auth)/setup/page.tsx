'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SetupStatusResponse, CreateAdminRequest } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SetupPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await api.get<SetupStatusResponse>('/api/setup');
        if (!res.required) {
          router.replace('/login');
        } else {
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    }
    void checkSetup();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);

    try {
      const body: CreateAdminRequest = { name, email, password };
      await api.post('/api/setup', body);
      router.push('/admin/login');
    } catch {
      setError('Error al crear el administrador. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-secondary text-sm">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground font-sans">
            Configuración inicial
          </h1>
          <p className="text-sm text-secondary mt-2">
            Crea la cuenta de administrador para comenzar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="setup-name"
            label="Nombre"
            type="text"
            value={name}
            onChange={(e) => setName((e.target as HTMLInputElement).value)}
            required
          />

          <Input
            id="setup-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            required
          />

          <Input
            id="setup-password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
          />

          <Input
            id="setup-confirm-password"
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
            required
          />

          {error && (
            <div role="alert" className="text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full mt-2"
          >
            Crear administrador
          </Button>
        </form>
      </div>
    </div>
  );
}
