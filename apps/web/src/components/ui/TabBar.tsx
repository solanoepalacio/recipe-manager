'use client';

import React from 'react';

export interface TabBarProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onChange, className = '' }: TabBarProps) {
  return (
    <div
      role="tablist"
      className={[
        'flex border-b border-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {tabs.map((tab, index) => {
        const isActive = index === activeTab;
        return (
          <button
            key={index}
            role="tab"
            aria-selected={isActive}
            data-active={isActive}
            onClick={() => onChange(index)}
            className={[
              'flex-1 py-3 text-sm text-center transition-colors relative',
              isActive
                ? 'text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent'
                : 'text-placeholder font-normal',
            ].join(' ')}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
