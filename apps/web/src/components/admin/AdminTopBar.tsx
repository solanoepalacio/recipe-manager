'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

export function AdminTopBar() {
  const router = useRouter();

  async function handleLogout() {
    await api.post('/api/admin/auth/logout');
    router.push('/admin/login');
  }

  return (
    <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
      <h1 className="text-base font-semibold text-foreground">Administración</h1>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Cerrar sesión
      </Button>
    </header>
  );
}
