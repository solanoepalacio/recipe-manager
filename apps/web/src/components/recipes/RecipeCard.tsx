import Link from 'next/link';
import { Clock, ImageIcon } from 'lucide-react';
import { RecipeListItem } from '@recipe-manager/shared';

interface RecipeCardProps {
  recipe: RecipeListItem;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const time = recipe.totalTime ?? recipe.cookTime ?? null;

  return (
    <Link
      href={`/recipes/${recipe.slug}?id=${recipe.id}`}
      className="flex items-center gap-4 py-[10px] border-b border-subtle cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-[72px] h-[68px] rounded-[10px] bg-sand flex-shrink-0 flex items-center justify-center">
        {recipe.imageCount > 0 && (
          <ImageIcon size={20} strokeWidth={2} className="text-secondary" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-[15px] font-semibold text-foreground tracking-[-0.2px] truncate">
          {recipe.name}
        </span>
        {time !== null && (
          <span className="text-[13px] text-secondary flex items-center gap-1">
            <Clock size={13} strokeWidth={2} />
            {time} min
          </span>
        )}
      </div>
    </Link>
  );
}
