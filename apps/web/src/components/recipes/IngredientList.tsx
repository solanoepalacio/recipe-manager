import type { SectionResponse } from '@recipe-manager/shared';

interface IngredientListProps {
  sections: SectionResponse[];
}

export function IngredientList({ sections }: IngredientListProps) {
  return (
    <div>
      {sections.map((section) => (
        <div key={section.id}>
          {section.title !== null && (
            <div className="px-5 py-2 text-[13px] font-semibold text-secondary">
              {section.title}
            </div>
          )}
          {section.ingredients.map((ingredient) => {
            const parts = [
              ingredient.quantity !== null ? String(ingredient.quantity) : '',
              ingredient.unitName ?? '',
              ingredient.foodName,
            ]
              .filter(Boolean)
              .join(' ')
              .trim();

            return (
              <div
                key={ingredient.id}
                className="flex items-center px-5 py-3 border-b border-subtle gap-2"
              >
                <span className="text-[15px] text-foreground">
                  {parts}
                  {ingredient.note && (
                    <span className="text-secondary"> ({ingredient.note})</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
