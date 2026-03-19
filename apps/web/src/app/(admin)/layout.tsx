'use client';
import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AdminAuthProvider, useAdminAuth } from '@/components/admin/AdminAuthProvider';

function AdminSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-pulse">
      <div className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
        <div className="w-32 h-5 bg-subtle rounded" />
        <div className="w-6 h-6 bg-subtle rounded" />
      </div>
      <div className="flex-1 px-6 py-8 space-y-4">
        <div className="w-48 h-6 bg-subtle rounded" />
        <div className="w-full h-10 bg-subtle rounded" />
        <div className="w-full h-10 bg-subtle rounded" />
        <div className="w-full h-10 bg-subtle rounded" />
      </div>
    </div>
  );
}

function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.replace('/admin/login');
    }
  }, [admin, isLoading, router]);

  if (isLoading) return <AdminSkeleton />;
  if (!admin) return null; // redirect in flight

  return <>{children}</>;
}

function AdminGuardedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPath = pathname === '/admin/login' || pathname === '/setup';

  if (isPublicPath) {
    return <>{children}</>;
  }

  return <AdminProtectedLayout>{children}</AdminProtectedLayout>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <AdminGuardedShell>{children}</AdminGuardedShell>
      </AdminAuthProvider>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
