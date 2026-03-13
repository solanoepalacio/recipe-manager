'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ login: loginValue, password });
      router.push('/');
    } catch {
      setError('Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground font-sans">
            Robotina Cooks
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="login-field"
            label="Email o usuario"
            type="text"
            value={loginValue}
            onChange={(e) => setLoginValue((e.target as HTMLInputElement).value)}
            autoComplete="username"
            required
          />

          <Input
            id="password-field"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            autoComplete="current-password"
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
            Iniciar sesión
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/reset-password"
            className="text-sm text-secondary hover:text-foreground transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
