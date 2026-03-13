export interface RecipeIngredientResponse {
  id: string;
  foodId: string;
  foodName: string;
  unitId: string | null;
  unitName: string | null;
  unitAbbreviation: string | null;
  quantity: number | null;
  note: string | null;
  order: number;
}

export interface IngredientSectionResponse {
  id: string;
  title: string | null;
  order: number;
  ingredients: RecipeIngredientResponse[];
}

export interface CreateIngredientRequest {
  foodId: string;
  unitId?: string;
  quantity?: number;
  note?: string;
}

export interface UpdateIngredientRequest {
  foodId?: string;
  unitId?: string;
  quantity?: number;
  note?: string;
}

export interface CreateSectionRequest {
  title?: string;
}

export interface UpdateSectionRequest {
  title?: string;
}
