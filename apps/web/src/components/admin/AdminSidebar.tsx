'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Home, Apple, Ruler, Key, LogOut } from 'lucide-react';
import { adminApi } from '@/lib/admin-api-client';

const navItems = [
  { href: '/admin/panel/users',       label: 'Usuarios',  icon: Users  },
  { href: '/admin/panel/households',  label: 'Hogares',   icon: Home   },
  { href: '/admin/panel/foods',       label: 'Alimentos', icon: Apple  },
  { href: '/admin/panel/units',       label: 'Unidades',  icon: Ruler  },
  { href: '/admin/panel/tokens',      label: 'Tokens',    icon: Key    },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await adminApi.post('/admin/auth/logout', {});
    router.replace('/admin/login');
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] min-h-screen bg-subtle border-r border-border">
        <div className="px-6 py-6">
          <h2
            className="text-[18px] font-semibold text-foreground"
            style={{ letterSpacing: '-0.3px' }}
          >
            Admin Panel
          </h2>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-[8px] text-[15px] ${
                  isActive
                    ? 'bg-background text-foreground font-semibold border-l-2 border-accent'
                    : 'text-secondary hover:bg-background/50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-6 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-[8px] text-[15px] text-destructive hover:bg-background/50"
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav className="lg:hidden flex border-b border-border bg-subtle overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-3 text-[13px] whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-accent text-foreground font-semibold'
                  : 'border-transparent text-secondary'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
