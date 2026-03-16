// packages/shared/src/api/meal-plan.ts
// Phase 5 — Meal Plan shared type contracts
import { MealType } from '../enums';

export interface MealPlanEntryResponse {
  id: string;
  date: string;        // ISO date string YYYY-MM-DD
  mealType: MealType;
  recipeId: string;
  recipeName: string;
  recipeSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanResponse {
  entries: MealPlanEntryResponse[];
}

export interface CreateMealPlanEntryRequest {
  recipeId: string;
  date: string;        // YYYY-MM-DD
  mealType: MealType;
}

export interface UpdateMealPlanEntryRequest {
  date?: string;
  mealType?: MealType;
  recipeId?: string;
}
