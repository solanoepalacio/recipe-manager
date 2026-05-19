'use client';
import { useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { Drawer } from './Drawer';
import { AppFooterContext, AppFooterProvider } from './AppFooterContext';

interface AppShellProps {
  children: React.ReactNode;
  user: { name: string; householdId: string } | null;
  onLogout: () => void;
  householdName: string;
}

function titleFromPathname(pathname: string): string {
  if (pathname === '/') return 'Hoy';
  if (pathname.startsWith('/recipes')) return 'Recetas';
  if (pathname.startsWith('/planner')) return 'Planificador';
  if (pathname.startsWith('/profile')) return 'Perfil';
  if (pathname.startsWith('/household')) return 'Mi hogar';
  return 'Recetas';
}

function AppShellInner({ children, user, onLogout, householdName }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const title = titleFromPathname(pathname);
  const footerCtx = useContext(AppFooterContext);
  const footerVisible = (footerCtx?.activeCount ?? 0) > 0;

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">
      <TopBar title={title} onMenuClick={() => setDrawerOpen(true)} />

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onLogout={onLogout}
        householdName={householdName}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      <div
        ref={(el) => footerCtx?.setSlot(el)}
        data-testid={footerVisible ? 'app-footer' : undefined}
        className={`shrink-0 border-t border-border bg-background ${footerVisible ? '' : 'hidden'}`}
      />
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <AppFooterProvider>
      <AppShellInner {...props} />
    </AppFooterProvider>
  );
}
