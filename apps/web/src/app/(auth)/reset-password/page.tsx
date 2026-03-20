'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Lock, Loader2, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ResetPasswordRequest, ResetPasswordResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  // Redirect to login after successful reset
  useEffect(() => {
    if (succeeded) {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [succeeded, router]);

  const { mutate: resetPassword, isPending, error } = useMutation({
    mutationFn: (body: ResetPasswordRequest) =>
      api.post<ResetPasswordResponse>('/auth/reset-password', body),
    onSuccess: () => {
      setSucceeded(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (newPassword.length < 8) {
      setValidationError('La contrasena debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Las contrasenas no coinciden');
      return;
    }

    resetPassword({ token, newPassword });
  };

  // Missing token in URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-[24rem] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-subtle rounded-[18px] flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-destructive" />
          </div>
          <h1
            className="text-[22px] font-semibold text-foreground mb-2"
            style={{ letterSpacing: '-0.5px' }}
          >
            Enlace invalido
          </h1>
          <p className="text-[15px] text-secondary mb-8">
            Este enlace de restablecimiento no contiene un token. Solicita un nuevo enlace al administrador.
          </p>
          <button
            onClick={() => router.replace('/login')}
            className="w-full rounded-[20px] py-4 px-6 bg-foreground text-background text-[15px] font-semibold"
          >
            Ir al inicio de sesion
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (succeeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-[24rem] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-subtle rounded-[18px] flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-accent" />
          </div>
          <h1
            className="text-[22px] font-semibold text-foreground mb-2"
            style={{ letterSpacing: '-0.5px' }}
          >
            Contrasena actualizada
          </h1>
          <p className="text-[15px] text-secondary">
            Tu contrasena fue cambiada correctamente. Redirigiendo al inicio de sesion...
          </p>
        </div>
      </div>
    );
  }

  const apiError = error as (Error & { status?: number }) | null;
  const displayError = validationError ?? (apiError ? apiError.message : null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-12">
      <div className="w-full max-w-[24rem] flex flex-col items-center">
        {/* Logo mark */}
        <div className="w-16 h-16 bg-subtle rounded-[18px] flex items-center justify-center mb-4">
          <Utensils size={28} className="text-accent" />
        </div>

        {/* Heading */}
        <h1
          className="text-[28px] font-semibold text-foreground mb-2 text-center"
          style={{ letterSpacing: '-0.5px' }}
        >
          Nueva contrasena
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] text-secondary mb-12 text-center">
          Elige una contrasena segura para tu cuenta
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {/* New password */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-foreground">
              Nueva contrasena
            </label>
            <div className="flex items-center gap-2 bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4">
              <Lock size={16} strokeWidth={2} className="text-secondary shrink-0" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-placeholder outline-none"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-foreground">
              Confirmar contrasena
            </label>
            <div className="flex items-center gap-2 bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4">
              <Lock size={16} strokeWidth={2} className="text-secondary shrink-0" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contrasena"
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-placeholder outline-none"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Inline error */}
          {displayError && (
            <p className="text-[13px] text-destructive" role="alert">
              {displayError}
            </p>
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
                <span>Actualizando...</span>
              </>
            ) : (
              'Actualizar contrasena'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
