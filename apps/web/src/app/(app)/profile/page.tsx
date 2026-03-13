'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/Button';
import type { ProfileResponse } from '@recipe-manager/shared';

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: () => api.get<ProfileResponse>('/api/profile'),
  });

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-1">
        {profile?.name ?? '—'}
      </h1>
      <p className="text-sm text-secondary mb-8">
        {profile?.email ?? ''}
      </p>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
