'use client';
import { useState } from 'react';
import { Search, ArrowUpDown, SlidersHorizontal, Plus } from 'lucide-react';
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

      {/* Search + filter row */}
      <div className="px-4 pt-2 pb-0">
        <div className="bg-subtle rounded-[12px] py-3 px-4 flex items-center gap-2">
          <Search size={18} strokeWidth={2} className="text-secondary shrink-0" />
          <span className="text-[15px] text-placeholder">Buscar recetas...</span>
        </div>
      </div>
      <div className="px-4 pb-3 pt-1 flex gap-4">
        <button className="flex items-center gap-1 text-[13px] text-secondary">
          <ArrowUpDown size={14} strokeWidth={2} />
          <span>Ordenar recetas</span>
        </button>
        <button className="flex items-center gap-1 text-[13px] text-secondary">
          <SlidersHorizontal size={14} strokeWidth={2} />
          <span>Filtrar por ingredientes</span>
        </button>
      </div>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto px-4">
        {children}
      </main>

      {/* FAB */}
      <button
        className="fixed bottom-7 right-6 w-[52px] h-[52px] bg-accent rounded-[16px] flex items-center justify-center"
        aria-label="Crear receta"
      >
        <Plus size={26} className="text-background" />
      </button>
    </div>
  );
}
