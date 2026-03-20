'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { HouseholdResponse } from '@recipe-manager/shared';

// AppShellSkeleton shown while /api/auth/me is in-flight
function AppShellSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden animate-pulse">
      {/* TopBar skeleton */}
      <div className="flex items-center justify-between px-6 py-4 bg-background">
        <div className="w-6 h-6 bg-subtle rounded" />
        <div className="w-24 h-5 bg-subtle rounded" />
        <div className="w-6 h-6" />
      </div>
      {/* Search skeleton */}
      <div className="px-4 pt-2 pb-3">
        <div className="bg-subtle rounded-[12px] py-3 px-4 h-[46px]" />
      </div>
      {/* Content skeleton */}
      <div className="flex-1 px-4 space-y-3 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2 border-b border-subtle">
            <div className="w-[72px] h-[68px] bg-subtle rounded-[10px] shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 bg-subtle rounded w-3/4" />
              <div className="h-3 bg-subtle rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const { data: household } = useQuery({
    queryKey: queryKeys.household.detail,
    queryFn: () => api.get<HouseholdResponse>('/household'),
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <AppShellSkeleton />;
  if (!user) return null; // redirect in progress

  const handleLogout = () => {
    api
      .post<{ message: string }>('/auth/logout', {})
      .catch(() => {})
      .finally(() => {
        router.replace('/login');
      });
  };

  return (
    <AppShell user={user} onLogout={handleLogout} householdName={household?.name ?? ''}>
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </AuthProvider>
  );
}
