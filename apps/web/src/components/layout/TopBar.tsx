'use client';
import { Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background">
      <button
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="w-6 h-6 flex items-center justify-center text-foreground"
      >
        <Menu size={24} strokeWidth={2} />
      </button>
      <h1
        className="text-[18px] font-semibold text-foreground"
        style={{ letterSpacing: '-0.3px' }}
      >
        {title}
      </h1>
      <div className="w-6 h-6" aria-hidden="true" />
    </header>
  );
}
