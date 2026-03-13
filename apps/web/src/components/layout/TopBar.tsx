'use client';

import React from 'react';

export type TopBarVariant = 'standard' | 'detail';

export interface TopBarProps {
  variant: TopBarVariant;
  title: string;
  onHamburger?: () => void;
  onBack?: () => void;
  onOverflow?: () => void;
}

export function TopBar({
  variant,
  title,
  onHamburger,
  onBack,
  onOverflow,
}: TopBarProps) {
  const isSand = variant === 'detail';

  return (
    <header
      className={[
        'flex items-center justify-between px-5 py-4 flex-shrink-0',
        isSand ? 'bg-sand' : 'bg-background',
      ].join(' ')}
    >
      {/* Left action */}
      <div className="w-6 flex items-center">
        {variant === 'standard' && (
          <button
            type="button"
            data-testid="hamburger-btn"
            onClick={onHamburger}
            className="flex flex-col justify-center gap-[5px] cursor-pointer"
            aria-label="Abrir menú"
          >
            <span className="block w-5 h-[1.5px] bg-foreground rounded-sm" />
            <span className="block w-5 h-[1.5px] bg-foreground rounded-sm" />
            <span className="block w-5 h-[1.5px] bg-foreground rounded-sm" />
          </button>
        )}

        {variant === 'detail' && (
          <button
            type="button"
            data-testid="back-btn"
            onClick={onBack}
            className="text-foreground hover:opacity-70 text-lg"
            aria-label="Volver"
          >
            ←
          </button>
        )}
      </div>

      {/* Title — centered */}
      <h1 className="text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h1>

      {/* Right action */}
      <div className="w-6 flex items-center justify-end">
        {variant === 'detail' && onOverflow && (
          <button
            type="button"
            data-testid="overflow-btn"
            onClick={onOverflow}
            className="text-foreground hover:opacity-70 text-xl leading-none"
            aria-label="Más opciones"
          >
            ⋮
          </button>
        )}
      </div>
    </header>
  );
}
