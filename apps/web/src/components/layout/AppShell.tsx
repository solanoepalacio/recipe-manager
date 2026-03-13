'use client';

import React, { useState } from 'react';
import { TopBar, type TopBarVariant } from './TopBar';
import { Drawer } from './Drawer';
import { useAuth } from '@/contexts/auth-context';

export interface AppShellProps {
  title: string;
  variant: TopBarVariant;
  children: React.ReactNode;
  onBack?: () => void;
  onOverflow?: () => void;
  activePath?: string;
}

export function AppShell({
  title,
  variant,
  children,
  onBack,
  onOverflow,
  activePath = '/',
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Persistent sidebar at md+ breakpoint */}
      <aside className="hidden md:flex md:flex-col md:w-72 md:shrink-0 md:border-r md:border-border">
        <Drawer
          isOpen={true}
          onClose={() => {}}
          user={{ name: user?.name ?? '' }}
          householdName=""
          activePath={activePath}
          persistent
        />
      </aside>

      {/* Mobile overlay drawer */}
      <div className="md:hidden">
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={{ name: user?.name ?? '' }}
          householdName=""
          activePath={activePath}
        />
      </div>

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* TopBar only shown on mobile; hidden at md since sidebar provides navigation */}
        <div className="md:hidden">
          <TopBar
            variant={variant}
            title={title}
            onHamburger={() => setDrawerOpen(true)}
            onBack={onBack}
            onOverflow={onOverflow}
          />
        </div>

        <main className="flex-1 max-w-screen-xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
