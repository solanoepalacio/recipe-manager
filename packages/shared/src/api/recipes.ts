import type { IngredientSectionResponse } from './ingredients';
import type { InstructionStepResponse } from './steps';
import type { RecipeImageResponse } from './images';

export interface RecipeListItemResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  servingsQty: number | null;
  servingsUnit: string | null;
  thumbnailUrl: string | null; // first image URL, null if no images
  createdAt: string;
  updatedAt: string;
}

export interface RecipeDetailResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  performTime: number | null;
  servingsQty: number | null;
  servingsUnit: string | null;
  sourceUrl: string | null;
  isLocked: boolean;
  landscapeView: boolean;
  shareToken: string | null;
  sections: IngredientSectionResponse[];
  steps: InstructionStepResponse[];
  images: RecipeImageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servingsQty?: number;
  servingsUnit?: string;
  sourceUrl?: string;
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  performTime?: number;
  servingsQty?: number;
  servingsUnit?: string;
  sourceUrl?: string;
  isLocked?: boolean;
  landscapeView?: boolean;
}

export interface DuplicateRecipeResponse {
  id: string;
  slug: string;
  name: string;
}
