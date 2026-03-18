'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function SectionAccordion({ title, children, defaultExpanded = true }: SectionAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 px-5 py-3 bg-subtle cursor-pointer w-full"
        type="button"
      >
        {expanded ? (
          <ChevronDown size={16} strokeWidth={2} className="text-secondary" />
        ) : (
          <ChevronRight size={16} strokeWidth={2} className="text-secondary" />
        )}
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
      </button>
      {expanded && <div>{children}</div>}
    </div>
  );
}
