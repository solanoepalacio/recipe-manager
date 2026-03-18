'use client';

const ALL_TABS = ['Ingredientes', 'Instrucciones', 'Básico', 'Fotos', 'Ajustes'];

interface EditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isNewRecipe?: boolean;
}

export function EditorTabs({ activeTab, onTabChange, isNewRecipe }: EditorTabsProps) {
  const tabs = isNewRecipe ? ALL_TABS.filter((t) => t !== 'Ajustes') : ALL_TABS;

  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`flex-1 py-3 text-[15px] text-center ${
            activeTab === tab
              ? 'font-semibold text-foreground border-b-2 border-accent'
              : 'text-placeholder font-normal'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
