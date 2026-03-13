'use client';

import React, { useState } from 'react';

export interface AccordionItem {
  title: string;
  children: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export function Accordion({ items, className = '' }: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className={['divide-y divide-border', className].filter(Boolean).join(' ')}>
      {items.map((item, index) => {
        const isOpen = openIndexes.has(index);
        return (
          <div key={index}>
            {/* Header */}
            <button
              type="button"
              onClick={() => toggle(index)}
              className={[
                'w-full flex items-center justify-between px-5 py-3 text-left',
                isOpen ? 'bg-sand' : 'bg-background',
              ].join(' ')}
            >
              <span
                className={[
                  'text-sm text-foreground',
                  isOpen ? 'font-semibold' : 'font-normal',
                ].join(' ')}
              >
                {item.title}
              </span>
              <span
                data-testid={`chevron-${index}`}
                className={[
                  'text-secondary transition-transform duration-200',
                  isOpen ? 'rotate-90' : '',
                ].join(' ')}
                aria-hidden="true"
              >
                ›
              </span>
            </button>

            {/* Content */}
            {isOpen && (
              <div className="bg-background">
                {item.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
