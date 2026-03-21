// packages/shared/src/api/recipes.ts
// Phase 4 — Recipe CRUD shared type contracts

export interface ImageResponse {
  id: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface IngredientResponse {
  id: string;
  foodId: string;
  foodName: string;
  unitId: string | null;
  unitName: string | null;
  quantity: number | null;
  note: string | null;
  order: number;
}

export interface SectionResponse {
  id: string;
  title: string | null;
  order: number;
  ingredients: IngredientResponse[];
}

export interface StepResponse {
  id: string;
  title: string | null;
  body: string;
  order: number;
}

export interface RecipeDetailResponse {
  id: string;
  householdId: string;
  createdById: string;
  name: string;
  slug: string;
  description: string | null;
  servingsQty: number | null;
  servingsUnit: string | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  performTime: number | null;
  sourceUrl: string | null;
  isLocked: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  sections: SectionResponse[];
  steps: StepResponse[];
  images: ImageResponse[];
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  servingsQty?: number;
  servingsUnit?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  performTime?: number;
  sourceUrl?: string;
  ingredients?: Array<{
    foodId: string;
    unitId?: string;
    quantity?: number;
    note?: string;
  }>;
  steps?: Array<{
    title?: string;
    body: string;
  }>;
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  servingsQty?: number | null;
  servingsUnit?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  performTime?: number | null;
  sourceUrl?: string | null;
  isLocked?: boolean;
}

export interface CreateSectionRequest {
  title?: string;
}

export interface UpdateSectionRequest {
  title?: string | null;
}

export interface ReorderRequest {
  ids: string[];
}

export interface CreateIngredientRequest {
  foodId: string;
  unitId?: string;
  quantity?: number;
  note?: string;
}

export interface UpdateIngredientRequest {
  foodId?: string;
  unitId?: string | null;
  quantity?: number | null;
  note?: string | null;
}

export interface CreateStepRequest {
  title?: string;
  body: string;
}

export interface UpdateStepRequest {
  title?: string | null;
  body?: string;
}

export interface RecipeListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  servingsQty: number | null;
  servingsUnit: string | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  coverImageUrl: string | null;
}

export interface RecipeQueryParams {
  search?: string;
  foodId?: string;
  sort?: 'name' | 'createdAt' | 'updatedAt' | 'random';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
