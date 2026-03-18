export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  recipes: {
    all:    ['recipes'] as const,
    list:   (params: Record<string, unknown>) => ['recipes', 'list', params] as const,
    detail: (slug: string) => ['recipes', 'detail', slug] as const,
  },
  foods: {
    all:  ['foods'] as const,
    list: () => ['foods', 'list'] as const,
  },
  units: {
    all:  ['units'] as const,
    list: () => ['units', 'list'] as const,
  },
  mealPlan: {
    week: (from: string, to: string) => ['meal-plan', from, to] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
};
