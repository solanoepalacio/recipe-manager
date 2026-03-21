// packages/shared/src/api/foods-units.ts
// Phase 15 — Foods and units type contracts

export interface FoodItem {
  id: string;
  name: string;
}

export interface UnitItem {
  id: string;
  name: string;
  abbreviation: string | null;
}

export interface BatchCreateIngredientsRequest {
  ingredients: Array<{
    foodId: string;
    unitId?: string;
    quantity?: number;
    note?: string;
  }>;
}
