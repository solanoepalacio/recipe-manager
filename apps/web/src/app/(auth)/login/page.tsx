'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Lock, Utensils, Loader2 } from 'lucide-react';
import type { LoginRequest, MeResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect already-authenticated users
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate: login, isPending } = useMutation({
    mutationFn: (body: LoginRequest) => api.post<MeResponse>('/auth/login', body),
    onSuccess: () => {
      router.replace('/');
    },
    onError: (err: Error & { status?: number }) => {
      const msg =
        err.status === 401
          ? 'Correo o contraseña incorrectos'
          : 'No se pudo conectar. Intenta de nuevo.';
      toast.error(msg, { duration: 6000 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  // Hide form while redirect is in flight (already authenticated)
  if (!authLoading && user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-12">
      <div className="w-full max-w-sm flex flex-col">
        {/* Logo mark */}
        <div className="mx-auto w-16 h-16 bg-subtle rounded-[18px] flex items-center justify-center mb-4">
          <Utensils size={28} className="text-accent" />
        </div>

        {/* Heading */}
        <h1
          className="text-[28px] font-semibold text-foreground mb-2 text-center"
          style={{ letterSpacing: '-0.5px' }}
        >
          Robotina Cooks
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] text-secondary mb-12 text-center">
          Tu asistente de recetas personales
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {/* Email field */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-foreground">
              Correo electrónico
            </label>
            <div className="flex items-center gap-2 bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4">
              <Mail size={16} strokeWidth={2} className="text-secondary shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-placeholder outline-none"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-foreground">
              Contraseña
            </label>
            <div className="flex items-center gap-2 bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4">
              <Lock size={16} strokeWidth={2} className="text-secondary shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-placeholder outline-none"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 rounded-[20px] py-4 px-6 bg-foreground text-background text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Iniciando...</span>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
