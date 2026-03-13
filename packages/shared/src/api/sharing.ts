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
  sections: import('./ingredients').IngredientSectionResponse[];
  steps: import('./steps').InstructionStepResponse[];
  images: import('./images').RecipeImageResponse[];
}
