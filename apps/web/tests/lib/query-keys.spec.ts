import { queryKeys } from '@/lib/query-keys';

describe('queryKeys', () => {
  describe('auth', () => {
    it('me returns correct key', () => {
      expect(queryKeys.auth.me()).toEqual(['auth', 'me']);
    });
  });

  describe('recipes', () => {
    it('all returns correct key without params', () => {
      expect(queryKeys.recipes.all()).toEqual(['recipes', undefined]);
    });

    it('all returns correct key with params', () => {
      const params = { q: 'pasta' };
      expect(queryKeys.recipes.all(params)).toEqual(['recipes', params]);
    });

    it('detail returns correct key', () => {
      expect(queryKeys.recipes.detail('recipe-id-1')).toEqual(['recipes', 'recipe-id-1']);
    });
  });

  describe('household', () => {
    it('detail returns correct key', () => {
      expect(queryKeys.household.detail()).toEqual(['household']);
    });

    it('members returns correct key', () => {
      expect(queryKeys.household.members()).toEqual(['household', 'members']);
    });
  });

  describe('profile', () => {
    it('detail returns correct key', () => {
      expect(queryKeys.profile.detail()).toEqual(['profile']);
    });
  });

  describe('foods', () => {
    it('all returns correct key', () => {
      expect(queryKeys.foods.all()).toEqual(['foods']);
    });
  });

  describe('units', () => {
    it('all returns correct key', () => {
      expect(queryKeys.units.all()).toEqual(['units']);
    });
  });

  describe('mealPlan', () => {
    it('range returns correct key', () => {
      expect(queryKeys.mealPlan.range('2024-01-01', '2024-01-07')).toEqual([
        'meal-plan',
        '2024-01-01',
        '2024-01-07',
      ]);
    });
  });

  describe('admin', () => {
    it('users returns correct key without page', () => {
      expect(queryKeys.admin.users()).toEqual(['admin', 'users', undefined]);
    });

    it('users returns correct key with page', () => {
      expect(queryKeys.admin.users(2)).toEqual(['admin', 'users', 2]);
    });

    it('households returns correct key', () => {
      expect(queryKeys.admin.households()).toEqual(['admin', 'households', undefined]);
    });

    it('foods returns correct key', () => {
      expect(queryKeys.admin.foods()).toEqual(['admin', 'foods', undefined]);
    });

    it('units returns correct key', () => {
      expect(queryKeys.admin.units()).toEqual(['admin', 'units', undefined]);
    });

    it('tokens returns correct key', () => {
      expect(queryKeys.admin.tokens()).toEqual(['admin', 'tokens']);
    });
  });
});
