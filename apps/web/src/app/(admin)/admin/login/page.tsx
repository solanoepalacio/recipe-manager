'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Shield, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api-client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  const { mutate: login, isPending } = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      adminApi.post<{ message: string }>('/admin/auth/login', body),
    onSuccess: () => {
      router.replace('/admin/panel');
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 401) {
        setInlineError(
          'Credenciales incorrectas. Verifica tu contraseña e inténtalo de nuevo.',
        );
      } else {
        setInlineError('No se pudo conectar. Inténtalo de nuevo.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-12">
      <div className="w-full max-w-[24rem] flex flex-col items-center">
        {/* Logo mark */}
        <div className="w-16 h-16 bg-subtle rounded-[18px] flex items-center justify-center mb-4">
          <Shield size={28} className="text-accent" />
        </div>

        {/* Heading */}
        <h1
          className="text-[28px] font-semibold text-foreground mb-2 text-center"
          style={{ letterSpacing: '-0.5px' }}
        >
          Panel de administración
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] text-secondary mb-12 text-center">
          Inicia sesión para continuar
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {/* Email field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[13px] text-foreground">
              Correo electrónico
            </label>
            <div className="flex items-center gap-2 bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4">
              <Mail size={16} strokeWidth={2} className="text-secondary shrink-0" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-placeholder outline-none"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[13px] text-foreground">
              Contraseña
            </label>
            <div className="flex items-center gap-2 bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4">
              <Lock size={16} strokeWidth={2} className="text-secondary shrink-0" />
              <input
                id="password"
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

          {/* Inline error */}
          {inlineError && (
            <p className="text-[13px] text-destructive">{inlineError}</p>
          )}

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
