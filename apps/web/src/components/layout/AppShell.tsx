'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { Drawer } from './Drawer';

interface AppShellProps {
  children: React.ReactNode;
  user: { name: string; householdId: string } | null;
  onLogout: () => void;
}

function titleFromPathname(pathname: string): string {
  if (pathname === '/') return 'Hoy';
  if (pathname.startsWith('/recipes')) return 'Recetas';
  if (pathname.startsWith('/planner')) return 'Planificador';
  if (pathname.startsWith('/profile')) return 'Perfil';
  return 'Recetas';
}

export function AppShell({ children, user, onLogout }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const title = titleFromPathname(pathname);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <TopBar title={title} onMenuClick={() => setDrawerOpen(true)} />

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onLogout={onLogout}
      />

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
