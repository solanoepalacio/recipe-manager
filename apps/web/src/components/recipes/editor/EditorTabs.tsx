'use client';

import { Info, ClipboardList, ChefHat, Camera, Settings2, type LucideIcon } from 'lucide-react';

const TAB_CONFIG: { name: string; Icon: LucideIcon }[] = [
  { name: 'Ingredientes',  Icon: ClipboardList },
  { name: 'Instrucciones', Icon: ChefHat },
  { name: 'Básico',        Icon: Info },
  { name: 'Fotos',         Icon: Camera },
  { name: 'Ajustes',       Icon: Settings2 },
];

interface EditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isNewRecipe?: boolean;
}

export function EditorTabs({ activeTab, onTabChange, isNewRecipe }: EditorTabsProps) {
  const tabs = isNewRecipe ? TAB_CONFIG.filter((t) => t.name !== 'Ajustes') : TAB_CONFIG;

  return (
    <div className="flex border-b border-border">
      {tabs.map(({ name, Icon }) => {
        const isActive = activeTab === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onTabChange(name)}
            className={`flex-1 py-2 flex flex-col items-center gap-1 ${
              isActive ? 'border-b-2 border-accent' : ''
            }`}
          >
            <Icon
              size={20}
              strokeWidth={1.75}
              className={isActive ? 'text-accent' : 'text-placeholder'}
            />
            <span className={`text-[11px] ${isActive ? 'font-semibold text-foreground' : 'font-normal text-placeholder'}`}>
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
