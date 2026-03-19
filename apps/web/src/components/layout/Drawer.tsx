'use client';
import { ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; householdId: string } | null;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { label: 'Hoy', href: '/' },
  { label: 'Recetas', href: '/recipes' },
  { label: 'Planificador', href: '/planner' },
];

export function Drawer({ isOpen, onClose, user, onLogout }: DrawerProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNav = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 bg-[rgba(44,44,42,0.3)] transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-[280px] md:w-[320px] bg-background z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="bg-sand pt-8 px-6 pb-6 rounded-tr-[20px]">
          <p className="text-[15px] text-secondary mb-1">Hola,</p>
          <button
            type="button"
            onClick={() => handleNav('/profile')}
            className="text-[18px] font-semibold text-foreground mb-3 text-left"
            style={{ letterSpacing: '-0.3px' }}
          >
            {user?.name ?? ''}
          </button>
          <button
            className="flex items-center gap-1 text-[15px] text-secondary"
            aria-label="Ver hogar"
          >
            <span>Hogar</span>
            <ChevronRight size={14} className="text-placeholder" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={`text-left text-[15px] text-foreground py-3 mx-4 ${
                  isActive ? 'border-b-2 border-accent w-fit' : ''
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="border-t border-border mx-4 my-2" />

          <button
            onClick={onLogout}
            className="text-left text-[15px] text-destructive py-3 mx-4 mb-6"
          >
            Cerrar sesión
          </button>
        </nav>
      </aside>
    </>
  );
}
