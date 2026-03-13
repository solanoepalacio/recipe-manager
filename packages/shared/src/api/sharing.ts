import type { IngredientSectionResponse } from './ingredients';
import type { InstructionStepResponse } from './steps';
import type { RecipeImageResponse } from './images';

export interface ShareRecipeResponse {
  shareUrl: string;
  shareToken: string;
}

export interface SharedRecipeResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  servingsQty: number | null;
  servingsUnit: string | null;
  sections: IngredientSectionResponse[];
  steps: InstructionStepResponse[];
  images: RecipeImageResponse[];
}
