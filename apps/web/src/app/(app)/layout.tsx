'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppShell } from '@/components/layout/AppShell';

const ROUTE_TITLES: Record<string, string> = {
  '/today': 'Hoy',
  '/recipes': 'Recetas',
  '/planner': 'Planificador',
  '/profile': 'Perfil',
  '/household': 'Mi casa',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // For recipe detail and cook mode, use detail variant
  const isDetail =
    pathname?.includes('/recipes/') || pathname?.includes('/planner');
  const title = ROUTE_TITLES[pathname ?? ''] ?? '';

  return (
    <AppShell
      variant={isDetail ? 'detail' : 'standard'}
      title={title}
      activePath={pathname ?? '/'}
      onBack={() => router.back()}
    >
      {children}
    </AppShell>
  );
}
