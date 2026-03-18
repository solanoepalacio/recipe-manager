'use client';
import { AppShell } from '@/components/layout/AppShell';

// Temporary stub — replaced in Plan 07-03 with AuthProvider + ProtectedLayout
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell user={null} onLogout={() => {}}>
      {children}
    </AppShell>
  );
}
