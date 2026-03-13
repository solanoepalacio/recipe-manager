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
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar
        variant={variant}
        title={title}
        onHamburger={() => setDrawerOpen(true)}
        onBack={onBack}
        onOverflow={onOverflow}
      />

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={{ name: user?.name ?? '' }}
        householdName=""
        activePath={activePath}
      />

      <main className="flex-1">{children}</main>
    </div>
  );
}
