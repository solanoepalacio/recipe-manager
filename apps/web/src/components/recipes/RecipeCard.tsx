import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { RecipeListItem } from '@recipe-manager/shared';

interface RecipeCardProps {
  recipe: RecipeListItem;
}

// RecipeListItem does not include time fields — time display deferred to when full recipe data is available
export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      href={`/recipes/${recipe.slug}?id=${recipe.id}`}
      className="flex items-center gap-4 py-[10px] border-b border-subtle cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-[72px] h-[68px] rounded-[10px] bg-sand flex-shrink-0 flex items-center justify-center overflow-hidden">
        {recipe.coverImageUrl ? (
          <Image
            src={recipe.coverImageUrl}
            alt={recipe.name}
            width={72}
            height={68}
            className="w-full h-full object-cover"
          />
        ) : recipe.imageCount > 0 ? (
          <ImageIcon size={20} strokeWidth={2} className="text-secondary" />
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-[15px] font-semibold text-foreground tracking-[-0.2px] truncate">
          {recipe.name}
        </span>
      </div>
    </Link>
  );
}
