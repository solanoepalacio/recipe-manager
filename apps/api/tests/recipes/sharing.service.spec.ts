import { NotFoundException } from '@nestjs/common';
import { SharingService } from '../../src/recipes/sharing/sharing.service';
import type { ShareRecipeResponse, SharedRecipeResponse } from '@recipe-manager/shared';

const makeSection = (overrides = {}) => ({
  id: 'sec-1',
  title: null,
  order: 0,
  ingredients: [],
  ...overrides,
});

const makeStep = (overrides = {}) => ({
  id: 'step-1',
  title: null,
  body: 'Cook it',
  order: 0,
  ...overrides,
});

const makeImage = (overrides = {}) => ({
  id: 'img-1',
  url: '/uploads/recipes/recipe-1/photo.jpg',
  order: 0,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const makeRecipe = (overrides: Record<string, unknown> = {}) => ({
  id: 'recipe-1',
  householdId: 'household-1',
  slug: 'test-recipe',
  name: 'Test Recipe',
  description: null,
  prepTime: null,
  cookTime: null,
  totalTime: null,
  servingsQty: null,
  servingsUnit: null,
  shareToken: null,
  sections: [makeSection()],
  steps: [],
  images: [],
  ...overrides,
});

describe('SharingService', () => {
  let service: SharingService;
  let mockPrisma: {
    recipe: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      recipe: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new SharingService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // shareRecipe
  // ─────────────────────────────────────────────

  describe('shareRecipe', () => {
    it('returns ShareRecipeResponse with shareUrl and shareToken', async () => {
      const recipe = makeRecipe();
      const updatedRecipe = makeRecipe({ shareToken: 'some-uuid-token' });
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipe.update.mockResolvedValue(updatedRecipe);

      const result: ShareRecipeResponse = await service.shareRecipe(
        'household-1',
        'recipe-1',
      );

      expect(result.shareToken).toBeDefined();
      expect(result.shareUrl).toContain(result.shareToken);
    });

    it('generates a UUID as the share token', async () => {
      const recipe = makeRecipe();
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipe.update.mockImplementation(({ data }) => {
        return Promise.resolve(makeRecipe({ shareToken: data.shareToken }));
      });

      const result = await service.shareRecipe('household-1', 'recipe-1');

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(result.shareToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.shareRecipe('household-1', 'recipe-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('scopes recipe lookup by householdId', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.shareRecipe('other-household', 'recipe-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.recipe.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ householdId: 'other-household' }),
        }),
      );
    });

    it('stores the token on the recipe record', async () => {
      const recipe = makeRecipe();
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipe.update.mockImplementation(({ data }) => {
        return Promise.resolve(makeRecipe({ shareToken: data.shareToken }));
      });

      await service.shareRecipe('household-1', 'recipe-1');

      expect(mockPrisma.recipe.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shareToken: expect.any(String) }),
          where: { id: 'recipe-1' },
        }),
      );
    });
  });

  // ─────────────────────────────────────────────
  // revokeShare
  // ─────────────────────────────────────────────

  describe('revokeShare', () => {
    it('sets shareToken to null', async () => {
      const recipe = makeRecipe({ shareToken: 'some-token' });
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipe.update.mockResolvedValue(makeRecipe({ shareToken: null }));

      await service.revokeShare('household-1', 'recipe-1');

      expect(mockPrisma.recipe.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { shareToken: null },
          where: { id: 'recipe-1' },
        }),
      );
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeShare('household-1', 'recipe-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────
  // getSharedRecipe
  // ─────────────────────────────────────────────

  describe('getSharedRecipe', () => {
    it('returns SharedRecipeResponse for valid token', async () => {
      const recipe = makeRecipe({
        shareToken: 'valid-token',
        sections: [
          {
            ...makeSection(),
            ingredients: [],
          },
        ],
        steps: [makeStep()],
        images: [makeImage()],
      });
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);

      const result: SharedRecipeResponse = await service.getSharedRecipe('valid-token');

      expect(result.id).toBe('recipe-1');
      expect(result.name).toBe('Test Recipe');
      expect(result.sections).toHaveLength(1);
      expect(result.steps).toHaveLength(1);
      expect(result.images).toHaveLength(1);
    });

    it('throws NotFoundException for invalid token', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.getSharedRecipe('invalid-token'),
      ).rejects.toThrow(NotFoundException);
    });

    it('queries by shareToken field', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(service.getSharedRecipe('some-token')).rejects.toThrow();

      expect(mockPrisma.recipe.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ shareToken: 'some-token' }),
        }),
      );
    });

    it('returns full recipe details including sections, steps, images', async () => {
      const ingredient = {
        id: 'ing-1',
        foodId: 'food-1',
        food: { name: 'Chicken' },
        unitId: 'unit-1',
        unit: { name: 'gram', abbreviation: 'g' },
        quantity: { toNumber: () => 200 } as any,
        note: null,
        order: 0,
      };
      const section = makeSection({ ingredients: [ingredient] });
      const recipe = makeRecipe({
        shareToken: 'valid-token',
        sections: [section],
        steps: [makeStep()],
        images: [makeImage()],
      });
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);

      const result = await service.getSharedRecipe('valid-token');

      expect(result.sections[0].ingredients).toHaveLength(1);
      expect(result.sections[0].ingredients[0].foodName).toBe('Chicken');
    });
  });
});
