import type { MealType } from '../enums';

export interface MealPlanEntryResponse {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeThumbnailUrl: string | null;
  date: string; // ISO date string (YYYY-MM-DD)
  mealType: MealType;
}

export interface MealPlanResponse {
  entries: MealPlanEntryResponse[];
}

export interface CreateMealPlanEntryRequest {
  recipeId: string;
  date: string;
  mealType: MealType;
}

export interface UpdateMealPlanEntryRequest {
  date?: string;
  mealType?: MealType;
}
