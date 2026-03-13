'use client';

import React from 'react';

export interface DrawerNavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: DrawerNavItem[] = [
  { label: 'Hoy', path: '/today' },
  { label: 'Recetas', path: '/recipes' },
  { label: 'Planificador', path: '/planner' },
  { label: 'Perfil', path: '/profile' },
  { label: 'Casa', path: '/household' },
];

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string };
  householdName: string;
  activePath: string;
  onNavigate?: (path: string) => void;
  /** When true, renders inline (no overlay scrim, no fixed positioning) */
  persistent?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Drawer({
  isOpen,
  onClose,
  user,
  householdName,
  activePath,
  onNavigate,
  persistent = false,
}: DrawerProps) {
  if (!isOpen) return null;

  if (persistent) {
    return (
      <nav
        className="flex flex-col w-72 bg-background h-full"
        aria-label="Navegación principal"
      >
        {/* Header — sand bg */}
        <div className="bg-sand px-5 py-6 flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              data-testid="user-avatar"
              className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background text-sm font-semibold flex-shrink-0"
            >
              {getInitials(user.name)}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {user.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('/household')}
            className="text-sm text-secondary hover:text-foreground text-left"
          >
            {householdName}
          </button>
        </div>
        <ul className="flex flex-col py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  data-active={isActive}
                  onClick={() => onNavigate?.(item.path)}
                  className={[
                    'w-full flex items-center px-5 py-3 text-sm text-left transition-colors',
                    isActive
                      ? 'text-foreground font-semibold border-l-2 border-accent bg-subtle'
                      : 'text-foreground font-normal border-l-2 border-transparent hover:bg-subtle',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <>
      {/* Scrim */}
      <div
        data-testid="drawer-scrim"
        className="fixed inset-0 z-40 bg-scrim"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <nav
        className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col bg-background shadow-lg"
        aria-label="Navegación principal"
      >
        {/* Header — sand bg */}
        <div className="bg-sand px-5 py-6 flex flex-col gap-1">
          {/* Avatar + name */}
          <div className="flex items-center gap-3 mb-2">
            <div
              data-testid="user-avatar"
              className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background text-sm font-semibold flex-shrink-0"
            >
              {getInitials(user.name)}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {user.name}
            </span>
          </div>

          {/* Household name */}
          <button
            type="button"
            onClick={() => onNavigate?.('/household')}
            className="text-sm text-secondary hover:text-foreground text-left"
          >
            {householdName}
          </button>
        </div>

        {/* Nav items */}
        <ul className="flex flex-col py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  data-active={isActive}
                  onClick={() => {
                    onNavigate?.(item.path);
                    onClose();
                  }}
                  className={[
                    'w-full flex items-center px-5 py-3 text-sm text-left transition-colors',
                    isActive
                      ? 'text-foreground font-semibold border-l-2 border-accent bg-subtle'
                      : 'text-foreground font-normal border-l-2 border-transparent hover:bg-subtle',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
