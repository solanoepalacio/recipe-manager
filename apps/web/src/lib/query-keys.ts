export interface RecipeQueryParams {
  q?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  recipes: {
    all: (params?: RecipeQueryParams) => ['recipes', params] as const,
    detail: (id: string) => ['recipes', id] as const,
  },
  household: {
    detail: () => ['household'] as const,
    members: () => ['household', 'members'] as const,
  },
  profile: {
    detail: () => ['profile'] as const,
  },
  foods: {
    all: () => ['foods'] as const,
  },
  units: {
    all: () => ['units'] as const,
  },
  mealPlan: {
    range: (from: string, to: string) => ['meal-plan', from, to] as const,
  },
  admin: {
    users: (page?: number) => ['admin', 'users', page] as const,
    households: (page?: number) => ['admin', 'households', page] as const,
    foods: (page?: number) => ['admin', 'foods', page] as const,
    units: (page?: number) => ['admin', 'units', page] as const,
    tokens: () => ['admin', 'tokens'] as const,
  },
};

