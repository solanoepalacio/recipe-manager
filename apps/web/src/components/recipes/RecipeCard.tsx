'use client';

import React from 'react';
import Image from 'next/image';
import type { RecipeListItemResponse } from '@recipe-manager/shared';

export interface RecipeCardProps {
  recipe: RecipeListItemResponse;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-background rounded-xl overflow-hidden border border-border hover:shadow-sm transition-shadow"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-subtle">
        {recipe.thumbnailUrl ? (
          <Image
            src={recipe.thumbnailUrl}
            alt={recipe.name}
            fill
            className="object-cover"
          />
        ) : null}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground line-clamp-2">{recipe.name}</p>
        {recipe.totalTime != null && (
          <p className="text-xs text-secondary mt-1">{recipe.totalTime} min</p>
        )}
      </div>
    </button>
  );
}
