import { NotFoundException } from '@nestjs/common';
import { MealPlanService } from '../../src/meal-plan/meal-plan.service';
import type {
  MealPlanResponse,
  MealPlanEntryResponse,
} from '@recipe-manager/shared';
import { MealType } from '@recipe-manager/shared';

const makeRecipe = (overrides = {}) => ({
  id: 'recipe-1',
  householdId: 'household-1',
  name: 'Test Recipe',
  images: [],
  ...overrides,
});

const makeMealPlan = (overrides = {}) => ({
  id: 'mealplan-1',
  householdId: 'household-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const makeEntry = (overrides = {}) => ({
  id: 'entry-1',
  mealPlanId: 'mealplan-1',
  recipeId: 'recipe-1',
  date: new Date('2024-03-15'),
  mealType: MealType.Lunch,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  recipe: {
    id: 'recipe-1',
    name: 'Test Recipe',
    images: [],
  },
  ...overrides,
});

describe('MealPlanService', () => {
  let service: MealPlanService;
  let mockPrisma: {
    mealPlan: {
      findFirst: jest.Mock;
      upsert: jest.Mock;
    };
    mealPlanEntry: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    recipe: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      mealPlan: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      mealPlanEntry: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      recipe: {
        findFirst: jest.fn(),
      },
    };
    service = new MealPlanService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // getMealPlan
  // ─────────────────────────────────────────────

  describe('getMealPlan', () => {
    it('returns MealPlanResponse with entries', async () => {
      const mealPlan = makeMealPlan();
      const entry = makeEntry();
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.mealPlanEntry.findMany.mockResolvedValue([entry]);

      const result: MealPlanResponse = await service.getMealPlan('household-1');

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('entry-1');
      expect(result.entries[0].recipeName).toBe('Test Recipe');
    });

    it('returns empty entries when no meal plan entries', async () => {
      const mealPlan = makeMealPlan();
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.mealPlanEntry.findMany.mockResolvedValue([]);

      const result = await service.getMealPlan('household-1');

      expect(result.entries).toHaveLength(0);
    });

    it('applies date filter when from and to are provided', async () => {
      const mealPlan = makeMealPlan();
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.mealPlanEntry.findMany.mockResolvedValue([]);

      await service.getMealPlan('household-1', '2024-03-01', '2024-03-31');

      expect(mockPrisma.mealPlanEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('filters without date when no from/to provided', async () => {
      const mealPlan = makeMealPlan();
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.mealPlanEntry.findMany.mockResolvedValue([]);

      await service.getMealPlan('household-1');

      const call = mockPrisma.mealPlanEntry.findMany.mock.calls[0][0];
      expect(call.where.date).toBeUndefined();
    });

    it('returns recipeThumbnailUrl from first image', async () => {
      const mealPlan = makeMealPlan();
      const entry = makeEntry({
        recipe: {
          id: 'recipe-1',
          name: 'Test Recipe',
          images: [{ url: '/uploads/recipes/recipe-1/photo.jpg' }],
        },
      });
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.mealPlanEntry.findMany.mockResolvedValue([entry]);

      const result = await service.getMealPlan('household-1');

      expect(result.entries[0].recipeThumbnailUrl).toBe(
        '/uploads/recipes/recipe-1/photo.jpg',
      );
    });

    it('returns null recipeThumbnailUrl when no images', async () => {
      const mealPlan = makeMealPlan();
      const entry = makeEntry();
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.mealPlanEntry.findMany.mockResolvedValue([entry]);

      const result = await service.getMealPlan('household-1');

      expect(result.entries[0].recipeThumbnailUrl).toBeNull();
    });

    it('formats date as YYYY-MM-DD', async () => {
      const mealPlan = makeMealPlan();
      const entry = makeEntry({ date: new Date('2024-03-15') });
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.mealPlanEntry.findMany.mockResolvedValue([entry]);

      const result = await service.getMealPlan('household-1');

      expect(result.entries[0].date).toBe('2024-03-15');
    });
  });

  // ─────────────────────────────────────────────
  // addEntry
  // ─────────────────────────────────────────────

  describe('addEntry', () => {
    it('returns MealPlanEntryResponse after creating entry', async () => {
      const mealPlan = makeMealPlan();
      const recipe = makeRecipe();
      const entry = makeEntry();
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.mealPlanEntry.create.mockResolvedValue(entry);

      const result: MealPlanEntryResponse = await service.addEntry('household-1', {
        recipeId: 'recipe-1',
        date: '2024-03-15',
        mealType: MealType.Lunch,
      });

      expect(result.id).toBe('entry-1');
      expect(result.recipeId).toBe('recipe-1');
      expect(result.mealType).toBe(MealType.Lunch);
    });

    it('throws NotFoundException when recipe not in household', async () => {
      const mealPlan = makeMealPlan();
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.addEntry('household-1', {
          recipeId: 'nonexistent-recipe',
          date: '2024-03-15',
          mealType: MealType.Lunch,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('verifies recipe belongs to household', async () => {
      const mealPlan = makeMealPlan();
      mockPrisma.mealPlan.upsert.mockResolvedValue(mealPlan);
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.addEntry('household-1', {
          recipeId: 'recipe-1',
          date: '2024-03-15',
          mealType: MealType.Lunch,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.recipe.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'recipe-1',
            householdId: 'household-1',
          }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────
  // updateEntry
  // ─────────────────────────────────────────────

  describe('updateEntry', () => {
    it('returns updated MealPlanEntryResponse', async () => {
      const entry = makeEntry();
      const updatedEntry = makeEntry({ date: new Date('2024-03-20'), mealType: MealType.Dinner });
      mockPrisma.mealPlanEntry.findFirst.mockResolvedValue(entry);
      mockPrisma.mealPlanEntry.update.mockResolvedValue(updatedEntry);

      const result = await service.updateEntry('household-1', 'entry-1', {
        date: '2024-03-20',
        mealType: MealType.Dinner,
      });

      expect(result.id).toBe('entry-1');
    });

    it('throws NotFoundException when entry not found', async () => {
      mockPrisma.mealPlanEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.updateEntry('household-1', 'nonexistent', { date: '2024-03-20' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('scopes lookup through mealPlan.householdId', async () => {
      mockPrisma.mealPlanEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.updateEntry('household-1', 'entry-1', { date: '2024-03-20' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.mealPlanEntry.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'entry-1',
            mealPlan: expect.objectContaining({ householdId: 'household-1' }),
          }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────
  // deleteEntry
  // ─────────────────────────────────────────────

  describe('deleteEntry', () => {
    it('deletes entry successfully', async () => {
      const entry = makeEntry();
      mockPrisma.mealPlanEntry.findFirst.mockResolvedValue(entry);
      mockPrisma.mealPlanEntry.delete.mockResolvedValue(entry);

      await service.deleteEntry('household-1', 'entry-1');

      expect(mockPrisma.mealPlanEntry.delete).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
      });
    });

    it('throws NotFoundException when entry not found', async () => {
      mockPrisma.mealPlanEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteEntry('household-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('scopes lookup through mealPlan.householdId to prevent cross-household access', async () => {
      mockPrisma.mealPlanEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteEntry('other-household', 'entry-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.mealPlanEntry.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mealPlan: expect.objectContaining({ householdId: 'other-household' }),
          }),
        }),
      );
    });
  });
});
