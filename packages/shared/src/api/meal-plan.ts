export interface MealPlanEntryResponse {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeThumbnailUrl: string | null;
  date: string; // ISO date string (YYYY-MM-DD)
  mealType: string; // MealType enum value
}

export interface MealPlanResponse {
  entries: MealPlanEntryResponse[];
}

export interface CreateMealPlanEntryRequest {
  recipeId: string;
  date: string;
  mealType: string;
}

export interface UpdateMealPlanEntryRequest {
  date?: string;
  mealType?: string;
}
