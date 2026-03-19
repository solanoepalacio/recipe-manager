'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SetupStatusResponse, SetupResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';

export default function SetupPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api.get<SetupStatusResponse>('/setup').then((res) => {
      if (!res.required) {
        router.replace('/admin/login');
      } else {
        setReady(true);
      }
    }).catch(() => {
      // If we can't reach setup endpoint, redirect to login
      router.replace('/admin/login');
    });
  }, [router]);

  const { mutate: createAdmin, isPending } = useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      api.post<SetupResponse>('/setup', body),
    onSuccess: () => {
      toast.success('Configuración completada. Inicia sesión.');
      router.replace('/admin/login');
    },
    onError: () => {
      setSubmitError('No se pudo completar la configuración. Inténtalo de nuevo.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setSubmitError(null);

    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    createAdmin({ name, email, password });
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

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
          Configuración inicial
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] text-secondary mb-12 text-center">
          Crea la cuenta de administrador para empezar
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {/* Name field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-[13px] text-foreground">
              Nombre *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin"
              className="bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              required
            />
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[13px] text-foreground">
              Correo electrónico *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              className="bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              required
              autoComplete="email"
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[13px] text-foreground">
              Contraseña *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              required
              autoComplete="new-password"
            />
          </div>

          {/* Confirm password field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="text-[13px] text-foreground">
              Confirmar contraseña *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder outline-none"
              required
              autoComplete="new-password"
            />
          </div>

          {/* Password mismatch error */}
          {passwordError && (
            <p className="text-[13px] text-destructive">{passwordError}</p>
          )}

          {/* Submit error */}
          {submitError && (
            <p className="text-[13px] text-destructive">{submitError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 rounded-[20px] py-4 px-6 bg-accent text-background text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              'Crear cuenta de administrador'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
