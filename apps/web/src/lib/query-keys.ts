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
  admin: {
    users:      { all: ['admin', 'users'] as const, list: (p: Record<string, unknown>) => ['admin', 'users', 'list', p] as const },
    households: { all: ['admin', 'households'] as const, list: (p: Record<string, unknown>) => ['admin', 'households', 'list', p] as const },
    foods:      { all: ['admin', 'foods'] as const, list: (p: Record<string, unknown>) => ['admin', 'foods', 'list', p] as const },
    units:      { all: ['admin', 'units'] as const, list: (p: Record<string, unknown>) => ['admin', 'units', 'list', p] as const },
    tokens:     { all: ['admin', 'tokens'] as const, list: (p: Record<string, unknown>) => ['admin', 'tokens', 'list', p] as const },
  },
};
