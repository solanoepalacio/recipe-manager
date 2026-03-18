'use client';
import { useState } from 'react';
import { TopBar } from './TopBar';
import { Drawer } from './Drawer';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  user: { name: string; householdId: string } | null;
  onLogout: () => void;
}

export function AppShell({ children, title = 'Recetas', user, onLogout }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
